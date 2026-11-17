import React from 'react';
import { PollutantDetail } from '../types';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface PollutantGridProps {
  pollutants: Record<string, PollutantDetail>;
}

interface PollutantMeta {
  key: string;
  name: string;
  chemicalFormula: string;
  averagingPeriod: string;
  sourceDesc: string;
}

const POLLUTANT_METAS: PollutantMeta[] = [
  {
    key: 'pm2_5',
    name: 'Particulate Matter 2.5',
    chemicalFormula: 'PM₂.₅',
    averagingPeriod: '24-hour average',
    sourceDesc:
      'Fine inhalable particles from vehicles, biomass burning, and industrial combustion.'
  },
  {
    key: 'pm10',
    name: 'Particulate Matter 10',
    chemicalFormula: 'PM₁₀',
    averagingPeriod: '24-hour average',
    sourceDesc: 'Coarse dust, construction debris, road dust, and mechanical abrasion.'
  },
  {
    key: 'nitrogen_dioxide',
    name: 'Nitrogen Dioxide',
    chemicalFormula: 'NO₂',
    averagingPeriod: '24-hour average',
    sourceDesc: 'Produced primarily from vehicular engines and thermal power generation.'
  },
  {
    key: 'ozone',
    name: 'Ground-level Ozone',
    chemicalFormula: 'O₃',
    averagingPeriod: '8-hour average',
    sourceDesc: 'Secondary pollutant formed by sunlight reacting with NOx and VOCs.'
  },
  {
    key: 'carbon_monoxide',
    name: 'Carbon Monoxide',
    chemicalFormula: 'CO',
    averagingPeriod: '8-hour average',
    sourceDesc: 'Colorless, odorless gas emitted by incomplete fuel combustion.'
  },
  {
    key: 'sulphur_dioxide',
    name: 'Sulphur Dioxide',
    chemicalFormula: 'SO₂',
    averagingPeriod: '24-hour average',
    sourceDesc: 'Emitted by fossil fuel combustion at industrial facilities and refineries.'
  }
];

export const PollutantGrid: React.FC<PollutantGridProps> = ({ pollutants }) => {
  const getCategoryBadgeClass = (category?: string | null) => {
    switch (category) {
      case 'Good':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Satisfactory':
        return 'bg-lime-100 text-lime-800 border-lime-300';
      case 'Moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Poor':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Very Poor':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Severe':
        return 'bg-rose-900 text-rose-100 border-rose-950';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <section aria-labelledby="pollutants-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="pollutants-heading" className="text-xl font-bold text-slate-900">
            Individual Pollutant Sub-Indices
          </h2>
          <p className="text-xs text-slate-500">
            Calculated individually using CPCB breakpoints and concentration averages
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {POLLUTANT_METAS.map((meta) => {
          const detail = pollutants[meta.key];
          const isAvailable = detail && detail.isAvailable && detail.subIndex !== null;

          return (
            <div
              key={meta.key}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {meta.name}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center space-x-1">
                      <span>{meta.chemicalFormula}</span>
                    </h3>
                  </div>

                  {isAvailable ? (
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(
                        detail.category
                      )}`}
                    >
                      <CheckCircle className="w-3 h-3" aria-hidden="true" />
                      <span>{detail.category}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <HelpCircle className="w-3 h-3" aria-hidden="true" />
                      <span>Unavailable</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline space-x-2">
                  {isAvailable ? (
                    <>
                      <span className="text-3xl font-extrabold text-slate-900">
                        {detail.calculatedValue ?? detail.raw}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{detail.unit}</span>
                    </>
                  ) : (
                    <span className="text-lg font-medium text-slate-400">No data monitored</span>
                  )}
                </div>

                <div className="mt-2 text-xs text-slate-600">
                  {isAvailable ? (
                    <span>
                      Sub-Index:{' '}
                      <strong className="text-slate-900 font-semibold">{detail.subIndex}</strong> /
                      500
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center space-x-1">
                      <AlertCircle
                        className="w-3.5 h-3.5 text-amber-600 inline"
                        aria-hidden="true"
                      />
                      <span>Excluded from overall index</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                <p className="italic font-medium">{meta.averagingPeriod}</p>
                <p className="mt-0.5 text-slate-600 truncate" title={meta.sourceDesc}>
                  {meta.sourceDesc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
