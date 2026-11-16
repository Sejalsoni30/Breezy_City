export type DataStateBadge = 'Live' | 'Cached' | 'Forecast' | 'Estimated' | 'Unavailable';

export interface LocationItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  admin1?: string;
  admin2?: string;
  timezone: string;
  displayName: string;
}

export interface WeatherData {
  temperature: number | null;
  temperatureUnit: string;
  humidity: number | null;
  humidityUnit: string;
  windSpeed: number | null;
  windSpeedUnit: string;
  windDirection: number | null;
  weatherCode: number | null;
  weatherDescription: string;
  timestamp: string;
  source: string;
  dataState: DataStateBadge;
}

export interface TrendPoint {
  time: string;
  aqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  isForecast: boolean;
}

export interface TrendsSummary {
  minAqi: number | null;
  maxAqi: number | null;
  avgAqi: number | null;
  direction: 'improving' | 'deteriorating' | 'stable';
  accessibleSummary: string;
}

export interface PollutantDetail {
  raw: number | null | undefined;
  unit: string;
  calculatedValue: number | null;
  subIndex: number | null;
  category: string | null;
  isAvailable: boolean;
}

export interface AirQualityApiResponse {
  standard: 'CPCB' | 'US_EPA';
  standardName: string;
  standardReference: string;
  location: {
    latitude: number;
    longitude: number;
    displayName?: string;
  };
  aqi: number | null;
  category: string | null;
  categoryInfo: {
    name: string;
    range: [number, number];
    color: string;
    badgeBg: string;
    badgeText: string;
    description: string;
    healthStatement: string;
    sensitiveGroupAdvice: string;
  } | null;
  dominantPollutants: string[];
  pollutants: Record<string, PollutantDetail>;
  healthGuidance: {
    general: string;
    sensitiveGroups: {
      children: string;
      elderly: string;
      respiratory: string;
      heart: string;
    };
    exposureReductionTips: string[];
    disclaimer: string;
  };
  trends: {
    history: TrendPoint[];
    forecast: TrendPoint[];
    summary: TrendsSummary;
  };
  metadata: {
    source: string;
    isModelEstimate: boolean;
    dataNatureDisclosure: string;
    modelTime: string;
    fetchTime: string;
    dataState: DataStateBadge;
    cachedAgeSeconds?: number;
  };
}
