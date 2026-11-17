import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { SERVER_CONFIG } from '../config/constants.js';

// Safe query pattern: letters, numbers, spaces, common punctuation in city/place names
const SAFE_PLACE_NAME_REGEX = /^[a-zA-Z0-9\s,.\-'\u00C0-\u024F\u0900-\u097F]+$/;

export const geocodeQuerySchema = z.object({
  q: z
    .string({ message: 'Query parameter "q" is required.' })
    .trim()
    .min(1, 'Query must be at least 1 character long.')
    .max(
      SERVER_CONFIG.BOUNDS.MAX_QUERY_LENGTH,
      `Query cannot exceed ${SERVER_CONFIG.BOUNDS.MAX_QUERY_LENGTH} characters.`
    )
    .refine(
      (val) => SAFE_PLACE_NAME_REGEX.test(val),
      'Query contains invalid or disallowed characters.'
    )
});

export const coordsQuerySchema = z.object({
  lat: z.coerce
    .number({ message: 'Latitude parameter "lat" is required.' })
    .min(
      SERVER_CONFIG.BOUNDS.MIN_LATITUDE,
      `Latitude must be between ${SERVER_CONFIG.BOUNDS.MIN_LATITUDE} and ${SERVER_CONFIG.BOUNDS.MAX_LATITUDE} degrees.`
    )
    .max(
      SERVER_CONFIG.BOUNDS.MAX_LATITUDE,
      `Latitude must be between ${SERVER_CONFIG.BOUNDS.MIN_LATITUDE} and ${SERVER_CONFIG.BOUNDS.MAX_LATITUDE} degrees.`
    ),
  lon: z.coerce
    .number({ message: 'Longitude parameter "lon" is required.' })
    .min(
      SERVER_CONFIG.BOUNDS.MIN_LONGITUDE,
      `Longitude must be between ${SERVER_CONFIG.BOUNDS.MIN_LONGITUDE} and ${SERVER_CONFIG.BOUNDS.MAX_LONGITUDE} degrees.`
    )
    .max(
      SERVER_CONFIG.BOUNDS.MAX_LONGITUDE,
      `Longitude must be between ${SERVER_CONFIG.BOUNDS.MIN_LONGITUDE} and ${SERVER_CONFIG.BOUNDS.MAX_LONGITUDE} degrees.`
    ),
  standard: z.enum(['CPCB', 'US_EPA']).optional().default('CPCB')
});

export const historicalTrendsSchema = coordsQuerySchema.extend({
  days: z.coerce
    .number()
    .min(SERVER_CONFIG.BOUNDS.MIN_HISTORY_DAYS)
    .max(SERVER_CONFIG.BOUNDS.MAX_HISTORY_DAYS)
    .default(SERVER_CONFIG.BOUNDS.DEFAULT_HISTORY_DAYS)
});

export const aiAdvisorySchema = z.object({
  aqi: z.coerce.number().min(0).max(500),
  category: z.string().trim().min(1).max(40),
  dominantPollutant: z.string().trim().min(1).max(30),
  userProfile: z.enum(['general', 'asthma', 'elderly', 'child', 'athlete']).default('general')
});

export const bookmarkCreateSchema = z.object({
  userId: z.string().trim().max(64).optional().default('anonymous'),
  name: z.string().trim().min(1, 'Name is required').max(100),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  displayName: z.string().trim().max(150).optional()
});

export const bookmarkDeleteParamsSchema = z.object({
  id: z.string().trim().min(1, 'Bookmark ID is required').max(64)
});

export const historyCreateSchema = z.object({
  userId: z.string().trim().max(64).optional().default('anonymous'),
  query: z
    .string({ message: 'Query string required' })
    .trim()
    .min(1, 'Query must not be empty')
    .max(SERVER_CONFIG.BOUNDS.MAX_QUERY_LENGTH)
    .refine((val) => SAFE_PLACE_NAME_REGEX.test(val), 'Search query contains disallowed characters')
});

/**
 * Validates request query parameters against a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({
        error: 'Bad Request',
        message: issue.message,
        path: issue.path.join('.')
      });
      return;
    }

    req.query = result.data as unknown as Request['query'];
    next();
  };
}

/**
 * Validates request body JSON against a Zod schema.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({
        error: 'Bad Request',
        message: issue.message,
        path: issue.path.join('.')
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Validates route parameters (e.g. :id) against a Zod schema.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({
        error: 'Bad Request',
        message: issue.message,
        path: issue.path.join('.')
      });
      return;
    }

    req.params = result.data as unknown as Request['params'];
    next();
  };
}
