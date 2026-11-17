import { Request, Response } from 'express';
import { db } from '../services/db.js';

export function handleGetHistory(req: Request, res: Response): void {
  const userId = (req.query.userId as string) || 'anonymous';
  const history = db.getSearchHistory(userId);
  res.json({ userId, history });
}

export function handleCreateHistory(req: Request, res: Response): void {
  const { userId = 'anonymous', query } = req.body;
  const item = db.addSearchHistory(userId, query.trim());
  res.status(201).json(item);
}
