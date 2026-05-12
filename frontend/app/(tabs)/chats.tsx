import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

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
    <ScrollView
      bounces={false}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.badge}>Anonymous chats</Text>
        <Text style={styles.title}>Your active conversations.</Text>
        <Text style={styles.subtitle}>
          Chats update in real time and stay visible for 48 hours from the latest message.
        </Text>
      </View>

      <View style={styles.listCard}>
        <Text style={styles.sectionTitle}>Chat list</Text>
        <Text style={styles.helperText}>
          {isLoadingChats
            ? 'Loading your conversations...'
            : `${chats.length} active chat${chats.length === 1 ? '' : 's'}`}
        </Text>

        {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}

        {isLoadingChats ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#1565c0" />
          </View>
        ) : null}

        {!isLoadingChats && !chatError && chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptyText}>
              Start a conversation from the Nearby tab and it will appear here automatically.
            </Text>
          </View>
        ) : null}

        {chats.map((chat) => {
          const partner = getOtherParticipant(chat, user?.uid ?? '');

          if (!partner || !partner.uid) {
            return null;
          }

          return (
            <Pressable
              key={chat.id}
              onPress={() => {
                router.push(
                  `/chat/${chat.id}?partnerId=${encodeURIComponent(partner.uid)}&partnerName=${encodeURIComponent(partner.anonymousName)}&partnerRole=${encodeURIComponent(partner.role)}` as never
                );
              }}
              style={({ pressed }) => [
                styles.chatRow,
                pressed ? styles.chatRowPressed : null,
              ]}>
              <View style={styles.chatRowTextWrap}>
                <Text style={styles.chatName}>{partner.anonymousName}</Text>
                <Text style={styles.chatRole}>{partner.role === 'local' ? 'Local' : 'Visitor'}</Text>
                <Text numberOfLines={1} style={styles.chatPreview}>
                  {chat.lastMessageText ?? 'No messages yet'}
                </Text>
              </View>
              <Text style={styles.openLabel}>Open</Text>
            </Pressable>
          );
        })}
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
  chatName: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  chatPreview: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
  },
  chatRole: {
    color: '#1565c0',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  chatRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 16,
  },
  chatRowPressed: {
    opacity: 0.92,
  },
  chatRowTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  content: {
    padding: 22,
    paddingTop: 74,
    paddingBottom: 36,
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    marginTop: 12,
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
  errorText: {
    color: '#c62828',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  helperText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 22,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    marginBottom: 18,
    padding: 24,
  },
  listCard: {
    backgroundColor: '#fff',
    borderColor: '#dbe4ee',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  loaderWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  openLabel: {
    color: '#1565c0',
    fontSize: 14,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: '#f4f8fc',
    flex: 1,
  },
  sectionTitle: {
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
});
