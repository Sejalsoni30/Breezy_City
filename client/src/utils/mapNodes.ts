/**
 * GIS Neighborhood Station Nodes and Styling Utilities
 */

export interface StationNode {
  id: string;
  name: string;
  zone: 'Central' | 'North' | 'South' | 'East' | 'West';
  lat: number;
  lon: number;
  aqi: number;
  pm25: number;
  dominantPollutant: string;
  category: string;
  color: string;
}

export const ZONES = ['All', 'Central', 'North', 'South', 'East', 'West'] as const;
export type ZoneType = (typeof ZONES)[number];

/**
 * Returns the CPCB category label and hex color for an AQI value.
 */
export function getCategoryAndColor(aqi: number): { category: string; color: string; bg: string } {
  if (aqi <= 50) return { category: 'Good', color: '#16a34a', bg: '#dcfce7' };
  if (aqi <= 100) return { category: 'Satisfactory', color: '#65a30d', bg: '#ecfccb' };
  if (aqi <= 200) return { category: 'Moderate', color: '#d97706', bg: '#fef3c7' };
  if (aqi <= 300) return { category: 'Poor', color: '#ea580c', bg: '#ffedd5' };
  if (aqi <= 400) return { category: 'Very Poor', color: '#dc2626', bg: '#fee2e2' };
  return { category: 'Severe', color: '#7f1d1d', bg: '#fecaca' };
}

interface OffsetDefinition {
  nameSuffix: string;
  zone: 'Central' | 'North' | 'South' | 'East' | 'West';
  dLat: number;
  dLon: number;
  factor: number;
  dominantPollutant: string;
}

const STATION_OFFSETS: readonly OffsetDefinition[] = [
  {
    nameSuffix: 'Civic Center',
    zone: 'Central',
    dLat: 0.0,
    dLon: 0.0,
    factor: 1.0,
    dominantPollutant: 'PM2.5'
  },
  {
    nameSuffix: 'North Industrial',
    zone: 'North',
    dLat: 0.045,
    dLon: 0.015,
    factor: 1.25,
    dominantPollutant: 'PM10'
  },
  {
    nameSuffix: 'North University Hub',
    zone: 'North',
    dLat: 0.065,
    dLon: -0.02,
    factor: 0.85,
    dominantPollutant: 'PM2.5'
  },
  {
    nameSuffix: 'South Eco Green Belt',
    zone: 'South',
    dLat: -0.042,
    dLon: 0.01,
    factor: 0.72,
    dominantPollutant: 'Ozone'
  },
  {
    nameSuffix: 'South Tech Corridor',
    zone: 'South',
    dLat: -0.068,
    dLon: -0.025,
    factor: 0.95,
    dominantPollutant: 'PM2.5'
  },
  {
    nameSuffix: 'East Highway Bypass',
    zone: 'East',
    dLat: 0.015,
    dLon: 0.055,
    factor: 1.35,
    dominantPollutant: 'NO2'
  },
  {
    nameSuffix: 'East Riverfront',
    zone: 'East',
    dLat: -0.02,
    dLon: 0.045,
    factor: 0.9,
    dominantPollutant: 'PM2.5'
  },
  {
    nameSuffix: 'West Commercial Metro',
    zone: 'West',
    dLat: 0.012,
    dLon: -0.052,
    factor: 1.15,
    dominantPollutant: 'PM2.5'
  },
  {
    nameSuffix: 'West Residential Hills',
    zone: 'West',
    dLat: -0.035,
    dLon: -0.06,
    factor: 0.78,
    dominantPollutant: 'PM2.5'
  }
] as const;

/**
 * Generates realistic micro-climate neighborhood nodes centered on the target city coordinates.
 */
export function generateNeighborhoodStations(
  cityName: string,
  latitude: number,
  longitude: number,
  baseAqi: number = 180
): StationNode[] {
  const effectiveBase = baseAqi && baseAqi > 0 ? baseAqi : 180;

  return STATION_OFFSETS.map((offset, index) => {
    const aqi = Math.max(15, Math.min(480, Math.round(effectiveBase * offset.factor)));
    const pm25 = Math.round(aqi * 0.42);
    const { category, color } = getCategoryAndColor(aqi);

    return {
      id: `station-node-${index}`,
      name: `${cityName} ${offset.nameSuffix}`,
      zone: offset.zone,
      lat: Number((latitude + offset.dLat).toFixed(5)),
      lon: Number((longitude + offset.dLon).toFixed(5)),
      aqi,
      pm25,
      dominantPollutant: offset.dominantPollutant,
      category,
      color
    };
  });
}
