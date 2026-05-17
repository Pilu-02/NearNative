import { Redirect } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth/auth-shell';
import { ActionButton, SurfaceCard } from '@/components/ui/app-primitives';
import { AppTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function VerifyEmailScreen() {
  const { isAuthOperationLoading, isEmailVerified, logout, reloadUser, resendVerificationEmail, user } =
    useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (isEmailVerified) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <AuthShell
      badge="Verify email"
      title="Check your inbox"
      subtitle="We sent a verification link to your email address. Open it, then come back here to unlock the app.">
      <View style={styles.content}>
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Pending verification</Text>
          <Text style={styles.bodyText}>{user?.email ?? 'No signed-in email found'}</Text>
          <Text style={styles.helperText}>
            If you do not see the email, check spam or promotions, then tap resend below.
          </Text>
        </SurfaceCard>

        <View style={styles.actionGroup}>
          <ActionButton
            label="I verified my email"
            loading={isAuthOperationLoading}
            onPress={() => {
              void (async () => {
                try {
                  await reloadUser();
                } catch {
                  Alert.alert(
                    'Refresh failed',
                    'We could not refresh your account right now. Please try again in a moment.'
                  );
                }
              })();
            }}
          />
          <ActionButton
            label="Resend verification link"
            loading={isAuthOperationLoading}
            onPress={() => {
              void (async () => {
                try {
                  await resendVerificationEmail();
                  Alert.alert(
                    'Verification sent',
                    'A fresh verification email has been sent to your inbox.'
                  );
                } catch {
                  Alert.alert(
                    'Unable to resend',
                    'Please wait a moment and try sending the verification link again.'
                  );
                }
              })();
            }}
            tone="ghost"
          />
          <ActionButton
            label="Sign out"
            loading={isAuthOperationLoading}
            onPress={() => {
              void (async () => {
                try {
                  await logout();
                } catch {
                  Alert.alert('Logout failed', 'Please try again.');
                }
              })();
            }}
            tone="dark"
          />
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  actionGroup: {
    gap: 12,
  },
  bodyText: {
    color: AppTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  content: {
    gap: 18,
  },
  helperText: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  sectionTitle: {
    color: AppTheme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
