import { OpenMeteoAirQualityRawResponse } from './openMeteo.js';
import { calculateSubIndex, getCategoryFromAqi } from '../aqi/calculator.js';
import { SERVER_CONFIG } from '../config/constants.js';

export interface DailyTrendSummary {
  date: string;
  avgPm25: number | null;
  avgPm10: number | null;
  aqi: number | null;
  category: string | null;
}

export interface HistoricalTrendsResult {
  days: number;
  series: DailyTrendSummary[];
}

/**
 * Fetches and aggregates multi-day historical atmospheric air quality data from Open-Meteo.
 */
export async function fetchHistoricalTrends(
  lat: number,
  lon: number,
  days: number
): Promise<HistoricalTrendsResult> {
  const url = `${SERVER_CONFIG.API_ENDPOINTS.OPEN_METEO_AIR_QUALITY}?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,nitrogen_dioxide,ozone&past_days=${days}&forecast_days=0`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(SERVER_CONFIG.UPSTREAM_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch historical model data: upstream error ${response.status}`);
  }

  const raw = (await response.json()) as OpenMeteoAirQualityRawResponse;
  const hourly = raw.hourly || {};
  const dailyMap = new Map<string, { pm2_5: number[]; pm10: number[] }>();

  (hourly.time || []).forEach((timestamp: string, idx: number) => {
    const dateStr = timestamp.split('T')[0];
    if (!dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, { pm2_5: [], pm10: [] });
    }
    const entry = dailyMap.get(dateStr)!;
    if (hourly.pm2_5?.[idx] != null) entry.pm2_5.push(hourly.pm2_5[idx]);
    if (hourly.pm10?.[idx] != null) entry.pm10.push(hourly.pm10[idx]);
  });

  const series: DailyTrendSummary[] = Array.from(dailyMap.entries()).map(([date, values]) => {
    const avgPm25 = values.pm2_5.length
      ? Math.round(values.pm2_5.reduce((acc, curr) => acc + curr, 0) / values.pm2_5.length)
      : null;
    const avgPm10 = values.pm10.length
      ? Math.round(values.pm10.reduce((acc, curr) => acc + curr, 0) / values.pm10.length)
      : null;

    const subPm25 =
      avgPm25 !== null ? (calculateSubIndex('pm2_5', avgPm25)?.subIndex ?? null) : null;
    const subPm10 =
      avgPm10 !== null ? (calculateSubIndex('pm10', avgPm10)?.subIndex ?? null) : null;
    const aqi = Math.max(subPm25 ?? 0, subPm10 ?? 0) || null;

    return {
      date,
      avgPm25,
      avgPm10,
      aqi,
      category: aqi ? getCategoryFromAqi(aqi) : null
    };
  });

  return { days, series };
}
