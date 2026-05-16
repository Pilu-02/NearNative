import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  ActionButton,
  AppScrollScreen,
  HeroPanel,
  MetricRow,
  SurfaceCard,
} from '@/components/ui/app-primitives';
import { AppTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/contexts/user-profile-context';

export default function ProfileScreen() {
  const { logout, user } = useAuth();
  const { userProfile } = useUserProfile();

  return (
    <AppScrollScreen>
      <HeroPanel
        badge="Profile"
        title="Your NearNative identity"
        subtitle="Everything here stays lightweight and anonymous so it is easy to move through the app safely."
      />

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.metricsWrap}>
          <MetricRow label="Email" value={user?.email ?? 'Unknown email'} />
          <MetricRow label="Anonymous name" value={userProfile?.anonymousName ?? 'Loading...'} />
          <MetricRow
            label="Role"
            value={
              userProfile?.role === 'local'
                ? 'Local'
                : userProfile?.role === 'visitor'
                  ? 'Visitor'
                  : 'Loading...'
            }
          />
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Session</Text>
        <Text style={styles.helperText}>
          Sign out when you want to test another user account or role on this device.
        </Text>
        <View style={styles.actionRow}>
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
      </SurfaceCard>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
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
