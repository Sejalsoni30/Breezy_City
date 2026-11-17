import { Request, Response, NextFunction } from 'express';
import { fetchHistoricalTrends } from '../services/historicalTrends.js';
import { appCache, AppCache } from '../services/cache.js';
import { SERVER_CONFIG } from '../config/constants.js';

export async function handleHistoricalTrends(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const days = Number(req.query.days) || SERVER_CONFIG.BOUNDS.DEFAULT_HISTORY_DAYS;

    const roundedLat = AppCache.roundCoord(lat);
    const roundedLon = AppCache.roundCoord(lon);
    const cacheKey = `hist:${days}:${roundedLat}:${roundedLon}`;

    const { data } = await appCache.fetchWithDeduplication(
      cacheKey,
      () => fetchHistoricalTrends(lat, lon, days),
      SERVER_CONFIG.CACHE_TTL.HISTORICAL_TRENDS_SECONDS
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
}
