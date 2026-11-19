import React from 'react';
import { AlertTriangle, WifiOff, RefreshCw, Search } from 'lucide-react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-4 sm:space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Loading air quality data"
    >
      {/* Hero skeleton */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-8 bg-slate-200 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
        <div className="h-28 w-28 sm:h-32 sm:w-32 bg-slate-200 rounded-2xl self-center shrink-0"></div>
      </div>

      {/* Grid skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6 text-red-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-bold">Unable to Load Air Quality Data</h3>
          <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shrink-0 min-h-[44px]"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export const OfflineNotice: React.FC = () => {
  return (
    <div
      role="status"
      className="bg-amber-500 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center space-x-2"
    >
      <WifiOff className="w-4 h-4" aria-hidden="true" />
      <span>You are currently offline. Showing cached or fallback data. Live updates paused.</span>
    </div>
  );
};

export const EmptyState: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto my-8">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
        <Search className="w-8 h-8" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Find Air Quality for Any City</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Search for your city above (e.g., Delhi, Mumbai, Bengaluru, London, New York) or use your
        current location to inspect live atmospheric model readings, CPCB NAQI calculations, and
        health guidance.
      </p>
    </div>
  );
};
