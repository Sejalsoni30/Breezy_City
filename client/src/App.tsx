import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { LocationSearch } from './components/LocationSearch';
import { AqiHero } from './components/AqiHero';
import { PollutantGrid } from './components/PollutantGrid';
import { HealthGuidance } from './components/HealthGuidance';
import { WeatherContext } from './components/WeatherContext';
import { DataAttribution } from './components/DataAttribution';
import { LoadingSkeleton, ErrorBanner, OfflineNotice, EmptyState } from './components/FeedbackStates';
import { LocationItem, AirQualityApiResponse, WeatherData } from './types';
import { Star } from 'lucide-react';

// Lazy-load Charts & AI Components to optimize initial bundle size
const TrendsChart = lazy(() => import('./components/TrendsChart'));
const HistoricalTrends = lazy(() => import('./components/HistoricalTrends'));
const AiHealthAssistant = lazy(() => import('./components/AiHealthAssistant'));
const NeighborhoodMap = lazy(() => import('./components/NeighborhoodMap'));

const STORAGE_KEY_FAVORITES = 'urban_aqi_favorites_v1';

// Default initial location: Delhi, India (prominent urban reference; no auto geolocation prompt)
const DEFAULT_LOCATION: LocationItem = {
  id: 1273294,
  name: 'Delhi',
  latitude: 28.65195,
  longitude: 77.23149,
  country: 'India',
  countryCode: 'IN',
  admin1: 'National Capital Territory of Delhi',
  timezone: 'Asia/Kolkata',
  displayName: 'Delhi, NCT of Delhi, India'
};

export const App: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationItem>(() => {
    // Check URL parameters for shared location
    try {
      const params = new URLSearchParams(window.location.search);
      const lat = params.get('lat');
      const lon = params.get('lon');
      const name = params.get('name');
      if (lat && lon && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
        return {
          id: -99,
          name: name || 'Shared Location',
          latitude: Number(lat),
          longitude: Number(lon),
          country: '',
          countryCode: '',
          timezone: 'UTC',
          displayName: name || `Location (${Number(lat).toFixed(2)}°, ${Number(lon).toFixed(2)}°)`
        };
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_LOCATION;
  });

  const [activeStandard, setActiveStandard] = useState<'CPCB' | 'US_EPA'>('CPCB');
  const [airQuality, setAirQuality] = useState<AirQualityApiResponse | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Favorites state persisted in localStorage and synced with database
  const [favorites, setFavorites] = useState<LocationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load favorites from localStorage:', e);
    }
    return [];
  });

  // Sync bookmarks with backend DB on load
  useEffect(() => {
    fetch('/api/bookmarks')
      .then((res) => res.json())
      .then((data) => {
        if (data.bookmarks && Array.isArray(data.bookmarks)) {
          setFavorites((prev) => {
            const map = new Map<string, LocationItem>();
            prev.forEach((p) => map.set(`${p.latitude.toFixed(2)},${p.longitude.toFixed(2)}`, p));
            data.bookmarks.forEach((b: { id?: string | number; name: string; latitude: number; longitude: number; displayName?: string }) => {
              const key = `${Number(b.latitude).toFixed(2)},${Number(b.longitude).toFixed(2)}`;
              if (!map.has(key)) {
                map.set(key, {
                  id: typeof b.id === 'number' ? b.id : (b.id ? Number(b.id) : Date.now()),
                  name: b.name,
                  latitude: b.latitude,
                  longitude: b.longitude,
                  country: '',
                  countryCode: '',
                  timezone: 'UTC',
                  displayName: b.displayName || b.name
                });
              }
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch((err) => {
        console.warn('Backend bookmarks sync offline or unavailable:', err);
      });
  }, []);

  // Save favorites to localStorage and backend database
  const toggleFavorite = (loc: LocationItem) => {
    setFavorites((prev) => {
      const exists = prev.some(
        (f) => Math.abs(f.latitude - loc.latitude) < 0.001 && Math.abs(f.longitude - loc.longitude) < 0.001
      );
      const next = exists
        ? prev.filter((f) => !(Math.abs(f.latitude - loc.latitude) < 0.001 && Math.abs(f.longitude - loc.longitude) < 0.001))
        : [...prev, loc];

      try {
        localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save favorites to localStorage:', e);
      }

      // Sync with backend DB
      if (exists) {
        fetch(`/api/bookmarks/${loc.id}`, { method: 'DELETE' }).catch(() => {});
      } else {
        fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: loc.name,
            displayName: loc.displayName || loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude
          })
        }).catch(() => {});
      }

      return next;
    });
  };

  const isCurrentFavorite = favorites.some(
    (f) =>
      Math.abs(f.latitude - selectedLocation.latitude) < 0.001 &&
      Math.abs(f.longitude - selectedLocation.longitude) < 0.001
  );

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDataForLocation = useCallback(
    async (loc: LocationItem, standard: 'CPCB' | 'US_EPA') => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch Air Quality with active standard
        const aqiRes = await fetch(
          `/api/air-quality?lat=${loc.latitude}&lon=${loc.longitude}&standard=${standard}`
        );
        if (!aqiRes.ok) {
          const errJson = await aqiRes.json().catch(() => ({}));
          throw new Error(
            errJson.message || `Air Quality API responded with status ${aqiRes.status}`
          );
        }
        const aqiData: AirQualityApiResponse = await aqiRes.json();
        setAirQuality(aqiData);

        // 2. Fetch Weather context (graceful degradation if weather fails)
        try {
          const wxRes = await fetch(`/api/weather?lat=${loc.latitude}&lon=${loc.longitude}`);
          if (wxRes.ok) {
            const wxData: WeatherData = await wxRes.json();
            setWeather(wxData);
          } else {
            setWeather(null);
          }
        } catch (wxErr) {
          console.warn('[App] Weather fetch failed, continuing with AQI data:', wxErr);
          setWeather(null);
        }
      } catch (err: unknown) {
        console.error('[App] Failed to load data:', err);
        const errMessage = err instanceof Error ? err.message : 'An error occurred while fetching atmospheric data. Please check your connection.';
        setError(errMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDataForLocation(selectedLocation, activeStandard);
  }, [selectedLocation, activeStandard, loadDataForLocation]);

  const handleSelectLocation = (loc: LocationItem) => {
    setSelectedLocation(loc);
  };

  const handleStandardChange = (standard: 'CPCB' | 'US_EPA') => {
    setActiveStandard(standard);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {!isOnline && <OfflineNotice />}
      <Header activeStandard={activeStandard} onStandardChange={handleStandardChange} />

      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      >
        {/* Search & Location Bar */}
        <section aria-label="Location search and selection" className="space-y-2">
          <LocationSearch onSelectLocation={handleSelectLocation} isLoading={isLoading} />

          {/* Favorites Pills Bar */}
          {favorites.length > 0 && (
            <div className="flex items-center space-x-2 overflow-x-auto py-1 text-xs">
              <span className="text-slate-500 font-semibold flex items-center space-x-1 shrink-0">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Saved Cities:</span>
              </span>
              <div className="flex items-center space-x-1.5 flex-nowrap">
                {favorites.map((fav, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedLocation(fav)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                      Math.abs(fav.latitude - selectedLocation.latitude) < 0.001 &&
                      Math.abs(fav.longitude - selectedLocation.longitude) < 0.001
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {fav.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Error Banner */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => loadDataForLocation(selectedLocation, activeStandard)}
          />
        )}

        {/* Loading Skeletons */}
        {isLoading && <LoadingSkeleton />}

        {/* Main Content Area */}
        {!isLoading && !error && airQuality && (
          <div className="space-y-6">
            {/* Hero AQI Card */}
            <AqiHero
              data={airQuality}
              locationName={selectedLocation.displayName || selectedLocation.name}
              isFavorite={isCurrentFavorite}
              onToggleFavorite={() => toggleFavorite(selectedLocation)}
            />

            {/* Pollutant Sub-Indices Grid */}
            <PollutantGrid pollutants={airQuality.pollutants} />

            {/* Health Advisory & Exposure Reduction */}
            <HealthGuidance
              guidance={airQuality.healthGuidance}
              category={airQuality.category}
            />

            {/* Personalized AI Health Advisory Assistant */}
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl p-6 border border-slate-200 h-48 animate-pulse flex items-center justify-center text-slate-400 text-xs">
                  Loading AI health assistant...
                </div>
              }
            >
              <AiHealthAssistant
                aqi={airQuality.aqi}
                category={airQuality.category}
                dominantPollutant={airQuality.dominantPollutants[0] || 'PM2.5'}
              />
            </Suspense>

            {/* Historical Trends & Analytics (7-day / 30-day interactive analysis) */}
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl p-6 border border-slate-200 h-72 animate-pulse flex items-center justify-center text-slate-400 text-xs">
                  Loading historical trend models...
                </div>
              }
            >
              <HistoricalTrends
                latitude={selectedLocation.latitude}
                longitude={selectedLocation.longitude}
              />
            </Suspense>

            {/* Neighborhood Air Quality Heatmap & GIS Overlay */}
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl p-6 border border-slate-200 h-96 animate-pulse flex items-center justify-center text-slate-400 text-xs">
                  Loading neighborhood GIS heatmap...
                </div>
              }
            >
              <NeighborhoodMap
                latitude={selectedLocation.latitude}
                longitude={selectedLocation.longitude}
                cityName={selectedLocation.name}
                baseAqi={airQuality.aqi}
              />
            </Suspense>

            {/* Trends Chart & Forecast (Lazy-loaded with fallback) */}
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl p-8 border border-slate-200 h-72 animate-pulse flex items-center justify-center text-slate-400 text-xs">
                  Loading trajectory and forecast model...
                </div>
              }
            >
              <TrendsChart
                history={airQuality.trends.history}
                forecast={airQuality.trends.forecast}
                summary={airQuality.trends.summary}
              />
            </Suspense>

            {/* Meteorological Context (Weather) */}
            <WeatherContext weather={weather} />

            {/* Data Source, Transparency, and Attribution Footer Badge */}
            <DataAttribution
              source={airQuality.metadata.source}
              isModelEstimate={airQuality.metadata.isModelEstimate}
              dataNatureDisclosure={airQuality.metadata.dataNatureDisclosure}
              modelTime={airQuality.metadata.modelTime}
              fetchTime={airQuality.metadata.fetchTime}
              dataState={airQuality.metadata.dataState}
              cachedAgeSeconds={airQuality.metadata.cachedAgeSeconds}
            />
          </div>
        )}

        {!isLoading && !error && !airQuality && <EmptyState />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-600 text-center space-y-2 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>
            <strong>Urban Air Quality Assistant</strong> • India CPCB National Air Quality Index (NAQI) & US EPA AQI Standards.
          </p>
          <p>
            Atmospheric model data powered by{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline font-medium"
            >
              Open-Meteo
            </a>{' '}
            under CC BY 4.0 license. Not a physical ground monitoring station.
          </p>
          <p className="text-[11px] text-slate-600">
            Hack2Skill Prompt Wars, Challenge 6 Submission.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
