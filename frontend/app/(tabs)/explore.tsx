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
import type { LocalVerificationStatus } from '@/types/user';

function getVerificationLabel(status: LocalVerificationStatus | undefined) {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'pending':
      return 'Pending review';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Not requested';
  }
}

export default function ProfileScreen() {
  const { isEmailVerified, logout, user } = useAuth();
  const { userProfile } = useUserProfile();
  const localStatus = userProfile?.localVerificationStatus;
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

      {/* Verification card removed per request */}

      <View style={styles.signOutWrap}>
        <ActionButton
          label="Sign out"
          tone="dark"
            centered
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
    marginTop: 24,
    alignItems: 'center',
  },
  actionRow: {
    marginTop: 16,
  },
  helperText: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
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
