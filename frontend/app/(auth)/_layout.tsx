import { Redirect, Stack } from 'expo-router';

import { ScreenLoader } from '@/components/ui/screen-loader';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout() {
  const { isAuthLoading, isAuthOperationLoading, isEmailVerified, user } = useAuth();

  if (isAuthLoading || isAuthOperationLoading) {
    return <ScreenLoader label="Preparing your account..." />;
  }

  if (user) {
    return <Redirect href={(isEmailVerified ? '/(tabs)' : '/verify-email') as never} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
