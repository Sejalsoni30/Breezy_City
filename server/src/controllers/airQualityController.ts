import { Request, Response, NextFunction } from 'express';
import { computeAirQuality } from '../services/airQualityService.js';
import { appCache, AppCache } from '../services/cache.js';
import { SERVER_CONFIG } from '../config/constants.js';

export async function handleAirQuality(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const standard = ((req.query.standard as string) || 'CPCB') as 'CPCB' | 'US_EPA';

    const roundedLat = AppCache.roundCoord(lat);
    const roundedLon = AppCache.roundCoord(lon);
    const cacheKey = `aqi:${standard}:${roundedLat}:${roundedLon}`;

    const { data, isCached, ageSeconds } = await appCache.fetchWithDeduplication(
      cacheKey,
      () => computeAirQuality({ latitude: lat, longitude: lon, standard }),
      SERVER_CONFIG.CACHE_TTL.AIR_QUALITY_SECONDS
    );

    // Deep copy to adjust metadata state & age for cached returns
    const responsePayload = {
      ...data,
      metadata: {
        ...data.metadata,
        dataState: isCached ? ('Cached' as const) : ('Live' as const),
        cachedAgeSeconds: isCached ? ageSeconds : 0
      }
    };

    res.json(responsePayload);
  } catch (err) {
    next(err);
  }
}
