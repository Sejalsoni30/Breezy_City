/**
 * Application-wide Server Configuration and Constants
 *
 * Centralizes all magic numbers, timeouts, cache TTLs, and external API endpoints.
 */

export const SERVER_CONFIG = {
  DEFAULT_PORT: 3001,
  DEFAULT_CLIENT_ORIGIN: 'http://localhost:5173',
  UPSTREAM_TIMEOUT_MS: Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000,
  CACHE_TTL: {
    GEOCODING_SECONDS: 86400, // 24 hours
    AIR_QUALITY_SECONDS: Number(process.env.CACHE_TTL_SECONDS) || 900, // 15 minutes
    WEATHER_SECONDS: 900, // 15 minutes
    HISTORICAL_TRENDS_SECONDS: 3600 // 1 hour
  },
  RATE_LIMIT: {
    WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX) || 100
  },
  API_ENDPOINTS: {
    OPEN_METEO_GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
    OPEN_METEO_AIR_QUALITY: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    OPEN_METEO_WEATHER: 'https://api.open-meteo.com/v1/forecast',
    GEMINI_GENERATE_CONTENT:
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
  },
  BOUNDS: {
    MIN_LATITUDE: -90,
    MAX_LATITUDE: 90,
    MIN_LONGITUDE: -180,
    MAX_LONGITUDE: 180,
    MIN_HISTORY_DAYS: 1,
    MAX_HISTORY_DAYS: 30,
    DEFAULT_HISTORY_DAYS: 7,
    MAX_QUERY_LENGTH: 100,
    MAX_HISTORY_ITEMS: 50,
    MAX_RETURNED_HISTORY: 10
  }
} as const;
