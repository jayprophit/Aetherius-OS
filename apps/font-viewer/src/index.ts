/**
 * Font Viewer
 *
 * Aetherius font viewer with catalogue, preview, install, uninstall and fallback analysis.
 *
 * This is a scaffold. Replace the placeholder with the real domain logic.
 */

export const FontViewerVersion = "0.1.0";

export interface FontViewerState {
  initialized: boolean;
}

export function createFontViewer(): FontViewerState {
  return { initialized: true };
}
