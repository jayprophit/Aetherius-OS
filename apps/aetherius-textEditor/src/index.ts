/**
 * Text Editor
 *
 * Aetherius text editor with syntax highlighting, minimap, find/replace and outline.
 *
 * This is a scaffold. Replace the placeholder with the real domain logic.
 */

export const TextEditorVersion = "0.1.0";

export interface TextEditorState {
  initialized: boolean;
}

export function createTextEditor(): TextEditorState {
  return { initialized: true };
}
