import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{partner.anonymousName}</Text>
            <Text style={styles.headerSubtitle}>
              {partner.role === 'local' ? 'Local' : 'Visitor'} anonymous chat
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          style={styles.messagesArea}>
          {isLoadingMessages ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color="#1565c0" />
              <Text style={styles.helperText}>Loading messages...</Text>
            </View>
          ) : null}

          {!isLoadingMessages && messages.length === 0 && !chatError ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptyText}>
                This is a private anonymous one-to-one chat. Messages update in real time and expire after 48 hours.
              </Text>
            </View>
          ) : null}

          {messages.map((message) => {
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
          <Text style={styles.errorText}>
            This chat expired after 48 hours. Sending a new message will start it again.
          </Text>
        ) : null}
        {isProfileLoading ? (
          <Text style={styles.helperText}>Preparing your anonymous profile...</Text>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            editable={!isSending && !isProfileLoading}
            multiline
            onChangeText={setMessageText}
            placeholder="Type your message..."
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={messageText}
          />
          <Pressable
            disabled={isSending || isProfileLoading || !messageText.trim()}
            onPress={() => {
              void handleSendMessage();
            }}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && !isSending ? styles.sendButtonPressed : null,
              isSending || isProfileLoading || !messageText.trim() ? styles.sendButtonDisabled : null,
            ]}>
            {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Send</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  backButtonText: {
    color: '#1565c0',
    fontSize: 14,
    fontWeight: '700',
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopColor: '#dbe4ee',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderColor: '#dbe4ee',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#f4f8fc',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
  helperText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ee',
    borderRadius: 18,
    borderWidth: 1,
    color: '#0f172a',
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  loaderWrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  messageBubble: {
    borderRadius: 22,
    marginBottom: 10,
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messagesArea: {
    backgroundColor: '#f4f8fc',
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  otherMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderColor: '#dbe4ee',
    borderWidth: 1,
  },
  otherMessageText: {
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 22,
  },
  ownMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1565c0',
  },
  ownMessageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  safeArea: {
    backgroundColor: '#f4f8fc',
    flex: 1,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#1565c0',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 76,
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonPressed: {
    opacity: 0.9,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
