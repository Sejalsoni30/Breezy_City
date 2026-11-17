import { calculateCpcbAqi } from './calculator.js';
import { TrendPoint, TrendsSummary } from '../types/index.js';

export function processTrends(
  hourly: {
    time?: string[];
    pm10?: (number | null)[];
    pm2_5?: (number | null)[];
    nitrogen_dioxide?: (number | null)[];
    ozone?: (number | null)[];
    carbon_monoxide?: (number | null)[];
    sulphur_dioxide?: (number | null)[];
  },
  referenceIsoTime?: string
): {
  history: TrendPoint[];
  forecast: TrendPoint[];
  summary: TrendsSummary;
} {
  if (!hourly || !hourly.time || !Array.isArray(hourly.time) || hourly.time.length === 0) {
    return {
      history: [],
      forecast: [],
      summary: {
        minAqi: null,
        maxAqi: null,
        avgAqi: null,
        direction: 'stable',
        accessibleSummary: 'Insufficient trend data available.'
      }
    };
  }

  const nowTime = referenceIsoTime ? new Date(referenceIsoTime).getTime() : Date.now();
  const allPoints: TrendPoint[] = [];

  for (let i = 0; i < hourly.time.length; i++) {
    const timeStr = hourly.time[i];
    const pointTime = new Date(timeStr).getTime();
    const isForecast = pointTime > nowTime;

    const pm2_5 = hourly.pm2_5 ? hourly.pm2_5[i] : null;
    const pm10 = hourly.pm10 ? hourly.pm10[i] : null;
    const no2 = hourly.nitrogen_dioxide ? hourly.nitrogen_dioxide[i] : null;
    const o3 = hourly.ozone ? hourly.ozone[i] : null;
    const co = hourly.carbon_monoxide ? hourly.carbon_monoxide[i] : null;
    const so2 = hourly.sulphur_dioxide ? hourly.sulphur_dioxide[i] : null;

    const aqiResult = calculateCpcbAqi({
      pm2_5,
      pm10,
      nitrogen_dioxide: no2,
      ozone: o3,
      carbon_monoxide: co,
      sulphur_dioxide: so2
    });

    allPoints.push({
      time: timeStr,
      aqi: aqiResult.aqi,
      pm2_5: pm2_5 ?? null,
      pm10: pm10 ?? null,
      isForecast
    });
  }

  // Split into history (up to last 24 points before current) and forecast (up to next 24 points)
  const history = allPoints.filter((p) => !p.isForecast).slice(-24);
  const forecast = allPoints.filter((p) => p.isForecast).slice(0, 24);

  // Analyze forecast points for summary
  const validForecastAqis = forecast
    .map((p) => p.aqi)
    .filter((a): a is number => a !== null && !isNaN(a));

  const validHistoryAqis = history
    .map((p) => p.aqi)
    .filter((a): a is number => a !== null && !isNaN(a));

  if (validForecastAqis.length === 0 && validHistoryAqis.length === 0) {
    return {
      history,
      forecast,
      summary: {
        minAqi: null,
        maxAqi: null,
        avgAqi: null,
        direction: 'stable',
        accessibleSummary: 'Insufficient valid AQI points to compute trend summary.'
      }
    };
  }

  const analysisPool = validForecastAqis.length > 0 ? validForecastAqis : validHistoryAqis;
  const minAqi = Math.min(...analysisPool);
  const maxAqi = Math.max(...analysisPool);
  const sumAqi = analysisPool.reduce((acc, curr) => acc + curr, 0);
  const avgAqi = Math.round(sumAqi / analysisPool.length);

  // Determine trend direction
  let direction: 'improving' | 'deteriorating' | 'stable' = 'stable';
  if (validHistoryAqis.length >= 3 && validForecastAqis.length >= 3) {
    const recentHistoryAvg =
      validHistoryAqis.slice(-6).reduce((a, b) => a + b, 0) /
      validHistoryAqis.slice(-6).length;
    const upcomingForecastAvg =
      validForecastAqis.slice(0, 6).reduce((a, b) => a + b, 0) /
      validForecastAqis.slice(0, 6).length;

    const diff = upcomingForecastAvg - recentHistoryAvg;
    if (diff > 12) {
      direction = 'deteriorating';
    } else if (diff < -12) {
      direction = 'improving';
    } else {
      direction = 'stable';
    }
  }

  let directionText = 'remain relatively stable';
  if (direction === 'improving') directionText = 'improve moderately';
  if (direction === 'deteriorating') directionText = 'deteriorate';

  const accessibleSummary = `Over the next 24 hours, air quality is projected to ${directionText}, with an expected average AQI of ${avgAqi}, ranging from a minimum of ${minAqi} to a maximum of ${maxAqi}.`;

  return {
    history,
    forecast,
    summary: {
      minAqi,
      maxAqi,
      avgAqi,
      direction,
      accessibleSummary
    }
  };
}
