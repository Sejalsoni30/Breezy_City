import { fetchRawAirQuality } from './openMeteo.js';
import { calculateCpcbAqi } from '../aqi/calculator.js';
import { calculateEpaSubIndex } from '../aqi/epaCalculator.js';
import { EPA_CATEGORIES, EpaAqiCategory } from '../aqi/epaBreakpoints.js';
import { getHealthGuidance } from '../aqi/healthGuidance.js';
import { processTrends } from '../aqi/trends.js';
import { AirQualityApiResponse, AqiCategoryInfo } from '../types/index.js';

export interface AirQualityComputeParams {
  latitude: number;
  longitude: number;
  standard: 'CPCB' | 'US_EPA';
}

/**
 * Computes official air quality index, pollutant breakdown, health guidance,
 * and trend projection for given geographic coordinates and standard.
 */
export async function computeAirQuality({
  latitude,
  longitude,
  standard
}: AirQualityComputeParams): Promise<AirQualityApiResponse> {
  const raw = await fetchRawAirQuality(latitude, longitude);
  const current = raw.current || {};
  const hourly = raw.hourly || {};

  // Compute base CPCB NAQI calculation (used for pollutants & health guidance)
  const baseCpcb = calculateCpcbAqi({
    pm2_5: current.pm2_5 ?? null,
    pm10: current.pm10 ?? null,
    nitrogen_dioxide: current.nitrogen_dioxide ?? null,
    ozone: current.ozone ?? null,
    carbon_monoxide: current.carbon_monoxide ?? null,
    sulphur_dioxide: current.sulphur_dioxide ?? null
  });

  let finalAqi: number | null = baseCpcb.aqi;
  let finalCategory: string | null = baseCpcb.category;
  let finalCategoryInfo: AqiCategoryInfo | null = baseCpcb.categoryInfo;
  let finalDominant: string[] = baseCpcb.dominantPollutants;
  let finalStandardName = 'India CPCB National Air Quality Index (NAQI)';
  let finalStandardRef = 'Central Pollution Control Board, MoEFCC, Oct 2014 Table 1';

  if (standard === 'US_EPA') {
    finalStandardName = 'US EPA Air Quality Index (2024 Revised Standard)';
    finalStandardRef = 'US EPA Technical Assistance Document (EPA-454/B-24-001, May 2024)';

    const epaPm25 =
      typeof current.pm2_5 === 'number' ? calculateEpaSubIndex('pm2_5', current.pm2_5) : null;
    const epaPm10 =
      typeof current.pm10 === 'number' ? calculateEpaSubIndex('pm10', current.pm10) : null;

    const validIndices: Array<{
      key: string;
      res: { subIndex: number; category: EpaAqiCategory };
    }> = [];
    if (epaPm25 !== null) validIndices.push({ key: 'pm2_5', res: epaPm25 });
    if (epaPm10 !== null) validIndices.push({ key: 'pm10', res: epaPm10 });

    if (validIndices.length > 0) {
      const maxItem = validIndices.reduce((prev, curr) =>
        curr.res.subIndex > prev.res.subIndex ? curr : prev
      );
      finalAqi = maxItem.res.subIndex;
      finalCategory = maxItem.res.category;
      finalCategoryInfo = EPA_CATEGORIES[maxItem.res.category];
      finalDominant = [maxItem.key];
    }
  }

  // Health guidance based on CPCB category
  const healthGuidance = getHealthGuidance(baseCpcb.category);

  // 24-hour history and forecast trends
  const trends = processTrends(hourly, current.time);

  return {
    standard,
    standardName: finalStandardName,
    standardReference: finalStandardRef,
    location: {
      latitude,
      longitude
    },
    aqi: finalAqi,
    category: finalCategory,
    categoryInfo: finalCategoryInfo,
    dominantPollutants: finalDominant,
    pollutants: baseCpcb.pollutants,
    healthGuidance,
    trends,
    metadata: {
      source: 'Open-Meteo Atmospheric Chemistry Model Grid',
      isModelEstimate: true,
      dataNatureDisclosure:
        'Modelled atmospheric reanalysis and forecast grid; not a physical ground monitoring station.',
      modelTime: current.time || new Date().toISOString(),
      fetchTime: new Date().toISOString(),
      dataState: 'Live'
    }
  };
}
