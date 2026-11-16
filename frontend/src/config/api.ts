/**
 * Global API configuration for frontend communication with NestJS backend.
 * Falls back to http://localhost:3000 during local development if VITE_API_URL is omitted.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';
