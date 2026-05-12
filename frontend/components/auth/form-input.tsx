import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type FormInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormInput({ error, label, style, ...props }: FormInputProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
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
  label: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
});
