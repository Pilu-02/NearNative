import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme } from '@/constants/theme';

type AuthShellProps = PropsWithChildren<{
  badge: string;
  title: string;
  subtitle: string;
}>;

export function AuthShell({ badge, title, subtitle, children }: AuthShellProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.accentOne} />
        <View style={styles.accentTwo} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height', default: undefined })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={styles.flex}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          bounces={false}
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible ? styles.contentKeyboardVisible : styles.contentCentered,
          ]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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
    backgroundColor: '#d9ebff',
    borderRadius: 180,
    height: 280,
    position: 'absolute',
    right: -60,
    top: -70,
    width: 280,
  },
  accentTwo: {
    backgroundColor: '#edf5ff',
    borderRadius: 120,
    height: 200,
    left: -40,
    position: 'absolute',
    top: 180,
    width: 200,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppTheme.colors.background,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: AppTheme.colors.card,
    borderRadius: 999,
    color: AppTheme.colors.accent,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 14,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  brand: {
    color: AppTheme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  card: {
    backgroundColor: AppTheme.colors.card,
    borderColor: AppTheme.colors.border,
    borderRadius: 30,
    borderWidth: 1,
    padding: 24,
    ...AppTheme.shadow.card,
  },
  content: {
    flexGrow: 1,
    padding: 22,
    paddingBottom: 34,
  },
  contentCentered: {
    justifyContent: 'center',
  },
  contentKeyboardVisible: {
    justifyContent: 'flex-start',
    paddingTop: 28,
  },
  flex: {
    flex: 1,
  },
  hero: {
    marginBottom: 24,
  },
  safeArea: {
    backgroundColor: AppTheme.colors.background,
    flex: 1,
  },
  subtitle: {
    color: AppTheme.colors.muted,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 420,
  },
  title: {
    color: AppTheme.colors.text,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 10,
  },
});
