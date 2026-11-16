const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const productionApiUrl = 'https://api-zakath-t9sf.onrender.com';

function resolveProductionApiUrl(): string {
  try {
    const url = new URL(configuredApiUrl || productionApiUrl);
    if (url.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      return url.origin;
    }
  } catch {
    // Fall back to the deployed Render service if the override is malformed.
  }
  return productionApiUrl;
}

export const API_BASE_URL = import.meta.env.DEV
  ? configuredApiUrl || 'http://localhost:3000'
  : resolveProductionApiUrl();
