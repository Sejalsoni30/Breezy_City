import { describe, it, expect } from 'vitest';
import { generateAiHealthAdvisory } from '../../src/services/aiAdvisory.js';

describe('AI Health Advisory Service', () => {
  it('generates grounded advice for general profile in Moderate AQI', async () => {
    const res = await generateAiHealthAdvisory(140, 'Moderate', 'PM2.5', 'general');
    expect(res).toBeDefined();
    expect(res.advice).toBeTruthy();
    expect(res.recommendations.length).toBeGreaterThanOrEqual(2);
    expect(res.disclaimer).toContain('Informational guidance only');
    expect(typeof res.isAIGenerated).toBe('boolean');
  });

  it('generates personalized precautions for asthma profile in Poor AQI', async () => {
    const res = await generateAiHealthAdvisory(240, 'Poor', 'PM2.5', 'asthma');
    expect(res).toBeDefined();
    expect(res.advice.toLowerCase()).toMatch(/(asthma|broncho|inhaler|respiratory|airway|mask|indoor)/);
    expect(res.recommendations.length).toBeGreaterThanOrEqual(2);
    expect(res.disclaimer).toContain('not medical advice');
  });

  it('generates protective recommendations for elderly profile in Severe AQI', async () => {
    const res = await generateAiHealthAdvisory(450, 'Severe', 'PM2.5', 'elderly');
    expect(res).toBeDefined();
    expect(res.advice).toBeTruthy();
    expect(res.recommendations.length).toBe(3);
    expect(res.disclaimer).toBeTruthy();
  });

  it('generates activity guidance for athlete profile across AQI categories', async () => {
    const resGood = await generateAiHealthAdvisory(30, 'Good', 'PM2.5', 'athlete');
    expect(resGood.advice.toLowerCase()).toMatch(/(safe|optimal|proceed|ideal)/);

    const resPoor = await generateAiHealthAdvisory(250, 'Poor', 'PM2.5', 'athlete');
    expect(resPoor.advice.toLowerCase()).toMatch(/(reschedule|indoor|reduce|postpone)/);
  });

  it('generates protective measures for child profile in Very Poor AQI', async () => {
    const res = await generateAiHealthAdvisory(350, 'Very Poor', 'PM2.5', 'child');
    expect(res).toBeDefined();
    expect(res.advice.toLowerCase()).toMatch(/(recess|indoor|outdoor|school|protect)/);
  });
});
