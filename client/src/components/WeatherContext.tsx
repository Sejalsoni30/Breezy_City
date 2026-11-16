import React from 'react';
import { WeatherData } from '../types';
import { Thermometer, Droplets, Wind, Compass, CloudSun, AlertCircle } from 'lucide-react';

interface WeatherContextProps {
  weather: WeatherData | null;
}

export const WeatherContext: React.FC<WeatherContextProps> = ({ weather }) => {
  if (!weather) {
    return null;
  }

  const getWindDirectionLabel = (deg: number | null) => {
    if (deg === null || deg === undefined) return 'N/A';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return `${directions[idx]} (${deg}°)`;
  };

  return (
    <section aria-labelledby="weather-heading" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 id="weather-heading" className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CloudSun className="w-5 h-5 text-sky-600" aria-hidden="true" />
            <span>Meteorological Context</span>
          </h2>
          <p className="text-xs text-slate-500">
            Atmospheric conditions influencing dispersion (strictly contextual; no causal claims)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperature */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold mb-2">
            <Thermometer className="w-4 h-4 text-rose-500" aria-hidden="true" />
            <span>Temperature</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {weather.temperature !== null ? `${weather.temperature}${weather.temperatureUnit}` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 capitalize">{weather.weatherDescription}</p>
        </div>

        {/* Humidity */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold mb-2">
            <Droplets className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <span>Relative Humidity</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {weather.humidity !== null ? `${weather.humidity}${weather.humidityUnit}` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Water vapor saturation</p>
        </div>

        {/* Wind Speed */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold mb-2">
            <Wind className="w-4 h-4 text-teal-500" aria-hidden="true" />
            <span>Wind Speed (10m)</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {weather.windSpeed !== null ? `${weather.windSpeed} ${weather.windSpeedUnit}` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Surface ventilation factor</p>
        </div>

        {/* Wind Direction */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold mb-2">
            <Compass className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <span>Wind Direction</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 truncate">
            {getWindDirectionLabel(weather.windDirection)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Dispersion vector</p>
        </div>
      </div>

      <div className="pt-2 flex items-center space-x-1.5 text-[11px] text-slate-500 italic">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
        <span>Weather data is displayed strictly for ambient environmental context. Weather and AQI correlation does not imply direct causality.</span>
      </div>
    </section>
  );
};
