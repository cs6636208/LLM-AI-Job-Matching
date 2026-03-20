import { PROMPTS } from './prompts';

const getValidApiKey = () => {
  const key = import.meta.env.VITE_TYPHOON_API_KEY;
  if (!key || key.includes('ใส่_API_KEY') || /[^\x00-\x7F]/.test(key)) return null;
  return key;
};

export const analyzeCandidates = async (jobReq, candidates) => {
  const apiKey = getValidApiKey();

  // Format candidates into a concise JSON to save tokens
  const simplifiedCandidates = candidates.map(c => ({
    id: c.id,
    name: c.name,
    role: c.currentRole,
    exp: c.yearsOfExperience,
    skills: c.skills,
    edu: c.education,
    summary: c.summary
  }));

  const prompt = PROMPTS.MATCH_CANDIDATES(jobReq, JSON.stringify(simplifiedCandidates));

  if (!apiKey) {
    console.log("No valid API Key detected. Using mock analysis.");
    return generateMockAnalysis(jobReq, candidates);
  }

  try {
    const baseUrl = 'https://api.opentyphoon.ai/v1/chat/completions';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'typhoon-v2.5-30b-a3b-instruct', // The only active instruct model for this API key tier
        messages: [
          { role: 'system', content: 'You are a helpful HR AI assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 8192
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Text:", errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      } catch(e) {
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Attempt to parse the JSON
    try {
      return JSON.parse(content);
    } catch (e) {
      // Sometimes models wrap json in markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
         return JSON.parse(jsonMatch[1]);
      }
      throw new Error("Failed to parse LLM response into JSON");
    }

  } catch (error) {
    console.error("LLM Analysis Error:", error);
    console.log("Returning mock analysis due to error.");
    return generateMockAnalysis(jobReq, candidates);
  }
};

export const extractResumeData = async (resumeText) => {
  const apiKey = getValidApiKey();
  const prompt = PROMPTS.EXTRACT_RESUME(resumeText);
  
  if (!apiKey) {
     // Mock fallback if no API key
     return {
       id: `REAL-${Date.now()}`,
       name: "Anonymous User (Mock)",
       currentRole: "Assessed Role",
       yearsOfExperience: Math.floor(Math.random() * 10) + 1,
       skills: ["React", "JavaScript", "Problem Solving", "Management"],
       education: "Bachelor's Degree",
       summary: "A highly capable professional with strong problem solving skills."
     };
  }

  try {
    const baseUrl = 'https://api.opentyphoon.ai/v1/chat/completions';
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'typhoon-v2.5-30b-a3b-instruct', // The only active instruct model for this API key tier
        messages: [
          { role: 'system', content: 'You are a helpful HR AI extractor.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 8192
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Extract API Error Text:", errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      } catch(e) {
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) parsed = JSON.parse(match[1]);
      else throw new Error("Extract: JSON Parse failed");
    }
    
    return {
      id: `REAL-${Date.now()}`,
      ...parsed
    };
  } catch(e) {
    console.error("Extract Resume Error", e);
    throw e;
  }
};

const generateMockAnalysis = (jobReq, candidates) => {
  const keywords = jobReq.toLowerCase().split(' ');
  
  let scored = candidates.map(c => {
    let score = 50 + Math.floor(Math.random() * 30); 
    const matchCount = c.skills.filter(s => jobReq.toLowerCase().includes(s.toLowerCase())).length;
    score += matchCount * 5;
    
    if (jobReq.toLowerCase().includes(c.currentRole.toLowerCase())) {
        score += 15;
    }

    score = Math.min(score, 98);

    return {
      id: c.id,
      name: c.name,
      currentRole: c.currentRole,
      yearsOfExperience: c.yearsOfExperience,
      score,
      matchedSkills: c.skills.slice(0, 3),
      missingSkills: ['Specific Domain Knowledge'],
      pros: [`Has ${c.yearsOfExperience} years of experience`, `Matches key roles attributes`],
      cons: [`Might need training on specific internal tools`, `Salary expectations might be high`]
    };
  });

  scored.sort((a, b) => b.score - a.score);
  
  return {
    rankedCandidates: scored.slice(0, 5) 
  };
};
