/**
 * Official India CPCB (Central Pollution Control Board) NAQI Breakpoints
 *
 * Source: "National Air Quality Index", Central Pollution Control Board,
 * Ministry of Environment, Forest & Climate Change, Government of India.
 * Publication Edition: October 2014, Table 1 & Table 2.
 * Reference: https://cpcb.nic.in/displaypdf.php?id=cWFsL2ZpbmFsX25hcWlfcmVwb3J0LnBkZg==
 * Retrieved: November 2026
 */

export interface BreakpointRange {
  bLo: number; // Breakpoint Low concentration
  bHi: number; // Breakpoint High concentration
  iLo: number; // Index Low
  iHi: number; // Index High
  category: AqiCategory;
}

export type AqiCategory = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface CategoryInfo {
  name: AqiCategory;
  range: [number, number];
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  healthStatement: string;
  sensitiveGroupAdvice: string;
}

export const CPCB_CATEGORIES: Record<AqiCategory, CategoryInfo> = {
  Good: {
    name: 'Good',
    range: [0, 50],
    color: '#16a34a',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
    description:
      'Minimal impact. Air quality is considered satisfactory, and air pollution poses little or no risk.',
    healthStatement: 'Minimal health impact. Ideal for outdoor activities.',
    sensitiveGroupAdvice: 'Safe for everyone, including children and elderly.'
  },
  Satisfactory: {
    name: 'Satisfactory',
    range: [51, 100],
    color: '#65a30d',
    badgeBg: 'bg-lime-100',
    badgeText: 'text-lime-800',
    description: 'Minor breathing discomfort to sensitive people.',
    healthStatement:
      'May cause minor breathing discomfort to sensitive people with lung or heart disease.',
    sensitiveGroupAdvice:
      'Unusually sensitive individuals should consider reducing prolonged or heavy outdoor exertion.'
  },
  Moderate: {
    name: 'Moderate',
    range: [101, 200],
    color: '#d97706',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    description: 'Breathing discomfort to the people with lungs, asthma and heart diseases.',
    healthStatement:
      'May cause breathing discomfort to people with asthma and heart diseases, and children/elderly.',
    sensitiveGroupAdvice:
      'People with asthma or heart ailments should limit heavy outdoor exertion.'
  },
  Poor: {
    name: 'Poor',
    range: [201, 300],
    color: '#ea580c',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    description: 'Breathing discomfort to most people on prolonged exposure.',
    healthStatement: 'Causes breathing discomfort to most people on prolonged outdoor exposure.',
    sensitiveGroupAdvice:
      'Children, older adults, and people with respiratory illness should avoid prolonged outdoor exertion.'
  },
  'Very Poor': {
    name: 'Very Poor',
    range: [301, 400],
    color: '#dc2626',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    description: 'Respiratory illness on prolonged exposure.',
    healthStatement:
      'May cause respiratory illness on prolonged exposure. Significant risk to all population groups.',
    sensitiveGroupAdvice:
      'Everyone should avoid prolonged outdoor exertion. Sensitive groups should stay indoors and keep activity levels low.'
  },
  Severe: {
    name: 'Severe',
    range: [401, 500],
    color: '#7f1d1d',
    badgeBg: 'bg-rose-950',
    badgeText: 'text-rose-100',
    description: 'Affects healthy people and seriously impacts those with existing diseases.',
    healthStatement:
      'Health warning of emergency conditions. Entire population is likely to be affected.',
    sensitiveGroupAdvice:
      'Everyone should avoid all outdoor physical activity. Sensitive individuals should remain indoors and use air purifiers.'
  }
};

/**
 * Breakpoints for India CPCB NAQI (Table 1 of Oct 2014 CPCB Report)
 * Note:
 * - PM10: 24-hr avg, µg/m³
 * - PM2.5: 24-hr avg, µg/m³
 * - NO2: 24-hr avg, µg/m³
 * - O3: 8-hr avg, µg/m³
 * - CO: 8-hr avg, mg/m³ (Input in µg/m³ MUST be converted to mg/m³)
 * - SO2: 24-hr avg, µg/m³
 */
export const CPCB_BREAKPOINTS: Record<string, BreakpointRange[]> = {
  pm10: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50, category: 'Good' },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100, category: 'Satisfactory' },
    { bLo: 101, bHi: 250, iLo: 101, iHi: 200, category: 'Moderate' },
    { bLo: 251, bHi: 350, iLo: 201, iHi: 300, category: 'Poor' },
    { bLo: 351, bHi: 430, iLo: 301, iHi: 400, category: 'Very Poor' },
    { bLo: 431, bHi: 500, iLo: 401, iHi: 500, category: 'Severe' }
  ],
  pm2_5: [
    { bLo: 0, bHi: 30, iLo: 0, iHi: 50, category: 'Good' },
    { bLo: 31, bHi: 60, iLo: 51, iHi: 100, category: 'Satisfactory' },
    { bLo: 61, bHi: 90, iLo: 101, iHi: 200, category: 'Moderate' },
    { bLo: 91, bHi: 120, iLo: 201, iHi: 300, category: 'Poor' },
    { bLo: 121, bHi: 250, iLo: 301, iHi: 400, category: 'Very Poor' },
    { bLo: 251, bHi: 350, iLo: 401, iHi: 500, category: 'Severe' }
  ],
  nitrogen_dioxide: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50, category: 'Good' },
    { bLo: 41, bHi: 80, iLo: 51, iHi: 100, category: 'Satisfactory' },
    { bLo: 81, bHi: 180, iLo: 101, iHi: 200, category: 'Moderate' },
    { bLo: 181, bHi: 280, iLo: 201, iHi: 300, category: 'Poor' },
    { bLo: 281, bHi: 400, iLo: 301, iHi: 400, category: 'Very Poor' },
    { bLo: 401, bHi: 500, iLo: 401, iHi: 500, category: 'Severe' }
  ],
  ozone: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50, category: 'Good' },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100, category: 'Satisfactory' },
    { bLo: 101, bHi: 168, iLo: 101, iHi: 200, category: 'Moderate' },
    { bLo: 169, bHi: 208, iLo: 201, iHi: 300, category: 'Poor' },
    { bLo: 209, bHi: 748, iLo: 301, iHi: 400, category: 'Very Poor' },
    { bLo: 749, bHi: 1000, iLo: 401, iHi: 500, category: 'Severe' }
  ],
  carbon_monoxide: [
    { bLo: 0.0, bHi: 1.0, iLo: 0, iHi: 50, category: 'Good' },
    { bLo: 1.1, bHi: 2.0, iLo: 51, iHi: 100, category: 'Satisfactory' },
    { bLo: 2.1, bHi: 10.0, iLo: 101, iHi: 200, category: 'Moderate' },
    { bLo: 10.1, bHi: 17.0, iLo: 201, iHi: 300, category: 'Poor' },
    { bLo: 17.1, bHi: 34.0, iLo: 301, iHi: 400, category: 'Very Poor' },
    { bLo: 34.1, bHi: 50.0, iLo: 401, iHi: 500, category: 'Severe' }
  ],
  sulphur_dioxide: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50, category: 'Good' },
    { bLo: 41, bHi: 80, iLo: 51, iHi: 100, category: 'Satisfactory' },
    { bLo: 81, bHi: 380, iLo: 101, iHi: 200, category: 'Moderate' },
    { bLo: 381, bHi: 800, iLo: 201, iHi: 300, category: 'Poor' },
    { bLo: 801, bHi: 1600, iLo: 301, iHi: 400, category: 'Very Poor' },
    { bLo: 1601, bHi: 2000, iLo: 401, iHi: 500, category: 'Severe' }
  ]
};
