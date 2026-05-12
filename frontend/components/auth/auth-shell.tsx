import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthShellProps = PropsWithChildren<{
  badge: string;
  title: string;
  subtitle: string;
}>;

export function AuthShell({ badge, title, subtitle, children }: AuthShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.accentOne} />
        <View style={styles.accentTwo} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.flex}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.brand}>NearNative</Text>
            <Text style={styles.badge}>{badge}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.card}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accentOne: {
    backgroundColor: '#d5ecff',
    borderRadius: 180,
    height: 280,
    position: 'absolute',
    right: -60,
    top: -70,
    width: 280,
  },
  accentTwo: {
    backgroundColor: '#eff7ff',
    borderRadius: 120,
    height: 200,
    left: -40,
    position: 'absolute',
    top: 180,
    width: 200,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f4f8fc',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 999,
    color: '#1565c0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  brand: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
  },
  flex: {
    flex: 1,
  },
  hero: {
    marginBottom: 24,
  },
  safeArea: {
    backgroundColor: '#f4f8fc',
    flex: 1,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 420,
  },
  title: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 10,
  },
});
