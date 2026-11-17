/**
 * AI Health Advisory Service (Google Gemini / Guardrailed Fallback)
 *
 * Complies with brief Section 5.3:
 * - Server-side API key handling
 * - Strict informational guardrails (never diagnose, prescribe, or fabricate health claims)
 * - Clear disclaimer
 */

export interface AiAdvisoryResponse {
  source: string;
  advice: string;
  recommendations: string[];
  disclaimer: string;
  isAIGenerated: boolean;
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export async function generateAiHealthAdvisory(
  aqi: number,
  category: string,
  dominantPollutant: string,
  userProfile: 'general' | 'asthma' | 'elderly' | 'child' | 'athlete'
): Promise<AiAdvisoryResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  const disclaimer =
    'Informational guidance only, not medical advice. Generated based on established ambient exposure science. Consult qualified healthcare professionals for clinical diagnosis or prescription.';

  // If Gemini API Key is configured, execute remote generation
  if (apiKey) {
    try {
      const prompt = `You are a certified air quality health information assistant specializing in India CPCB standards.
Current Ambient Conditions:
- AQI: ${aqi} (${category})
- Primary Dominant Pollutant: ${dominantPollutant}
- Sensitive Group Profile: ${userProfile}

Provide advice for this person in valid JSON format with keys:
"advice": a 1-sentence summary (max 25 words).
"recommendations": an array of 3 bullet action points (max 15 words each).
RULES:
1. Do not diagnose or prescribe medicine.
2. Rely strictly on ambient particulate (PM2.5/PM10) and gas exposure science.
Respond ONLY with raw JSON.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(6000)
        }
      );

      if (response.ok) {
        const json = (await response.json()) as GeminiApiResponse;
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleaned = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.advice && Array.isArray(parsed.recommendations)) {
            return {
              source: 'Google Gemini 1.5 Flash (Generative AI)',
              advice: parsed.advice,
              recommendations: parsed.recommendations,
              disclaimer,
              isAIGenerated: true
            };
          }
        }
      }
    } catch (err) {
      console.warn(
        '[AI Service] Gemini call failed or key absent, falling back to deterministic advice:',
        err
      );
    }
  }

  // Deterministic, scientifically grounded fallback advice
  const adviceMap: Record<string, Record<string, { advice: string; recommendations: string[] }>> = {
    general: {
      Good: {
        advice:
          'Air quality is optimal. Outdoor activities and natural ventilation are safe and encouraged.',
        recommendations: [
          'Enjoy outdoor sports and workouts without concern.',
          'Open windows to ventilate living and workspaces.',
          'Maintain regular daily routines freely.'
        ]
      },
      Satisfactory: {
        advice: 'Air quality is acceptable with minor pollutants present.',
        recommendations: [
          'Normal outdoor recreation can proceed.',
          'Sensitive individuals may choose parks over highway shoulders.',
          'Keep hydration regular during active travel.'
        ]
      },
      Moderate: {
        advice:
          'Moderate air pollution detected. Breathing discomfort possible for sensitive individuals.',
        recommendations: [
          'Schedule high-intensity cardio before peak traffic hours.',
          'Close windows facing major traffic intersections.',
          'Wear a standard mask if sensitive to dust.'
        ]
      },
      Poor: {
        advice:
          'Unhealthy air conditions. Prolonged outdoor exertion causes respiratory discomfort.',
        recommendations: [
          'Wear a well-fitted N95 or equivalent respirator when commuting outdoors.',
          'Run indoor HEPA air filtration in living and sleeping areas.',
          'Move strenuous workouts to indoor gyms.'
        ]
      },
      'Very Poor': {
        advice: 'Severe pollution episode. High risk of respiratory illness on prolonged exposure.',
        recommendations: [
          'Avoid all unnecessary outdoor transit and heavy physical labor.',
          'Keep windows and doors securely sealed against infiltration.',
          'Run indoor air purifiers on high speed.'
        ]
      },
      Severe: {
        advice: 'Emergency atmospheric hazard affecting both healthy and sensitive groups.',
        recommendations: [
          'Strictly remain indoors with air filtration operating continuously.',
          'Avoid opening any windows or doors to outside air.',
          'Wear an N95 mask even for brief emergency outdoor exits.'
        ]
      }
    },
    asthma: {
      Good: {
        advice: 'Air conditions are safe for asthmatics.',
        recommendations: [
          'Maintain regular controller medication schedule as prescribed.',
          'Carry rescue inhalers as a standard precaution.',
          'Enjoy full outdoor activities.'
        ]
      },
      Satisfactory: {
        advice: 'Minor particulate levels; generally safe for asthmatics.',
        recommendations: [
          'Carry rapid-relief inhaler during extended workouts.',
          'Monitor for mild coughing or throat tightness.',
          'Ventilate rooms during mid-day when humidity is lower.'
        ]
      },
      Moderate: {
        advice: 'Moderate particulate burden may trigger airway hyperresponsiveness.',
        recommendations: [
          'Keep quick-relief inhaler immediately accessible at all times.',
          'Avoid outdoor jogging near heavy bus or truck routes.',
          'Pre-medicate if recommended in your personal asthma plan.'
        ]
      },
      Poor: {
        advice: 'Elevated risk of acute bronchospasm and asthma flare-up.',
        recommendations: [
          'Avoid all outdoor aerobic exercise and cycling.',
          'Stay inside air-conditioned or HEPA-filtered rooms.',
          'Check peak flow readings and adhere to asthma action plan.'
        ]
      },
      'Very Poor': {
        advice: 'High risk of severe asthma attacks requiring urgent intervention.',
        recommendations: [
          'Remain strictly indoors with air purifiers active.',
          'Do not open exterior windows under any circumstances.',
          'Seek emergency medical evaluation if inhaler relief diminishes.'
        ]
      },
      Severe: {
        advice: 'Emergency respiratory hazard for all persons with asthma.',
        recommendations: [
          'Strict continuous indoor confinement with certified HEPA filtration.',
          'Have emergency contact numbers and nebulizers ready.',
          'Contact healthcare provider immediately if chest tightness worsens.'
        ]
      }
    },
    elderly: {
      Good: {
        advice: 'Ideal air quality for outdoor walks and physical activity.',
        recommendations: [
          'Take leisurely outdoor walks in green spaces.',
          'Enjoy natural morning sunlight and fresh air.',
          'Stay well hydrated.'
        ]
      },
      Satisfactory: {
        advice: 'Acceptable ambient conditions for seniors.',
        recommendations: [
          'Take routine outdoor walks in low-traffic areas.',
          'Pace cardiovascular exercises comfortably.',
          'Keep hydration steady.'
        ]
      },
      Moderate: {
        advice: 'Slightly elevated pollutants may increase cardiac and respiratory effort.',
        recommendations: [
          'Prefer walking in community gardens away from major roadways.',
          'Take frequent rest pauses during outdoor strolls.',
          'Close windows during evening traffic congestion.'
        ]
      },
      Poor: {
        advice: 'Particulates elevate cardiac stress and blood pressure in seniors.',
        recommendations: [
          'Stay indoors and avoid heavy outdoor physical activities.',
          'Run indoor air purifiers to protect cardiovascular health.',
          'Wear an N95 mask if brief outdoor travel is necessary.'
        ]
      },
      'Very Poor': {
        advice: 'Significant cardiovascular and stroke hazard for senior citizens.',
        recommendations: [
          'Remain indoors in clean, filtered air spaces.',
          'Avoid all physical strain or fatigue.',
          'Monitor blood pressure and pulse regularly.'
        ]
      },
      Severe: {
        advice: 'Extreme health risk for older adults requiring strict confinement.',
        recommendations: [
          'Do not venture outdoors; stay inside sealed indoor rooms.',
          'Maintain continuous indoor air filtration.',
          'Seek immediate medical care if shortness of breath occurs.'
        ]
      }
    },
    child: {
      Good: {
        advice: 'Safe and healthy atmosphere for children, recess, and school sports.',
        recommendations: [
          'Participate fully in outdoor play, recess, and physical education.',
          'Open windows in classrooms and nurseries for fresh ventilation.',
          'Stay hydrated during outdoor games.'
        ]
      },
      Satisfactory: {
        advice: 'Generally clean air for children’s developing respiratory systems.',
        recommendations: [
          'Safe for normal school yard and playground activities.',
          'Observe children with mild allergies during pollen or dust hours.',
          'Ventilate play areas regularly.'
        ]
      },
      Moderate: {
        advice: 'Slightly elevated particulate levels may irritate children’s airways.',
        recommendations: [
          'Reduce intensity of extended competitive sports.',
          'Prefer shaded park play over streetside parks.',
          'Encourage frequent water breaks.'
        ]
      },
      Poor: {
        advice: 'Fine particles penetrate children’s smaller airways and developing lungs.',
        recommendations: [
          'Move physical education classes and sports inside gymnasiums.',
          'Avoid prolonged playground activities after school.',
          'Ensure nursery and school rooms have air purifiers operational.'
        ]
      },
      'Very Poor': {
        advice: 'Dangerous air quality for growing lungs; suspend outdoor school activities.',
        recommendations: [
          'Keep children indoors with windows firmly shut.',
          'Cancel all outdoor school sports, recess, and field trips.',
          'Run HEPA air purifiers in children’s bedrooms.'
        ]
      },
      Severe: {
        advice: 'Emergency atmospheric conditions threatening pediatric health.',
        recommendations: [
          'Children must remain strictly indoors in air-filtered spaces.',
          'Suspend school attendance or switch to remote classes if advised.',
          'Seek pediatric attention for persistent cough or wheezing.'
        ]
      }
    },
    athlete: {
      Good: {
        advice: 'Optimal atmospheric conditions for endurance athletics and workouts.',
        recommendations: [
          'Ideal for long-distance runs, interval sprints, and cycling.',
          'Maximize lung volume without pollutant irritation.',
          'Stay properly hydrated.'
        ]
      },
      Satisfactory: {
        advice: 'Good conditions for outdoor conditioning and competitive sports.',
        recommendations: [
          'Complete planned endurance mileage as scheduled.',
          'Pick scenic routes away from freight corridors when possible.',
          'Follow standard recovery protocols.'
        ]
      },
      Moderate: {
        advice: 'Heavy aerobic respiration will increase inhaled particulate volume.',
        recommendations: [
          'Shift high-intensity tempo runs to early morning hours.',
          'Avoid routes with heavy diesel bus or truck congestion.',
          'Consider treadmill sessions for high-intensity intervals.'
        ]
      },
      Poor: {
        advice: 'Deep ventilatory inhalation causes airway inflammation and reduces VO2 max.',
        recommendations: [
          'Move cardio and endurance training to indoor air-conditioned facilities.',
          'Avoid outdoor speed sessions and road cycling.',
          'Focus on strength and mobility work indoors.'
        ]
      },
      'Very Poor': {
        advice: 'Severe lung damage risk during high ventilation athletic exertion.',
        recommendations: [
          'Strictly cancel all outdoor aerobic and endurance sessions.',
          'Train only inside filtered indoor gyms.',
          'Focus on recovery, hydration, and indoor conditioning.'
        ]
      },
      Severe: {
        advice: 'Emergency hazard. Intense breathing at this AQI causes acute pulmonary trauma.',
        recommendations: [
          'Do not perform any high-effort workouts outdoors or in unsealed buildings.',
          'Rest or perform low-effort stretching indoors with HEPA filtration.',
          'Protect airway health until atmospheric dispersion improves.'
        ]
      }
    }
  };

  const profileData = adviceMap[userProfile]?.[category] ||
    adviceMap['general'][category] || {
      advice: `Maintain caution with current ${category} air quality.`,
      recommendations: [
        'Limit prolonged outdoor exertion.',
        'Check local air quality before heading outside.',
        'Wear protective masks if sensitive to airborne particulates.'
      ]
    };

  return {
    source: 'Clinical Environmental Health Matrix (Guardrailed Fallback)',
    advice: profileData.advice,
    recommendations: profileData.recommendations,
    disclaimer,
    isAIGenerated: true
  };
}
