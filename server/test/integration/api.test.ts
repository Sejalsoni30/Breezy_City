import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { appCache } from '../../src/services/cache.js';

describe('API Server Integration Tests', () => {
  const app = createApp();

  beforeAll(() => {
    appCache.flush();
  });

  afterAll(() => {
    appCache.flush();
  });

  describe('GET /api/health', () => {
    it('returns 200 OK and health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toContain('Urban Air Quality');
    });

    it('sets protective security headers via Helmet', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('GET /api/geocode', () => {
    it('returns geocoded locations for valid query', async () => {
      const res = await request(app).get('/api/geocode?q=Delhi');
      expect(res.status).toBe(200);
      expect(res.body.query).toBe('Delhi');
      expect(Array.isArray(res.body.results)).toBe(true);
      if (res.body.results.length > 0) {
        expect(res.body.results[0]).toHaveProperty('name');
        expect(res.body.results[0]).toHaveProperty('displayName');
        expect(res.body.results[0]).toHaveProperty('latitude');
        expect(res.body.results[0]).toHaveProperty('longitude');
      }
    });

    it('rejects missing query with 400 Bad Request', async () => {
      const res = await request(app).get('/api/geocode');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Bad Request');
    });

    it('rejects malicious or injection-style queries with 400', async () => {
      const res = await request(app).get('/api/geocode?q=<script>alert("xss")</script>');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Bad Request');
    });

    it('rejects oversized queries > 100 chars with 400', async () => {
      const oversized = 'A'.repeat(105);
      const res = await request(app).get(`/api/geocode?q=${oversized}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Bad Request');
    });
  });

  describe('GET /api/air-quality', () => {
    it('returns full CPCB AQI calculation and transparency metadata', async () => {
      const res = await request(app).get('/api/air-quality?lat=28.6139&lon=77.2090');
      expect(res.status).toBe(200);

      // Verify CPCB standard fields
      expect(res.body.standard).toBe('CPCB');
      expect(res.body.standardName).toContain('India CPCB');
      expect(res.body).toHaveProperty('aqi');
      expect(res.body).toHaveProperty('category');
      expect(res.body).toHaveProperty('dominantPollutants');
      expect(res.body.pollutants).toHaveProperty('pm2_5');
      expect(res.body.pollutants).toHaveProperty('carbon_monoxide');

      // Verify health guidance & disclaimer
      expect(res.body.healthGuidance).toHaveProperty('general');
      expect(res.body.healthGuidance.disclaimer).toContain('Informational only');

      // Verify trend data
      expect(res.body.trends).toHaveProperty('summary');
      expect(Array.isArray(res.body.trends.history)).toBe(true);

      // Verify data nature disclosure (mandatory: model estimate, not station)
      expect(res.body.metadata.isModelEstimate).toBe(true);
      expect(res.body.metadata.dataNatureDisclosure).toContain('not a physical ground monitoring station');
      expect(res.body.metadata.dataState).toBe('Live');
    });

    it('serves subsequent requests from cache with age metadata', async () => {
      // First request (miss or cached)
      await request(app).get('/api/air-quality?lat=28.6139&lon=77.2090');

      // Immediate second request (cache hit)
      const res2 = await request(app).get('/api/air-quality?lat=28.6139&lon=77.2090');
      expect(res2.status).toBe(200);
      expect(res2.body.metadata.dataState).toBe('Cached');
      expect(res2.body.metadata.cachedAgeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('supports US EPA standard calculation when standard=US_EPA is requested', async () => {
      const res = await request(app).get('/api/air-quality?lat=28.6139&lon=77.2090&standard=US_EPA');
      expect(res.status).toBe(200);
      expect(res.body.standard).toBe('US_EPA');
      expect(res.body.standardName).toContain('US EPA');
      expect(res.body).toHaveProperty('aqi');
      expect(res.body).toHaveProperty('category');
    });

    it('rejects coordinates out of bounds', async () => {
      const resLat = await request(app).get('/api/air-quality?lat=95&lon=77.2');
      expect(resLat.status).toBe(400);

      const resLon = await request(app).get('/api/air-quality?lat=28.6&lon=195');
      expect(resLon.status).toBe(400);

      const resNan = await request(app).get('/api/air-quality?lat=invalid&lon=77.2');
      expect(resNan.status).toBe(400);
    });
  });

  describe('GET /api/weather', () => {
    it('returns weather context safely without causal claims', async () => {
      const res = await request(app).get('/api/weather?lat=28.6139&lon=77.2090');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('temperature');
      expect(res.body).toHaveProperty('humidity');
      expect(res.body).toHaveProperty('windSpeed');
      expect(res.body).toHaveProperty('weatherDescription');
    });
  });

  describe('CORS and Security boundaries', () => {
    it('blocks disallowed external origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('CORS');
    });
  });
});
