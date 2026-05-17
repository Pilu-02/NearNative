import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthShell } from '@/components/auth/auth-shell';
import { FormInput } from '@/components/auth/form-input';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const { login, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    let hasError = false;

    if (!trimmedEmail) {
      setEmailError('Email is required.');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login(trimmedEmail, password);
    } catch (error) {
      Alert.alert('Login failed', getFirebaseErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError('Enter your email first so we know where to send the reset link.');
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset(trimmedEmail);
      Alert.alert(
        'Reset link sent',
        'If this email is registered, a password reset link has been sent to the inbox.'
      );
    } catch (error) {
      Alert.alert('Reset failed', getFirebaseErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      badge="Welcome back"
      title="Sign in to NearNative"
      subtitle="Connect with trusted locals nearby and ask for help without sharing your identity.">
      <View style={styles.form}>
        <FormInput
          autoCapitalize="none"
          autoComplete="email"
          error={emailError}
          keyboardType="email-address"
          label="Email"
          onChangeText={(value) => {
            setEmail(value);
            if (emailError) {
              setEmailError('');
            }
          }}
          placeholder="you@example.com"
          value={email}
        />
        <FormInput
          autoComplete="password"
          error={passwordError}
          label="Password"
          onChangeText={(value) => {
            setPassword(value);
            if (passwordError) {
              setPasswordError('');
            }
          }}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
        />

        <Pressable
          disabled={isSubmitting}
          onPress={() => {
            void handleForgotPassword();
          }}
          style={({ pressed }) => [
            styles.forgotPasswordButton,
            pressed && !isSubmitting ? styles.forgotPasswordPressed : null,
          ]}>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </Pressable>

        <Pressable
          disabled={isSubmitting}
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isSubmitting ? styles.primaryButtonPressed : null,
            isSubmitting ? styles.primaryButtonDisabled : null,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign in</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to NearNative?</Text>
          <Link href="/signup" style={styles.footerLink}>
            Create an account
          </Link>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -6,
  },
  forgotPasswordPressed: {
    opacity: 0.72,
  },
  forgotPasswordText: {
    color: '#1565c0',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  footerLink: {
    color: '#1565c0',
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 15,
  },
  form: {
    gap: 18,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1565c0',
    borderRadius: 18,
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: '#1565c0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
