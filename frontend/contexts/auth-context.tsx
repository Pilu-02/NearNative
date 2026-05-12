import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import { generateAnonymousName } from '@/lib/anonymous-name';
import type { UserRole } from '@/types/user';

type SignupInput = {
  email: string;
  password: string;
  role: UserRole;
};

type AuthContextValue = {
  isAuthLoading: boolean;
  isAuthOperationLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  user: FirebaseUser | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthOperationLoading, setIsAuthOperationLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthLoading,
      isAuthOperationLoading,
      login: async (email, password) => {
        setIsAuthOperationLoading(true);

        try {
          await signInWithEmailAndPassword(auth, email, password);
        } finally {
          setIsAuthOperationLoading(false);
        }
      },
      logout: async () => {
        setIsAuthOperationLoading(true);

        try {
          await signOut(auth);
        } finally {
          setIsAuthOperationLoading(false);
        }
      },
      signup: async ({ email, password, role }) => {
        try {
          setIsAuthOperationLoading(true);

          const credential = await createUserWithEmailAndPassword(auth, email, password);

          await setDoc(doc(db, 'users', credential.user.uid), {
            anonymousName: generateAnonymousName(role),
            uid: credential.user.uid,
            email,
            role,
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('Failed to create Firestore user document during signup.', error);

          if (auth.currentUser) {
            try {
              await auth.currentUser.delete();
            } catch {
              await signOut(auth);
            }
          }

          throw error;
        } finally {
          setIsAuthOperationLoading(false);
        }
      },
      user,
    }),
    [isAuthLoading, isAuthOperationLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
