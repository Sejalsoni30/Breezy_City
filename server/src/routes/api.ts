import { Router, Request, Response, NextFunction } from 'express';
import { validateQuery, geocodeQuerySchema, coordsQuerySchema } from '../middleware/validate.js';
import { searchLocations, fetchRawAirQuality, fetchRawWeather } from '../services/openMeteo.js';
import { calculateCpcbAqi } from '../aqi/calculator.js';
import { calculateEpaSubIndex, getEpaCategory } from '../aqi/epaCalculator.js';
import { EPA_CATEGORIES } from '../aqi/epaBreakpoints.js';
import { getHealthGuidance } from '../aqi/healthGuidance.js';
import { processTrends } from '../aqi/trends.js';
import { appCache, AppCache } from '../services/cache.js';
import { AirQualityApiResponse, WeatherData } from '../types/index.js';

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
          let finalCategoryInfo: any = null;
          let finalDominant: string[] = [];
          let finalStandardName = 'India CPCB National Air Quality Index (NAQI)';
          let finalStandardRef = 'Central Pollution Control Board, MoEFCC, Oct 2014 Table 1';

          if (standard === 'US_EPA') {
            finalStandardName = 'US EPA Air Quality Index (2024 Revised Standard)';
            finalStandardRef = 'US EPA Technical Assistance Document (EPA-454/B-24-001, May 2024)';

            const epaPm25 = current.pm2_5 !== undefined ? calculateEpaSubIndex('pm2_5', current.pm2_5) : null;
            const epaPm10 = current.pm10 !== undefined ? calculateEpaSubIndex('pm10', current.pm10) : null;

            const validIndices = [
              { key: 'pm2_5', res: epaPm25 },
              { key: 'pm10', res: epaPm10 }
            ].filter((item): item is { key: string; res: { subIndex: number; category: any } } => item.res !== null);

            if (validIndices.length > 0) {
              const maxItem = validIndices.reduce((prev, curr) =>
                curr.res.subIndex > prev.res.subIndex ? curr : prev
              );
              finalAqi = maxItem.res.subIndex;
              finalCategory = maxItem.res.category;
              finalCategoryInfo = EPA_CATEGORIES[maxItem.res.category as keyof typeof EPA_CATEGORIES];
              finalDominant = [maxItem.key];
            }
          } else {
            // Default India CPCB NAQI
            const cpcbRes = calculateCpcbAqi({
              pm2_5: current.pm2_5,
              pm10: current.pm10,
              nitrogen_dioxide: current.nitrogen_dioxide,
              ozone: current.ozone,
              carbon_monoxide: current.carbon_monoxide,
              sulphur_dioxide: current.sulphur_dioxide
            });
            finalAqi = cpcbRes.aqi;
            finalCategory = cpcbRes.category;
            finalCategoryInfo = cpcbRes.categoryInfo;
            finalDominant = cpcbRes.dominantPollutants;
          }

          // Compute underlying pollutant breakdown & health guidance
          const baseCpcb = calculateCpcbAqi({
            pm2_5: current.pm2_5,
            pm10: current.pm10,
            nitrogen_dioxide: current.nitrogen_dioxide,
            ozone: current.ozone,
            carbon_monoxide: current.carbon_monoxide,
            sulphur_dioxide: current.sulphur_dioxide
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
