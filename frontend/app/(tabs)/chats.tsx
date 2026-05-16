import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import {
  ActionButton,
  AppScrollScreen,
  EmptyStateCard,
  HeroPanel,
  LoadingCard,
  Pill,
  SectionHeader,
  SurfaceCard,
} from '@/components/ui/app-primitives';
import { AppTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getOtherParticipant, getTimestampMillis, isTimestampExpired } from '@/lib/chat';
import { db } from '@/lib/firebase';
import type { ChatDocument } from '@/types/chat';

type ChatListItem = ChatDocument & {
  id: string;
};

export default function ChatsScreen() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    if (!user) {
      setChats([]);
      setIsLoadingChats(false);
      return;
    }

    setIsLoadingChats(true);

    const chatsQuery = query(collection(db, 'chats'), where('participantIds', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const nextChats = snapshot.docs
          .map((chatSnapshot) => ({
            id: chatSnapshot.id,
            ...(chatSnapshot.data() as ChatDocument),
          }))
          .filter((chat) => !isTimestampExpired(chat.expiresAt))
          .sort((left, right) => getTimestampMillis(right.updatedAt) - getTimestampMillis(left.updatedAt));

        setChats(nextChats);
        setChatError('');
        setIsLoadingChats(false);
      },
      (error) => {
        console.error('Failed to listen to chats list.', error);
        setChatError(
          'Unable to load chats. Make sure your Firestore rules allow participants to read chats.'
        );
        setIsLoadingChats(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return (
    <AppScrollScreen>
      <HeroPanel
        badge="Chats"
        title="Active conversations"
        subtitle="Your anonymous conversations update in real time and stay visible for 48 hours from the latest message."
        aside={
          <View style={styles.heroAside}>
            <Text style={styles.heroCount}>{chats.length}</Text>
            <Text style={styles.heroCountLabel}>active</Text>
          </View>
        }
      />

      <SurfaceCard>
        <SectionHeader
          kicker="Inbox"
          title="Chat list"
          subtitle="Open any conversation to continue where you left off."
        />

        {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}

        {isLoadingChats ? <LoadingCard label="Loading your conversations..." /> : null}

        {!isLoadingChats && !chatError && chats.length === 0 ? (
          <EmptyStateCard
            title="No chats yet"
            description="Start a conversation from the Nearby tab and it will appear here automatically."
          />
        ) : null}

        {!isLoadingChats &&
          chats.map((chat) => {
            const partner = getOtherParticipant(chat, user?.uid ?? '');

            if (!partner || !partner.uid) {
              return null;
            }

            return (
              <View key={chat.id} style={styles.chatCard}>
                <View style={styles.chatTopRow}>
                  <View style={styles.chatTextWrap}>
                    <Text style={styles.chatName}>{partner.anonymousName}</Text>
                    <Text style={styles.chatRole}>
                      {partner.role === 'local' ? 'Local' : 'Visitor'}
                    </Text>
                  </View>
                  <Pill label="Live" tone="neutral" />
                </View>

                <Text numberOfLines={2} style={styles.previewText}>
                  {chat.lastMessageText ?? 'No messages yet'}
                </Text>

                <ActionButton
                  label="Open chat"
                  tone="ghost"
                  onPress={() => {
                    router.push(
                      `/chat/${chat.id}?partnerId=${encodeURIComponent(partner.uid)}&partnerName=${encodeURIComponent(partner.anonymousName)}&partnerRole=${encodeURIComponent(partner.role)}` as never
                    );
                  }}
                />
              </View>
            );
          })}
      </SurfaceCard>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  chatCard: {
    backgroundColor: AppTheme.colors.cardAlt,
    borderColor: AppTheme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    marginTop: 14,
    padding: 16,
  },
  chatName: {
    color: AppTheme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  chatRole: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  chatTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  chatTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
  previewText: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
});
