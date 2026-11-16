import { EPA_BREAKPOINTS, EPA_CATEGORIES, EpaAqiCategory, EpaCategoryInfo } from './epaBreakpoints.js';

export function calculateEpaSubIndex(
  pollutant: string,
  concentration: number
): { subIndex: number; category: EpaAqiCategory } | null {
  if (concentration === null || concentration === undefined || isNaN(concentration) || concentration < 0) {
    return null;
  }

  const ranges = EPA_BREAKPOINTS[pollutant];
  if (!ranges || ranges.length === 0) return null;

  // Truncate to 1 decimal place for PM2.5, integer for PM10 per EPA guidance
  const c = pollutant === 'pm2_5' ? Math.floor(concentration * 10) / 10 : Math.floor(concentration);

  const maxRange = ranges[ranges.length - 1];
  if (c > maxRange.cHi) {
    return { subIndex: 500, category: 'Hazardous' };
  }

  for (const range of ranges) {
    if (c >= range.cLo && c <= range.cHi) {
      const deltaI = range.iHi - range.iLo;
      const deltaC = range.cHi - range.cLo;
      const index = Math.round((deltaI / deltaC) * (c - range.cLo) + range.iLo);
      return {
        subIndex: Math.max(range.iLo, Math.min(range.iHi, index)),
        category: range.category
      };
    }
  }

  return null;
}

export function getEpaCategory(aqi: number): EpaAqiCategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}
