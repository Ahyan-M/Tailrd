// API Configuration
// For production with custom domain, use: 'https://api.tailrd.com'
// For current Render deployment: 'https://tailrd.onrender.com'
// For local development: 'http://localhost:8000'
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://tailrd.onrender.com';

export const API_ENDPOINTS = {
  OPTIMIZE_DOCX: `${API_BASE_URL}/optimize-docx`,
  SUGGEST_KEYWORDS: `${API_BASE_URL}/suggest-keywords`,
  FINALIZE_RESUME: `${API_BASE_URL}/finalize-resume`,
  DOWNLOAD_OPTIMIZED: `${API_BASE_URL}/download-optimized`,
  HEALTH_CHECK: `${API_BASE_URL}/health`,
};

export default API_BASE_URL; 