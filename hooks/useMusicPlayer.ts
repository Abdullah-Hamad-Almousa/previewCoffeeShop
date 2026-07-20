import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useAudioPlaylist,
  useAudioPlaylistStatus,
  setAudioModeAsync,
  type AudioPlaylist,
} from 'expo-audio';

// Track files (bundled in assets — relative paths for require)
const TRACKS = [
  require('../assets/audio/track1.mp3'),
  require('../assets/audio/track2.mp3'),
];

// Low volume — background ambient
const VOLUME = 0.3;
// Delay before music starts (ms)
const START_DELAY = 10_000;

type MusicState = 'idle' | 'playing' | 'paused';

export function useMusicPlayer() {
  const [state, setState] = useState<MusicState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  // Create playlist with loop='all' so track1 → track2 → track1...
  const playlist = useAudioPlaylist({
    sources: TRACKS,
    loop: 'all',
  });

  const status = useAudioPlaylistStatus(playlist);

  // Set volume + configure audio mode on mount
  useEffect(() => {
    playlist.volume = VOLUME;

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, [playlist]);

  // Start music after 10s delay
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    timerRef.current = setTimeout(() => {
      try {
        playlist.play();
        setState('playing');
      } catch {}
    }, START_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playlist]);

  // Pause
  const pauseMusic = useCallback(() => {
    try {
      playlist.pause();
      setState('paused');
    } catch {}
  }, [playlist]);

  // Resume
  const resumeMusic = useCallback(() => {
    try {
      playlist.play();
      setState('playing');
    } catch {}
  }, [playlist]);

  return {
    state,
    status,
    pauseMusic,
    resumeMusic,
  };
}