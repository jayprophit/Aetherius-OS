/**
 * Screenshot
 *
 * Aetherius screenshot with region, window, full-screen, timer and annotation.
 *
 * This is a scaffold. Replace the placeholder with the real domain logic.
 */

export const ScreenshotVersion = "0.1.0";

export interface ScreenshotState {
  initialized: boolean;
}

export function createScreenshot(): ScreenshotState {
  return { initialized: true };
}
