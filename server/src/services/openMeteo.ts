import { GeocodingResponse, LocationItem, WeatherData } from '../types/index.js';

const TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000;

export function getWeatherDescription(code: number | null): string {
  if (code === null || code === undefined) return 'Unknown';
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}

/**
 * Searches places via Open-Meteo Geocoding API.
 */
export async function searchLocations(query: string): Promise<GeocodingResponse> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Geocoding upstream error: ${response.status}`);
  }

  const data: any = await response.json();
  if (!data.results || !Array.isArray(data.results)) {
    return { query, count: 0, results: [] };
  }

  const results: LocationItem[] = data.results.map((item: any) => {
    const parts = [item.name];
    if (item.admin1 && item.admin1 !== item.name) parts.push(item.admin1);
    if (item.country) parts.push(item.country);
    const displayName = parts.join(', ');

    return {
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country || '',
      countryCode: item.country_code || '',
      admin1: item.admin1,
      admin2: item.admin2,
      timezone: item.timezone || 'UTC',
      displayName
    };
  });

  return {
    query,
    count: results.length,
    results
  };
}

/**
 * Fetches Air Quality metrics from Open-Meteo Air Quality API.
 */
export async function fetchRawAirQuality(lat: number, lon: number): Promise<any> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&past_days=1&forecast_days=2`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Air quality upstream error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches Weather metrics from Open-Meteo Forecast API.
 */
export async function fetchRawWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Weather upstream error: ${response.status}`);
  }

  const data: any = await response.json();
  const current = data.current || {};
  const currentUnits = data.current_units || {};

  return {
    temperature: current.temperature_2m ?? null,
    temperatureUnit: currentUnits.temperature_2m || '°C',
    humidity: current.relative_humidity_2m ?? null,
    humidityUnit: currentUnits.relative_humidity_2m || '%',
    windSpeed: current.wind_speed_10m ?? null,
    windSpeedUnit: currentUnits.wind_speed_10m || 'km/h',
    windDirection: current.wind_direction_10m ?? null,
    weatherCode: current.weather_code ?? null,
    weatherDescription: getWeatherDescription(current.weather_code),
    timestamp: current.time || new Date().toISOString(),
    source: 'Open-Meteo Weather Forecast Model',
    dataState: 'Live'
  };
}
