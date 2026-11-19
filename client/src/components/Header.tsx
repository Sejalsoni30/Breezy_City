import React from 'react';
import { Wind, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeStandard: 'CPCB' | 'US_EPA';
  onStandardChange: (standard: 'CPCB' | 'US_EPA') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeStandard, onStandardChange }) => {
  return (
    <header
      className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm"
      role="banner"
    >
      {/* Skip to main content link for keyboard users (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Wind className="w-4 h-4 sm:w-6 sm:h-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm xs:text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
              Urban Air Quality Assistant
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Hack2Skill Prompt Wars • Challenge 6
            </p>
          </div>
        </div>

        {/* Standard Switch Toggle (CPCB vs US EPA) */}
        <div className="flex items-center shrink-0">
          <label htmlFor="standard-select" className="sr-only">
            Select Air Quality Index Standard
          </label>
          <div className="flex items-center space-x-1 sm:space-x-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 min-h-[36px] sm:min-h-[40px]">
            <ShieldCheck
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0"
              aria-hidden="true"
            />
            <span className="hidden md:inline font-semibold">Standard:</span>
            <select
              id="standard-select"
              value={activeStandard}
              onChange={(e) => onStandardChange(e.target.value as 'CPCB' | 'US_EPA')}
              className="bg-transparent font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded cursor-pointer text-xs"
            >
              <option value="CPCB">India CPCB (NAQI)</option>
              <option value="US_EPA">US EPA (2024 Revised)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
