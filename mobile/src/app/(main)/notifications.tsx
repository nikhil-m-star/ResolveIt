import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Bell,
  Check,
  CircleAlert,
  ShieldAlert,
  Compass,
  Activity,
  History,
  ArrowRight,
  Clock} from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Custom lightweight time formatter
function formatTimeAgo(dateString: string) {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const ms = now.getTime() - past.getTime();
    if (isNaN(ms) || ms < 0) return 'RECENTLY';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'JUST NOW';
    if (minutes < 60) return `${minutes}M AGO`;
    if (hours < 24) return `${hours}H AGO`;
    return `${days}D AGO`;
  } catch {
    return 'RECENTLY';
  }
}

function getIcon(type: string) {
  switch (type) {
    case 'URGENT': return ShieldAlert;
    case 'WARNING': return CircleAlert;
    case 'SUCCESS': return Check;
    default: return Compass;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL');

  // Fetch all notifications
  const { data: notifications = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data || [];
    },
    refetchInterval: 15000});

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }});

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.isRead).length
    : 0;

  const urgentCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => n.type === 'URGENT' && !n.isRead).length
    : 0;

  const filteredNotifications = Array.isArray(notifications)
    ? notifications.filter((item: any) => {
        if (filter === 'UNREAD') return !item.isRead;
        if (filter === 'URGENT') return item.type === 'URGENT';
        return true;
      })
    : [];

  const handleNotificationTap = (item: any) => {
    if (item.issueId) {
      router.push(`/issue/${item.issueId}`);
    }
  };

  const renderNotificationCard = ({ item }: { item: any }) => {
    const isRead = item.isRead || false;
    const isUrgent = item.type === 'URGENT';
    const IconComp = getIcon(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notifItem,
          !isRead ? styles.notifItemUnread : styles.notifItemRead,
        ]}
        onPress={() => handleNotificationTap(item)}
        activeOpacity={0.85}
      >
        {/* Left unread indicator bar */}
        {!isRead && <View style={styles.unreadBar} />}

        <View style={styles.notifRow}>
          {/* Icon unit */}
          <View style={[
            styles.iconUnit,
            !isRead
              ? styles.iconUnitUnread
              : styles.iconUnitRead,
            isUrgent && !isRead && styles.iconUnitUrgent,
          ]}>
            {isUrgent && !isRead && <View style={styles.urgentPulse} />}
            <IconComp size={20} color={!isRead ? '#10b981' : '#ffffff'} />
          </View>

          {/* Content */}
          <View style={styles.notifContent}>
            {/* Type + Priority */}
            <View style={styles.notifTopRow}>
              <View style={styles.notifTypeRow}>
                <Text style={[
                  styles.notifType,
                  isUrgent && styles.notifTypeUrgent,
                ]}>
                  {item.type}
                </Text>
                <View style={styles.typeDivider} />
              </View>
              {!isRead && (
                <View style={styles.priorityBadge}>
                  <Activity size={10} color="#000000" />
                  <Text style={styles.priorityText}>Unread</Text>
                </View>
              )}
            </View>

            {/* Message */}
            <Text style={[
              styles.notifMessage,
              isRead && styles.notifMessageRead,
            ]}>
              {item.message}
            </Text>

            {/* Meta row */}
            <View style={styles.notifMeta}>
              {/* Timestamp */}
              <View style={styles.metaItem}>
                <View style={styles.metaIconBox}>
                  <Clock size={12} color="#94a3b8" />
                </View>
                <Text style={styles.metaText}>{formatTimeAgo(item.createdAt)}</Text>
              </View>

              {/* Review Details link */}
              {item.issueId && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => router.push(`/issue/${item.issueId}`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.reviewText}>Open</Text>
                  <ArrowRight size={12} color="#10b981" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingFull}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
        ListHeaderComponent={
          <View>
            {/* Emergency HUD Banner */}
            {urgentCount > 0 && (
              <View style={styles.emergencyBanner}>
                <View style={styles.emergencyGlow} />
                <View style={styles.emergencyContent}>
                  <View style={styles.emergencyIcon}>
                    <ShieldAlert size={24} color="#000000" />
                  </View>
                  <View style={styles.emergencyTextWrap}>
                    <Text style={styles.emergencyTitle}>Urgent</Text>
                    <Text style={styles.emergencySubtitle}>{urgentCount} urgent updates</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.emergencyButton}
                    onPress={() => setFilter('URGENT')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emergencyButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.kickerRow}>
                  <Activity size={12} color="#10b981" />
                  <Text style={styles.kickerText}>Inbox</Text>
                </View>
                <Text style={styles.headerTitle}>Notifications</Text>
              </View>

              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  activeOpacity={0.8}
                >
                  {markAllReadMutation.isPending ? (
                    <ActivityIndicator size="small" color="#94a3b8" />
                  ) : (
                    <Check size={12} color="#94a3b8" />
                  )}
                  <Text style={styles.dismissText}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
              {(['ALL', 'UNREAD', 'URGENT'] as const).map((f) => {
                const isActive = filter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterTab, isActive && styles.filterTabActive]}
                    onPress={() => setFilter(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feed header bar */}
            <View style={styles.feedCard}>
              <View style={styles.feedHeader}>
                <View style={styles.feedHeaderLeft}>
                  <History size={14} color="#10b981" />
                  <Text style={styles.feedHeaderText}>Recent</Text>
                </View>
                <View style={styles.feedHeaderRight}>
                  <View style={[
                    styles.feedDot,
                    unreadCount > 0 ? styles.feedDotActive : styles.feedDotInactive,
                  ]} />
                  <Text style={styles.feedCountText}>{unreadCount} new</Text>
                </View>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Bell size={36} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>You’re all caught up.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 50 : 36},
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120},

  // Loading
  loadingFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16},
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700'},

  // Emergency Banner
  emergencyBanner: {
    position: 'relative',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden'},
  emergencyGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.1)'},
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14},
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15},
  emergencyTextWrap: {
    flex: 1,
    gap: 4},
  emergencyTitle: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5},
  emergencySubtitle: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700'},
  emergencyButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12},
  emergencyButtonText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3},

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingTop: 8},
  headerLeft: {
    gap: 6},
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  kickerText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3},
  headerTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5},
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16},
  dismissText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3},

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    backgroundColor: '#000000',
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginBottom: 24},
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18},
  filterTabActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10},
  filterTabText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5},
  filterTabTextActive: {
    color: '#000000'},

  // Feed Card Container
  feedCard: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden'},
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000000'},
  feedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  feedHeaderText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3},
  feedHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999},
  feedDot: {
    width: 5,
    height: 5,
    borderRadius: 3},
  feedDotActive: {
    backgroundColor: '#10b981'},
  feedDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'},
  feedCountText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3},

  // Notification Item
  notifItem: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#000000'},
  notifItemUnread: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)'},
  notifItemRead: {
    opacity: 0.5},
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: '25%',
    bottom: '25%',
    width: 4,
    backgroundColor: '#10b981',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10},
  notifRow: {
    flexDirection: 'row',
    gap: 16},
  iconUnit: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'},
  iconUnitUnread: {
    backgroundColor: '#000000',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12},
  iconUnitRead: {
    backgroundColor: '#000000'},
  iconUnitUrgent: {
  },
  urgentPulse: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.1)'},
  notifContent: {
    flex: 1,
    gap: 8},
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'},
  notifTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  notifType: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3},
  notifTypeUrgent: {
    color: '#ef4444'},
  typeDivider: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'},
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10},
  priorityText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1},
  notifMessage: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3},
  notifMessageRead: {
    color: '#cbd5e1'},
  notifMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8},
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6},
  metaIconBox: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6},
  metaText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3},
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12},
  reviewText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3},

  // Empty State
  emptyState: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#000000'},
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    marginBottom: 8},
  emptyTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5},
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18}});
