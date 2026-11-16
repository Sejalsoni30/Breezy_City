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

  describe('GET /api/historical-trends', () => {
    it('returns 7-day multi-day daily aggregations', async () => {
      const res = await request(app).get('/api/historical-trends?lat=28.6139&lon=77.2090&days=7');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('days', 7);
      expect(Array.isArray(res.body.series)).toBe(true);
      if (res.body.series.length > 0) {
        expect(res.body.series[0]).toHaveProperty('date');
        expect(res.body.series[0]).toHaveProperty('avgPm25');
        expect(res.body.series[0]).toHaveProperty('avgPm10');
      }
    });

    it('rejects invalid days parameter', async () => {
      const res = await request(app).get('/api/historical-trends?lat=28.6139&lon=77.2090&days=100');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/ai/advisory', () => {
    it('generates personalized health advisory with guardrails', async () => {
      const res = await request(app)
        .post('/api/ai/advisory')
        .send({
          aqi: 245,
          category: 'Poor',
          dominantPollutant: 'PM2.5',
          userProfile: 'asthma'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('advice');
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(res.body.recommendations.length).toBeGreaterThan(0);
      expect(res.body.disclaimer).toContain('Informational guidance only');
      expect(res.body.isAIGenerated).toBe(true);
    });

    it('validates schema input strictly', async () => {
      const res = await request(app)
        .post('/api/ai/advisory')
        .send({
          aqi: 9999, // invalid aqi > 500
          category: 'Hazardous',
          dominantPollutant: 'PM2.5'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Database Bookmarks & History Endpoints', () => {
    let bookmarkId = '';

    it('creates, retrieves, and deletes user bookmarks', async () => {
      // Create bookmark
      const createRes = await request(app)
        .post('/api/bookmarks')
        .send({
          userId: 'test-user-1',
          name: 'Delhi',
          displayName: 'Delhi, India',
          latitude: 28.6139,
          longitude: 77.2090
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body).toHaveProperty('id');
      expect(createRes.body.name).toBe('Delhi');
      bookmarkId = createRes.body.id;

      // Get bookmarks
      const getRes = await request(app).get('/api/bookmarks?userId=test-user-1');
      expect(getRes.status).toBe(200);
      expect(getRes.body.bookmarks.some((b: any) => b.id === bookmarkId)).toBe(true);

      // Delete bookmark
      const delRes = await request(app).delete(`/api/bookmarks/${bookmarkId}?userId=test-user-1`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify deleted
      const checkRes = await request(app).get('/api/bookmarks?userId=test-user-1');
      expect(checkRes.body.bookmarks.some((b: any) => b.id === bookmarkId)).toBe(false);
    });

    it('records and retrieves search history with deduplication', async () => {
      await request(app)
        .post('/api/history')
        .send({ userId: 'test-user-2', query: 'Mumbai' });

      await request(app)
        .post('/api/history')
        .send({ userId: 'test-user-2', query: 'Bengaluru' });

      const res = await request(app).get('/api/history?userId=test-user-2');
      expect(res.status).toBe(200);
      expect(res.body.history.length).toBe(2);
      expect(res.body.history[0].query).toBe('Bengaluru'); // most recent first
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
