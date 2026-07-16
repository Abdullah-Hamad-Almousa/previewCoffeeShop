import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="product/[id]" options={{ title: '' }} />
      <Stack.Screen name="payment/[productId]" options={{ title: '' }} />
    </Stack>
  );
}