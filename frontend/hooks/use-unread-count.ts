import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import type { ChatDocument } from '@/types/chat';

export function useUnreadChatCount() {
  const { user } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setTotalUnreadCount(0);
      return;
    }

    const chatsQuery = query(collection(db, 'chats'), where('participantIds', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        let unreadCount = 0;
        snapshot.docs.forEach((doc) => {
          const chat = doc.data() as ChatDocument;
          unreadCount += chat.unreadCounts?.[user.uid] ?? 0;
        });
        setTotalUnreadCount(unreadCount);
      },
      (error) => {
        console.error('Failed to listen to unread count.', error);
        setTotalUnreadCount(0);
      }
    );

    return unsubscribe;
  }, [user]);

  return totalUnreadCount;
}
