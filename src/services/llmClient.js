import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const BACKEND_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const analyzeCandidates = async (jobReq, candidates) => {
  try {
    const res = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ jobReq, candidates })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to analyze');

    return data;
  } catch (err) {
    console.error('LLM API Error:', err);
    throw err;
  }
};

export const extractProfileFromText = async (resumeText) => {
  try {
    const res = await fetch(`${BACKEND_URL}/extract`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text: resumeText })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to extract resume');

    return data;
  } catch (err) {
    console.error('Extraction Error:', err);
    throw err;
  }
};

export const extractResumeData = async (file) => {
  try {
    let rawText = '';

    if (file.type === 'text/plain') {
      rawText = await file.text();
    } else if (file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      rawText = fullText;
    } else {
      throw new Error("Unsupported file format. Please upload PDF or TXT.");
    }

    if (!rawText.trim()) throw new Error("File appears to be empty or unreadable.");

    return await extractProfileFromText(rawText);

  } catch (error) {
    console.error("Resume extraction failed:", error);
    throw error;
  }
};

// Expose mock for fast local offline testing if needed, though usually not called anymore.
export const generateMockAnalysis = async (jobReq, candidates) => {
  // legacy fallback
  return { rankedCandidates: [] };
};
