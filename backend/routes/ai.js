import express from 'express';
import fetch from 'node-fetch';
import { requireAuth } from '../middleware/auth.js';
import { validate, analyzeSchema, judgeSchema, extractSchema } from '../validate.js';
import logger from '../logger.js';

const router = express.Router();

const API_KEY = process.env.TYPHOON_API_KEY;
const API_URL = 'https://api.opentyphoon.ai/v1/chat/completions';

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     tags: [AI]
 *     summary: Analyze and rank candidates against job requirements
 *     description: |
 *       Uses Typhoon AI to evaluate candidates in batches (tournament style).
 *       Automatically splits large candidate pools into batches of 50.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobReq, candidates]
 *             properties:
 *               jobReq:
 *                 type: string
 *                 minLength: 10
 *                 description: "Detailed job requirements in Thai or English"
 *                 example: "ต้องการ Senior React Developer ประสบการณ์ 5 ปีขึ้นไป รู้ Node.js, Next.js"
 *               candidates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Candidate'
 *     responses:
 *       200:
 *         description: Ranked candidates with scores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rankedCandidates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RankedCandidate'
 *       400:
 *         description: Validation error
 *       500:
 *         description: AI analysis error
 */
router.post('/analyze', requireAuth, validate(analyzeSchema), async (req, res) => {
  try {
    const { jobReq, candidates } = req.body;

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

    const analyzeOneBatch = async (batch, batchNum) => {
      const prompt = promptTemplate(batch);
      const requestBody = {
        model: 'typhoon-v2.5-30b-a3b-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 32768,
        temperature: 0.3,
      };

      logger.info({ batch: batchNum, candidateCount: batch.length }, '[ANALYZE] Sending batch to Typhoon API');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.text();
        logger.error({ batch: batchNum, status: response.status, error: err }, '[ANALYZE] Batch failed');
        throw new Error(`Batch ${batchNum} failed: ${err}`);
      }

      const data = await response.json();
      let textObj = data.choices[0].message.content;

      const jsonMatch = textObj.match(/\{[\s\S]*\}/);
      if (jsonMatch) textObj = jsonMatch[0];
      else textObj = textObj.replace(/^```json/gi, '').replace(/^```/g, '').replace(/```$/g, '').trim();

      try {
        return JSON.parse(textObj);
      } catch (parseErr) {
        logger.warn({ batch: batchNum }, '[ANALYZE] JSON parse failed, attempting auto-fix');
        textObj = textObj.replace(/,\s*([\]}])/g, '$1');
        textObj = textObj.replace(/\}\s*\{/g, '},{');
        textObj = textObj.replace(/\n/g, '\\n');
        try {
          return JSON.parse(textObj);
        } catch (fatalErr) {
          logger.error({ batch: batchNum, raw: textObj.slice(0, 500) }, '[ANALYZE] FATAL: unparseable JSON');
          return { rankedCandidates: [] };
        }
      }
    };

    const batches = [];
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      batches.push(candidates.slice(i, i + BATCH_SIZE));
    }

    logger.info({ total: candidates.length, batchCount: batches.length }, '[ANALYZE] Starting analysis');

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
      const result = await analyzeOneBatch(batches[0], 1);
      return res.json(deduplicateCandidates(result));
    }

    const batchResults = await Promise.all(
      batches.map((batch, idx) => analyzeOneBatch(batch, idx + 1))
    );

    let allTopCandidates = batchResults.flatMap(r => r.rankedCandidates || []);
    const seenFinalists = new Set();
    allTopCandidates = allTopCandidates.filter(c => {
      if (seenFinalists.has(c.id)) return false;
      seenFinalists.add(c.id);
      return true;
    });

    logger.info({ finalistCount: allTopCandidates.length, batchCount: batches.length }, '[ANALYZE] Tournament final round');
    const finalResult = await analyzeOneBatch(allTopCandidates, 'FINAL');
    return res.json(deduplicateCandidates(finalResult));

  } catch (error) {
    logger.error({ err: error }, 'AI Analysis error');
    res.status(500).json({ error: 'Error analyzing candidates via AI' });
  }
});

/**
 * @swagger
 * /api/judge:
 *   post:
 *     tags: [AI]
 *     summary: Side-by-side comparison and declare a winner
 *     description: Uses Typhoon AI to compare shortlisted candidates and declare one winner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobReq, candidates]
 *             properties:
 *               jobReq:
 *                 type: string
 *                 description: Job requirements
 *               candidates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Candidate'
 *     responses:
 *       200:
 *         description: Verdict with winner and runner-ups (Thai markdown)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verdict:
 *                   type: string
 *                   description: Thai markdown with winner analysis
 */
router.post('/judge', requireAuth, validate(judgeSchema), async (req, res) => {
  try {
    const { jobReq, candidates } = req.body;

    const judgePrompt = `
You are the Executive HR Director. You have shortlisted a final set of elite candidates for the following job requirement:
"${jobReq}"

Here are the shortlisted candidates:
${JSON.stringify(candidates, null, 2)}

Your task is to analyze these candidates side-by-side, weigh their pros and cons deeply, and confidently DECLARE ONE ABSOLUTE WINNER who fits the requirement best.
Also provide a summary of the runner-ups and why they fell short of the winner.

Respond strictly in Thai Markdown format.
Include these headers:
### 🏆 ผู้ชนะเลิศแบบฟันธง: [ชื่อคนชนะ]
**เหตุผลที่ชนะ:** ...

### 🥈 ผู้ท้าชิง (Runner-ups):
**[ชื่อ]:** ... ทำไมถึงแพ้คนชนะ ...

### 📝 บทสรุปจากผู้อำนวยการ HR:
...
`;

    const requestBody = {
      model: 'typhoon-v2.5-30b-a3b-instruct',
      messages: [{ role: 'user', content: judgePrompt }],
      max_tokens: 3000,
      temperature: 0.4,
    };

    logger.info('[JUDGE] Sending to Typhoon API');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ status: response.status }, '[JUDGE] Typhoon API failed');
      return res.status(response.status).json({ error: 'Failed to judge via OpenTyphoon AI' });
    }

    const data = await response.json();
    return res.json({ verdict: data.choices[0].message.content });

  } catch (error) {
    logger.error({ err: error }, 'AI Judge error');
    res.status(500).json({ error: 'Error judging candidates' });
  }
});

/**
 * @swagger
 * /api/extract:
 *   post:
 *     tags: [AI]
 *     summary: Extract candidate profile from resume text
 *     description: Uses Typhoon AI to parse resume text into structured candidate data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 minLength: 20
 *                 description: Raw resume text extracted from PDF/TXT
 *     responses:
 *       200:
 *         description: Extracted candidate profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Invalid input
 */
router.post('/extract', requireAuth, validate(extractSchema), async (req, res) => {
  try {
    const { text } = req.body;

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

    logger.info({ textLength: text.length }, '[EXTRACT] Sending to Typhoon API');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ status: response.status }, '[EXTRACT] Typhoon API failed');
      return res.status(response.status).json({ error: 'Failed to extract resume data via OpenTyphoon AI', details: err });
    }

    const data = await response.json();
    let textObj = data.choices[0].message.content;

    textObj = textObj.replace(/^```json[\r\n]*/gi, '').replace(/^```[\r\n]*/g, '').replace(/```$/g, '').trim();
    const jsonMatch = textObj.match(/\{[\s\S]*\}/);
    if (jsonMatch) textObj = jsonMatch[0];

    try {
      const parsedData = JSON.parse(textObj);
      return res.json(parsedData);
    } catch (parseErr) {
      textObj = textObj.replace(/,\s*([\]}])/g, '$1');
      try {
        const parsedData = JSON.parse(textObj);
        return res.json(parsedData);
      } catch (fatalErr) {
        logger.error({ raw: textObj.slice(0, 500) }, '[EXTRACT] FATAL: unparseable JSON');
        return res.status(500).json({ error: 'AI returned invalid JSON format. Please try again.' });
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'AI Extraction error');
    return res.status(500).json({ error: 'Server error extracting resume data' });
  }
});

export default router;
