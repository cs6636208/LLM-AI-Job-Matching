import * as pdfjsLib from 'pdfjs-dist';
import { API_URL } from '../config.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// โ”€โ”€ Token Refresh Logic โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
let isRefreshing = false;
let refreshSubscribers = [];

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
};

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

/**
 * Core fetch wrapper: attaches the current access token, and if the
 * server responds 403 (expired token), automatically requests a new
 * one via the httpOnly refresh-token cookie before retrying once.
 */
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // First attempt
  let res = await fetch(url, { ...options, headers, credentials: 'include' });

  // If 403, try to refresh the access token
  if (res.status === 403) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // send httpOnly cookie
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onTokenRefreshed(data.token);
        } else {
          // Refresh failed โ€” force logout
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
          throw new Error('Session expired. Please log in again.');
        }
      } finally {
        isRefreshing = false;
      }
    }

    // Wait for the ongoing refresh to complete, then retry
    const newToken = await new Promise((resolve) => {
      subscribeTokenRefresh(resolve);
    });

    const retryHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newToken}`,
      ...options.headers,
    };

    res = await fetch(url, { ...options, headers: retryHeaders, credentials: 'include' });
  }

  return res;
};

// โ”€โ”€ Public API โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

export const judgeCandidates = async (jobReq, candidates) => {
  try {
    const res = await authFetch(`${API_URL}/judge`, {
      method: 'POST',
      body: JSON.stringify({ jobReq, candidates }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to judge');
    return data;
  } catch (err) {
    console.error('LLM Judge API Error:', err);
    throw err;
  }
};

export const analyzeCandidates = async (jobReq, candidates) => {
  try {
    const res = await authFetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ jobReq, candidates }),
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
    const res = await authFetch(`${API_URL}/extract`, {
      method: 'POST',
      body: JSON.stringify({ text: resumeText }),
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
export const generateMockAnalysis = async (_jobReq, _candidates) => {
  // legacy fallback
  return { rankedCandidates: [] };
};
