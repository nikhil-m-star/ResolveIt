import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Rss, Map, PlusCircle, Bell, User as UserIcon } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function MainLayout() {
  // Fetch notifications to display unread badge
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.read && !n.isRead).length
    : 0;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 30 : 20,
            left: 20,
            right: 20,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            paddingBottom: 0,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 5,
            alignItems: 'center',
            justifyContent: 'center',
          },
          tabBarItemStyle: {
            height: 54,
            alignSelf: 'center',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'DASHBOARD',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                <Rss size={22} color={color} />
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
                <Map size={22} color={color} />
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
                <PlusCircle size={22} color={color} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="notifications"
          options={{
            title: 'NOTIFICATIONS',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                <Bell size={22} color={color} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
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
                <UserIcon size={22} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  activeTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#10b981',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
});
