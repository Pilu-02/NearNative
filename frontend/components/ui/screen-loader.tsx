import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '@/constants/theme';

type ScreenLoaderProps = {
  label?: string;
};

export function ScreenLoader({ label = 'Loading...' }: ScreenLoaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.orb} />
      <View style={styles.card}>
        <ActivityIndicator color={AppTheme.colors.accent} size="large" />
        <Text style={styles.title}>NearNative</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.card,
    borderColor: AppTheme.colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 10,
    minWidth: 220,
    paddingHorizontal: 26,
    paddingVertical: 28,
    ...AppTheme.shadow.card,
  },
  label: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  orb: {
    backgroundColor: AppTheme.colors.accentSoft,
    borderRadius: 120,
    height: 160,
    position: 'absolute',
    top: 110,
    width: 160,
  },
  title: {
    color: AppTheme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
