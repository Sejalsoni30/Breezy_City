import React, { useState } from 'react';
import { AirQualityApiResponse } from '../types';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Sparkles,
  Star,
  Share2,
  Check
} from 'lucide-react';

interface AqiHeroProps {
  data: AirQualityApiResponse;
  locationName: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const AqiHero: React.FC<AqiHeroProps> = ({
  data,
  locationName,
  isFavorite = false,
  onToggleFavorite
}) => {
  const { aqi, category, categoryInfo, dominantPollutants, standardName } = data;
  const [isCopied, setIsCopied] = useState(false);

  const getCategoryTheme = (cat?: string | null) => {
    switch (cat) {
      case 'Good':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-green-700" aria-hidden="true" />,
          cardBorder: 'border-green-300',
          badgeBg: 'bg-green-100',
          badgeText: 'text-green-800',
          badgeBorder: 'border-green-300',
          numColor: 'text-green-700',
          levelLabel: 'Good (0 - 50)'
        };
      case 'Satisfactory':
      case 'Moderate':
        return {
          icon: <Sparkles className="w-6 h-6 text-lime-700" aria-hidden="true" />,
          cardBorder: 'border-lime-300',
          badgeBg: 'bg-lime-100',
          badgeText: 'text-lime-800',
          badgeBorder: 'border-lime-300',
          numColor: 'text-lime-700',
          levelLabel: `${cat} (51 - 100)`
        };
      case 'Unhealthy for Sensitive Groups':
        return {
          icon: <AlertCircle className="w-6 h-6 text-amber-700" aria-hidden="true" />,
          cardBorder: 'border-amber-300',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-800',
          badgeBorder: 'border-amber-300',
          numColor: 'text-amber-700',
          levelLabel: 'Unhealthy for Sensitive Groups (101 - 150)'
        };
      case 'Poor':
      case 'Unhealthy':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-orange-700" aria-hidden="true" />,
          cardBorder: 'border-orange-300',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-800',
          badgeBorder: 'border-orange-300',
          numColor: 'text-orange-700',
          levelLabel: `${cat} (151 - 200)`
        };
      case 'Very Poor':
      case 'Very Unhealthy':
        return {
          icon: <Flame className="w-6 h-6 text-red-700" aria-hidden="true" />,
          cardBorder: 'border-red-300',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-800',
          badgeBorder: 'border-red-300',
          numColor: 'text-red-700',
          levelLabel: `${cat} (201 - 300)`
        };
      case 'Severe':
      case 'Hazardous':
      default:
        return {
          icon: <ShieldAlert className="w-6 h-6 text-rose-900" aria-hidden="true" />,
          cardBorder: 'border-rose-400',
          badgeBg: 'bg-rose-100',
          badgeText: 'text-rose-900',
          badgeBorder: 'border-rose-300',
          numColor: 'text-rose-900',
          levelLabel: `${cat || 'Severe'} (301 - 500+)`
        };
    }
  };

  const theme = getCategoryTheme(category);

  const formatPollutantName = (name: string) => {
    switch (name) {
      case 'pm2_5':
        return 'PM2.5';
      case 'pm10':
        return 'PM10';
      case 'nitrogen_dioxide':
        return 'NO₂';
      case 'ozone':
        return 'O₃';
      case 'carbon_monoxide':
        return 'CO';
      case 'sulphur_dioxide':
        return 'SO₂';
      default:
        return name;
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?lat=${data.location.latitude}&lon=${data.location.longitude}&name=${encodeURIComponent(locationName)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Air Quality for ${locationName}`,
          text: `Current AQI for ${locationName} is ${aqi} (${category}).`,
          url: shareUrl
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  return (
    <article
      className={`bg-white rounded-2xl p-6 sm:p-8 shadow-sm border ${theme.cardBorder} transition-all duration-200`}
      aria-label={`Air Quality Index for ${locationName}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Location & Primary Indicator */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider uppercase text-slate-500">
            <span>{standardName}</span>
            <span>•</span>
            <span className="text-blue-600 font-bold">Mathematical Model Index</span>
          </div>

          <div className="flex items-center space-x-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {locationName}
            </h2>

            {onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                aria-label={
                  isFavorite ? 'Remove from favorite locations' : 'Add to favorite locations'
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              >
                <Star
                  className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share location link"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors inline-flex items-center space-x-1"
            >
              {isCopied ? (
                <Check className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              ) : (
                <Share2 className="w-5 h-5 text-slate-400" aria-hidden="true" />
              )}
            </button>
            {isCopied && (
              <span className="text-xs text-emerald-700 font-semibold">Link copied!</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
              role="status"
            >
              {theme.icon}
              <span>{category || 'Unknown Category'}</span>
            </div>

            <span className="text-xs text-slate-600 font-medium">
              Category Bracket: <strong>{theme.levelLabel}</strong>
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed max-w-xl">
            {categoryInfo?.description || 'Air quality data is currently being monitored.'}
          </p>

          {dominantPollutants && dominantPollutants.length > 0 && (
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 inline-block px-3 py-1.5 rounded-lg">
              Primary Dominant Pollutant:{' '}
              <strong className="text-slate-900 font-semibold">
                {dominantPollutants.map(formatPollutantName).join(', ')}
              </strong>
            </div>
          )}
        </div>

        {/* Right: Prominent AQI Dial / Number Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 min-w-[200px] text-center shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            {data.standard === 'US_EPA' ? 'US EPA AQI' : 'CPCB NAQI'}
          </span>
          <div className={`text-6xl sm:text-7xl font-extrabold tracking-tighter ${theme.numColor}`}>
            {aqi !== null ? aqi : '--'}
          </div>
          <span className="text-xs font-semibold text-slate-600 mt-2">Scale: 0 to 500</span>
        </div>
      </div>
    </article>
  );
};
