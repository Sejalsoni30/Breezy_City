import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// Safe query pattern: letters, numbers, spaces, common punctuation in city/place names
const SAFE_PLACE_NAME_REGEX = /^[a-zA-Z0-9\s,.\-'\u00C0-\u024F\u0900-\u097F]+$/;

export const geocodeQuerySchema = z.object({
  q: z
    .string({ required_error: 'Query parameter "q" is required.' })
    .trim()
    .min(1, 'Query must be at least 1 character long.')
    .max(100, 'Query cannot exceed 100 characters.')
    .refine(
      (val) => SAFE_PLACE_NAME_REGEX.test(val),
      'Query contains invalid or disallowed characters.'
    )
});

export const coordsQuerySchema = z.object({
  lat: z.coerce
    .number({ required_error: 'Latitude parameter "lat" is required.' })
    .min(-90, 'Latitude must be between -90 and 90 degrees.')
    .max(90, 'Latitude must be between -90 and 90 degrees.'),
  lon: z.coerce
    .number({ required_error: 'Longitude parameter "lon" is required.' })
    .min(-180, 'Longitude must be between -180 and 180 degrees.')
    .max(180, 'Longitude must be between -180 and 180 degrees.'),
  standard: z.enum(['CPCB', 'US_EPA']).optional().default('CPCB')
});

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

    req.query = result.data as any;
    next();
  };
}
