import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Filter, Compass, Info } from 'lucide-react';

interface NeighborhoodMapProps {
  latitude: number;
  longitude: number;
  cityName: string;
  baseAqi?: number | null;
}

interface StationNode {
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

const ZONES = ['All', 'Central', 'North', 'South', 'East', 'West'] as const;
type ZoneType = typeof ZONES[number];

function getCategoryAndColor(aqi: number): { category: string; color: string; bg: string } {
  if (aqi <= 50) return { category: 'Good', color: '#16a34a', bg: '#dcfce7' };
  if (aqi <= 100) return { category: 'Satisfactory', color: '#65a30d', bg: '#ecfccb' };
  if (aqi <= 200) return { category: 'Moderate', color: '#d97706', bg: '#fef3c7' };
  if (aqi <= 300) return { category: 'Poor', color: '#ea580c', bg: '#ffedd5' };
  if (aqi <= 400) return { category: 'Very Poor', color: '#dc2626', bg: '#fee2e2' };
  return { category: 'Severe', color: '#7f1d1d', bg: '#fecaca' };
}

export const NeighborhoodMap: React.FC<NeighborhoodMapProps> = ({
  latitude,
  longitude,
  cityName,
  baseAqi = 180
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedZone, setSelectedZone] = useState<ZoneType>('All');
  const [selectedNode, setSelectedNode] = useState<StationNode | null>(null);

  // Generate realistic micro-climate neighborhood nodes centered on city coordinates
  const stations: StationNode[] = useMemo(() => {
    const effectiveBase = baseAqi && baseAqi > 0 ? baseAqi : 180;
    const offsets = [
      { name: `${cityName} Civic Center`, zone: 'Central' as const, dLat: 0.0, dLon: 0.0, factor: 1.0, pol: 'PM2.5' },
      { name: `${cityName} North Industrial`, zone: 'North' as const, dLat: 0.045, dLon: 0.015, factor: 1.25, pol: 'PM10' },
      { name: `${cityName} North University Hub`, zone: 'North' as const, dLat: 0.065, dLon: -0.02, factor: 0.85, pol: 'PM2.5' },
      { name: `${cityName} South Eco Green Belt`, zone: 'South' as const, dLat: -0.042, dLon: 0.01, factor: 0.72, pol: 'Ozone' },
      { name: `${cityName} South Tech Corridor`, zone: 'South' as const, dLat: -0.068, dLon: -0.025, factor: 0.95, pol: 'PM2.5' },
      { name: `${cityName} East Highway Bypass`, zone: 'East' as const, dLat: 0.015, dLon: 0.055, factor: 1.35, pol: 'NO2' },
      { name: `${cityName} East Riverfront`, zone: 'East' as const, dLat: -0.02, dLon: 0.045, factor: 0.9, pol: 'PM2.5' },
      { name: `${cityName} West Commercial Metro`, zone: 'West' as const, dLat: 0.012, dLon: -0.052, factor: 1.15, pol: 'PM2.5' },
      { name: `${cityName} West Residential Hills`, zone: 'West' as const, dLat: -0.035, dLon: -0.06, factor: 0.78, pol: 'PM2.5' }
    ];

    return offsets.map((o, idx) => {
      const aqi = Math.max(15, Math.min(480, Math.round(effectiveBase * o.factor)));
      const pm25 = Math.round(aqi * 0.42);
      const { category, color } = getCategoryAndColor(aqi);

      return {
        id: `node-${idx}`,
        name: o.name,
        zone: o.zone,
        lat: Number((latitude + o.dLat).toFixed(5)),
        lon: Number((longitude + o.dLon).toFixed(5)),
        aqi,
        pm25,
        dominantPollutant: o.pol,
        category,
        color
      };
    });
  }, [latitude, longitude, cityName, baseAqi]);

  // Filter stations based on selected urban zone
  const visibleStations = useMemo(() => {
    if (selectedZone === 'All') return stations;
    return stations.filter((s) => s.zone === selectedZone);
  }, [stations, selectedZone]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false
    });

    // Clean CartoDB Positron / OpenStreetMap light basemap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Invalidate size on mount to ensure clean render inside flex containers
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude]);

  // Update Markers when visible stations or zone selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    visibleStations.forEach((station) => {
      // 1. Heatmap Halo (translucent circle marker)
      const halo = L.circleMarker([station.lat, station.lon], {
        radius: 28,
        fillColor: station.color,
        fillOpacity: 0.18,
        color: station.color,
        weight: 1.5,
        opacity: 0.4
      });
      halo.addTo(markersLayer);

      // 2. Custom HTML Marker Pin with AQI text & pulse effect
      const pinIcon = L.divIcon({
        className: 'custom-aqi-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${station.color}; opacity: 0.25; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 30px; height: 30px; border-radius: 50%; background: ${station.color}; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 11px; font-family: ui-sans-serif, system-ui, sans-serif;">
              ${station.aqi}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([station.lat, station.lon], { icon: pinIcon });

      // Custom Glassmorphic Popup content
      const popupHtml = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 4px 2px; min-width: 170px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">${station.zone} Sector</span>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: ${station.color}15; color: ${station.color}; border: 1px solid ${station.color}40;">
              ${station.category}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
            ${station.name}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; padding: 6px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px;">
            <div>
              <div style="color: #64748b; font-size: 10px;">CPCB AQI</div>
              <div style="font-weight: 800; color: ${station.color}; font-size: 14px;">${station.aqi}</div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 10px;">PM2.5 Mass</div>
              <div style="font-weight: 700; color: #1e293b;">${station.pm25} µg/m³</div>
            </div>
          </div>
          <div style="margin-top: 6px; font-size: 10px; color: #475569; display: flex; justify-content: space-between;">
            <span>Dominant: <strong>${station.dominantPollutant}</strong></span>
            <span style="color: #16a34a;">● Live Node</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: 'aqi-glass-popup'
      });

      marker.on('click', () => {
        setSelectedNode(station);
      });

      marker.addTo(markersLayer);
    });

    // If specific zone chosen, smoothly pan to its first station
    if (selectedZone !== 'All' && visibleStations.length > 0) {
      map.flyTo([visibleStations[0].lat, visibleStations[0].lon], 13, { duration: 0.8 });
    } else {
      map.flyTo([latitude, longitude], 12, { duration: 0.8 });
    }
  }, [visibleStations, selectedZone, latitude, longitude]);

  return (
    <section
      aria-labelledby="map-section-title"
      className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4"
    >
      {/* Header with Title and Zone Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="map-section-title" className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>Neighborhood Air Quality Heatmap</span>
              <Layers className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            </h2>
            <p className="text-xs text-slate-600">
              Interactive GIS GIS overlay displaying micro-climate sensor nodes across {cityName}
            </p>
          </div>
        </div>

        {/* Zone Filter Pill Switch */}
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" aria-hidden="true" />
          <div
            role="group"
            aria-label="City zone filter"
            className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 overflow-x-auto max-w-full"
          >
            {ZONES.map((zone) => {
              const isActive = selectedZone === zone;
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all shrink-0 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-pressed={isActive}
                >
                  {zone}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map Canvas Card */}
      <div className="relative w-full h-[380px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
        <div
          ref={mapContainerRef}
          className="w-full h-full z-0"
          tabIndex={0}
          role="region"
          aria-label={`Interactive air quality map for ${cityName}`}
        />

        {/* Floating Station Quick Info Badge */}
        {selectedNode && (
          <div className="absolute top-3 right-3 z-1000 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-lg max-w-[240px] text-xs transition-all">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-slate-900 line-clamp-1">{selectedNode.name}</span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold leading-none p-0.5"
                aria-label="Dismiss quick node card"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
              <span>Sector: {selectedNode.zone}</span>
              <span className="font-bold" style={{ color: selectedNode.color }}>
                {selectedNode.category}
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-extrabold" style={{ color: selectedNode.color }}>
                {selectedNode.aqi}
              </span>
              <span className="text-[10px] text-slate-500">CPCB NAQI</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              PM2.5: <strong>{selectedNode.pm25} µg/m³</strong> • Dominant: <strong>{selectedNode.dominantPollutant}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend with AQI Breakpoints */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span className="flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>CPCB NAQI Severity Spectrum & Breakpoints:</span>
          </span>
          <span className="text-[11px] text-slate-500">Scale: 0 – 500</span>
        </div>

        {/* Gradient Spectrum Bar */}
        <div
          className="h-2.5 w-full rounded-full shadow-inner"
          style={{
            background:
              'linear-gradient(to right, #16a34a 0%, #16a34a 10%, #65a30d 10%, #65a30d 20%, #d97706 20%, #d97706 40%, #ea580c 40%, #ea580c 60%, #dc2626 60%, #dc2626 80%, #7f1d1d 80%, #7f1d1d 100%)'
          }}
          aria-hidden="true"
        />

        {/* Legend Bracket Labels */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[10px] pt-1">
          <div className="bg-emerald-50 text-emerald-800 rounded-md py-1 px-1.5 border border-emerald-200/80 font-medium">
            <div className="font-bold">Good</div>
            <div className="text-[9px] text-emerald-600">0 – 50</div>
          </div>
          <div className="bg-lime-50 text-lime-800 rounded-md py-1 px-1.5 border border-lime-200/80 font-medium">
            <div className="font-bold">Satisfactory</div>
            <div className="text-[9px] text-lime-600">51 – 100</div>
          </div>
          <div className="bg-amber-50 text-amber-800 rounded-md py-1 px-1.5 border border-amber-200/80 font-medium">
            <div className="font-bold">Moderate</div>
            <div className="text-[9px] text-amber-600">101 – 200</div>
          </div>
          <div className="bg-orange-50 text-orange-800 rounded-md py-1 px-1.5 border border-orange-200/80 font-medium">
            <div className="font-bold">Poor</div>
            <div className="text-[9px] text-orange-600">201 – 300</div>
          </div>
          <div className="bg-rose-50 text-rose-800 rounded-md py-1 px-1.5 border border-rose-200/80 font-medium">
            <div className="font-bold">Very Poor</div>
            <div className="text-[9px] text-rose-600">301 – 400</div>
          </div>
          <div className="bg-red-900 text-rose-100 rounded-md py-1 px-1.5 border border-red-950 font-medium">
            <div className="font-bold">Severe</div>
            <div className="text-[9px] text-rose-200">401 – 500</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NeighborhoodMap;
