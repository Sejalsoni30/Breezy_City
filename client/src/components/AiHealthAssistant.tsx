import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, HeartPulse, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

interface AiHealthAssistantProps {
  aqi: number | null;
  category: string | null;
  dominantPollutant: string;
}

type UserProfile = 'general' | 'asthma' | 'elderly' | 'child' | 'athlete';

interface AdvisoryState {
  source: string;
  advice: string;
  recommendations: string[];
  disclaimer: string;
  isAIGenerated: boolean;
}

const PROFILES: { id: UserProfile; label: string; description: string }[] = [
  { id: 'general', label: 'General Public', description: 'Standard healthy adults' },
  { id: 'asthma', label: 'Asthma / Respiratory', description: 'Airway hyperresponsiveness' },
  { id: 'elderly', label: 'Elderly (65+)', description: 'Cardiopulmonary sensitivity' },
  { id: 'child', label: 'Children', description: 'Developing pediatric airways' },
  { id: 'athlete', label: 'Athletes & Runners', description: 'High-ventilation exertion' }
];

export const AiHealthAssistant: React.FC<AiHealthAssistantProps> = ({
  aqi,
  category,
  dominantPollutant
}) => {
  const [selectedProfile, setSelectedProfile] = useState<UserProfile>('general');
  const [advisory, setAdvisory] = useState<AdvisoryState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvisory = async (profile: UserProfile) => {
    if (aqi == null || !category) {
      setAdvisory(null);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aqi,
          category,
          dominantPollutant,
          userProfile: profile
        })
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve personalized health advisory');
      }

      const data: AdvisoryState = await response.json();
      setAdvisory(data);
    } catch (err: any) {
      console.error('[AiHealthAssistant] Error fetching advisory:', err);
      setError('Unable to load AI advisory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisory(selectedProfile);
  }, [aqi, category, dominantPollutant, selectedProfile]);

  return (
    <section
      aria-labelledby="ai-advisory-title"
      className="bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/60 rounded-2xl border border-indigo-100 shadow-sm p-5 sm:p-6 space-y-5"
    >
      {/* Title & Engine Source Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="ai-advisory-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Personalized AI Health Advisory</span>
              <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            </h2>
            <p className="text-xs text-slate-600">
              Personalized precautions tuned to your health profile and live ambient air quality
            </p>
          </div>
        </div>

        {advisory && (
          <div className="flex items-center self-start sm:self-center">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-1.5 animate-pulse" aria-hidden="true" />
              {advisory.source}
            </span>
          </div>
        )}
      </div>

      {/* Sensitive Profile Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
          <HeartPulse className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
          <span>Select Individual Profile:</span>
        </label>
        <div
          role="group"
          aria-label="Health profile selection"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
        >
          {PROFILES.map((p) => {
            const isSelected = selectedProfile === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProfile(p.id)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
                aria-pressed={isSelected}
              >
                <span className="text-xs font-bold leading-tight">{p.label}</span>
                <span
                  className={`text-[10px] mt-0.5 leading-snug line-clamp-1 ${
                    isSelected ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  {p.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advisory Content */}
      {isLoading ? (
        <div className="bg-white/80 rounded-xl p-6 border border-indigo-50 flex items-center justify-center space-x-2 text-indigo-600 text-xs animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Analyzing environmental impact and formulating medical precautions...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchAdvisory(selectedProfile)}
            className="underline font-bold hover:text-red-900 focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
          >
            Retry
          </button>
        </div>
      ) : advisory ? (
        <div className="space-y-4">
          {/* Main Assessment */}
          <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Exposure Assessment
            </h3>
            <p className="text-sm font-medium text-slate-900 leading-relaxed">
              {advisory.advice}
            </p>
          </div>

          {/* Targeted Action Points */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recommended Protective Measures
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {advisory.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex items-start space-x-2.5"
                >
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="text-xs text-slate-800 leading-relaxed font-medium">
                    {rec}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Disclaimer Callout */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
              <strong>Clinical Guardrail:</strong> {advisory.disclaimer}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default AiHealthAssistant;
