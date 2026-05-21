import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { auth, db, storage } from '@/lib/firebase';
import { generateAnonymousName } from '@/lib/anonymous-name';
import type { UserRole } from '@/types/user';

type SignupDocumentInput = {
  mimeType?: string;
  name: string;
  uri: string;
};

type SignupInput = {
  localAddress?: string;
  localDocument?: SignupDocumentInput | null;
  fullName?: string;
  email: string;
  password: string;
  role: UserRole;
};

type AuthContextValue = {
  isEmailVerified: boolean;
  isAuthLoading: boolean;
  isAuthOperationLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  reloadUser: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  user: FirebaseUser | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthOperationLoading, setIsAuthOperationLoading] = useState(false);

  const syncVerifiedUserMetadata = async (currentUser: FirebaseUser) => {
    if (!currentUser.emailVerified) {
      return;
    }

    await setDoc(
      doc(db, 'users', currentUser.uid),
      {
        emailVerifiedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

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
      isEmailVerified: user?.emailVerified ?? false,
      isAuthOperationLoading,
      login: async (email, password) => {
        setIsAuthOperationLoading(true);

        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          await syncVerifiedUserMetadata(credential.user);
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
      requestPasswordReset: async (email) => {
        setIsAuthOperationLoading(true);

        try {
          await sendPasswordResetEmail(auth, email);
        } finally {
          setIsAuthOperationLoading(false);
        }
      },
      reloadUser: async () => {
        if (!auth.currentUser) {
          return;
        }

        setIsAuthOperationLoading(true);

        try {
          await reload(auth.currentUser);
          setUser(auth.currentUser ? { ...auth.currentUser } : null);

          if (auth.currentUser?.emailVerified) {
            await syncVerifiedUserMetadata(auth.currentUser);
          }
        } finally {
          setIsAuthOperationLoading(false);
        }
      },
      resendVerificationEmail: async () => {
        if (!auth.currentUser) {
          return;
        }

        setIsAuthOperationLoading(true);

        try {
          await sendEmailVerification(auth.currentUser);
        } finally {
          setIsAuthOperationLoading(false);
        }
      },
      signup: async ({ email, password, role, fullName, localAddress, localDocument }) => {
        let uploadedDocumentPath = '';

        try {
          setIsAuthOperationLoading(true);

          const credential = await createUserWithEmailAndPassword(auth, email, password);
          const isLocalApplicant = role === 'local';
          const hasVerificationSubmission =
            isLocalApplicant &&
            Boolean(fullName?.trim()) &&
            Boolean(localAddress?.trim()) &&
            Boolean(localDocument);
          const activeRole: UserRole = role;

          if (hasVerificationSubmission && fullName && localAddress && localDocument) {
            const safeFileName = `${Date.now()}-${localDocument.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            uploadedDocumentPath = `local-verification/${credential.user.uid}/${safeFileName}`;
            const storageRef = ref(storage, uploadedDocumentPath);
            const uploadResponse = await fetch(localDocument.uri);
            const documentBlob = await uploadResponse.blob();

            await uploadBytes(storageRef, documentBlob, {
              contentType: localDocument.mimeType || 'application/octet-stream',
            });

            const documentUrl = await getDownloadURL(storageRef);

            await setDoc(doc(db, 'localVerificationRequests', credential.user.uid), {
              address: localAddress.trim(),
              createdAt: serverTimestamp(),
              documentMimeType: localDocument.mimeType || null,
              documentName: localDocument.name,
              documentPath: uploadedDocumentPath,
              documentUrl,
              email,
              fullName: fullName.trim(),
              status: 'pending',
              uid: credential.user.uid,
              updatedAt: serverTimestamp(),
            });
          }

          await setDoc(doc(db, 'users', credential.user.uid), {
            anonymousName: generateAnonymousName(activeRole),
            emailVerifiedAt: null,
            uid: credential.user.uid,
            email,
            fullName: fullName?.trim() || null,
            isLocalVerified: role === 'local',
            localAddress: localAddress?.trim() || null,
            localVerificationStatus: hasVerificationSubmission ? 'pending' : 'not_requested',
            requestedRole: role,
            role: activeRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          await sendEmailVerification(credential.user);
        } catch (error) {
          console.error('Failed to create Firestore user document during signup.', error);

          if (uploadedDocumentPath) {
            try {
              await deleteObject(ref(storage, uploadedDocumentPath));
            } catch {
              // Best-effort cleanup only.
            }
          }

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
