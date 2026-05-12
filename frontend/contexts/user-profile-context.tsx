import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types/user';

type UserProfileContextValue = {
  isProfileLoading: boolean;
  userProfile: UserProfile | null;
};

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        setUserProfile(
          snapshot.exists()
            ? ({
                uid: snapshot.id,
                ...(snapshot.data() as Omit<UserProfile, 'uid'>),
              } as UserProfile)
            : null
        );
        setIsProfileLoading(false);
      },
      (error) => {
        console.error('Failed to load current user profile.', error);
        setUserProfile(null);
        setIsProfileLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const value = useMemo<UserProfileContextValue>(
    () => ({
      isProfileLoading,
      userProfile,
    }),
    [isProfileLoading, userProfile]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);

  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider.');
  }

  return context;
}
