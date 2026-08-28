// Centralized API configuration — reads from VITE_API_URL env var
// In development this defaults to http://localhost:5000/api
// In production, set VITE_API_URL to your deployed backend URL

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
