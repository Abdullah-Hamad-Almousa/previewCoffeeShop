import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { colors } from '@/lib/theme';

/**
 * Floating music control button.
 * Shows a speaker icon — tap to toggle play/pause.
 * Appears after music starts (10s delay).
 */
export function MusicButton() {
  const { state, pauseMusic, resumeMusic } = useMusicPlayer();

  // Don't render until music has at least started
  if (state === 'idle') {
    return null;
  }

  const isPlaying = state === 'playing';
  const icon = isPlaying ? '🔊' : '🔇';
  const label = isPlaying ? 'Music' : 'Paused';

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={isPlaying ? pauseMusic : resumeMusic}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 100,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: { fontSize: 18 },
  label: { fontSize: 12, color: colors.brass, fontWeight: '600' },
});