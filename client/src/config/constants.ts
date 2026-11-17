/**
 * Client Application Constants
 *
 * Centralizes UI constants, local storage keys, map tiles, and configuration.
 */

export const CLIENT_CONFIG = {
  APP_NAME: 'Urban Air Quality Assistant',
  SUBTITLE: 'Hack2Skill Prompt Wars • Challenge 6',
  STORAGE_KEYS: {
    FAVORITES: 'breezycity_favorites',
    STANDARD: 'breezycity_standard'
  },
  DEFAULT_LOCATION: {
    NAME: 'Delhi',
    DISPLAY_NAME: 'Delhi, India',
    LATITUDE: 28.6139,
    LONGITUDE: 77.209
  },
  DATA_REFRESH_INTERVAL_MS: 300000, // 5 minutes
  MAP: {
    DEFAULT_ZOOM: 12,
    MAX_ZOOM: 19,
    FLY_TO_ZOOM: 13,
    DEFAULT_BASE_AQI: 180,
    TILE_URL:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    TILE_ATTRIBUTION:
      'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, METI, TomTom'
  },
  SENSITIVE_GROUPS: [
    { key: 'children', label: 'Children' },
    { key: 'elderly', label: 'Elderly' },
    { key: 'respiratory', label: 'Asthma / Respiratory' },
    { key: 'heart', label: 'Cardiovascular' }
  ]
} as const;
