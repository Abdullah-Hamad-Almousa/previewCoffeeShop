import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioPlaylist, setAudioModeAsync } from 'expo-audio';

// Track files (bundled in assets — relative paths for require)
const TRACKS = [
  require('../assets/audio/track1.mp3'),
  require('../assets/audio/track2.mp3'),
];

const VOLUME = 0.3;
const START_DELAY = 10_000;

type MusicState = 'idle' | 'playing' | 'paused';

export function useMusicPlayer() {
  const [state, setState] = useState<MusicState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  const playlist = useAudioPlaylist({
    sources: TRACKS,
    loop: 'all',
  });

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

  const pauseMusic = useCallback(() => {
    try {
      playlist.pause();
      setState('paused');
    } catch {}
  }, [playlist]);

  const resumeMusic = useCallback(() => {
    try {
      playlist.play();
      setState('playing');
    } catch {}
  }, [playlist]);

  return { state, pauseMusic, resumeMusic };
}