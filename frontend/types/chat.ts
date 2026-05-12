import type { UserRole } from '@/types/user';

export type ChatParticipant = {
  anonymousName: string;
  role: UserRole;
  uid: string;
};

export type ChatDocument = {
  createdAt?: unknown;
  expiresAt?: unknown;
  lastMessageText?: string;
  lastMessageTimestamp?: unknown;
  participantIds: string[];
  participants: ChatParticipant[];
  updatedAt?: unknown;
};

export type ChatMessage = {
  expiresAt?: unknown;
  senderId: string;
  text: string;
  timestamp?: unknown;
};
