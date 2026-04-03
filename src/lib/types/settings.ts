/** User-configurable settings for a study */
export interface StudySettings {
  /** Custom dimension scales (overrides auto-detected min/max) */
  dimensionScales: Record<string, { min: number; max: number }>;
  /** Whether dimensions are flipped (inverted axis) */
  dimensionFlipped: Record<string, boolean>;
  /** Hidden dimensions (not shown in parallel coordinates) */
  hiddenDimensions: Set<string>;
  /** Target marks on dimensions (e.g., energy targets) */
  targetMarks: Record<string, number>;
}

/** Panel visibility state */
export interface PanelVisibility {
  sidebar: boolean;
  parallelCoords: boolean;
  scatterMatrix: boolean;
  viewer: boolean;
  thumbnails: boolean;
  dataTable: boolean;
}

/** Default panel visibility */
export const DEFAULT_PANEL_VISIBILITY: PanelVisibility = {
  sidebar: true,
  parallelCoords: true,
  scatterMatrix: true,
  viewer: true,
  thumbnails: true,
  dataTable: false,
};
