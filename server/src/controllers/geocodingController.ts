import { Request, Response, NextFunction } from 'express';
import { searchLocations } from '../services/openMeteo.js';
import { appCache } from '../services/cache.js';
import { SERVER_CONFIG } from '../config/constants.js';

export async function handleGeocode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = req.query.q as string;
    const cacheKey = `geo:${q.toLowerCase()}`;

    const { data } = await appCache.fetchWithDeduplication(
      cacheKey,
      () => searchLocations(q),
      SERVER_CONFIG.CACHE_TTL.GEOCODING_SECONDS
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
}
