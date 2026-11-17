import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/utils/sanitize';
import {
  generateNeighborhoodStations,
  getCategoryAndColor,
  ZONES
} from '../src/utils/mapNodes';

describe('Sanitization Utilities', () => {
  it('escapes dangerous HTML characters to prevent XSS injection', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
    );
    expect(escapeHtml("Test 'safe' & <bold>")).toBe('Test &#039;safe&#039; &amp; &lt;bold&gt;');
  });

  it('handles empty or non-string inputs safely', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null as unknown as string)).toBe('');
    expect(escapeHtml(undefined as unknown as string)).toBe('');
  });
});

describe('Neighborhood Map Nodes Utilities', () => {
  it('generates 9 micro-climate stations centered around given coordinates', () => {
    const stations = generateNeighborhoodStations('Delhi', 28.6139, 77.209, 180);
    expect(stations).toHaveLength(9);
    expect(stations[0].name).toContain('Delhi Civic Center');
    expect(stations[0].zone).toBe('Central');
    expect(stations[0].aqi).toBeGreaterThanOrEqual(15);
    expect(stations[0].pm25).toBeGreaterThan(0);
  });

  it('correctly maps AQI values to CPCB color and category brackets', () => {
    expect(getCategoryAndColor(30).category).toBe('Good');
    expect(getCategoryAndColor(75).category).toBe('Satisfactory');
    expect(getCategoryAndColor(150).category).toBe('Moderate');
    expect(getCategoryAndColor(250).category).toBe('Poor');
    expect(getCategoryAndColor(350).category).toBe('Very Poor');
    expect(getCategoryAndColor(450).category).toBe('Severe');
  });

  it('supports all required urban zones', () => {
    expect(ZONES).toEqual(['All', 'Central', 'North', 'South', 'East', 'West']);
  });
});
