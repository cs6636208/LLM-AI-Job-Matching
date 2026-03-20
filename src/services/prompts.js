export const PROMPTS = {
  MATCH_CANDIDATES: (jobReq, candidatesJSON) => `
You are an expert HR AI Assistant. Your task is to evaluate a pool of candidates against a specific job requirement.

Job Requirement:
"${jobReq}"

Please evaluate ALL the provided candidates. Return ONLY the Top 10 best matching candidates in the "rankedCandidates" array.
Even if their scores are low, ALWAYS return the 10 highest scoring candidates (do not return an empty array).
Calculate a "score" (0-100) for each candidate based on how well their skills and experience match the requirement.
Identify their "matchedSkills", "missingSkills", and provide 2-3 "pros" and "cons" for why they fit or don't fit.
Sort the final array by score in descending order.

Respond STRICTLY with valid JSON in the following format, with no markdown code blocks around it if possible.

{
  "rankedCandidates": [
    {
      "id": "CAND-001",
      "name": "John Doe",
      "currentRole": "Software Engineer",
      "yearsOfExperience": 5,
      "score": 95,
      "matchedSkills": ["React", "Node.js"],
      "missingSkills": ["AWS"],
      "pros": ["Strong background in React", "Adequate years of experience"],
      "cons": ["Lacks cloud infrastructure experience"]
    }
  ]
}
`,
  EXTRACT_RESUME: (resumeText) => `
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
${resumeText}
"""
`
};
