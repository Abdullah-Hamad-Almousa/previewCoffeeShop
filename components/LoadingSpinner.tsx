import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { sharedStyles } from '@/lib/theme';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

/** Reusable loading spinner */
export function LoadingSpinner({ fullScreen = true }: LoadingSpinnerProps) {
  return (
    <View style={fullScreen ? sharedStyles.center : styles.inline}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { paddingVertical: 40, alignItems: 'center' },
});