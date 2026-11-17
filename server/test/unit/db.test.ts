import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/services/db.js';

describe('Database Service (Bookmarks & Search History)', () => {
  const testUser = 'user-test-unit';

  it('saves and retrieves user bookmarks', () => {
    const saved = db.saveBookmark(testUser, {
      name: 'Delhi Civic Center',
      latitude: 28.6139,
      longitude: 77.209,
      displayName: 'Delhi Civic Center, Central Delhi'
    });

    expect(saved.id).toBeDefined();
    expect(saved.userId).toBe(testUser);
    expect(saved.name).toBe('Delhi Civic Center');

    const list = db.getBookmarks(testUser);
    expect(list.some((b) => b.id === saved.id)).toBe(true);
  });

  it('deletes an existing bookmark correctly', () => {
    const item = db.saveBookmark(testUser, {
      name: 'Connaught Place',
      latitude: 28.6315,
      longitude: 77.2167,
      displayName: 'Connaught Place, New Delhi'
    });

    const deleted = db.deleteBookmark(testUser, item.id);
    expect(deleted).toBe(true);

    const listAfter = db.getBookmarks(testUser);
    expect(listAfter.some((b) => b.id === item.id)).toBe(false);
  });

  it('rejects deletion of a bookmark belonging to a different user', () => {
    const item = db.saveBookmark(testUser, {
      name: 'Indira Gandhi International Airport',
      latitude: 28.5562,
      longitude: 77.1,
      displayName: 'IGI Airport, New Delhi'
    });

    const deleted = db.deleteBookmark('different-user-999', item.id);
    expect(deleted).toBe(false);
  });

  it('records and returns search history in reverse chronological order', () => {
    db.addSearchHistory(testUser, 'Mumbai');
    db.addSearchHistory(testUser, 'Kolkata');
    db.addSearchHistory(testUser, 'Bengaluru');

    const history = db.getSearchHistory(testUser);
    expect(history.length).toBeGreaterThanOrEqual(3);
    expect(history[0].query).toBe('Bengaluru');
    expect(history[1].query).toBe('Kolkata');
    expect(history[2].query).toBe('Mumbai');
  });
});
