import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme } from '@/constants/theme';

type AppScrollScreenProps = {
  children: ReactNode;
  scroll?: boolean;
};

export function AppScrollScreen({ children, scroll = true }: AppScrollScreenProps) {
  const { width } = useWindowDimensions();
  const content = <View style={[styles.inner, width > 820 ? styles.innerWide : null]}>{children}</View>;

  if (!scroll) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.flex}>{content}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.flex}>
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}

type PillProps = {
  label: string;
  tone?: 'accent' | 'neutral' | 'dark' | 'danger';
};

export function Pill({ label, tone = 'accent' }: PillProps) {
  return (
    <Text
      style={[
        styles.pill,
        tone === 'neutral' ? styles.pillNeutral : null,
        tone === 'dark' ? styles.pillDark : null,
        tone === 'danger' ? styles.pillDanger : null,
      ]}>
      {label}
    </Text>
  );
}

type HeroPanelProps = {
  badge: string;
  subtitle: string;
  title: string;
  aside?: ReactNode;
};

export function HeroPanel({ aside, badge, subtitle, title }: HeroPanelProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTextWrap}>
        <Pill label={badge} tone="neutral" />
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>
      {aside ? <View style={styles.heroAside}>{aside}</View> : null}
    </View>
  );
}

type SurfaceCardProps = {
  children: ReactNode;
};

export function SurfaceCard({ children }: SurfaceCardProps) {
  return <View style={styles.card}>{children}</View>;
}

type SectionHeaderProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ kicker, subtitle, title }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

type MetricRowProps = {
  label: string;
  value: string;
};

export function MetricRow({ label, value }: MetricRowProps) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

type ActionButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  tone?: 'accent' | 'dark' | 'ghost' | 'danger';
};

export function ActionButton({
  disabled,
  label,
  loading,
  onPress,
  tone = 'accent',
}: ActionButtonProps) {
  const spinnerColor = tone === 'ghost' ? AppTheme.colors.accent : AppTheme.colors.white;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'dark' ? styles.buttonDark : null,
        tone === 'ghost' ? styles.buttonGhost : null,
        tone === 'danger' ? styles.buttonDanger : null,
        pressed && !(disabled || loading) ? styles.buttonPressed : null,
        disabled || loading ? styles.buttonDisabled : null,
      ]}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            tone === 'ghost' ? styles.buttonGhostText : null,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

type EmptyStateProps = {
  description: string;
  title: string;
};

export function EmptyStateCard({ description, title }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateText}>{description}</Text>
    </View>
  );
}

type LoadingCardProps = {
  label: string;
};

export function LoadingCard({ label }: LoadingCardProps) {
  return (
    <View style={styles.loadingCard}>
      <ActivityIndicator color={AppTheme.colors.accent} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AppTheme.colors.accent,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 132,
    paddingHorizontal: 18,
    ...AppTheme.shadow.button,
  },
  buttonDark: {
    backgroundColor: AppTheme.colors.dark,
    shadowColor: AppTheme.colors.dark,
  },
  buttonDanger: {
    backgroundColor: AppTheme.colors.danger,
    shadowColor: AppTheme.colors.danger,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGhost: {
    backgroundColor: AppTheme.colors.accentSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGhostText: {
    color: AppTheme.colors.accent,
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: AppTheme.colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: AppTheme.colors.card,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.xl,
    borderWidth: 1,
    padding: AppTheme.spacing.card,
    ...AppTheme.shadow.card,
  },
  emptyState: {
    backgroundColor: AppTheme.colors.cardAlt,
    borderColor: AppTheme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  emptyStateText: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  emptyStateTitle: {
    color: AppTheme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  flex: {
    flex: 1,
  },
  hero: {
    backgroundColor: AppTheme.colors.dark,
    borderRadius: 32,
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 22,
  },
  heroAside: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 90,
  },
  heroSubtitle: {
    color: AppTheme.colors.darkMuted,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: AppTheme.colors.white,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: 14,
  },
  inner: {
    alignSelf: 'center',
    gap: AppTheme.spacing.section,
    width: '100%',
  },
  innerWide: {
    maxWidth: 760,
  },
  kicker: {
    color: AppTheme.colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.cardAlt,
    borderColor: AppTheme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    justifyContent: 'center',
    minHeight: 110,
    padding: 18,
  },
  loadingLabel: {
    color: AppTheme.colors.muted,
    fontSize: 14,
  },
  metricLabel: {
    color: AppTheme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  metricRow: {
    gap: 6,
  },
  metricValue: {
    color: AppTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: AppTheme.colors.accent,
    borderRadius: AppTheme.radius.pill,
    color: AppTheme.colors.white,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillDark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    color: AppTheme.colors.white,
  },
  pillDanger: {
    backgroundColor: AppTheme.colors.dangerSoft,
    color: AppTheme.colors.danger,
  },
  pillNeutral: {
    backgroundColor: AppTheme.colors.accentSoft,
    color: AppTheme.colors.accent,
  },
  safeArea: {
    backgroundColor: AppTheme.colors.background,
    flex: 1,
  },
  scrollContent: {
    padding: AppTheme.spacing.screen,
    paddingBottom: 120,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionSubtitle: {
    color: AppTheme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    color: AppTheme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
