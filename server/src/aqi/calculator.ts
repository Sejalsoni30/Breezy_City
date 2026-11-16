import {
  CPCB_BREAKPOINTS,
  CPCB_CATEGORIES,
  AqiCategory,
  CategoryInfo
} from './cpcbBreakpoints.js';
import { convertCoUgToMg } from './conversions.js';

export interface PollutantReading {
  raw: number | null | undefined;
  unit: string;
  calculatedValue: number | null; // e.g. CO in mg/m³
  subIndex: number | null;
  category: AqiCategory | null;
  isAvailable: boolean;
}

export interface CpcbAqiResult {
  aqi: number | null;
  category: AqiCategory | null;
  categoryInfo: CategoryInfo | null;
  dominantPollutants: string[];
  pollutants: Record<string, PollutantReading>;
  validPollutantsCount: number;
  hasMandatoryPm: boolean;
  isAvailable: boolean;
  statusMessage: string;
  calculatedAt: string;
}

/**
 * Calculates the CPCB sub-index for a single pollutant.
 */
export function calculateSubIndex(
  pollutant: string,
  concentration: number
): { subIndex: number; category: AqiCategory } | null {
  if (concentration === null || concentration === undefined || isNaN(concentration) || concentration < 0) {
    return null;
  }

  const ranges = CPCB_BREAKPOINTS[pollutant];
  if (!ranges || ranges.length === 0) {
    return null;
  }

  // Handle value above maximum defined breakpoint (Severe)
  const maxRange = ranges[ranges.length - 1];
  if (concentration > maxRange.bHi) {
    return {
      subIndex: 500,
      category: 'Severe'
    };
  }

  // Find matching breakpoint range
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const prevRange = i > 0 ? ranges[i - 1] : null;

    // Check if concentration falls in this range
    // If there is an integer gap between prevRange.bHi and range.bLo (e.g., 30 to 31),
    // float values like 30.5 belong to the upper range.
    const effectiveFloor = prevRange ? prevRange.bHi : range.bLo;
    const isFirstRange = i === 0;

    const inRange = isFirstRange
      ? concentration >= range.bLo && concentration <= range.bHi
      : concentration > effectiveFloor && concentration <= range.bHi;

    if (inRange) {
      // Linear interpolation formula:
      // I = [(I_HI - I_LO) / (B_HI - B_LO)] * (C - B_LO) + I_LO
      // Use standard range.bLo and range.bHi for the slope
      const deltaI = range.iHi - range.iLo;
      const deltaB = range.bHi - range.bLo;
      const subIndex = Math.round(
        (deltaI / deltaB) * (concentration - range.bLo) + range.iLo
      );

      // Clamp between range.iLo and range.iHi
      const clampedSubIndex = Math.max(range.iLo, Math.min(range.iHi, subIndex));
      return {
        subIndex: clampedSubIndex,
        category: range.category
      };
    }
  }

  return null;
}

/**
 * Maps an AQI value to its CPCB Category.
 */
export function getCategoryFromAqi(aqi: number): AqiCategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

/**
 * Calculates India CPCB NAQI given current pollutant readings.
 * 
 * Rules enforced from CPCB Oct 2014 report:
 * 1. Minimum 3 valid pollutants required.
 * 2. At least one of the valid pollutants MUST be PM10 or PM2.5.
 * 3. Overall AQI = max(sub-indices of all valid pollutants).
 * 4. Dominant pollutant = pollutant with the highest sub-index.
 */
export function calculateCpcbAqi(rawReadings: {
  pm2_5?: number | null;
  pm10?: number | null;
  nitrogen_dioxide?: number | null;
  ozone?: number | null;
  carbon_monoxide?: number | null; // in µg/m³
  sulphur_dioxide?: number | null;
}): CpcbAqiResult {
  const calculatedAt = new Date().toISOString();
  const pollutants: Record<string, PollutantReading> = {};

  const pollutantConfigs: Record<
    string,
    { rawUnit: string; calcUnit: string; transform: (val: number) => number }
  > = {
    pm2_5: { rawUnit: 'µg/m³', calcUnit: 'µg/m³', transform: (v) => v },
    pm10: { rawUnit: 'µg/m³', calcUnit: 'µg/m³', transform: (v) => v },
    nitrogen_dioxide: { rawUnit: 'µg/m³', calcUnit: 'µg/m³', transform: (v) => v },
    ozone: { rawUnit: 'µg/m³', calcUnit: 'µg/m³', transform: (v) => v },
    carbon_monoxide: { rawUnit: 'µg/m³', calcUnit: 'mg/m³', transform: convertCoUgToMg },
    sulphur_dioxide: { rawUnit: 'µg/m³', calcUnit: 'µg/m³', transform: (v) => v }
  };

  let maxSubIndex = -1;
  let dominantPollutants: string[] = [];
  let validCount = 0;
  let hasMandatoryPm = false;

  for (const [key, config] of Object.entries(pollutantConfigs)) {
    const rawVal = rawReadings[key as keyof typeof rawReadings];
    if (rawVal !== undefined && rawVal !== null && !isNaN(rawVal) && rawVal >= 0) {
      const calcVal = config.transform(rawVal);
      const res = calculateSubIndex(key, calcVal);

      if (res !== null) {
        pollutants[key] = {
          raw: rawVal,
          unit: config.calcUnit,
          calculatedValue: calcVal,
          subIndex: res.subIndex,
          category: res.category,
          isAvailable: true
        };

        validCount++;
        if (key === 'pm2_5' || key === 'pm10') {
          hasMandatoryPm = true;
        }

        if (res.subIndex > maxSubIndex) {
          maxSubIndex = res.subIndex;
          dominantPollutants = [key];
        } else if (res.subIndex === maxSubIndex) {
          dominantPollutants.push(key);
        }
      } else {
        pollutants[key] = {
          raw: rawVal,
          unit: config.calcUnit,
          calculatedValue: null,
          subIndex: null,
          category: null,
          isAvailable: false
        };
      }
    } else {
      pollutants[key] = {
        raw: null,
        unit: config.calcUnit,
        calculatedValue: null,
        subIndex: null,
        category: null,
        isAvailable: false
      };
    }
  }

  // Check CPCB minimum criteria
  const isAqiAvailable = validCount >= 3 && hasMandatoryPm && maxSubIndex >= 0;

  if (!isAqiAvailable) {
    let reason = 'AQI Unavailable: ';
    if (!hasMandatoryPm && validCount < 3) {
      reason += 'Requires at least 3 pollutants including PM2.5 or PM10.';
    } else if (!hasMandatoryPm) {
      reason += 'CPCB requires PM2.5 or PM10 for a valid AQI calculation.';
    } else {
      reason += `Only ${validCount} valid pollutants available (CPCB requires at least 3).`;
    }

    return {
      aqi: null,
      category: null,
      categoryInfo: null,
      dominantPollutants: [],
      pollutants,
      validPollutantsCount: validCount,
      hasMandatoryPm,
      isAvailable: false,
      statusMessage: reason,
      calculatedAt
    };
  }

  const overallCategory = getCategoryFromAqi(maxSubIndex);
  const categoryInfo = CPCB_CATEGORIES[overallCategory];

  return {
    aqi: maxSubIndex,
    category: overallCategory,
    categoryInfo,
    dominantPollutants,
    pollutants,
    validPollutantsCount: validCount,
    hasMandatoryPm,
    isAvailable: true,
    statusMessage: `AQI calculated using India CPCB NAQI standard based on ${validCount} monitored pollutants.`,
    calculatedAt
  };
}
