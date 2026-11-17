import { Request, Response, NextFunction } from 'express';
import { generateAiHealthAdvisory } from '../services/aiAdvisory.js';

export async function handleAiAdvisory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { aqi, category, dominantPollutant, userProfile } = req.body;
    const result = await generateAiHealthAdvisory(aqi, category, dominantPollutant, userProfile);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
