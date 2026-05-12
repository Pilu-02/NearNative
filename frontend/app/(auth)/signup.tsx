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
import { useAuth } from '@/contexts/auth-context';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import type { UserRole } from '@/types/user';

const roles: { label: string; value: UserRole; description: string }[] = [
  {
    label: 'Local',
    value: 'local',
    description: 'Share local knowledge with visitors nearby.',
  },
  {
    label: 'Visitor',
    value: 'visitor',
    description: 'Ask for help and recommendations around you.',
  },
];

export default function SignupScreen() {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
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
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (!selectedRole) {
      setRoleError('Please choose whether you are a local or visitor.');
      hasError = true;
    } else {
      setRoleError('');
    }

    if (hasError || !selectedRole) {
      return;
    }

    try {
      setIsSubmitting(true);
      await signup({
        email: trimmedEmail,
        password,
        role: selectedRole,
      });
    } catch (error) {
      Alert.alert('Signup failed', getFirebaseErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      badge="Join the network"
      title="Create your NearNative account"
      subtitle="Choose how you want to use the app today. You can build the rest of the profile in the next phase.">
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
          autoComplete="new-password"
          error={passwordError}
          label="Password"
          onChangeText={(value) => {
            setPassword(value);
            if (passwordError) {
              setPasswordError('');
            }
          }}
          placeholder="Minimum 6 characters"
          secureTextEntry
          value={password}
        />

        <View style={styles.roleSection}>
          <Text style={styles.sectionLabel}>Choose your role</Text>
          <View style={styles.roleGrid}>
            {roles.map((role) => {
              const isSelected = selectedRole === role.value;

              return (
                <Pressable
                  key={role.value}
                  onPress={() => {
                    setSelectedRole(role.value);
                    if (roleError) {
                      setRoleError('');
                    }
                  }}
                  style={({ pressed }) => [
                    styles.roleCard,
                    isSelected ? styles.roleCardSelected : null,
                    pressed ? styles.roleCardPressed : null,
                  ]}>
                  <Text style={[styles.roleTitle, isSelected ? styles.roleTitleSelected : null]}>
                    {role.label}
                  </Text>
                  <Text
                    style={[
                      styles.roleDescription,
                      isSelected ? styles.roleDescriptionSelected : null,
                    ]}>
                    {role.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {roleError ? <Text style={styles.errorText}>{roleError}</Text> : null}
        </View>

        <Pressable
          disabled={isSubmitting}
          onPress={handleSignup}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isSubmitting ? styles.primaryButtonPressed : null,
            isSubmitting ? styles.primaryButtonDisabled : null,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create account</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/login" style={styles.footerLink}>
            Sign in
          </Link>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#c62828',
    fontSize: 13,
    marginTop: 8,
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
  roleCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ee',
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  roleCardPressed: {
    opacity: 0.92,
  },
  roleCardSelected: {
    backgroundColor: '#e8f1ff',
    borderColor: '#1565c0',
  },
  roleDescription: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 20,
  },
  roleDescriptionSelected: {
    color: '#1d4f91',
  },
  roleGrid: {
    gap: 12,
  },
  roleSection: {
    marginTop: 4,
  },
  roleTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  roleTitleSelected: {
    color: '#0c4a8a',
  },
  sectionLabel: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
});
