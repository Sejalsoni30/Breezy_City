import crypto from 'crypto';

export interface Bookmark {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  displayName: string;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  searchedAt: string;
}

// In-memory zero-friction store for development & evaluation when remote DB is not linked
class MemoryDatabase {
  private bookmarks: Map<string, Bookmark> = new Map();
  private history: SearchHistoryItem[] = [];

  public getBookmarks(userId: string): Bookmark[] {
    return Array.from(this.bookmarks.values())
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveBookmark(userId: string, loc: { name: string; latitude: number; longitude: number; displayName: string }): Bookmark {
    const id = crypto.randomUUID();
    const bookmark: Bookmark = {
      id,
      userId,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      displayName: loc.displayName,
      createdAt: new Date().toISOString()
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  public deleteBookmark(userId: string, id: string): boolean {
    const item = this.bookmarks.get(id);
    if (item && item.userId === userId) {
      return this.bookmarks.delete(id);
    }
    return false;
  }

  public addSearchHistory(userId: string, query: string): SearchHistoryItem {
    const item: SearchHistoryItem = {
      id: crypto.randomUUID(),
      userId,
      query,
      searchedAt: new Date().toISOString()
    };
    this.history.unshift(item);
    if (this.history.length > 50) this.history.pop();
    return item;
  }

  public getSearchHistory(userId: string): SearchHistoryItem[] {
    return this.history.filter((h) => h.userId === userId).slice(0, 10);
  }
}

export const db = new MemoryDatabase();
