import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { ActionButton, EmptyStateCard, LoadingCard, Pill } from '@/components/ui/app-primitives';
import { AppTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import {
  buildChatParticipantFromProfile,
  buildChatParticipantFromRoute,
  getChatExpiryTimestamp,
  isTimestampExpired,
} from '@/lib/chat';
import { db } from '@/lib/firebase';
import type { ChatDocument, ChatMessage } from '@/types/chat';
import type { UserRole } from '@/types/user';

function normalizeRole(value: string | string[] | undefined): UserRole {
  return value === 'local' ? 'local' : 'visitor';
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    chatId: string;
    partnerId?: string;
    partnerName?: string;
    partnerRole?: string;
  }>();
  const { user } = useAuth();
  const { isProfileLoading, userProfile } = useUserProfile();
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [messageText, setMessageText] = useState('');
  const [chatError, setChatError] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const chatId = typeof params.chatId === 'string' ? params.chatId : '';
  const partnerId = typeof params.partnerId === 'string' ? params.partnerId : '';
  const partnerName = typeof params.partnerName === 'string' ? params.partnerName : '';
  const partnerRole = normalizeRole(params.partnerRole);

  const partner = useMemo(
    () => buildChatParticipantFromRoute(partnerId, partnerName, partnerRole),
    [partnerId, partnerName, partnerRole]
  );

  useEffect(() => {
    if (!chatId) {
      setChatError('This chat could not be opened.');
      setIsLoadingMessages(false);
      return;
    }

    const chatRef = doc(db, 'chats', chatId);
    const unsubscribeChat = onSnapshot(
      chatRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setIsExpired(false);
          return;
        }

        const chat = snapshot.data() as ChatDocument;
        setIsExpired(isTimestampExpired(chat.expiresAt));
      },
      (error) => {
        console.error('Failed to listen to chat metadata.', error);
        setChatError('Unable to load this chat right now.');
      }
    );

    const messagesQuery = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs
          .map((messageSnapshot) => ({
            id: messageSnapshot.id,
            ...(messageSnapshot.data() as ChatMessage),
          }))
          .filter((message) => !isTimestampExpired(message.expiresAt));

        setMessages(nextMessages);
        setIsLoadingMessages(false);
      },
      (error) => {
        console.error('Failed to listen to messages.', error);
        setChatError(
          'Unable to load chat messages. Make sure your Firestore rules allow participants to read chats and messages.'
        );
        setIsLoadingMessages(false);
      }
    );

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [chatId]);

  const handleSendMessage = async () => {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || !user || !partnerId || !userProfile || !chatId) {
      return;
    }

    try {
      setIsSending(true);
      setChatError('');

      const expiresAt = getChatExpiryTimestamp();
      const chatRef = doc(db, 'chats', chatId);
      const currentParticipant = buildChatParticipantFromProfile(userProfile);
      const partnerParticipant = buildChatParticipantFromRoute(
        partner.uid,
        partner.anonymousName,
        partner.role
      );

      await setDoc(
        chatRef,
        {
          expiresAt,
          lastMessageText: trimmedMessage,
          lastMessageTimestamp: serverTimestamp(),
          participantIds: [currentParticipant.uid, partnerParticipant.uid].sort(),
          participants: [currentParticipant, partnerParticipant],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        expiresAt,
        senderId: user.uid,
        text: trimmedMessage,
        timestamp: serverTimestamp(),
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message.', error);
      setChatError('Unable to send the message right now. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height', default: undefined })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={styles.flex}>
        <View style={styles.headerShell}>
          <View style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <ActionButton label="Back" tone="ghost" onPress={() => router.back()} />
              <Pill label={partner.role === 'local' ? 'Local' : 'Visitor'} tone="neutral" />
            </View>
            <Text style={styles.headerTitle}>{partner.anonymousName}</Text>
            <Text style={styles.headerSubtitle}>
              Private anonymous chat with real-time updates and 48 hour expiry.
            </Text>
          </View>
        </View>

        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.messagesContent}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.messagesArea}>
          {isLoadingMessages ? <LoadingCard label="Loading messages..." /> : null}

          {!isLoadingMessages && messages.length === 0 && !chatError ? (
            <EmptyStateCard
              title="Start the conversation"
              description="Send the first message and this chat will update live on both devices."
            />
          ) : null}

          {!isLoadingMessages &&
            messages.map((message) => {
              const isOwnMessage = message.senderId === user?.uid;

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
                  ]}>
                  <Text style={isOwnMessage ? styles.ownMessageText : styles.otherMessageText}>
                    {message.text}
                  </Text>
                </View>
              );
            })}
        </ScrollView>

        {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
        {isExpired ? (
          <Text style={styles.warningText}>
            This chat expired after 48 hours. Sending a new message will start it again.
          </Text>
        ) : null}
        {isProfileLoading ? (
          <Text style={styles.helperText}>Preparing your anonymous profile...</Text>
        ) : null}

        <View style={[styles.composerShell, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.composer}>
            <TextInput
              editable={!isSending && !isProfileLoading}
              multiline
              onChangeText={setMessageText}
              placeholder="Type your message..."
              placeholderTextColor="#94a3b8"
              style={styles.input}
              textAlignVertical="top"
              value={messageText}
            />
            <ActionButton
              disabled={!messageText.trim()}
              label="Send"
              loading={isSending}
              onPress={() => {
                void handleSendMessage();
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  composer: {
    alignItems: 'flex-end',
    backgroundColor: AppTheme.colors.card,
    borderColor: AppTheme.colors.border,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    ...AppTheme.shadow.card,
  },
  composerShell: {
    backgroundColor: AppTheme.colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  errorText: {
    color: AppTheme.colors.danger,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  flex: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: AppTheme.colors.dark,
    borderRadius: 30,
    padding: 20,
  },
  headerShell: {
    backgroundColor: AppTheme.colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerSubtitle: {
    color: AppTheme.colors.darkMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  headerTitle: {
    color: AppTheme.colors.white,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 14,
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helperText: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: AppTheme.colors.cardAlt,
    borderColor: AppTheme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    color: AppTheme.colors.text,
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  messageBubble: {
    borderRadius: 24,
    marginBottom: 12,
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messagesArea: {
    backgroundColor: AppTheme.colors.background,
    flex: 1,
  },
  messagesContent: {
    gap: 4,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
  },
  otherMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: AppTheme.colors.card,
    borderColor: AppTheme.colors.border,
    borderWidth: 1,
  },
  otherMessageText: {
    color: AppTheme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  ownMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: AppTheme.colors.accent,
  },
  ownMessageText: {
    color: AppTheme.colors.white,
    fontSize: 15,
    lineHeight: 22,
  },
  safeArea: {
    backgroundColor: AppTheme.colors.background,
    flex: 1,
  },
  warningText: {
    color: AppTheme.colors.accentDeep,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    textAlign: 'center',
  },
});
