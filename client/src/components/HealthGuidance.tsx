import React, { useState } from 'react';
import {
  HeartPulse,
  Baby,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  CheckSquare,
  AlertOctagon
} from 'lucide-react';

interface HealthGuidanceProps {
  guidance: {
    general: string;
    sensitiveGroups: {
      children: string;
      elderly: string;
      respiratory: string;
      heart: string;
    };
    exposureReductionTips: string[];
    disclaimer: string;
  };
  category: string | null;
}

export const HealthGuidance: React.FC<HealthGuidanceProps> = ({ guidance, category }) => {
  const [activeTab, setActiveTab] = useState<
    'general' | 'children' | 'elderly' | 'respiratory' | 'heart'
  >('general');

  const tabs = [
    { id: 'general', label: 'General Public', icon: HeartPulse },
    { id: 'children', label: 'Children & Youth', icon: Baby },
    { id: 'elderly', label: 'Older Adults', icon: UserCheck },
    { id: 'respiratory', label: 'Asthma & Lungs', icon: Stethoscope },
    { id: 'heart', label: 'Heart & Cardio', icon: ShieldCheck }
  ] as const;

  const getAdviceForTab = () => {
    switch (activeTab) {
      case 'children':
        return guidance.sensitiveGroups.children;
      case 'elderly':
        return guidance.sensitiveGroups.elderly;
      case 'respiratory':
        return guidance.sensitiveGroups.respiratory;
      case 'heart':
        return guidance.sensitiveGroups.heart;
      case 'general':
      default:
        return guidance.general;
    }
  };

  return (
    <section
      aria-labelledby="health-advisory-heading"
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2
            id="health-advisory-heading"
            className="text-xl font-bold text-slate-900 flex items-center space-x-2"
          >
            <HeartPulse className="w-5 h-5 text-rose-600" aria-hidden="true" />
            <span>Health Advisory & Exposure Reduction</span>
          </h2>
          <p className="text-xs text-slate-500">
            Official India CPCB health impact recommendations for{' '}
            <strong>{category || 'Current'}</strong> air conditions
          </p>
        </div>
      </div>

      {/* Group Navigation Tabs */}
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Health guidance for sensitive groups"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Advisory Content Panel */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="bg-blue-50/60 rounded-xl p-5 border border-blue-100 text-slate-800"
      >
        <h3 className="text-sm font-bold text-blue-900 mb-1">
          {tabs.find((t) => t.id === activeTab)?.label} Advisory
        </h3>
        <p className="text-sm leading-relaxed text-slate-700">{getAdviceForTab()}</p>
      </div>

      {/* Practical Exposure Reduction Checklist */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
          <CheckSquare className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <span>Recommended Practical Actions</span>
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700">
          {guidance.exposureReductionTips.map((tip, idx) => (
            <li
              key={idx}
              className="flex items-start space-x-2 bg-slate-50 border border-slate-200/80 rounded-lg p-3"
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"
                aria-hidden="true"
              />
              <span className="leading-normal">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Medical Disclaimer */}
      <div className="pt-4 border-t border-slate-100 flex items-start space-x-2 text-[11px] text-slate-500">
        <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong>Mandatory Notice:</strong> {guidance.disclaimer}
        </p>
      </div>
    </section>
  );
};
