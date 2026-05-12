import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

import { useAuth } from '@/contexts/auth-context';
import { useLocationSync } from '@/contexts/location-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { getFallbackAnonymousName } from '@/lib/anonymous-name';
import {
  buildChatParticipantFromProfile,
  buildChatParticipantFromRoute,
  getChatExpiryTimestamp,
  getDirectChatId,
} from '@/lib/chat';
import { formatApproximateDistance, getDistanceInMeters } from '@/lib/distance';
import { db } from '@/lib/firebase';
import type { UserProfile, UserRole } from '@/types/user';

const NEARBY_RADIUS_METERS = 500;

type NearbyUser = UserProfile & {
  distanceInMeters: number;
};

function getRoleLabel(role: UserRole) {
  return role === 'local' ? 'Local' : 'Visitor';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const { coordinates, errorMessage, isSyncingLocation, permissionStatus, refreshLocation } =
    useLocationSync();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');

  const loadNearbyUsers = useCallback(async () => {
    if (!user || !coordinates) {
      setNearbyUsers([]);
      return;
    }

    try {
      setIsLoadingUsers(true);
      setUsersError('');

      const snapshot = await getDocs(collection(db, 'users'));
      const allUsers = snapshot.docs.map(
        (documentSnapshot) =>
          ({
            uid: documentSnapshot.id,
            ...(documentSnapshot.data() as Omit<UserProfile, 'uid'>),
          }) as UserProfile
      );

      const nextNearbyUsers = allUsers
        .filter(
          (candidate) =>
            typeof candidate.uid === 'string' &&
            candidate.uid.length > 0 &&
            (candidate.role === 'local' || candidate.role === 'visitor')
        )
        .filter((candidate) => candidate.uid !== user.uid)
        .filter(
          (candidate) =>
            typeof candidate.latitude === 'number' && typeof candidate.longitude === 'number'
        )
        .map((candidate) => ({
          ...candidate,
          distanceInMeters: getDistanceInMeters(
            coordinates.latitude,
            coordinates.longitude as number,
            candidate.latitude as number,
            candidate.longitude as number
          ),
        }))
        .filter((candidate) => candidate.distanceInMeters <= NEARBY_RADIUS_METERS)
        .sort((left, right) => left.distanceInMeters - right.distanceInMeters);

      setNearbyUsers(nextNearbyUsers);
    } catch (error) {
      console.error('Failed to load nearby users.', error);
      setUsersError(
        'Unable to load nearby users. Check Firestore rules and make sure signed-in users can read the users collection.'
      );
    } finally {
      setIsLoadingUsers(false);
    }
  }, [coordinates, user]);

  useEffect(() => {
    if (!user || !coordinates) {
      setNearbyUsers([]);
      return;
    }

    void loadNearbyUsers();
  }, [coordinates, loadNearbyUsers, user]);

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.badge}>Nearby users</Text>
        <Text style={styles.title}>People within 500 meters.</Text>
        <Text style={styles.subtitle}>
          This list excludes your own account and only shows users with saved location data close
          to your current position.
        </Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionLabel}>Your location status</Text>
        <Text style={styles.detailLabel}>Permission</Text>
        <Text style={styles.detailValue}>{permissionStatus ?? 'Checking permission...'}</Text>
        <Text style={styles.detailLabel}>Latitude</Text>
        <Text style={styles.detailValue}>
          {coordinates ? coordinates.latitude.toFixed(6) : 'Not available'}
        </Text>
        <Text style={styles.detailLabel}>Longitude</Text>
        <Text style={styles.detailValue}>
          {coordinates ? coordinates.longitude.toFixed(6) : 'Not available'}
        </Text>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionLabel}>Visible people nearby</Text>
        <Text style={styles.helperText}>
          {isLoadingUsers
            ? 'Refreshing nearby users...'
            : `${nearbyUsers.length} user${nearbyUsers.length === 1 ? '' : 's'} found within ${NEARBY_RADIUS_METERS} meters`}
        </Text>

        {usersError ? <Text style={styles.errorText}>{usersError}</Text> : null}

        {!isLoadingUsers && !usersError && nearbyUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No nearby users yet</Text>
            <Text style={styles.emptyText}>
              Ask another account to sign in nearby with location enabled, then refresh this screen.
            </Text>
          </View>
        ) : null}

        {nearbyUsers.map((nearbyUser) => (
          <View key={nearbyUser.uid} style={styles.userCard}>
            <View style={styles.userHeader}>
              <Text style={styles.userName}>
                {nearbyUser.anonymousName ??
                  getFallbackAnonymousName(nearbyUser.role, nearbyUser.uid)}
              </Text>
              <Text style={styles.distanceText}>
                {formatApproximateDistance(nearbyUser.distanceInMeters)}
              </Text>
            </View>
            <Text style={styles.roleText}>{getRoleLabel(nearbyUser.role)}</Text>
            <Pressable
              onPress={async () => {
                if (!user || !userProfile) {
                  return;
                }

                const nextChatId = getDirectChatId(user.uid, nearbyUser.uid);
                const nextPartnerName =
                  nearbyUser.anonymousName ??
                  getFallbackAnonymousName(nearbyUser.role, nearbyUser.uid);
                const chatRef = doc(db, 'chats', nextChatId);

                try {
                  await setDoc(
                    chatRef,
                    {
                      createdAt: serverTimestamp(),
                      expiresAt: getChatExpiryTimestamp(),
                      participantIds: [user.uid, nearbyUser.uid].sort(),
                      participants: [
                        buildChatParticipantFromProfile(userProfile),
                        buildChatParticipantFromRoute(
                          nearbyUser.uid,
                          nextPartnerName,
                          nearbyUser.role
                        ),
                      ],
                      updatedAt: serverTimestamp(),
                    },
                    { merge: true }
                  );

                  router.push(
                    `/chat/${nextChatId}?partnerId=${encodeURIComponent(nearbyUser.uid)}&partnerName=${encodeURIComponent(nextPartnerName)}&partnerRole=${encodeURIComponent(nearbyUser.role)}` as never
                  );
                } catch (error) {
                  console.error('Failed to create or open chat.', error);
                  Alert.alert(
                    'Unable to open chat',
                    'Please check your Firestore chat rules and try again.'
                  );
                }
              }}
              style={({ pressed }) => [
                styles.chatButton,
                pressed ? styles.chatButtonPressed : null,
              ]}>
              <Text style={styles.chatButtonText}>Start anonymous chat</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          disabled={isSyncingLocation || isLoadingUsers}
          onPress={async () => {
            await refreshLocation();
          }}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && !isSyncingLocation && !isLoadingUsers ? styles.refreshButtonPressed : null,
            isSyncingLocation || isLoadingUsers ? styles.refreshButtonDisabled : null,
          ]}>
          {isSyncingLocation || isLoadingUsers ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh nearby users</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f1ff',
    borderRadius: 999,
    color: '#1565c0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  chatButtonPressed: {
    opacity: 0.9,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 22,
    paddingTop: 74,
    paddingBottom: 36,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderColor: '#dbe4ee',
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 22,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    marginTop: 6,
    padding: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    marginBottom: 18,
    padding: 24,
  },
  helperText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 22,
  },
  refreshButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1565c0',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 18,
  },
  refreshButtonDisabled: {
    opacity: 0.75,
  },
  refreshButtonPressed: {
    opacity: 0.92,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: '#f4f8fc',
    flex: 1,
  },
  sectionLabel: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  distanceText: {
    color: '#1565c0',
    fontSize: 13,
    fontWeight: '700',
  },
  roleText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  userCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  userHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userName: {
    color: '#0f172a',
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    marginRight: 12,
  },
});
