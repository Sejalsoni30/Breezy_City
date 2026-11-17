import { Request, Response, NextFunction } from 'express';
import { fetchRawWeather } from '../services/openMeteo.js';
import { appCache, AppCache } from '../services/cache.js';
import { SERVER_CONFIG } from '../config/constants.js';

export async function handleWeather(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    const roundedLat = AppCache.roundCoord(lat);
    const roundedLon = AppCache.roundCoord(lon);
    const cacheKey = `wx:${roundedLat}:${roundedLon}`;

    const { data, isCached } = await appCache.fetchWithDeduplication(
      cacheKey,
      () => fetchRawWeather(lat, lon),
      SERVER_CONFIG.CACHE_TTL.WEATHER_SECONDS
    );

    res.json({
      ...data,
      dataState: isCached ? 'Cached' : 'Live'
    });
  } catch (err) {
    next(err);
  }
}
