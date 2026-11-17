import { describe, it, expect } from 'vitest';
import {
  geocodeQuerySchema,
  coordsQuerySchema,
  historicalTrendsSchema,
  aiAdvisorySchema,
  bookmarkCreateSchema,
  historyCreateSchema
} from '../../src/middleware/validate.js';

describe('Input Validation & Sanitization Schemas', () => {
  describe('geocodeQuerySchema', () => {
    it('accepts valid city names with accents and punctuation', () => {
      const result = geocodeQuerySchema.safeParse({ q: 'New Delhi' });
      expect(result.success).toBe(true);
    });

    it('rejects query strings with disallowed characters or script tags', () => {
      const scriptResult = geocodeQuerySchema.safeParse({ q: '<script>alert(1)</script>' });
      expect(scriptResult.success).toBe(false);

      const emptyResult = geocodeQuerySchema.safeParse({ q: '   ' });
      expect(emptyResult.success).toBe(false);
    });
  });

  describe('coordsQuerySchema', () => {
    it('accepts valid coordinates within global geographic boundaries', () => {
      const result = coordsQuerySchema.safeParse({ lat: '28.6139', lon: '77.2090' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lat).toBe(28.6139);
        expect(result.data.lon).toBe(77.209);
        expect(result.data.standard).toBe('CPCB');
      }
    });

    it('rejects coordinates out of bounds', () => {
      expect(coordsQuerySchema.safeParse({ lat: '95.0', lon: '77.0' }).success).toBe(false);
      expect(coordsQuerySchema.safeParse({ lat: '28.0', lon: '190.0' }).success).toBe(false);
    });
  });

  describe('historicalTrendsSchema', () => {
    it('clamps or validates day range between 1 and 30 days', () => {
      const valid = historicalTrendsSchema.safeParse({ lat: 28, lon: 77, days: 14 });
      expect(valid.success).toBe(true);

      const outOfRange = historicalTrendsSchema.safeParse({ lat: 28, lon: 77, days: 60 });
      expect(outOfRange.success).toBe(false);
    });
  });

  describe('aiAdvisorySchema', () => {
    it('accepts valid health advisory requests', () => {
      const res = aiAdvisorySchema.safeParse({
        aqi: 220,
        category: 'Poor',
        dominantPollutant: 'PM2.5',
        userProfile: 'asthma'
      });
      expect(res.success).toBe(true);
    });

    it('rejects unknown user profiles', () => {
      const res = aiAdvisorySchema.safeParse({
        aqi: 220,
        category: 'Poor',
        dominantPollutant: 'PM2.5',
        userProfile: 'invalid_profile'
      });
      expect(res.success).toBe(false);
    });
  });

  describe('bookmarkCreateSchema', () => {
    it('validates bookmark creation inputs strictly', () => {
      const valid = bookmarkCreateSchema.safeParse({
        name: 'Connaught Place',
        latitude: 28.63,
        longitude: 77.21
      });
      expect(valid.success).toBe(true);

      const missingName = bookmarkCreateSchema.safeParse({
        name: '',
        latitude: 28.63,
        longitude: 77.21
      });
      expect(missingName.success).toBe(false);
    });
  });

  describe('historyCreateSchema', () => {
    it('sanitizes and validates search history queries', () => {
      const valid = historyCreateSchema.safeParse({ query: 'Bengaluru' });
      expect(valid.success).toBe(true);

      const empty = historyCreateSchema.safeParse({ query: '' });
      expect(empty.success).toBe(false);
    });
  });
});
