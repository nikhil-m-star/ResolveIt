import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Rss, Map, PlusCircle, User as UserIcon, Sparkles, LayoutGrid } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette } from '@/constants/palette';

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 4 : 16;

  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data || [];
    },
    refetchInterval: 30000,
  });

  const horizontalMargin = (screenWidth - 210) / 2;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: Palette.accent,
          tabBarInactiveTintColor: Palette.textPlaceholder,
          sceneStyle: { backgroundColor: Palette.background },
          tabBarBackground: () => (
            <View style={styles.tabBarFill} />
          ),
          tabBarStyle: {
            position: 'absolute',
            bottom: bottomOffset,
            left: horizontalMargin,
            right: horizontalMargin,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            borderTopColor: 'transparent',
            borderWidth: 0,
            paddingBottom: 0,
            paddingTop: 0,
            paddingLeft: 0,
            paddingRight: 0,
            elevation: 0,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
          },
          tabBarItemStyle: {
            flex: 1,
            height: 64,
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarIconStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          },
          tabBarLabelStyle: {
            display: 'none',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'DASHBOARD',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                <Rss size={18} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'MAP EXPLORER',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                <Map size={18} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="ai-insights"
          options={{
            title: 'AI INSIGHTS',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                <Sparkles size={18} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="kanban"
          options={{
            title: 'CASE BOARD',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                <LayoutGrid size={18} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: 'REPORT ISSUE',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                <PlusCircle size={18} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'PROFILE',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                <UserIcon size={18} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="users" options={{ href: null }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  tabBarFill: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.75)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  activeTab: {
    backgroundColor: Palette.accentSurface,
  },
});
