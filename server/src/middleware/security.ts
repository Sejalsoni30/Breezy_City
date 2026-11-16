import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 100;

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
      connectSrc: ["'self'", CLIENT_ORIGIN, "https://*.open-meteo.com", "https://*.tile.openstreetmap.org"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin requests without an Origin header
    if (!origin) {
      return callback(null, true);
    }

    // Allow configured origin, localhost, or any onrender.com deployment
    if (
      CLIENT_ORIGIN === '*' ||
      origin === CLIENT_ORIGIN ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.onrender.com') ||
      origin.includes('onrender.com')
    ) {
      return callback(null, true);
    }

    callback(new Error('CORS request blocked by origin allowlist'));
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  maxAge: 86400
});

export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please wait before making more requests.'
  }
});

/**
 * Production-safe Global Error Handler.
 * Never leaks internal stack traces or database/upstream details to clients.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Safe logging in dev / test
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.error('[Error Handler]', err.message || err);
  }

  // Handle CORS rejection
  if (err.message && err.message.includes('CORS')) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed by CORS policy'
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  const message =
    statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Request failed.';

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message
  });
}
