import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/contexts/user-profile-context';

export default function ProfileScreen() {
  const { logout, user } = useAuth();
  const { userProfile } = useUserProfile();

  return (
    <View style={styles.screen}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerText}>
          Phase one is complete once login, signup, Firestore storage, and sign out all work.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{user?.email ?? 'Unknown email'}</Text>
        <Text style={styles.label}>Anonymous name</Text>
        <Text style={styles.secondaryValue}>{userProfile?.anonymousName ?? 'Loading...'}</Text>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.secondaryValue}>
          {userProfile?.role === 'local'
            ? 'Local'
            : userProfile?.role === 'visitor'
              ? 'Visitor'
              : 'Loading...'}
        </Text>

        <Pressable
          onPress={async () => {
            try {
              await logout();
            } catch {
              Alert.alert('Logout failed', 'Please try again.');
            }
          }}
          style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutPressed : null]}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#fff',
    borderColor: '#dbe4ee',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  headerText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8,
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    gap: 12,
    padding: 22,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logoutButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  logoutPressed: {
    opacity: 0.9,
  },
  logoutText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: '#f4f8fc',
    flex: 1,
    gap: 18,
    padding: 22,
    paddingTop: 74,
  },
  value: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  secondaryValue: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
  },
});
