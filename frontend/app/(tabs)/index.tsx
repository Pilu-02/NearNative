import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import {
  ActionButton,
  AppScrollScreen,
  EmptyStateCard,
  HeroPanel,
  LoadingCard,
  MetricRow,
  Pill,
  SectionHeader,
  SurfaceCard,
} from '@/components/ui/app-primitives';
import { AppTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLocationSync } from '@/contexts/location-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { getFallbackAnonymousName } from '@/lib/anonymous-name';
import {
  buildChatParticipantFromProfile,
  buildChatParticipantFromRoute,
  getChatExpiryTimestamp,
  isTimestampExpired,
} from '@/lib/chat';
import { formatApproximateDistance, getDistanceInMeters } from '@/lib/distance';
import { db } from '@/lib/firebase';
import { formatRadiusLabel, getSosExpiryTimestamp, RADIUS_OPTIONS_METERS } from '@/lib/sos';
import type { SosAlertDocument } from '@/types/sos';
import type { UserProfile, UserRole } from '@/types/user';

const DEFAULT_RADIUS_METERS = 500;

type NearbyUser = UserProfile & {
  distanceInMeters: number;
};

type NearbySosAlert = SosAlertDocument & {
  distanceInMeters: number;
  id: string;
  isOwnAlert: boolean;
};

function getRoleLabel(role: UserRole) {
  return role === 'local' ? 'Local' : 'Visitor';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const { coordinates, errorMessage, isSyncingLocation, permissionStatus, refreshLocation } =
    useLocationSync();
  const [selectedRadiusMeters, setSelectedRadiusMeters] = useState(DEFAULT_RADIUS_METERS);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [nearbyAlerts, setNearbyAlerts] = useState<NearbySosAlert[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [isSubmittingSos, setIsSubmittingSos] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [alertsError, setAlertsError] = useState('');

  const openDirectChat = useCallback(
    async (partner: Pick<UserProfile, 'anonymousName' | 'role' | 'uid'>) => {
      if (!user || !userProfile) {
        Alert.alert('Unable to open chat', 'Your profile is still loading. Please try again.');
        return;
      }

      const partnerName =
        partner.anonymousName ?? getFallbackAnonymousName(partner.role, partner.uid);
      const nextChatId = [user.uid, partner.uid].sort().join('_');
      const chatRef = doc(db, 'chats', nextChatId);

      try {
        await setDoc(
          chatRef,
          {
            createdAt: serverTimestamp(),
            expiresAt: getChatExpiryTimestamp(),
            participantIds: [user.uid, partner.uid].sort(),
            participants: [
              buildChatParticipantFromProfile(userProfile),
              buildChatParticipantFromRoute(partner.uid, partnerName, partner.role),
            ],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        router.push(
          `/chat/${nextChatId}?partnerId=${encodeURIComponent(partner.uid)}&partnerName=${encodeURIComponent(partnerName)}&partnerRole=${encodeURIComponent(partner.role)}` as never
        );
      } catch (error) {
        console.error('Failed to create or open chat.', error);
        Alert.alert(
          'Unable to open chat',
          'Please check your Firestore chat rules and try again.'
        );
      }
    },
    [user, userProfile]
  );

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
            coordinates.longitude,
            candidate.latitude as number,
            candidate.longitude as number
          ),
        }))
        .filter((candidate) => candidate.distanceInMeters <= selectedRadiusMeters)
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
  }, [coordinates, selectedRadiusMeters, user]);

  useEffect(() => {
    if (!user || !coordinates) {
      setNearbyUsers([]);
      return;
    }

    void loadNearbyUsers();
  }, [coordinates, loadNearbyUsers, selectedRadiusMeters, user]);

  useEffect(() => {
    if (!user || !coordinates) {
      setNearbyAlerts([]);
      setIsLoadingAlerts(false);
      return;
    }

    setIsLoadingAlerts(true);

    const unsubscribe = onSnapshot(
      collection(db, 'sosAlerts'),
      (snapshot) => {
        const nextAlerts = snapshot.docs
          .map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...(documentSnapshot.data() as SosAlertDocument),
          }))
          .filter(
            (alertDocument) =>
              typeof alertDocument.creatorId === 'string' &&
              typeof alertDocument.latitude === 'number' &&
              typeof alertDocument.longitude === 'number' &&
              typeof alertDocument.radiusMeters === 'number' &&
              !isTimestampExpired(alertDocument.expiresAt)
          )
          .map((alertDocument) => {
            const distanceInMeters = getDistanceInMeters(
              coordinates.latitude,
              coordinates.longitude,
              alertDocument.latitude,
              alertDocument.longitude
            );

            return {
              ...alertDocument,
              distanceInMeters,
              isOwnAlert: alertDocument.creatorId === user.uid,
            } satisfies NearbySosAlert;
          })
          .filter((alertDocument) => alertDocument.isOwnAlert || alertDocument.distanceInMeters <= alertDocument.radiusMeters)
          .sort((left, right) => {
            if (left.isOwnAlert && !right.isOwnAlert) {
              return -1;
            }

            if (!left.isOwnAlert && right.isOwnAlert) {
              return 1;
            }

            return left.distanceInMeters - right.distanceInMeters;
          });

        setNearbyAlerts(nextAlerts);
        setAlertsError('');
        setIsLoadingAlerts(false);
      },
      (error) => {
        console.error('Failed to load SOS alerts.', error);
        setAlertsError(
          'Unable to load SOS alerts. Make sure signed-in users can read the sosAlerts collection.'
        );
        setIsLoadingAlerts(false);
      }
    );

    return unsubscribe;
  }, [coordinates, user]);

  const activeOwnAlert = useMemo(
    () => nearbyAlerts.find((alertDocument) => alertDocument.isOwnAlert) ?? null,
    [nearbyAlerts]
  );

  const visibleEmergencyAlerts = useMemo(
    () => nearbyAlerts.filter((alertDocument) => !alertDocument.isOwnAlert),
    [nearbyAlerts]
  );

  const handleTriggerSos = useCallback(async () => {
    if (!user || !userProfile) {
      Alert.alert('Unable to send SOS', 'Your account is still loading. Please try again.');
      return;
    }

    if (!coordinates) {
      Alert.alert(
        'Location needed',
        'Turn on location and refresh your position before sending an SOS alert.'
      );
      return;
    }

    try {
      setIsSubmittingSos(true);

      await setDoc(
        doc(db, 'sosAlerts', user.uid),
        {
          anonymousName:
            userProfile.anonymousName ?? getFallbackAnonymousName(userProfile.role, user.uid),
          createdAt: serverTimestamp(),
          creatorId: user.uid,
          expiresAt: getSosExpiryTimestamp(),
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radiusMeters: selectedRadiusMeters,
          role: userProfile.role,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert(
        'SOS sent',
        `Signed-in users within ${formatRadiusLabel(selectedRadiusMeters)} can now see your emergency alert.`
      );
    } catch (error) {
      console.error('Failed to send SOS alert.', error);
      Alert.alert(
        'Unable to send SOS',
        'Please check your Firestore sosAlerts rules and try again.'
      );
    } finally {
      setIsSubmittingSos(false);
    }
  }, [coordinates, selectedRadiusMeters, user, userProfile]);

  const handleCancelSos = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setIsSubmittingSos(true);
      await deleteDoc(doc(db, 'sosAlerts', user.uid));
    } catch (error) {
      console.error('Failed to cancel SOS alert.', error);
      Alert.alert(
        'Unable to cancel SOS',
        'Please try again in a moment. Your active alert is still visible until then.'
      );
    } finally {
      setIsSubmittingSos(false);
    }
  }, [user]);

  return (
    <AppScrollScreen>
      <HeroPanel
        badge="Nearby"
        title="People around you"
        subtitle={`Browse locals and visitors inside your ${formatRadiusLabel(selectedRadiusMeters)} radius, or send an SOS if you need urgent help.`}
        aside={
          <View style={styles.heroAside}>
            <Text style={styles.heroCount}>{nearbyUsers.length}</Text>
            <Text style={styles.heroCountLabel}>found</Text>
          </View>
        }
      />

      <SurfaceCard>
        <SectionHeader
          kicker="Radius"
          title="Adjust your discovery range"
          subtitle="Choose how far NearNative should look when showing nearby locals and travellers."
        />
        <View style={styles.radiusWrap}>
          {RADIUS_OPTIONS_METERS.map((radiusOption) => {
            const isActive = radiusOption === selectedRadiusMeters;

            return (
              <Pressable
                key={radiusOption}
                onPress={() => setSelectedRadiusMeters(radiusOption)}
                style={[styles.radiusChip, isActive ? styles.radiusChipActive : null]}>
                <Text
                  style={[
                    styles.radiusChipText,
                    isActive ? styles.radiusChipTextActive : null,
                  ]}>
                  {formatRadiusLabel(radiusOption)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader
          kicker="Emergency"
          title="SOS assistance"
          subtitle="Send a time-limited emergency alert to signed-in users around you. Nearby users can open a private support chat immediately."
        />

        {alertsError ? <Text style={styles.errorText}>{alertsError}</Text> : null}
        {isLoadingAlerts ? <LoadingCard label="Checking active SOS alerts..." /> : null}

        {activeOwnAlert ? (
          <View style={[styles.sosCard, styles.ownSosCard]}>
            <View style={styles.sosTopRow}>
              <View style={styles.sosTextWrap}>
                <Text style={styles.sosTitle}>Your SOS alert is live</Text>
                <Text style={styles.sosDescription}>
                  Nearby users inside {formatRadiusLabel(activeOwnAlert.radiusMeters)} can see your
                  request for help right now.
                </Text>
              </View>
              <Pill label="Active" tone="danger" />
            </View>
            <ActionButton
              label="Cancel SOS alert"
              loading={isSubmittingSos}
              onPress={() => {
                void handleCancelSos();
              }}
              tone="danger"
            />
          </View>
        ) : (
          <View style={[styles.sosCard, styles.sendSosCard]}>
            <View style={styles.sosTopRow}>
              <View style={styles.sosTextWrap}>
                <Text style={styles.sosTitle}>Need urgent help?</Text>
                <Text style={styles.sosDescription}>
                  This sends an alert to nearby signed-in locals and travellers within your current
                  radius.
                </Text>
              </View>
              <Pill label="SOS" tone="danger" />
            </View>
            <ActionButton
              label={`Send SOS to ${formatRadiusLabel(selectedRadiusMeters)}`}
              loading={isSubmittingSos}
              onPress={() => {
                void handleTriggerSos();
              }}
              tone="danger"
            />
          </View>
        )}

        {!isLoadingAlerts && visibleEmergencyAlerts.length > 0 ? (
          <View style={styles.emergencyFeed}>
            <SectionHeader
              kicker="Live Alerts"
              title="Nearby emergency requests"
              subtitle="Open a private chat if you can assist someone nearby."
            />

            {visibleEmergencyAlerts.map((alertDocument) => (
              <View key={alertDocument.id} style={styles.alertCard}>
                <View style={styles.userTopRow}>
                  <View style={styles.userTitleWrap}>
                    <Text style={styles.userName}>{alertDocument.anonymousName}</Text>
                    <Text style={styles.userMeta}>{getRoleLabel(alertDocument.role)}</Text>
                  </View>
                  <Pill label={formatApproximateDistance(alertDocument.distanceInMeters)} tone="danger" />
                </View>

                <Text style={styles.alertText}>
                  Emergency alert visible within {formatRadiusLabel(alertDocument.radiusMeters)}.
                </Text>

                <ActionButton
                  label="Open support chat"
                  tone="dark"
                  onPress={() => {
                    void openDirectChat({
                      anonymousName: alertDocument.anonymousName,
                      role: alertDocument.role,
                      uid: alertDocument.creatorId,
                    });
                  }}
                />
              </View>
            ))}
          </View>
        ) : null}

        {!isLoadingAlerts && !alertsError && !activeOwnAlert && visibleEmergencyAlerts.length === 0 ? (
          <EmptyStateCard
            title="No active SOS nearby"
            description="If someone nearby triggers an emergency alert, it will appear here instantly."
          />
        ) : null}
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader
          kicker="Location"
          title="Your live position"
          subtitle="Location is refreshed on app open so the nearby list and SOS coverage stay relevant."
        />
        <View style={styles.metricsGrid}>
          <MetricRow label="Permission" value={permissionStatus ?? 'Checking...'} />
          <MetricRow
            label="Latitude"
            value={coordinates ? coordinates.latitude.toFixed(6) : 'Not available'}
          />
          <MetricRow
            label="Longitude"
            value={coordinates ? coordinates.longitude.toFixed(6) : 'Not available'}
          />
        </View>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader
          kicker="Nearby List"
          title="Visible users"
          subtitle={`${nearbyUsers.length} user${nearbyUsers.length === 1 ? '' : 's'} currently inside your ${formatRadiusLabel(selectedRadiusMeters)} radius`}
        />

        {usersError ? <Text style={styles.errorText}>{usersError}</Text> : null}

        {isLoadingUsers ? <LoadingCard label="Refreshing nearby users..." /> : null}

        {!isLoadingUsers && !usersError && nearbyUsers.length === 0 ? (
          <EmptyStateCard
            title="No nearby users yet"
            description="Ask another account to sign in nearby with location enabled, then refresh this screen."
          />
        ) : null}

        {!isLoadingUsers &&
          nearbyUsers.map((nearbyUser) => {
            const partnerName =
              nearbyUser.anonymousName ?? getFallbackAnonymousName(nearbyUser.role, nearbyUser.uid);

            return (
              <View key={nearbyUser.uid} style={styles.userCard}>
                <View style={styles.userTopRow}>
                  <View style={styles.userTitleWrap}>
                    <Text style={styles.userName}>{partnerName}</Text>
                    <Text style={styles.userMeta}>{getRoleLabel(nearbyUser.role)}</Text>
                  </View>
                  <Pill label={formatApproximateDistance(nearbyUser.distanceInMeters)} />
                </View>

                <ActionButton
                  label="Start anonymous chat"
                  tone="dark"
                  onPress={() => {
                    void openDirectChat({
                      anonymousName: nearbyUser.anonymousName,
                      role: nearbyUser.role,
                      uid: nearbyUser.uid,
                    });
                  }}
                />
              </View>
            );
          })}

        <View style={styles.refreshRow}>
          <ActionButton
            label="Refresh nearby users"
            loading={isSyncingLocation || isLoadingUsers}
            onPress={() => {
              void refreshLocation();
            }}
          />
        </View>
      </SurfaceCard>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: AppTheme.colors.cardAlt,
    borderColor: AppTheme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    marginTop: 14,
    padding: 16,
  },
  alertText: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  emergencyFeed: {
    marginTop: 18,
  },
  errorText: {
    color: AppTheme.colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  heroAside: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  heroCount: {
    color: AppTheme.colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  heroCountLabel: {
    color: AppTheme.colors.darkMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metricsGrid: {
    gap: 14,
    marginTop: 16,
  },
  ownSosCard: {
    backgroundColor: AppTheme.colors.dangerSoft,
    borderColor: '#f4b5b5',
  },
  radiusChip: {
    backgroundColor: AppTheme.colors.cardAlt,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  radiusChipActive: {
    backgroundColor: AppTheme.colors.accent,
    borderColor: AppTheme.colors.accent,
  },
  radiusChipText: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  radiusChipTextActive: {
    color: AppTheme.colors.white,
  },
  radiusWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  refreshRow: {
    marginTop: 16,
  },
  sendSosCard: {
    marginTop: 16,
  },
  sosCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    marginTop: 16,
    padding: 16,
  },
  sosDescription: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  sosTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  sosTitle: {
    color: AppTheme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sosTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  userCard: {
    backgroundColor: AppTheme.colors.cardAlt,
    borderColor: AppTheme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    marginTop: 14,
    padding: 16,
  },
  userMeta: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  userName: {
    color: AppTheme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  userTitleWrap: {
    flex: 1,
    marginRight: 12,
  },
  userTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
