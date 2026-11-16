import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import { securityHeaders, corsMiddleware, apiRateLimiter, errorHandler } from './middleware/security.js';
import { apiRouter } from './routes/api.js';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10kb' }));

  // Apply rate limiter to /api
  app.use('/api', apiRateLimiter);

  // robots.txt route for SEO compliance
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send('User-agent: *\nAllow: /\n');
  });

  // Mount API endpoints
  app.use('/api', apiRouter);

  // In production, serve static client assets if built
  const possiblePaths = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist')
  ];

  const clientDist = possiblePaths.find((p) => fs.existsSync(p));
  if (clientDist) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
