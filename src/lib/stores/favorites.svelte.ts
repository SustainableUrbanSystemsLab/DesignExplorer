import type { FavoriteEntry, FavoritesCollection } from '../types/favorites';

const STORAGE_PREFIX = 'de-favorites-';

/**
 * Favorites store — persists favorite designs to localStorage.
 */
class FavoritesStore {
  private _studyId = $state<string>('');
  entries = $state<FavoriteEntry[]>([]);

  /** Set of favorited row IDs for fast lookup */
  get favoriteIds(): Set<string> {
    return new Set(this.entries.map((e) => e.rowId));
  }

  /** Set of favorited row indices */
  get favoriteIndices(): Set<number> {
    return new Set(this.entries.map((e) => e.rowIndex));
  }

  get count(): number {
    return this.entries.length;
  }

  /**
   * Initialize for a dataset. Loads any saved favorites from localStorage.
   */
  init(studyId: string) {
    this._studyId = studyId;
    this.loadFromStorage();
  }

  /**
   * Toggle favorite status for a design.
   */
  toggle(rowIndex: number, rowId: string) {
    const existing = this.entries.findIndex((e) => e.rowId === rowId);
    if (existing >= 0) {
      this.entries = this.entries.filter((_, i) => i !== existing);
    } else {
      this.entries = [
        ...this.entries,
        { rowIndex, rowId, timestamp: Date.now() },
      ];
    }
    this.saveToStorage();
  }

  /**
   * Check if a design is favorited.
   */
  isFavorite(rowId: string): boolean {
    return this.favoriteIds.has(rowId);
  }

  /**
   * Update the note on a favorite.
   */
  setNote(rowId: string, note: string) {
    this.entries = this.entries.map((e) =>
      e.rowId === rowId ? { ...e, note } : e
    );
    this.saveToStorage();
  }

  /**
   * Remove all favorites for the current study.
   */
  clearAll() {
    this.entries = [];
    this.saveToStorage();
  }

  /**
   * Export favorites as JSON.
   */
  exportJSON(): string {
    const collection: FavoritesCollection = {
      studyId: this._studyId,
      entries: this.entries,
    };
    return JSON.stringify(collection, null, 2);
  }

  /**
   * Import favorites from JSON, merging with existing.
   */
  importJSON(json: string) {
    const collection: FavoritesCollection = JSON.parse(json);
    const existingIds = this.favoriteIds;

    for (const entry of collection.entries) {
      if (!existingIds.has(entry.rowId)) {
        this.entries = [...this.entries, entry];
      }
    }
    this.saveToStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + this._studyId);
      if (stored) {
        const collection: FavoritesCollection = JSON.parse(stored);
        this.entries = collection.entries;
      } else {
        this.entries = [];
      }
    } catch {
      this.entries = [];
    }
  }

  private saveToStorage() {
    try {
      const collection: FavoritesCollection = {
        studyId: this._studyId,
        entries: this.entries,
      };
      localStorage.setItem(STORAGE_PREFIX + this._studyId, JSON.stringify(collection));
    } catch {
      // localStorage might be full or unavailable
      console.warn('Failed to save favorites to localStorage');
    }
  }
}

export const favorites = new FavoritesStore();
