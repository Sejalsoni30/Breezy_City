import { Request, Response } from 'express';
import { db } from '../services/db.js';

export function handleGetBookmarks(req: Request, res: Response): void {
  const userId = (req.query.userId as string) || 'anonymous';
  const bookmarks = db.getBookmarks(userId);
  res.json({ userId, bookmarks });
}

export function handleCreateBookmark(req: Request, res: Response): void {
  const { userId = 'anonymous', name, latitude, longitude, displayName } = req.body;
  const item = db.saveBookmark(userId, {
    name,
    latitude: Number(latitude),
    longitude: Number(longitude),
    displayName: displayName || name
  });
  res.status(201).json(item);
}

export function handleDeleteBookmark(req: Request, res: Response): void {
  const userId = (req.query.userId as string) || 'anonymous';
  const bookmarkId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = db.deleteBookmark(userId, bookmarkId);
  res.json({ success });
}
