import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { AqiHero } from '../src/components/AqiHero';
import { PollutantGrid } from '../src/components/PollutantGrid';
import { HealthGuidance } from '../src/components/HealthGuidance';
import { DataAttribution } from '../src/components/DataAttribution';
import { LocationSearch } from '../src/components/LocationSearch';
import { GlobalErrorBoundary } from '../src/components/GlobalErrorBoundary';
import { AiHealthAssistant } from '../src/components/AiHealthAssistant';
import { HistoricalTrends } from '../src/components/HistoricalTrends';
import { NeighborhoodMap } from '../src/components/NeighborhoodMap';
import { AirQualityApiResponse } from '../src/types';

vi.mock('leaflet', () => {
  const mapMock = {
    remove: vi.fn(),
    invalidateSize: vi.fn(),
    setView: vi.fn(),
    flyTo: vi.fn()
  };
  const layerGroupMock = {
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn()
  };
  const markerMock = {
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis()
  };
  return {
    default: {
      map: vi.fn(() => mapMock),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      layerGroup: vi.fn(() => layerGroupMock),
      circleMarker: vi.fn(() => markerMock),
      marker: vi.fn(() => markerMock),
      divIcon: vi.fn(() => ({}))
    }
  };
});

const mockAqiData: AirQualityApiResponse = {
  standard: 'CPCB',
  standardName: 'India CPCB National Air Quality Index (NAQI)',
  standardReference: 'CPCB Oct 2014 Table 1',
  location: { latitude: 28.65, longitude: 77.23, displayName: 'Delhi, India' },
  aqi: 285,
  category: 'Poor',
  categoryInfo: {
    name: 'Poor',
    range: [201, 300],
    color: '#ea580c',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    description: 'Breathing discomfort to most people on prolonged exposure.',
    healthStatement: 'Causes breathing discomfort to most people on prolonged outdoor exposure.',
    sensitiveGroupAdvice: 'People with respiratory illness should avoid prolonged exertion.'
  },
  dominantPollutants: ['pm2_5'],
  pollutants: {
    pm2_5: {
      raw: 110,
      unit: 'µg/m³',
      calculatedValue: 110,
      subIndex: 285,
      category: 'Poor',
      isAvailable: true
    },
    pm10: {
      raw: 140,
      unit: 'µg/m³',
      calculatedValue: 140,
      subIndex: 125,
      category: 'Moderate',
      isAvailable: true
    },
    carbon_monoxide: {
      raw: 1200,
      unit: 'mg/m³',
      calculatedValue: 1.2,
      subIndex: 55,
      category: 'Satisfactory',
      isAvailable: true
    },
    ozone: {
      raw: null,
      unit: 'µg/m³',
      calculatedValue: null,
      subIndex: null,
      category: null,
      isAvailable: false
    }
  },
  healthGuidance: {
    general: 'Causes breathing discomfort on prolonged outdoor exposure.',
    sensitiveGroups: {
      children: 'Avoid prolonged outdoor play and sports.',
      elderly: 'Stay indoors as much as possible.',
      respiratory: 'High risk of asthma attacks; keep inhalers handy.',
      heart: 'Avoid strenuous aerobic exertion.'
    },
    exposureReductionTips: [
      'Wear a certified N95 or FFP2 mask outdoors.',
      'Run indoor HEPA air purifiers.'
    ],
    disclaimer: 'Informational only, not medical advice.'
  },
  trends: {
    history: [],
    forecast: [],
    summary: {
      minAqi: 240,
      maxAqi: 310,
      avgAqi: 280,
      direction: 'stable',
      accessibleSummary: 'Air quality will remain stable over the next 24 hours.'
    }
  },
  metadata: {
    source: 'Open-Meteo Atmospheric Chemistry Model Grid',
    isModelEstimate: true,
    dataNatureDisclosure: 'Modelled atmospheric reanalysis and forecast grid; not a physical ground monitoring station.',
    modelTime: '2026-11-16T14:00:00Z',
    fetchTime: '2026-11-16T14:35:00Z',
    dataState: 'Live'
  }
};

describe('Client UI Component Tests', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/ai/advisory')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              source: 'Clinical Environmental Health Matrix',
              advice: 'Air is polluted. Reduce prolonged outdoor running.',
              recommendations: [
                'Wear an N95 mask outdoors.',
                'Run indoor HEPA air filtration.',
                'Keep windows closed.'
              ],
              disclaimer: 'Informational guidance only, not medical advice.',
              isAIGenerated: true
            })
        });
      }
      if (url.includes('/api/historical-trends')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              days: 7,
              series: [
                {
                  date: '2026-11-15',
                  avgPm25: 110,
                  avgPm10: 160,
                  aqi: 275,
                  category: 'Poor'
                }
              ]
            })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    }) as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });
  describe('AqiHero Component', () => {
    it('renders location, category badge, and CPCB AQI value', () => {
      render(<AqiHero data={mockAqiData} locationName="Delhi, NCT of Delhi, India" />);
      expect(screen.getByText('Delhi, NCT of Delhi, India')).toBeInTheDocument();
      expect(screen.getByText('285')).toBeInTheDocument();
      expect(screen.getByText('Poor')).toBeInTheDocument();
      expect(screen.getByText(/Primary Dominant Pollutant:/i)).toBeInTheDocument();
      expect(screen.getByText('PM2.5')).toBeInTheDocument();
      expect(screen.getByText(/Scale: 0 to 500/i)).toBeInTheDocument();
    });
  });

  describe('PollutantGrid Component', () => {
    it('renders individual pollutants with units, sub-indices, and missing states', () => {
      render(<PollutantGrid pollutants={mockAqiData.pollutants} />);
      expect(screen.getByText('PM₂.₅')).toBeInTheDocument();
      expect(screen.getByText('PM₁₀')).toBeInTheDocument();
      expect(screen.getByText('CO')).toBeInTheDocument();
      expect(screen.getByText('O₃')).toBeInTheDocument();

      // Check sub-index displays
      expect(screen.getByText('285')).toBeInTheDocument();
      // O3 and unmonitored pollutants are marked excluded
      expect(screen.getAllByText(/Excluded from overall index/i).length).toBeGreaterThan(0);
    });
  });

  describe('HealthGuidance Component', () => {
    it('renders official guidance, sensitive group tabs, and mandatory medical disclaimer', () => {
      render(<HealthGuidance guidance={mockAqiData.healthGuidance} category="Poor" />);

      // General guidance visible initially
      expect(screen.getByText(/Causes breathing discomfort on prolonged outdoor exposure/i)).toBeInTheDocument();

      // Switch to Children tab
      const childrenTab = screen.getByRole('tab', { name: /Children & Youth/i });
      fireEvent.click(childrenTab);
      expect(screen.getByText(/Avoid prolonged outdoor play and sports/i)).toBeInTheDocument();

      // Exposure reduction tip
      expect(screen.getByText(/Wear a certified N95 or FFP2 mask outdoors/i)).toBeInTheDocument();

      // Mandatory medical disclaimer
      expect(screen.getByText(/Informational only, not medical advice/i)).toBeInTheDocument();
    });
  });

  describe('DataAttribution Component', () => {
    it('explicitly states model grid data nature and Open-Meteo attribution', () => {
      render(
        <DataAttribution
          source={mockAqiData.metadata.source}
          isModelEstimate={mockAqiData.metadata.isModelEstimate}
          dataNatureDisclosure={mockAqiData.metadata.dataNatureDisclosure}
          modelTime={mockAqiData.metadata.modelTime}
          fetchTime={mockAqiData.metadata.fetchTime}
          dataState={mockAqiData.metadata.dataState}
        />
      );

      expect(screen.getByText(/Atmospheric Model Grid Estimate \(Not a Ground Station Sensor\)/i)).toBeInTheDocument();
      expect(screen.getByText(/not a physical ground monitoring station/i)).toBeInTheDocument();
      expect(screen.getByText('Open-Meteo')).toBeInTheDocument();
    });
  });

  describe('LocationSearch Component', () => {
    it('renders input field with accessible label and Use My Location button', () => {
      const handleSelect = vi.fn();
      render(<LocationSearch onSelectLocation={handleSelect} isLoading={false} />);

      const input = screen.getByPlaceholderText(/Search city/i);
      expect(input).toBeInTheDocument();

      const geoButton = screen.getByRole('button', { name: /Use My Location/i });
      expect(geoButton).toBeInTheDocument();
    });
  });

  describe('GlobalErrorBoundary Component', () => {
    it('catches render errors and displays accessible alert with retry controls', () => {
      // Component that throws
      const ProblemChild = () => {
        throw new Error('Test crash in child component');
      };

      // Suppress console.error in test output for intentional error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <GlobalErrorBoundary>
          <ProblemChild />
        </GlobalErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try re-rendering/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('AiHealthAssistant Component', () => {
    it('renders sensitive group profiles and disclaimers', () => {
      render(
        <AiHealthAssistant
          aqi={285}
          category="Poor"
          dominantPollutant="PM2.5"
        />
      );

      expect(screen.getByText(/Personalized AI Health Advisory/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Asthma/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Elderly/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Children/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Athletes/i })).toBeInTheDocument();
    });
  });

  describe('HistoricalTrends Component', () => {
    it('renders interval toggle buttons and table view switch', () => {
      render(<HistoricalTrends latitude={28.65} longitude={77.23} />);

      expect(screen.getByText(/Historical AQI Trends/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Past 7 Days/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Past 30 Days/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Table View/i })).toBeInTheDocument();
    });
  });

  describe('NeighborhoodMap Component', () => {
    it('renders card header, zone filter buttons, and AQI color legend', () => {
      render(
        <NeighborhoodMap
          latitude={28.6139}
          longitude={77.2090}
          cityName="Delhi"
          baseAqi={175}
        />
      );

      // Card title and zone controls
      expect(screen.getByText(/Neighborhood Air Quality Heatmap/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Central/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /North/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /South/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /East/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /West/i })).toBeInTheDocument();

      // Legend brackets
      expect(screen.getByText(/^Good$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Satisfactory$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Moderate$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Poor$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Very Poor$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Severe$/i)).toBeInTheDocument();
    });

    it('allows switching between urban zones via interactive filter buttons', () => {
      render(
        <NeighborhoodMap
          latitude={28.6139}
          longitude={77.2090}
          cityName="Delhi"
          baseAqi={175}
        />
      );

      const northBtn = screen.getByRole('button', { name: /North/i });
      fireEvent.click(northBtn);
      expect(northBtn).toHaveAttribute('aria-pressed', 'true');
      expect(northBtn).toHaveClass('text-emerald-700');
    });
  });
});
