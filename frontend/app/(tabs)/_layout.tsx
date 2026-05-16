import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { ScreenLoader } from '@/components/ui/screen-loader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppTheme, Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthLoading, isAuthOperationLoading, user } = useAuth();

  if (isAuthLoading || isAuthOperationLoading) {
    return <ScreenLoader label="Preparing your dashboard..." />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {
          backgroundColor: AppTheme.colors.card,
          borderTopColor: 'transparent',
          borderRadius: 26,
          bottom: 14,
          height: 76,
          left: 14,
          paddingBottom: 12,
          paddingTop: 12,
          position: 'absolute',
          right: 14,
          ...AppTheme.shadow.card,
        },
        tabBarInactiveTintColor: AppTheme.colors.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
