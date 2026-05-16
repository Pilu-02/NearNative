import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type FormInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormInput({
  error,
  label,
  secureTextEntry,
  style,
  ...props
}: FormInputProps) {
  const isPasswordField = secureTextEntry === true;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          {...props}
          placeholderTextColor="#94a3b8"
          secureTextEntry={isPasswordField ? !isPasswordVisible : secureTextEntry}
          style={[
            styles.input,
            isPasswordField ? styles.inputWithTrailingIcon : null,
            error ? styles.inputError : null,
            style,
          ]}
        />
        {isPasswordField ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setIsPasswordVisible((currentValue) => !currentValue)}
            style={styles.trailingIconButton}>
            <Ionicons
              color="#64748b"
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#c62828',
    fontSize: 13,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#d7e2ee',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 15,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputWithTrailingIcon: {
    paddingRight: 52,
  },
  inputWrap: {
    position: 'relative',
  },
  label: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  trailingIconButton: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    top: 0,
  },
});
