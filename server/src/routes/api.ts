import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateQuery, geocodeQuerySchema, coordsQuerySchema } from '../middleware/validate.js';
import { searchLocations, fetchRawAirQuality, fetchRawWeather, OpenMeteoAirQualityRawResponse } from '../services/openMeteo.js';
import { calculateCpcbAqi, calculateSubIndex, getCategoryFromAqi } from '../aqi/calculator.js';
import { calculateEpaSubIndex, getEpaCategory } from '../aqi/epaCalculator.js';
import { EPA_CATEGORIES, EpaAqiCategory } from '../aqi/epaBreakpoints.js';
import { getHealthGuidance } from '../aqi/healthGuidance.js';
import { processTrends } from '../aqi/trends.js';
import { appCache, AppCache } from '../services/cache.js';
import { generateAiHealthAdvisory } from '../services/aiAdvisory.js';
import { db } from '../services/db.js';
import { AirQualityApiResponse, WeatherData, AqiCategoryInfo } from '../types/index.js';

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
apiRouter.get(
  '/geocode',
  validateQuery(geocodeQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query.q as string;
      const cacheKey = `geo:${q.toLowerCase()}`;

      const { data } = await appCache.fetchWithDeduplication(
        cacheKey,
        () => searchLocations(q),
        86400 // Cache geocoding for 24h
      );

      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// Air Quality endpoint
apiRouter.get(
  '/air-quality',
  validateQuery(coordsQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      const standard = (req.query.standard as string) || 'CPCB';

      const roundedLat = AppCache.roundCoord(lat);
      const roundedLon = AppCache.roundCoord(lon);
      const cacheKey = `aqi:${standard}:${roundedLat}:${roundedLon}`;

      const { data, isCached, ageSeconds } = await appCache.fetchWithDeduplication(
        cacheKey,
        async () => {
          const raw = await fetchRawAirQuality(lat, lon);
          const current = raw.current || {};
          const hourly = raw.hourly || {};

          let finalAqi: number | null = null;
          let finalCategory: string | null = null;
          let finalCategoryInfo: AqiCategoryInfo | null = null;
          let finalDominant: string[] = [];
          let finalStandardName = 'India CPCB National Air Quality Index (NAQI)';
          let finalStandardRef = 'Central Pollution Control Board, MoEFCC, Oct 2014 Table 1';

          if (standard === 'US_EPA') {
            finalStandardName = 'US EPA Air Quality Index (2024 Revised Standard)';
            finalStandardRef = 'US EPA Technical Assistance Document (EPA-454/B-24-001, May 2024)';

            const epaPm25 = typeof current.pm2_5 === 'number' ? calculateEpaSubIndex('pm2_5', current.pm2_5) : null;
            const epaPm10 = typeof current.pm10 === 'number' ? calculateEpaSubIndex('pm10', current.pm10) : null;

            const validIndices: Array<{ key: string; res: { subIndex: number; category: EpaAqiCategory } }> = [];
            if (epaPm25 !== null) validIndices.push({ key: 'pm2_5', res: epaPm25 });
            if (epaPm10 !== null) validIndices.push({ key: 'pm10', res: epaPm10 });

            if (validIndices.length > 0) {
              const maxItem = validIndices.reduce((prev, curr) =>
                curr.res.subIndex > prev.res.subIndex ? curr : prev
              );
              finalAqi = maxItem.res.subIndex;
              finalCategory = maxItem.res.category;
              finalCategoryInfo = EPA_CATEGORIES[maxItem.res.category];
              finalDominant = [maxItem.key];
            }
          } else {
            // Default India CPCB NAQI
            const cpcbRes = calculateCpcbAqi({
              pm2_5: current.pm2_5 ?? null,
              pm10: current.pm10 ?? null,
              nitrogen_dioxide: current.nitrogen_dioxide ?? null,
              ozone: current.ozone ?? null,
              carbon_monoxide: current.carbon_monoxide ?? null,
              sulphur_dioxide: current.sulphur_dioxide ?? null
            });
            finalAqi = cpcbRes.aqi;
            finalCategory = cpcbRes.category;
            finalCategoryInfo = cpcbRes.categoryInfo;
            finalDominant = cpcbRes.dominantPollutants;
          }

          // Compute underlying pollutant breakdown & health guidance
          const baseCpcb = calculateCpcbAqi({
            pm2_5: current.pm2_5 ?? null,
            pm10: current.pm10 ?? null,
            nitrogen_dioxide: current.nitrogen_dioxide ?? null,
            ozone: current.ozone ?? null,
            carbon_monoxide: current.carbon_monoxide ?? null,
            sulphur_dioxide: current.sulphur_dioxide ?? null
          });

          // Health guidance based on category
          const healthGuidance = getHealthGuidance(baseCpcb.category);

          // Trends calculation
          const trends = processTrends(hourly, current.time);

          const responsePayload: AirQualityApiResponse = {
            standard: standard as 'CPCB' | 'US_EPA',
            standardName: finalStandardName,
            standardReference: finalStandardRef,
            location: {
              latitude: lat,
              longitude: lon
            },
            aqi: finalAqi,
            category: finalCategory,
            categoryInfo: finalCategoryInfo,
            dominantPollutants: finalDominant,
            pollutants: baseCpcb.pollutants,
            healthGuidance,
            trends,
            metadata: {
              source: 'Open-Meteo Atmospheric Chemistry Model Grid',
              isModelEstimate: true,
              dataNatureDisclosure:
                'Modelled atmospheric reanalysis and forecast grid; not a physical ground monitoring station.',
              modelTime: current.time || new Date().toISOString(),
              fetchTime: new Date().toISOString(),
              dataState: 'Live'
            }
          };

          return responsePayload;
        }
      );

      // Deep copy to adjust metadata state & age for cached returns
      const payload: AirQualityApiResponse = {
        ...data,
        metadata: {
          ...data.metadata,
          dataState: isCached ? 'Cached' : 'Live',
          cachedAgeSeconds: isCached ? ageSeconds : 0
        }
      };

      res.json(payload);
    } catch (err) {
      next(err);
    }
  }
);

// Weather context endpoint
apiRouter.get(
  '/weather',
  validateQuery(coordsQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);

      const roundedLat = AppCache.roundCoord(lat);
      const roundedLon = AppCache.roundCoord(lon);
      const cacheKey = `wx:${roundedLat}:${roundedLon}`;

      const { data, isCached, ageSeconds } = await appCache.fetchWithDeduplication(
        cacheKey,
        () => fetchRawWeather(lat, lon)
      );

      const payload: WeatherData = {
        ...data,
        dataState: isCached ? 'Cached' : 'Live'
      };

      res.json(payload);
    } catch (err) {
      next(err);
    }
  }
);

// Historical Multi-Day Trends endpoint
const historicalTrendsSchema = coordsQuerySchema.extend({
  days: z.coerce.number().min(1).max(30).default(7)
});

apiRouter.get(
  '/historical-trends',
  validateQuery(historicalTrendsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      const days = Number(req.query.days) || 7;

      const roundedLat = AppCache.roundCoord(lat);
      const roundedLon = AppCache.roundCoord(lon);
      const cacheKey = `hist:${days}:${roundedLat}:${roundedLon}`;

      const { data } = await appCache.fetchWithDeduplication(
        cacheKey,
        async () => {
          const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,nitrogen_dioxide,ozone&past_days=${days}&forecast_days=0`;
          const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (!response.ok) throw new Error('Failed to fetch historical model data');
          const raw = (await response.json()) as OpenMeteoAirQualityRawResponse;

          const hourly = raw.hourly || {};
          const dailyMap = new Map<string, { pm2_5: number[]; pm10: number[] }>();

          (hourly.time || []).forEach((t: string, idx: number) => {
            const dateStr = t.split('T')[0];
            if (!dailyMap.has(dateStr)) dailyMap.set(dateStr, { pm2_5: [], pm10: [] });
            const entry = dailyMap.get(dateStr)!;
            if (hourly.pm2_5?.[idx] != null) entry.pm2_5.push(hourly.pm2_5[idx]);
            if (hourly.pm10?.[idx] != null) entry.pm10.push(hourly.pm10[idx]);
          });

          const dailySeries = Array.from(dailyMap.entries()).map(([date, vals]) => {
            const avgPm25 = vals.pm2_5.length ? Math.round(vals.pm2_5.reduce((a, b) => a + b, 0) / vals.pm2_5.length) : null;
            const avgPm10 = vals.pm10.length ? Math.round(vals.pm10.reduce((a, b) => a + b, 0) / vals.pm10.length) : null;
            const subPm25 = avgPm25 !== null ? calculateSubIndex('pm2_5', avgPm25)?.subIndex ?? null : null;
            const subPm10 = avgPm10 !== null ? calculateSubIndex('pm10', avgPm10)?.subIndex ?? null : null;
            const aqi = Math.max(subPm25 ?? 0, subPm10 ?? 0) || null;

            return {
              date,
              avgPm25,
              avgPm10,
              aqi,
              category: aqi ? getCategoryFromAqi(aqi) : null
            };
          });

          return { days, series: dailySeries };
        },
        3600 // Cache 1 hour
      );

      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// Generative AI Health Advisory endpoint
const aiAdvisorySchema = z.object({
  aqi: z.coerce.number().min(0).max(500),
  category: z.string().max(40),
  dominantPollutant: z.string().max(30),
  userProfile: z.enum(['general', 'asthma', 'elderly', 'child', 'athlete']).default('general')
});

apiRouter.post(
  '/ai/advisory',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = aiAdvisorySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Bad Request', details: parsed.error.issues });
        return;
      }

      const { aqi, category, dominantPollutant, userProfile } = parsed.data;
      const result = await generateAiHealthAdvisory(aqi, category, dominantPollutant, userProfile);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Database Bookmarks endpoints
apiRouter.get('/bookmarks', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'anonymous';
  const bookmarks = db.getBookmarks(userId);
  res.json({ userId, bookmarks });
});

apiRouter.post('/bookmarks', (req: Request, res: Response) => {
  const { userId = 'anonymous', name, latitude, longitude, displayName } = req.body || {};
  if (!name || latitude == null || longitude == null) {
    res.status(400).json({ error: 'Missing bookmark fields' });
    return;
  }
  const item = db.saveBookmark(userId, { name, latitude, longitude, displayName: displayName || name });
  res.status(201).json(item);
});

apiRouter.delete('/bookmarks/:id', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'anonymous';
  const bookmarkId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = db.deleteBookmark(userId, bookmarkId);
  res.json({ success });
});

// Database Search History endpoints
apiRouter.get('/history', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'anonymous';
  const history = db.getSearchHistory(userId);
  res.json({ userId, history });
});

apiRouter.post('/history', (req: Request, res: Response) => {
  const { userId = 'anonymous', query } = req.body || {};
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query string required' });
    return;
  }
  const item = db.addSearchHistory(userId, query.trim());
  res.status(201).json(item);
});
