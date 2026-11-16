const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = new URL(
  configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:3000' : ''),
).origin;
