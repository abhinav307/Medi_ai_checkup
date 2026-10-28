export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'https://abhinav1a-medi-ai-backend.hf.space')
).replace(/\/$/, '');

/**
 * Normalizes an image URL so it resolves correctly whether relative, localhost, or hosted.
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://localhost:8000')) {
    return url.replace('http://localhost:8000', API_BASE_URL);
  }
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
};
