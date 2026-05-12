import { Redirect, Stack } from 'expo-router';

import { ScreenLoader } from '@/components/ui/screen-loader';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout() {
  const { isAuthLoading, isAuthOperationLoading, user } = useAuth();

  if (isAuthLoading || isAuthOperationLoading) {
    return <ScreenLoader label="Loading NearNative..." />;
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
