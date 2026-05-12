import { Redirect } from 'expo-router';

import { ScreenLoader } from '@/components/ui/screen-loader';
import { useAuth } from '@/contexts/auth-context';

export default function IndexScreen() {
  const { isAuthLoading, isAuthOperationLoading, user } = useAuth();

  if (isAuthLoading || isAuthOperationLoading) {
    return <ScreenLoader label="Checking your session..." />;
  }

  return <Redirect href={user ? '/(tabs)' : '/login'} />;
}
