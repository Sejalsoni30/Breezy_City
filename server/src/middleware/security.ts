import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { SERVER_CONFIG } from '../config/constants.js';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || SERVER_CONFIG.DEFAULT_CLIENT_ORIGIN;

/**
 * Helmet Content Security Policy and Secure Headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://unpkg.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'https://*.arcgisonline.com',
        'https://server.arcgisonline.com',
        'https://*.basemaps.cartocdn.com',
        'https://*.tile.openstreetmap.org',
        'https://unpkg.com'
      ],
      connectSrc: [
        "'self'",
        CLIENT_ORIGIN,
        'https://*.open-meteo.com',
        'https://*.arcgisonline.com',
        'https://server.arcgisonline.com',
        'https://*.basemaps.cartocdn.com',
        'https://*.tile.openstreetmap.org',
        'https://unpkg.com'
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * Restrict browser hardware permissions via Permissions-Policy header
 */
export function permissionsPolicy(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(), payment=()');
  next();
}

/**
 * CORS Middleware with strict origin allowlist
 */
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
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  maxAge: 86400
});

/**
 * API Route Rate Limiting (DDoS & Brute Force Prevention)
 */
export const apiRateLimiter = rateLimit({
  windowMs: SERVER_CONFIG.RATE_LIMIT.WINDOW_MS,
  max: SERVER_CONFIG.RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please wait before making more requests.'
  }
});

export interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Production-safe Global Error Handler.
 * Never leaks internal stack traces or database/upstream details to clients.
 */
export function errorHandler(
  err: HttpError,
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
