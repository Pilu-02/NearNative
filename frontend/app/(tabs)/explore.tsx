import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  ActionButton,
  AppScrollScreen,
  HeroPanel,
  MetricRow,
  Pill,
  SurfaceCard,
} from '@/components/ui/app-primitives';
import { AppTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/contexts/user-profile-context';

export default function ProfileScreen() {
  const { isEmailVerified, logout, user } = useAuth();
  const { userProfile } = useUserProfile();
  const requestedRole = userProfile?.requestedRole ?? userProfile?.role;
  const activeRole =
    userProfile?.role === 'local'
      ? 'Local'
      : userProfile?.role === 'visitor'
        ? 'Visitor'
        : 'Loading...';

  return (
    <AppScrollScreen>
      <HeroPanel
        badge="Profile"
        title="Your NearNative identity"
        subtitle="Track your email status, account role, and local verification progress from one place."
        aside={
          <Pill
            label={isEmailVerified ? 'Email verified' : 'Verify email'}
            tone={isEmailVerified ? 'neutral' : 'danger'}
          />
        }
      />

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.metricsWrap}>
          <MetricRow label="Email" value={user?.email ?? 'Unknown email'} />
          <MetricRow label="Anonymous name" value={userProfile?.anonymousName ?? 'Loading...'} />
          <MetricRow label="Active role" value={activeRole} />
          <MetricRow
            label="Requested role"
            value={requestedRole === 'local' ? 'Local applicant' : 'Visitor'}
          />
        </View>
      </SurfaceCard>

      <View style={styles.signOutWrap}>
        <ActionButton
          label="Sign out"
          tone="dark"
          onPress={() => {
            void (async () => {
              try {
                await logout();
              } catch {
                Alert.alert('Logout failed', 'Please try again.');
              }
            })();
          }}
        />
      </View>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  signOutWrap: {
    alignItems: 'center',
    marginTop: 24,
  },
  metricsWrap: {
    gap: 14,
    marginTop: 16,
  },
  sectionTitle: {
    color: AppTheme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
