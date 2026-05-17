import * as DocumentPicker from 'expo-document-picker';
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
import { AppTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import type { UserRole } from '@/types/user';

const roles: { description: string; label: string; value: UserRole }[] = [
  {
    label: 'Local',
    value: 'local',
    description: 'Apply to guide nearby visitors after verification.',
  },
  {
    label: 'Visitor',
    value: 'visitor',
    description: 'Ask for help and recommendations around you.',
  },
];

type PickedDocument = {
  mimeType?: string;
  name: string;
  uri: string;
};

export default function SignupScreen() {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState('');
  const [localAddress, setLocalAddress] = useState('');
  const [pickedDocument, setPickedDocument] = useState<PickedDocument | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [isPickingDocument, setIsPickingDocument] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLocalSignup = selectedRole === 'local';

  const pickVerificationDocument = async () => {
    try {
      setIsPickingDocument(true);
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/pdf', 'image/*'],
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      setPickedDocument({
        mimeType: asset.mimeType,
        name: asset.name,
        uri: asset.uri,
      });
      setDocumentError('');
    } catch {
      Alert.alert('Upload failed', 'We could not pick that document. Please try again.');
    } finally {
      setIsPickingDocument(false);
    }
  };

  const handleSignup = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFullName = fullName.trim();
    const trimmedAddress = localAddress.trim();
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
      setRoleError('Please choose whether you are applying as a local or joining as a visitor.');
      hasError = true;
    } else {
      setRoleError('');
    }

    if (isLocalSignup) {
      if (!trimmedFullName) {
        setFullNameError('Your full name is required for local verification.');
        hasError = true;
      } else {
        setFullNameError('');
      }

      if (!trimmedAddress) {
        setAddressError('Please provide the address where you live.');
        hasError = true;
      } else {
        setAddressError('');
      }

      if (!pickedDocument) {
        setDocumentError('Please upload a proof document for review.');
        hasError = true;
      } else {
        setDocumentError('');
      }
    } else {
      setFullNameError('');
      setAddressError('');
      setDocumentError('');
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
        fullName: isLocalSignup ? trimmedFullName : undefined,
        localAddress: isLocalSignup ? trimmedAddress : undefined,
        localDocument: isLocalSignup ? pickedDocument : null,
      });
      Alert.alert(
        'Account created',
        'We sent you a verification link. Please verify your email before continuing.'
      );
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
      subtitle="Visitors can join instantly. Local applicants submit a quick verification request before local access is activated.">
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

        {isLocalSignup ? (
          <View style={styles.localSection}>
            <Text style={styles.localHeading}>Local verification details</Text>
            <Text style={styles.localHelper}>
              Your local access stays pending until the backend team reviews your submitted proof.
            </Text>

            <FormInput
              error={fullNameError}
              label="Full name"
              onChangeText={(value) => {
                setFullName(value);
                if (fullNameError) {
                  setFullNameError('');
                }
              }}
              placeholder="Your full legal name"
              value={fullName}
            />

            <FormInput
              error={addressError}
              label="Address"
              multiline
              onChangeText={(value) => {
                setLocalAddress(value);
                if (addressError) {
                  setAddressError('');
                }
              }}
              placeholder="Where do you currently live?"
              style={styles.addressInput}
              value={localAddress}
            />

            <View>
              <Text style={styles.sectionLabel}>Proof document</Text>
              <Pressable
                onPress={() => {
                  void pickVerificationDocument();
                }}
                style={({ pressed }) => [
                  styles.uploadCard,
                  pressed ? styles.uploadCardPressed : null,
                ]}>
                <Text style={styles.uploadTitle}>
                  {pickedDocument ? pickedDocument.name : 'Upload proof of residence'}
                </Text>
                <Text style={styles.uploadDescription}>
                  Accepted: PDF or image. This will be reviewed before local access is approved.
                </Text>
                <Text style={styles.uploadAction}>
                  {isPickingDocument ? 'Choosing document...' : pickedDocument ? 'Replace file' : 'Choose file'}
                </Text>
              </Pressable>
              {documentError ? <Text style={styles.errorText}>{documentError}</Text> : null}
            </View>
          </View>
        ) : null}

        <Pressable
          disabled={isSubmitting}
          onPress={() => {
            void handleSignup();
          }}
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
  addressInput: {
    minHeight: 96,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  errorText: {
    color: AppTheme.colors.danger,
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
    color: AppTheme.colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    color: AppTheme.colors.muted,
    fontSize: 15,
  },
  form: {
    gap: 18,
  },
  localHeading: {
    color: AppTheme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  localHelper: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  localSection: {
    backgroundColor: AppTheme.colors.cardAlt,
    borderColor: AppTheme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.accent,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: AppTheme.colors.accent,
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
    borderColor: AppTheme.colors.accent,
  },
  roleDescription: {
    color: AppTheme.colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  roleDescriptionSelected: {
    color: AppTheme.colors.accentDeep,
  },
  roleGrid: {
    gap: 12,
  },
  roleSection: {
    marginTop: 4,
  },
  roleTitle: {
    color: AppTheme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  roleTitleSelected: {
    color: AppTheme.colors.accentDeep,
  },
  sectionLabel: {
    color: AppTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  uploadAction: {
    color: AppTheme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  uploadCard: {
    backgroundColor: AppTheme.colors.card,
    borderColor: AppTheme.colors.border,
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 16,
  },
  uploadCardPressed: {
    opacity: 0.92,
  },
  uploadDescription: {
    color: AppTheme.colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  uploadTitle: {
    color: AppTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
