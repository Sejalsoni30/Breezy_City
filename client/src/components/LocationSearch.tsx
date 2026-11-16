import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { LocationItem } from '../types';

interface LocationSearchProps {
  onSelectLocation: (loc: LocationItem) => void;
  isLoading: boolean;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onSelectLocation,
  isLoading: isExternalLoading
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic with request cancellation
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setNoResults(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setGeoError(null);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }

        const data = await response.json();
        const locations: LocationItem[] = data.results || [];
        setResults(locations);
        setIsOpen(true);
        setNoResults(locations.length === 0);
        setHighlightedIndex(-1);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[Search] Geocode error:', err);
          setResults([]);
          setNoResults(true);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          selectItem(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectItem = (item: LocationItem) => {
    setQuery(item.displayName);
    setIsOpen(false);
    setResults([]);
    onSelectLocation(item);
  };

  // Browser Geolocation handler
  const handleUseMyLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoError(null);
    setIsGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGeoLoading(false);
        // Round coordinates to 3 decimal places (~110m) for privacy & caching
        const rawLat = position.coords.latitude;
        const rawLon = position.coords.longitude;
        const lat = Math.round(rawLat * 1000) / 1000;
        const lon = Math.round(rawLon * 1000) / 1000;

        const myLocationItem: LocationItem = {
          id: -1,
          name: 'My Current Location',
          latitude: lat,
          longitude: lon,
          country: '',
          countryCode: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          displayName: `My Location (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`
        };

        setQuery(myLocationItem.displayName);
        onSelectLocation(myLocationItem);
      },
      (error) => {
        setIsGeoLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission denied. Please search for your city by name.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location information is unavailable. Please search by city name.');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out. Please try again or search by name.');
            break;
          default:
            setGeoError('An unknown error occurred while requesting location.');
            break;
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  }, [onSelectLocation]);

  return (
    <div className="w-full space-y-2" ref={searchContainerRef}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Input container */}
        <div className="relative flex-1">
          <label htmlFor="location-search-input" className="sr-only">
            Search for a city or urban area
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
            ) : (
              <Search className="w-4 h-4" aria-hidden="true" />
            )}
          </div>
          <input
            ref={inputRef}
            id="location-search-input"
            role="combobox"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Search city (e.g. Delhi, Mumbai, Bengaluru, London)..."
            aria-autocomplete="list"
            aria-controls="location-results-list"
            aria-expanded={isOpen}
            aria-activedescendant={
              highlightedIndex >= 0 ? `location-option-${highlightedIndex}` : undefined
            }
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <ul
              id="location-results-list"
              role="listbox"
              className="absolute z-40 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto divide-y divide-slate-100 focus:outline-none"
            >
              {results.map((item, index) => {
                const isSelected = highlightedIndex === index;
                return (
                  <li
                    key={item.id || `${item.latitude}-${item.longitude}-${index}`}
                    id={`location-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-3 flex items-start space-x-3 cursor-pointer text-xs transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                      <p className="text-slate-500 mt-0.5">{item.displayName}</p>
                    </div>
                  </li>
                );
              })}

              {noResults && (
                <li className="px-4 py-4 text-center text-xs text-slate-500">
                  No matching cities or urban locations found.
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Use My Location Button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isGeoLoading || isExternalLoading}
          aria-label="Use My Location via browser geolocation"
          className="inline-flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 shrink-0"
        >
          {isGeoLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
          ) : (
            <Navigation className="w-4 h-4 text-blue-600" aria-hidden="true" />
          )}
          <span>Use My Location</span>
        </button>
      </div>

      {/* Geolocation feedback error banner */}
      {geoError && (
        <div
          role="alert"
          className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span>{geoError}</span>
        </div>
      )}
    </div>
  );
};
