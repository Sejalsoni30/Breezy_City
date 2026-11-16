import { describe, it, expect } from 'vitest';
import {
  calculateSubIndex,
  getCategoryFromAqi,
  calculateCpcbAqi
} from '../../src/aqi/calculator.js';
import { convertCoUgToMg, calculateMovingAverage } from '../../src/aqi/conversions.js';

describe('India CPCB NAQI - Sub-Index Boundary Calculations', () => {
  describe('PM2.5 Breakpoints', () => {
    it('calculates boundaries for Good (0-30 -> 0-50)', () => {
      expect(calculateSubIndex('pm2_5', 0)).toEqual({ subIndex: 0, category: 'Good' });
      expect(calculateSubIndex('pm2_5', 15)).toEqual({ subIndex: 25, category: 'Good' });
      expect(calculateSubIndex('pm2_5', 30)).toEqual({ subIndex: 50, category: 'Good' });
    });

    it('calculates boundaries for Satisfactory (31-60 -> 51-100)', () => {
      expect(calculateSubIndex('pm2_5', 31)).toEqual({ subIndex: 51, category: 'Satisfactory' });
      expect(calculateSubIndex('pm2_5', 60)).toEqual({ subIndex: 100, category: 'Satisfactory' });
    });

    it('calculates boundaries for Moderate (61-90 -> 101-200)', () => {
      expect(calculateSubIndex('pm2_5', 61)).toEqual({ subIndex: 101, category: 'Moderate' });
      expect(calculateSubIndex('pm2_5', 90)).toEqual({ subIndex: 200, category: 'Moderate' });
    });

    it('calculates boundaries for Poor (91-120 -> 201-300)', () => {
      expect(calculateSubIndex('pm2_5', 91)).toEqual({ subIndex: 201, category: 'Poor' });
      expect(calculateSubIndex('pm2_5', 120)).toEqual({ subIndex: 300, category: 'Poor' });
    });

    it('calculates boundaries for Very Poor (121-250 -> 301-400)', () => {
      expect(calculateSubIndex('pm2_5', 121)).toEqual({ subIndex: 301, category: 'Very Poor' });
      expect(calculateSubIndex('pm2_5', 250)).toEqual({ subIndex: 400, category: 'Very Poor' });
    });

    it('calculates boundaries for Severe (251-350 -> 401-500)', () => {
      expect(calculateSubIndex('pm2_5', 251)).toEqual({ subIndex: 401, category: 'Severe' });
      expect(calculateSubIndex('pm2_5', 350)).toEqual({ subIndex: 500, category: 'Severe' });
    });

    it('caps values above maximum breakpoint at 500 Severe', () => {
      expect(calculateSubIndex('pm2_5', 500)).toEqual({ subIndex: 500, category: 'Severe' });
    });
  });

  describe('PM10 Breakpoints', () => {
    it('calculates boundaries correctly across all categories', () => {
      expect(calculateSubIndex('pm10', 0)).toEqual({ subIndex: 0, category: 'Good' });
      expect(calculateSubIndex('pm10', 50)).toEqual({ subIndex: 50, category: 'Good' });
      expect(calculateSubIndex('pm10', 51)).toEqual({ subIndex: 51, category: 'Satisfactory' });
      expect(calculateSubIndex('pm10', 100)).toEqual({ subIndex: 100, category: 'Satisfactory' });
      expect(calculateSubIndex('pm10', 250)).toEqual({ subIndex: 200, category: 'Moderate' });
      expect(calculateSubIndex('pm10', 350)).toEqual({ subIndex: 300, category: 'Poor' });
      expect(calculateSubIndex('pm10', 430)).toEqual({ subIndex: 400, category: 'Very Poor' });
      expect(calculateSubIndex('pm10', 500)).toEqual({ subIndex: 500, category: 'Severe' });
      expect(calculateSubIndex('pm10', 650)).toEqual({ subIndex: 500, category: 'Severe' });
    });
  });

  describe('Carbon Monoxide (CO in mg/m³)', () => {
    it('calculates sub-index in mg/m³ correctly', () => {
      expect(calculateSubIndex('carbon_monoxide', 0.5)).toEqual({ subIndex: 25, category: 'Good' });
      expect(calculateSubIndex('carbon_monoxide', 1.0)).toEqual({ subIndex: 50, category: 'Good' });
      expect(calculateSubIndex('carbon_monoxide', 2.0)).toEqual({ subIndex: 100, category: 'Satisfactory' });
      expect(calculateSubIndex('carbon_monoxide', 10.0)).toEqual({ subIndex: 200, category: 'Moderate' });
      expect(calculateSubIndex('carbon_monoxide', 17.0)).toEqual({ subIndex: 300, category: 'Poor' });
      expect(calculateSubIndex('carbon_monoxide', 34.0)).toEqual({ subIndex: 400, category: 'Very Poor' });
      expect(calculateSubIndex('carbon_monoxide', 50.0)).toEqual({ subIndex: 500, category: 'Severe' });
      expect(calculateSubIndex('carbon_monoxide', 65.0)).toEqual({ subIndex: 500, category: 'Severe' });
    });
  });

  describe('Edge cases and invalid inputs', () => {
    it('returns null for negative or NaN values', () => {
      expect(calculateSubIndex('pm2_5', -10)).toBeNull();
      expect(calculateSubIndex('pm2_5', NaN)).toBeNull();
      // @ts-expect-error invalid input test
      expect(calculateSubIndex('pm2_5', null)).toBeNull();
    });

    it('returns null for unknown pollutant', () => {
      expect(calculateSubIndex('unknown_pollutant', 50)).toBeNull();
    });

    it('interpolates intermediate floating point values accurately', () => {
      // In PM2.5 range 0-30 -> 0-50, val 15 -> (50/30)*15 = 25
      const res = calculateSubIndex('pm2_5', 15.0);
      expect(res).not.toBeNull();
      expect(res?.subIndex).toBe(25);
    });
  });
});

describe('Unit Conversions & Averages', () => {
  it('converts CO from µg/m³ to mg/m³', () => {
    expect(convertCoUgToMg(1000)).toBe(1.0);
    expect(convertCoUgToMg(2500)).toBe(2.5);
    expect(convertCoUgToMg(878)).toBe(0.88);
    expect(convertCoUgToMg(-10)).toBeNaN();
  });

  it('calculates moving average with required completeness threshold', () => {
    const hourly = [10, 20, 30, 40, 50, 60, 70, 80];
    const avg = calculateMovingAverage(hourly, 4);
    expect(avg).toBe(65); // avg of [50, 60, 70, 80] = 260 / 4 = 65

    // With nulls
    const withNulls = [10, null, 30, 40];
    const avgNulls = calculateMovingAverage(withNulls, 4, 0.75); // 3 of 4 is 75% -> valid
    expect(avgNulls).toBe((10 + 30 + 40) / 3);

    // Below threshold
    const sparse = [null, null, null, 50];
    const avgSparse = calculateMovingAverage(sparse, 4, 0.75);
    expect(avgSparse).toBeNull();
  });
});

describe('CPCB National AQI Calculation Engine Rules', () => {
  it('enforces CPCB minimum 3 pollutants rule', () => {
    // Only 2 pollutants
    const res = calculateCpcbAqi({
      pm2_5: 45,
      pm10: 80
    });
    expect(res.isAvailable).toBe(false);
    expect(res.aqi).toBeNull();
    expect(res.statusMessage).toContain('CPCB requires at least 3');
  });

  it('enforces mandatory PM10 or PM2.5 requirement', () => {
    // 3 pollutants, but NO PM
    const res = calculateCpcbAqi({
      nitrogen_dioxide: 50,
      ozone: 60,
      sulphur_dioxide: 30
    });
    expect(res.isAvailable).toBe(false);
    expect(res.aqi).toBeNull();
    expect(res.statusMessage).toContain('PM2.5 or PM10');
  });

  it('calculates overall AQI and dominant pollutant when criteria are met', () => {
    // Delhi scenario: PM2.5 is high
    const res = calculateCpcbAqi({
      pm2_5: 95, // sub-index: 201 + (99/29)*4 ≈ 215 (Poor)
      pm10: 80,  // sub-index: 80 (Satisfactory)
      nitrogen_dioxide: 40, // sub-index: 50 (Good)
      ozone: 50, // sub-index: 50 (Good)
      carbon_monoxide: 1000 // 1.0 mg/m³ -> sub-index: 50 (Good)
    });

    expect(res.isAvailable).toBe(true);
    expect(res.aqi).toBeGreaterThan(200);
    expect(res.category).toBe('Poor');
    expect(res.dominantPollutants).toContain('pm2_5');
    expect(res.categoryInfo?.name).toBe('Poor');
  });

  it('handles tied dominant pollutants correctly', () => {
    const res = calculateCpcbAqi({
      pm2_5: 30, // sub-index 50
      pm10: 50,  // sub-index 50
      nitrogen_dioxide: 40 // sub-index 50
    });

    expect(res.isAvailable).toBe(true);
    expect(res.aqi).toBe(50);
    expect(res.category).toBe('Good');
    expect(res.dominantPollutants.length).toBeGreaterThanOrEqual(2);
  });
});
