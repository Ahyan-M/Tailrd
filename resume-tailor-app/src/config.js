// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://tailrd.onrender.com';

export const API_ENDPOINTS = {
  OPTIMIZE_DOCX: `${API_BASE_URL}/optimize-docx`,
  SUGGEST_KEYWORDS: `${API_BASE_URL}/suggest-keywords`,
  FINALIZE_RESUME: `${API_BASE_URL}/finalize-resume`,
  DOWNLOAD_OPTIMIZED: `${API_BASE_URL}/download-optimized`,
};

export default API_BASE_URL; 