import express from 'express';
import fetch from 'node-fetch';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const API_KEY = process.env.TYPHOON_API_KEY;
const API_URL = 'https://api.opentyphoon.ai/v1/chat/completions';

router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { jobReq, candidates } = req.body;

    if (!jobReq || !candidates || candidates.length === 0) {
      return res.status(400).json({ error: 'Job requirements and candidates are required.' });
    }

    const BATCH_SIZE = 50;
    const promptTemplate = (candidatePool) => `
You are an expert HR AI Assistant. Your task is to evaluate a pool of candidates against a specific job requirement.

Job Requirement:
"${jobReq}"

Candidate Pool (JSON):
${JSON.stringify(candidatePool, null, 2)}

=== EVALUATION RULES (MUST FOLLOW STRICTLY) ===

1. ROLE MATCHING (CRITICAL): Check if the user specified a job title/role (e.g., "Software Engineer"). If the candidate's \`currentRole\` is fundamentally different (e.g. "Data Scientist", "Product Manager", "HR Manager") when a specific role is requested, heavily penalize them (-40 points). The top candidates MUST have a matching or highly related \`currentRole\`.

2. EDUCATION PRIORITY (CRITICAL): If the job requirement mentions a specific education level (e.g. "Master's Degree", "ปริญญาโท", "PhD"), candidates who meet or EXCEED that education level MUST be ranked HIGHER than those who do not. A candidate with lower education receives a severe score penalty (-30 points).

3. SKILL MATCHING & IMPLICIT SKILLS: Look for direct technical skills (e.g., "C++"). Also infer requested implicit skills: e.g. "ออกแบบ ui" (UI design) means look for UI/UX, Figma, Design skills. Each matching skill adds strongly to the score.

4. SPECIAL TRAITS AS TIE-BREAKERS: If the requirement mentions soft skills or traits like "problem-solving" (แนวคิดการแก้ปัญหา), "leadership", prioritize candidates who explicitly list these in their skills or summary.

5. EXACT SCORING FORMULA REQUIREMENTS:
   - Role Match: 30% weight
   - Education Match: 25% weight  
   - Skills (Tech & Soft) Match: 35% weight
   - Experience: 10% weight

6. Return ONLY the Top 5 best matching candidates in the "rankedCandidates" array.
7. Even if scores are low, ALWAYS return at least 5 candidates.
8. Sort the final array by score in descending order.

Respond STRICTLY with valid JSON in the following format, with no markdown code blocks:

{
  "rankedCandidates": [
    {
      "id": "CAND-001",
      "name": "John Doe",
      "currentRole": "Software Engineer",
      "yearsOfExperience": 5,
      "education": "Master's Degree",
      "score": 95,
      "matchedSkills": ["React", "Node.js"],
      "missingSkills": ["AWS"],
      "pros": ["Holds Master's Degree as required", "Strong problem-solving background"],
      "cons": ["Lacks cloud infrastructure experience"]
    }
  ]
}
`;

    // Helper: call Typhoon API for one batch
    const analyzeOneBatch = async (batch, batchNum) => {
      const prompt = promptTemplate(batch);
      const requestBody = {
        model: 'typhoon-v2.5-30b-a3b-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 32768,
        temperature: 0.3,
      };

      console.log(`[ANALYZE] Batch ${batchNum}: Sending ${batch.length} candidates to Typhoon API...`);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`[ANALYZE] Batch ${batchNum} failed:`, err);
        throw new Error(`Batch ${batchNum} failed: ${err}`);
      }

      const data = await response.json();
      let textObj = data.choices[0].message.content;

      // Extract exactly the JSON object boundaries from the response
      const jsonMatch = textObj.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        textObj = jsonMatch[0];
      } else {
        textObj = textObj.replace(/^```json/gi, '').replace(/^```/g, '').replace(/```$/g, '').trim();
      }

      try {
        return JSON.parse(textObj);
      } catch (parseErr) {
        console.warn(`[ANALYZE] Batch ${batchNum} JSON parse failed, attempting auto-fix...`);
        // Auto-fix 1: Remove trailing commas before closing brackets/braces
        textObj = textObj.replace(/,\s*([\]}])/g, '$1');
        // Auto-fix 2: Add missing commas between objects in an array
        textObj = textObj.replace(/\}\s*\{/g, '},{');
        // Auto-fix 3: Sanitize unescaped newlines in strings
        textObj = textObj.replace(/\n/g, '\\n');

        try {
          return JSON.parse(textObj);
        } catch (fatalErr) {
          console.error(`[ANALYZE] FATAL: AI returned unparseable JSON in Batch ${batchNum}.\nRaw Output:\n${textObj}`);
          // Return an empty list if this batch fails completely so the whole tournament doesn't crash
          return { rankedCandidates: [] };
        }
      }
    };

    // Split candidates into batches
    const batches = [];
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      batches.push(candidates.slice(i, i + BATCH_SIZE));
    }

    console.log(`[ANALYZE] Total candidates: ${candidates.length}, split into ${batches.length} batch(es) of up to ${BATCH_SIZE}`);

    // Helper to remove any duplicate candidates the AI hallucinates
    const deduplicateCandidates = (result) => {
      if (!result || !result.rankedCandidates) return result;
      const seen = new Set();
      result.rankedCandidates = result.rankedCandidates.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
      return result;
    };

    if (batches.length === 1) {
      // Only 1 batch — direct call, no tournament needed
      const result = await analyzeOneBatch(batches[0], 1);
      return res.json(deduplicateCandidates(result));
    }

    // Tournament mode: run all batches in parallel, collect top 5 from each
    const batchResults = await Promise.all(
      batches.map((batch, idx) => analyzeOneBatch(batch, idx + 1))
    );

    // Collect all top candidates from each batch, and deduplicate them just in case
    let allTopCandidates = batchResults.flatMap(r => r.rankedCandidates || []);
    const seenFinalists = new Set();
    allTopCandidates = allTopCandidates.filter(c => {
      if (seenFinalists.has(c.id)) return false;
      seenFinalists.add(c.id);
      return true;
    });

    console.log(`[ANALYZE] Tournament: collected ${allTopCandidates.length} finalists from ${batches.length} batches. Running final round...`);

    // Final round: pick the overall Top 5 from all batch winners
    const finalResult = await analyzeOneBatch(allTopCandidates, 'FINAL');
    return res.json(deduplicateCandidates(finalResult));

  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: 'Error analyzing candidates via AI' });
  }
});

router.post('/extract', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Resume text is required for extraction' });
    }

    const extractPrompt = `
You are an expert HR AI Data Extractor. Extract the candidate's profile from the following resume text.
Output strictly as JSON in this format:

{
  "name": "Full Name",
  "currentRole": "Most relevant job title according to the resume",
  "yearsOfExperience": <Total years as integer>,
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "education": "Highest degree obtained",
  "summary": "A short 1-2 sentence professional summary"
}

Resume Text:
"""
${text}
"""
`;

    const requestBody = {
      model: 'typhoon-v2.5-30b-a3b-instruct',
      messages: [{ role: 'user', content: extractPrompt }],
      max_tokens: 1500,
      temperature: 0.1,
    };

    console.log('[EXTRACT] Sending to Typhoon API...', { model: requestBody.model, textLength: text.length });
    console.log(requestBody.messages);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[EXTRACT] Typhoon API Status:', response.status);
      console.error('[EXTRACT] Typhoon API Response:', err);
      return res.status(response.status).json({ error: 'Failed to extract resume data via OpenTyphoon AI', details: err });
    }

    const data = await response.json();
    let textObj = data.choices[0].message.content;

    textObj = textObj.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();

    const parsedData = JSON.parse(textObj);
    return res.json(parsedData);
  } catch (error) {
    console.error('AI Extraction Error:', error);
    return res.status(500).json({ error: 'Server error extracting resume data' });
  }
});

export default router;
