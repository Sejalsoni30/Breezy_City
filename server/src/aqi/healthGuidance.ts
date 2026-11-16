import { AqiCategory } from './cpcbBreakpoints.js';

export interface HealthGuidance {
  general: string;
  sensitiveGroups: {
    children: string;
    elderly: string;
    respiratory: string;
    heart: string;
  };
  exposureReductionTips: string[];
  disclaimer: string;
}

export const MEDICAL_DISCLAIMER =
  'Informational only, not medical advice. Health guidance is derived from official Central Pollution Control Board (CPCB) advisories. Consult qualified healthcare professionals for individual clinical decisions.';

/**
 * Deterministic, rule-based health guidance according to official CPCB NAQI guidelines.
 */
export function getHealthGuidance(category: AqiCategory | null): HealthGuidance {
  if (!category) {
    return {
      general: 'Air quality data is currently insufficient to determine health impact.',
      sensitiveGroups: {
        children: 'No specific guidance available.',
        elderly: 'No specific guidance available.',
        respiratory: 'No specific guidance available.',
        heart: 'No specific guidance available.'
      },
      exposureReductionTips: [
        'Check back once monitoring data is restored.',
        'Follow local municipal environmental bulletins.'
      ],
      disclaimer: MEDICAL_DISCLAIMER
    };
  }

  switch (category) {
    case 'Good':
      return {
        general: 'Air quality is satisfactory and poses minimal or no health hazard.',
        sensitiveGroups: {
          children: 'Safe for all normal outdoor play and school activities.',
          elderly: 'Ideal air quality for outdoor walking and exercise.',
          respiratory: 'No special precautions required.',
          heart: 'Safe for normal outdoor exertion.'
        },
        exposureReductionTips: [
          'Enjoy outdoor activities and natural ventilation.',
          'Open windows to refresh indoor air.'
        ],
        disclaimer: MEDICAL_DISCLAIMER
      };

    case 'Satisfactory':
      return {
        general: 'Air quality is acceptable; minor breathing discomfort may occur in unusually sensitive people.',
        sensitiveGroups: {
          children: 'Safe for outdoor recreation; monitor for coughing if prone to allergies.',
          elderly: 'Generally safe; take breaks if feeling unusual fatigue.',
          respiratory: 'People with severe asthma or COPD should carry quick-relief inhalers.',
          heart: 'Maintain regular activity; monitor for chest discomfort during intense workouts.'
        },
        exposureReductionTips: [
          'Sensitive individuals should take more breaks during prolonged outdoor exertion.',
          'Keep indoor living spaces clean and well-ventilated.'
        ],
        disclaimer: MEDICAL_DISCLAIMER
      };

    case 'Moderate':
      return {
        general: 'May cause breathing discomfort to people with lung disease, asthma, and heart conditions.',
        sensitiveGroups: {
          children: 'Reduce prolonged or intense outdoor sports and running.',
          elderly: 'Limit heavy physical outdoor exertion; prefer brisk walks during lower-traffic hours.',
          respiratory: 'Individuals with asthma should strictly keep prescribed medication handy.',
          heart: 'Avoid strenuous outdoor workouts that elevate heart rate significantly.'
        },
        exposureReductionTips: [
          'Schedule intense physical exertion during early morning or late evening when pollution is lower.',
          'Keep windows closed during peak traffic hours.',
          'Sensitive individuals should consider wearing a fitted particulate respirator (e.g. N95) near roadways.'
        ],
        disclaimer: MEDICAL_DISCLAIMER
      };

    case 'Poor':
      return {
        general: 'Causes breathing discomfort to most people on prolonged outdoor exposure.',
        sensitiveGroups: {
          children: 'Avoid prolonged outdoor play and sports; move activities indoors.',
          elderly: 'Stay indoors as much as possible; avoid morning/evening outdoor walks.',
          respiratory: 'High risk of asthma attacks or shortness of breath. Stay in air-filtered spaces.',
          heart: 'Avoid all heavy outdoor labor and strenuous aerobic exercise.'
        },
        exposureReductionTips: [
          'Wear a certified N95 or FFP2 mask when stepping outside.',
          'Run indoor air purifiers equipped with HEPA filtration if available.',
          'Avoid burning candles, incense, or outdoor biomass.',
          'Keep vehicle windows rolled up and set AC to internal air recirculation.'
        ],
        disclaimer: MEDICAL_DISCLAIMER
      };

    case 'Very Poor':
      return {
        general: 'May cause respiratory illness on prolonged exposure. Significant hazard to all residents.',
        sensitiveGroups: {
          children: 'Children must strictly remain indoors and refrain from strenuous physical play.',
          elderly: 'Stay indoors with closed doors and windows; monitor vital signs if chronically ill.',
          respiratory: 'Severe risk of acute respiratory exacerbation. Keep emergency medications accessible.',
          heart: 'Elevated risk of cardiovascular strain. Rest and avoid physical exertion.'
        },
        exposureReductionTips: [
          'Avoid all non-essential outdoor travel and activities.',
          'Wear a tightly fitted N95 respirator if stepping outdoors is unavoidable.',
          'Seal window cracks and run HEPA air purifiers continuously indoors.',
          'Do not smoke, fry food in unventilated rooms, or vacuum without HEPA filters.'
        ],
        disclaimer: MEDICAL_DISCLAIMER
      };

    case 'Severe':
      return {
        general: 'Emergency conditions: seriously impacts healthy individuals and endangers those with existing medical conditions.',
        sensitiveGroups: {
          children: 'Strictly avoid all outdoor exposure. Schools are advised to suspend outdoor sessions.',
          elderly: 'Remain indoors in a sealed room with active air filtration; seek medical care if symptoms worsen.',
          respiratory: 'Extreme health danger. Use prescribed nebulizers or inhalers as directed by physician.',
          heart: 'Avoid any physical stress; emergency consultation recommended if chest pain or distress occurs.'
        },
        exposureReductionTips: [
          'Stay completely indoors with windows and doors securely closed.',
          'Continuous use of HEPA air purifiers inside living spaces is strongly recommended.',
          'Do not perform any outdoor exercise or walking.',
          'Wear a high-efficiency N95/N99 respirator if emergency outdoor transit is mandatory.',
          'Follow municipal disaster management and public health alerts.'
        ],
        disclaimer: MEDICAL_DISCLAIMER
      };
  }
}
