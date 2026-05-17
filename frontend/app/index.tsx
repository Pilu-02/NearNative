import { Redirect } from 'expo-router';

import { ScreenLoader } from '@/components/ui/screen-loader';
import { useAuth } from '@/contexts/auth-context';

export default function IndexScreen() {
  const { isAuthLoading, isAuthOperationLoading, isEmailVerified, user } = useAuth();

  if (isAuthLoading || isAuthOperationLoading) {
    return <ScreenLoader label="Checking your session..." />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={(isEmailVerified ? '/(tabs)' : '/verify-email') as never} />;
}
