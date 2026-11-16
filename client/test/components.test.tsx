import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AqiHero } from '../src/components/AqiHero';
import { PollutantGrid } from '../src/components/PollutantGrid';
import { HealthGuidance } from '../src/components/HealthGuidance';
import { DataAttribution } from '../src/components/DataAttribution';
import { LocationSearch } from '../src/components/LocationSearch';
import { AirQualityApiResponse } from '../src/types';

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
});
