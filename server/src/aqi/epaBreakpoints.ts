/**
 * US EPA Air Quality Index (AQI) Breakpoints
 * 
 * Source: US EPA "Technical Assistance Document for the Reporting of Daily Air Quality - the Air Quality Index (AQI)"
 * Publication: EPA-454/B-24-001 (incorporating May 2024 PM2.5 annual/daily revisions).
 * Reference: https://www.airnow.gov/aqi/aqi-basics/
 */

export interface EpaBreakpointRange {
  cLo: number; // Concentration Low
  cHi: number; // Concentration High
  iLo: number; // Index Low
  iHi: number; // Index High
  category: EpaAqiCategory;
}

export type EpaAqiCategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous';

export interface EpaCategoryInfo {
  name: EpaAqiCategory;
  range: [number, number];
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  healthStatement: string;
  sensitiveGroupAdvice: string;
}

export const EPA_CATEGORIES: Record<EpaAqiCategory, EpaCategoryInfo> = {
  Good: {
    name: 'Good',
    range: [0, 50],
    color: '#16a34a',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
    description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
    healthStatement: 'None. It is a great day to be active outside.',
    sensitiveGroupAdvice: 'None.'
  },
  Moderate: {
    name: 'Moderate',
    range: [51, 100],
    color: '#eab308',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
    description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
    healthStatement: 'Unusually sensitive individuals may experience respiratory symptoms.',
    sensitiveGroupAdvice: 'Unusually sensitive people should consider reducing prolonged or heavy outdoor exertion.'
  },
  'Unhealthy for Sensitive Groups': {
    name: 'Unhealthy for Sensitive Groups',
    range: [101, 150],
    color: '#ea580c',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
    healthStatement: 'Increasing likelihood of respiratory symptoms in sensitive individuals, aggravation of heart or lung disease.',
    sensitiveGroupAdvice: 'People with heart or lung disease, older adults, children and teens should reduce prolonged or heavy outdoor exertion.'
  },
  Unhealthy: {
    name: 'Unhealthy',
    range: [151, 200],
    color: '#dc2626',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    description: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',
    healthStatement: 'Increased aggravation of heart or lung disease and premature mortality among persons with cardiopulmonary disease.',
    sensitiveGroupAdvice: 'People with heart or lung disease, older adults, children and teens should avoid prolonged or heavy outdoor exertion. Everyone else should reduce prolonged or heavy exertion.'
  },
  'Very Unhealthy': {
    name: 'Very Unhealthy',
    range: [201, 300],
    color: '#9333ea',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    description: 'Health alert: The risk of health effects is increased for everyone.',
    healthStatement: 'Significant aggravation of heart or lung disease and premature mortality. Substantial increase in respiratory effects in general population.',
    sensitiveGroupAdvice: 'People with heart or lung disease, older adults, children and teens should avoid all outdoor physical activity. Everyone else should avoid prolonged or heavy exertion.'
  },
  Hazardous: {
    name: 'Hazardous',
    range: [301, 500],
    color: '#7f1d1d',
    badgeBg: 'bg-rose-950',
    badgeText: 'text-rose-100',
    description: 'Health warning of emergency conditions: everyone is more likely to be affected.',
    healthStatement: 'Serious aggravation of heart or lung disease. Premature mortality in persons with cardiopulmonary disease and the elderly; serious risk of respiratory effects in general population.',
    sensitiveGroupAdvice: 'Everyone should avoid all physical activity outdoors. Sensitive groups should remain indoors and keep activity levels low.'
  }
};

/**
 * Breakpoints for US EPA AQI (Concentration in µg/m³ unless noted)
 */
export const EPA_BREAKPOINTS: Record<string, EpaBreakpointRange[]> = {
  pm2_5: [
    { cLo: 0.0, cHi: 9.0, iLo: 0, iHi: 50, category: 'Good' },
    { cLo: 9.1, cHi: 35.4, iLo: 51, iHi: 100, category: 'Moderate' },
    { cLo: 35.5, cHi: 55.4, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
    { cLo: 55.5, cHi: 125.4, iLo: 151, iHi: 200, category: 'Unhealthy' },
    { cLo: 125.5, cHi: 225.4, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
    { cLo: 225.5, cHi: 500.4, iLo: 301, iHi: 500, category: 'Hazardous' }
  ],
  pm10: [
    { cLo: 0, cHi: 54, iLo: 0, iHi: 50, category: 'Good' },
    { cLo: 55, cHi: 154, iLo: 51, iHi: 100, category: 'Moderate' },
    { cLo: 155, cHi: 254, iLo: 101, iHi: 150, category: 'Unhealthy for Sensitive Groups' },
    { cLo: 255, cHi: 354, iLo: 151, iHi: 200, category: 'Unhealthy' },
    { cLo: 355, cHi: 424, iLo: 201, iHi: 300, category: 'Very Unhealthy' },
    { cLo: 425, cHi: 604, iLo: 301, iHi: 500, category: 'Hazardous' }
  ]
};
