/** A single favorited design */
export interface FavoriteEntry {
  /** Row index in the dataset */
  rowIndex: number;
  /** Deterministic ID from input parameter values */
  rowId: string;
  /** When the favorite was added */
  timestamp: number;
  /** Optional user note */
  note?: string;
}

/** Collection of favorites scoped to a specific dataset */
export interface FavoritesCollection {
  /** Hash of CSV header row to scope favorites per dataset */
  studyId: string;
  /** Favorited designs */
  entries: FavoriteEntry[];
}
