import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

/**
 * Steampunk Beaver Background
 *
 * Renders a faint beaver emoji 🦫 at a random position on the screen.
 * NOT 100% visible — uses low opacity so it's a subtle background detail.
 * Brown tinted circle behind it reinforces the steampunk theme.
 *
 * Props:
 *  - seed: optional number to control position (defaults to random on mount)
 */
interface BeaverBackgroundProps {
  seed?: number;
}

export function BeaverBackground({ seed }: BeaverBackgroundProps) {
  const position = useMemo(() => {
    const s = seed ?? Math.random();
    const x = 5 + (s * 1000) % 70;        // 5% to 75% from left
    const y = 8 + (s * 7777) % 60;        // 8% to 68% from top
    const size = 80 + (s * 333) % 60;     // 80px to 140px
    const opacity = 0.05 + (s * 111) % 0.04; // 0.05 to 0.09 — very faint
    const rotate = (s * 360) % 30 - 15;   // -15 to +15 degrees
    return { x, y, size, opacity, rotate };
  }, [seed]);

  return (
    <View style={styles.bg} pointerEvents="none">
      <View
        style={[
          styles.beaverWrap,
          {
            left: `${position.x}%`,
            top: `${position.y}%`,
            opacity: position.opacity,
            transform: [{ rotate: `${position.rotate}deg` }],
          },
        ]}
      >
        <View style={[styles.beaverCircle, { width: position.size, height: position.size }]}>
          <Text style={[styles.beaverEmoji, { fontSize: position.size * 0.5 }]}>
            🦫
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  beaverWrap: {
    position: 'absolute',
  },
  beaverCircle: {
    borderRadius: 999,
    backgroundColor: colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaverEmoji: {
    // Emoji color can't be changed, but the circle behind it is brown
  },
});