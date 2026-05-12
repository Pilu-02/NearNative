import { Timestamp } from 'firebase/firestore';

import { getFallbackAnonymousName } from '@/lib/anonymous-name';
import type { ChatDocument, ChatParticipant } from '@/types/chat';
import type { UserProfile, UserRole } from '@/types/user';

const CHAT_TTL_HOURS = 48;

export function getDirectChatId(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join('_');
}

export function getChatExpiryTimestamp() {
  return Timestamp.fromDate(new Date(Date.now() + CHAT_TTL_HOURS * 60 * 60 * 1000));
}

export function isTimestampExpired(value: unknown) {
  if (!(value instanceof Timestamp)) {
    return false;
  }

  return value.toMillis() <= Date.now();
}

export function getOtherParticipant(chat: ChatDocument, currentUserId: string) {
  return Array.isArray(chat.participants)
    ? chat.participants.find((participant) => participant.uid !== currentUserId) ?? null
    : null;
}

export function getTimestampMillis(value: unknown) {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

export function buildChatParticipantFromProfile(profile: Pick<UserProfile, 'anonymousName' | 'role' | 'uid'>) {
  return {
    anonymousName:
      profile.anonymousName ?? getFallbackAnonymousName(profile.role, profile.uid),
    role: profile.role,
    uid: profile.uid,
  } satisfies ChatParticipant;
}

export function buildChatParticipantFromRoute(
  uid: string,
  anonymousName: string | undefined,
  role: UserRole
) {
  return {
    anonymousName: anonymousName || getFallbackAnonymousName(role, uid),
    role,
    uid,
  } satisfies ChatParticipant;
}
