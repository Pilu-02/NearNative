type FirebaseLikeError = {
  code?: string;
  message?: string;
};

export function getFirebaseErrorMessage(error: unknown) {
  const firebaseError = error as FirebaseLikeError;

  switch (firebaseError.code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
      return 'The email or password is incorrect.';
    case 'auth/user-not-found':
      return 'No account was found for that email.';
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/weak-password':
      return 'Please choose a stronger password with at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    case 'permission-denied':
      return 'Firestore permission denied. Please review your security rules.';
    default:
      return firebaseError.message ?? 'Something went wrong. Please try again.';
  }
}
