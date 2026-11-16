import React from 'react';
import { Info, ExternalLink } from 'lucide-react';
import { StateBadge } from './StateBadge';
import { DataStateBadge } from '../types';

interface DataAttributionProps {
  source: string;
  isModelEstimate: boolean;
  dataNatureDisclosure: string;
  modelTime: string;
  fetchTime: string;
  dataState: DataStateBadge;
  cachedAgeSeconds?: number;
}

export const DataAttribution: React.FC<DataAttributionProps> = ({
  source,
  isModelEstimate,
  dataNatureDisclosure,
  modelTime,
  fetchTime,
  dataState,
  cachedAgeSeconds
}) => {
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
        ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
      <div className="flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            {isModelEstimate ? 'Atmospheric Model Grid Estimate (Not a Ground Station Sensor)' : source}
          </p>
          <p className="text-slate-500 leading-relaxed">
            {dataNatureDisclosure} Data provided under CC BY 4.0 by{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium underline inline-flex items-center space-x-0.5"
            >
              <span>Open-Meteo</span>
              <ExternalLink className="w-3 h-3 ml-0.5" aria-hidden="true" />
            </a>.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 pt-0.5">
            <span>Model Time: <strong>{formatTime(modelTime)}</strong></span>
            <span>Retrieved: <strong>{formatTime(fetchTime)}</strong></span>
          </div>
        </div>
      </div>

      <div className="shrink-0 self-start md:self-center">
        <StateBadge state={dataState} ageSeconds={cachedAgeSeconds} />
      </div>
    </div>
  );
};
