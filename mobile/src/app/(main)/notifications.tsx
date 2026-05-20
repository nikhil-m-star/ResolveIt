import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getNotificationIcon, formatDate } from '@/utils/helpers';
import { CheckSquare, BellOff, Info, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react-native';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  // Fetch all notifications
  const { data: notifications = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data || [];
    },
  });

  // Mark a single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/notifications/read');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const filteredNotifications = Array.isArray(notifications)
    ? notifications.filter((item: any) => {
        if (filter === 'UNREAD') {
          return !item.read && !item.isRead;
        }
        return true;
      })
    : [];

  const handleNotificationTap = (id: string, isRead: boolean) => {
    if (!isRead) {
      markReadMutation.mutate(id);
    }
  };

  const handleDismissAll = () => {
    markAllReadMutation.mutate();
  };

  const renderNotificationCard = ({ item }: { item: any }) => {
    const isRead = item.read || item.isRead || false;
    const isUrgent = item.type === 'URGENT' || item.type === 'EMERGENCY' || item.priority === 'HIGH';
    
    // Fallback icon mapping
    let IconComponent = getNotificationIcon(item.type);
    if (!IconComponent) {
      IconComponent = isUrgent ? AlertCircle : Info;
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !isRead && styles.unreadCard,
          isUrgent && styles.urgentCard
        ]}
        onPress={() => handleNotificationTap(item.id, isRead)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconWrapper}>
            <IconComponent size={18} color={isUrgent ? '#ef4444' : isRead ? '#64748b' : '#10b981'} />
          </View>
          <View style={styles.contentWrapper}>
            <Text style={[styles.cardTitle, isRead && styles.readText]}>
              {item.title}
            </Text>
            <Text style={[styles.cardMessage, isRead && styles.readText]}>
              {item.message}
            </Text>
            <Text style={styles.cardTime}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          {!isRead && (
            <View style={styles.unreadPulse} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SECURE INBOX</Text>
          <Text style={styles.headerSubtitle}>ACCOUNTABILITY CHRONOLOGY</Text>
        </View>

        {/* Mark All Read Button */}
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.dismissAllButton}
            onPress={handleDismissAll}
            disabled={markAllReadMutation.isPending}
            activeOpacity={0.8}
          >
            <CheckSquare size={16} color="#10b981" />
            <Text style={styles.dismissAllText}>WIPE ALL</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'ALL' && styles.activeFilterTab]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterTabText, filter === 'ALL' && styles.activeFilterTabText]}>
            ALL LOGS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'UNREAD' && styles.activeFilterTab]}
          onPress={() => setFilter('UNREAD')}
        >
          <Text style={[styles.filterTabText, filter === 'UNREAD' && styles.activeFilterTabText]}>
            UNRESOLVED
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications Feed */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#10b981"
              colors={['#10b981']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BellOff size={32} color="#475569" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>NO INCOMING TRANSMISSIONS</Text>
              <Text style={styles.emptySubtext}>
                Your citizen inbox is currently clean of outstanding alerts.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 2,
    marginTop: 2,
  },
  dismissAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  dismissAllText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  filterTab: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  filterTabText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  activeFilterTabText: {
    color: '#10b981',
    fontWeight: '900',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100, // tab inset
    gap: 12,
  },
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  unreadCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  urgentCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contentWrapper: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardMessage: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  cardTime: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  unreadPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    alignSelf: 'center',
  },
  readText: {
    color: '#475569',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  emptySubtext: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});
