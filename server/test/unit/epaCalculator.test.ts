import { describe, it, expect } from 'vitest';
import { calculateEpaSubIndex, getEpaCategory } from '../../src/aqi/epaCalculator.js';
import { EPA_BREAKPOINTS, EPA_CATEGORIES } from '../../src/aqi/epaBreakpoints.js';

describe('US EPA Air Quality Index (2024 Standards)', () => {
  describe('calculateEpaSubIndex for PM2.5', () => {
    it('calculates Good bracket (0.0 - 9.0 µg/m³ -> 0 - 50)', () => {
      const low = calculateEpaSubIndex('pm2_5', 0.0);
      expect(low).toEqual({ subIndex: 0, category: 'Good' });

      const mid = calculateEpaSubIndex('pm2_5', 4.5);
      expect(mid?.category).toBe('Good');
      expect(mid?.subIndex).toBeGreaterThanOrEqual(0);
      expect(mid?.subIndex).toBeLessThanOrEqual(50);

      const high = calculateEpaSubIndex('pm2_5', 9.0);
      expect(high).toEqual({ subIndex: 50, category: 'Good' });
    });

    it('calculates Moderate bracket (9.1 - 35.4 µg/m³ -> 51 - 100)', () => {
      const res = calculateEpaSubIndex('pm2_5', 12.0);
      expect(res?.category).toBe('Moderate');
      expect(res?.subIndex).toBeGreaterThanOrEqual(51);
      expect(res?.subIndex).toBeLessThanOrEqual(100);
    });

    it('calculates Unhealthy for Sensitive Groups bracket (35.5 - 55.4 µg/m³ -> 101 - 150)', () => {
      const res = calculateEpaSubIndex('pm2_5', 40.0);
      expect(res?.category).toBe('Unhealthy for Sensitive Groups');
      expect(res?.subIndex).toBeGreaterThanOrEqual(101);
      expect(res?.subIndex).toBeLessThanOrEqual(150);
    });

    it('calculates Unhealthy bracket (55.5 - 125.4 µg/m³ -> 151 - 200)', () => {
      const res = calculateEpaSubIndex('pm2_5', 75.0);
      expect(res?.category).toBe('Unhealthy');
      expect(res?.subIndex).toBeGreaterThanOrEqual(151);
      expect(res?.subIndex).toBeLessThanOrEqual(200);
    });

    it('calculates Very Unhealthy bracket (125.5 - 225.4 µg/m³ -> 201 - 300)', () => {
      const res = calculateEpaSubIndex('pm2_5', 180.0);
      expect(res?.category).toBe('Very Unhealthy');
      expect(res?.subIndex).toBeGreaterThanOrEqual(201);
      expect(res?.subIndex).toBeLessThanOrEqual(300);
    });

    it('calculates Hazardous bracket (225.5 - 500.4 µg/m³ -> 301 - 500)', () => {
      const res = calculateEpaSubIndex('pm2_5', 300.0);
      expect(res?.category).toBe('Hazardous');
      expect(res?.subIndex).toBeGreaterThanOrEqual(301);
      expect(res?.subIndex).toBeLessThanOrEqual(500);
    });

    it('caps values exceeding maximum defined concentration at 500 Hazardous', () => {
      const res = calculateEpaSubIndex('pm2_5', 600.0);
      expect(res).toEqual({ subIndex: 500, category: 'Hazardous' });
    });
  });

  describe('calculateEpaSubIndex for PM10', () => {
    it('calculates Good bracket (0 - 54 µg/m³ -> 0 - 50)', () => {
      const low = calculateEpaSubIndex('pm10', 0);
      expect(low).toEqual({ subIndex: 0, category: 'Good' });

      const high = calculateEpaSubIndex('pm10', 54);
      expect(high).toEqual({ subIndex: 50, category: 'Good' });
    });

    it('calculates Moderate bracket (55 - 154 µg/m³ -> 51 - 100)', () => {
      const res = calculateEpaSubIndex('pm10', 100);
      expect(res?.category).toBe('Moderate');
      expect(res?.subIndex).toBeGreaterThanOrEqual(51);
      expect(res?.subIndex).toBeLessThanOrEqual(100);
    });

    it('caps PM10 above max breakpoint at 500 Hazardous', () => {
      const res = calculateEpaSubIndex('pm10', 700);
      expect(res).toEqual({ subIndex: 500, category: 'Hazardous' });
    });
  });

  describe('Edge cases and boundary handling', () => {
    it('returns null for negative concentration', () => {
      expect(calculateEpaSubIndex('pm2_5', -5)).toBeNull();
    });

    it('returns null for NaN or undefined concentration', () => {
      expect(calculateEpaSubIndex('pm2_5', NaN)).toBeNull();
      expect(calculateEpaSubIndex('pm2_5', undefined as unknown as number)).toBeNull();
    });

    it('returns null for unsupported pollutant', () => {
      expect(calculateEpaSubIndex('non_existent_gas', 50)).toBeNull();
    });
  });

  describe('getEpaCategory helper', () => {
    it('correctly maps AQI values to EPA categories', () => {
      expect(getEpaCategory(25)).toBe('Good');
      expect(getEpaCategory(50)).toBe('Good');
      expect(getEpaCategory(51)).toBe('Moderate');
      expect(getEpaCategory(100)).toBe('Moderate');
      expect(getEpaCategory(101)).toBe('Unhealthy for Sensitive Groups');
      expect(getEpaCategory(150)).toBe('Unhealthy for Sensitive Groups');
      expect(getEpaCategory(151)).toBe('Unhealthy');
      expect(getEpaCategory(200)).toBe('Unhealthy');
      expect(getEpaCategory(201)).toBe('Very Unhealthy');
      expect(getEpaCategory(300)).toBe('Very Unhealthy');
      expect(getEpaCategory(301)).toBe('Hazardous');
      expect(getEpaCategory(500)).toBe('Hazardous');
    });
  });

  describe('EPA_CATEGORIES metadata completeness', () => {
    it('contains all 6 required EPA category definitions with styling', () => {
      const categories = [
        'Good',
        'Moderate',
        'Unhealthy for Sensitive Groups',
        'Unhealthy',
        'Very Unhealthy',
        'Hazardous'
      ] as const;
      categories.forEach((cat) => {
        const info = EPA_CATEGORIES[cat];
        expect(info).toBeDefined();
        expect(info.name).toBe(cat);
        expect(info.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(info.healthStatement).toBeTruthy();
        expect(info.sensitiveGroupAdvice).toBeTruthy();
      });
    });
  });
});
