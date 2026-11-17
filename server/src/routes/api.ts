import { Router, Request, Response } from 'express';
import {
  validateQuery,
  validateBody,
  validateParams,
  geocodeQuerySchema,
  coordsQuerySchema,
  historicalTrendsSchema,
  aiAdvisorySchema,
  bookmarkCreateSchema,
  bookmarkDeleteParamsSchema,
  historyCreateSchema
} from '../middleware/validate.js';
import { handleGeocode } from '../controllers/geocodingController.js';
import { handleAirQuality } from '../controllers/airQualityController.js';
import { handleWeather } from '../controllers/weatherController.js';
import { handleHistoricalTrends } from '../controllers/trendsController.js';
import { handleAiAdvisory } from '../controllers/aiController.js';
import {
  handleGetBookmarks,
  handleCreateBookmark,
  handleDeleteBookmark
} from '../controllers/bookmarksController.js';
import { handleGetHistory, handleCreateHistory } from '../controllers/historyController.js';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Urban Air Quality Assistant API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Geocoding search endpoint
apiRouter.get('/geocode', validateQuery(geocodeQuerySchema), handleGeocode);

// Air Quality endpoint (CPCB & US EPA standard calculation)
apiRouter.get('/air-quality', validateQuery(coordsQuerySchema), handleAirQuality);

// Weather context endpoint
apiRouter.get('/weather', validateQuery(coordsQuerySchema), handleWeather);

// Historical multi-day trends endpoint
apiRouter.get('/historical-trends', validateQuery(historicalTrendsSchema), handleHistoricalTrends);

// AI Health Advisory endpoint (Google Gemini / Guardrailed Fallback)
apiRouter.post('/ai/advisory', validateBody(aiAdvisorySchema), handleAiAdvisory);

// User bookmarked locations endpoints
apiRouter.get('/bookmarks', handleGetBookmarks);
apiRouter.post('/bookmarks', validateBody(bookmarkCreateSchema), handleCreateBookmark);
apiRouter.delete(
  '/bookmarks/:id',
  validateParams(bookmarkDeleteParamsSchema),
  handleDeleteBookmark
);

// User search history endpoints
apiRouter.get('/history', handleGetHistory);
apiRouter.post('/history', validateBody(historyCreateSchema), handleCreateHistory);
