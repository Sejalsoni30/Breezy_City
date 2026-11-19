import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Filter, Compass, Info } from 'lucide-react';
import { CLIENT_CONFIG } from '../config/constants.js';
import { StationNode, ZONES, ZoneType, generateNeighborhoodStations } from '../utils/mapNodes.js';
import { escapeHtml } from '../utils/sanitize.js';

interface NeighborhoodMapProps {
  latitude: number;
  longitude: number;
  cityName: string;
  baseAqi?: number | null;
}

/**
 * Creates custom pulsing HTML pin marker for an AQI station node.
 */
function createPinIcon(station: StationNode): L.DivIcon {
  return L.divIcon({
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
}

/**
 * Compiles sanitized glassmorphic popup HTML for a station node.
 */
function createPopupHtml(station: StationNode): string {
  return `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 4px 2px; min-width: 170px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">${escapeHtml(station.zone)} Sector</span>
        <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: ${station.color}15; color: ${station.color}; border: 1px solid ${station.color}40;">
          ${escapeHtml(station.category)}
        </span>
      </div>
      <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
        ${escapeHtml(station.name)}
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
        <span>Dominant: <strong>${escapeHtml(station.dominantPollutant)}</strong></span>
        <span style="color: #16a34a;">● Live Node</span>
      </div>
    </div>
  `;
}

export const NeighborhoodMap: React.FC<NeighborhoodMapProps> = ({
  latitude,
  longitude,
  cityName,
  baseAqi = CLIENT_CONFIG.MAP.DEFAULT_BASE_AQI
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedZone, setSelectedZone] = useState<ZoneType>('All');
  const [selectedNode, setSelectedNode] = useState<StationNode | null>(null);

  // Generate realistic micro-climate neighborhood nodes centered on city coordinates
  const stations = useMemo(() => {
    return generateNeighborhoodStations(
      cityName,
      latitude,
      longitude,
      baseAqi ?? CLIENT_CONFIG.MAP.DEFAULT_BASE_AQI
    );
  }, [latitude, longitude, cityName, baseAqi]);

  // Filter stations based on selected urban zone
  const visibleStations = useMemo(() => {
    if (selectedZone === 'All') return stations;
    return stations.filter((s) => s.zone === selectedZone);
  }, [stations, selectedZone]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: CLIENT_CONFIG.MAP.DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: false
    });

    // Production-ready Esri World Street Map basemap: completely free, NO API key required, NO watermarks, NO 403 blocks
    L.tileLayer(CLIENT_CONFIG.MAP.TILE_URL, {
      maxZoom: CLIENT_CONFIG.MAP.MAX_ZOOM,
      attribution: CLIENT_CONFIG.MAP.TILE_ATTRIBUTION
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

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
      const marker = L.marker([station.lat, station.lon], {
        icon: createPinIcon(station)
      });

      marker.bindPopup(createPopupHtml(station), {
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
      map.flyTo([visibleStations[0].lat, visibleStations[0].lon], CLIENT_CONFIG.MAP.FLY_TO_ZOOM, {
        duration: 0.8
      });
    } else {
      map.flyTo([latitude, longitude], CLIENT_CONFIG.MAP.DEFAULT_ZOOM, { duration: 0.8 });
    }
  }, [visibleStations, selectedZone, latitude, longitude]);

  return (
    <section
      aria-labelledby="map-section-title"
      className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-3 sm:space-y-4"
    >
      {/* Header with Title and Zone Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="map-section-title"
              className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5"
            >
              <span>Neighborhood Air Quality Heatmap</span>
              <Layers className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
            </h2>
            <p className="text-xs text-slate-600">
              Interactive GIS overlay displaying micro-climate sensor nodes across {cityName}
            </p>
          </div>
        </div>

        {/* Zone Filter Pill Switch */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <Filter
            className="w-3.5 h-3.5 text-slate-500 hidden sm:inline shrink-0"
            aria-hidden="true"
          />
          <div
            role="group"
            aria-label="City zone filter"
            className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 overflow-x-auto no-scrollbar max-w-full"
          >
            {ZONES.map((zone) => {
              const isActive = selectedZone === zone;
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all shrink-0 min-h-[34px] flex items-center focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
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

      {/* Selected Node Details Bar */}
      {selectedNode && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 animate-in fade-in duration-200"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: selectedNode.color }}
              aria-hidden="true"
            />
            <span className="font-semibold text-slate-900 truncate">{selectedNode.name}</span>
            <span className="text-slate-500 shrink-0">({selectedNode.zone} Sector)</span>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <span>
              AQI: <strong style={{ color: selectedNode.color }}>{selectedNode.aqi}</strong>
            </span>
            <span className="hidden xs:inline">
              PM2.5: <strong>{selectedNode.pm25} µg/m³</strong>
            </span>
            <span className="text-slate-400">|</span>
            <span className="font-medium text-slate-800">{selectedNode.category}</span>
          </div>
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="relative w-full h-[260px] xs:h-[300px] sm:h-[360px] md:h-[400px] rounded-xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-100">
        <div
          ref={mapContainerRef}
          className="w-full h-full z-0"
          aria-label={`Interactive neighborhood map for ${cityName}`}
        />
      </div>

      {/* AQI Gradient Spectrum & Breakpoint Legend */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            CPCB NAQI Severity Spectrum &amp; Breakpoints:
          </span>
          <span className="text-slate-600 font-medium">Scale: 0 – 500</span>
        </div>

        {/* Continuous Gradient Bar */}
        <div
          className="w-full h-2.5 rounded-full shadow-inner"
          style={{
            background:
              'linear-gradient(to right, #16a34a 0%, #16a34a 10%, #65a30d 10%, #65a30d 20%, #d97706 20%, #d97706 40%, #ea580c 40%, #ea580c 60%, #dc2626 60%, #dc2626 80%, #7f1d1d 80%, #7f1d1d 100%)'
          }}
        />

        {/* Breakpoint Legend Cards */}
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
