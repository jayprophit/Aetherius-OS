/**
 * Media Player
 *
 * Aetherius media player with playlists, subtitles, cast and transcoding.
 *
 * This is a scaffold. Replace the placeholder with the real domain logic.
 */

export const MediaPlayerVersion = "0.1.0";

export interface MediaPlayerState {
  initialized: boolean;
}

export function createMediaPlayer(): MediaPlayerState {
  return { initialized: true };
}
