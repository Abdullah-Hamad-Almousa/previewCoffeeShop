import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

export default function ManagerLayout() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Not logged in → send to sign in
  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Logged in but not a manager → send back to customer home
  if (role !== 'manager') {
    return <Redirect href="/(customer)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Lazy-load: don't render screens until visited
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="products" />
      <Stack.Screen name="edit-product/[id]" />
      <Stack.Screen name="recommendation" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="queue-section" />
      <Stack.Screen name="queue-edit/[id]" />
    </Stack>
  );
}