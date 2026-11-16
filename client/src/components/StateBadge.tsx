import React from 'react';
import { DataStateBadge } from '../types';
import { Radio, Database, CloudSun, HelpCircle, AlertTriangle } from 'lucide-react';

interface StateBadgeProps {
  state: DataStateBadge;
  ageSeconds?: number;
}

export const StateBadge: React.FC<StateBadgeProps> = ({ state, ageSeconds }) => {
  const formatAge = (sec?: number) => {
    if (!sec || sec < 60) return `${sec || 0}s ago`;
    const mins = Math.floor(sec / 60);
    return `${mins}m ago`;
  };

  switch (state) {
    case 'Live':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
          <Radio className="w-3 h-3" aria-hidden="true" />
          <span>Live Data</span>
        </span>
      );

    case 'Cached':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
          <Database className="w-3 h-3 text-amber-700" aria-hidden="true" />
          <span>Cached ({formatAge(ageSeconds)})</span>
        </span>
      );

    case 'Forecast':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
          <CloudSun className="w-3 h-3 text-sky-600" aria-hidden="true" />
          <span>Forecast Model</span>
        </span>
      );

    case 'Estimated':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
          <HelpCircle className="w-3 h-3 text-purple-600" aria-hidden="true" />
          <span>Estimated</span>
        </span>
      );

    case 'Unavailable':
    default:
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <AlertTriangle className="w-3 h-3 text-slate-500" aria-hidden="true" />
          <span>Unavailable</span>
        </span>
      );
  }
};
