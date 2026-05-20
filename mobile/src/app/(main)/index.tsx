import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Image,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, resolveImageUrl } from '@/lib/api';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import Logo from '@/components/Logo';
import {
  getCategoryIconComponent} from '@/utils/helpers';
import {
  Search,
  ArrowBigUp,
  ArrowBigDown,
  MapPin,
  ChevronDown,
  PlusCircle,
  CheckCircle2,
  Bell} from 'lucide-react-native';

// Custom lightweight time formatter matching web's formatDistanceToNow
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

// Web uses getStatusColor() which returns tailwind classes. We replicate it as RN styles.
function getStatusBadgeStyles(status: string) {
  switch (status) {
    case 'REPORTED':
      return { bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' };
    case 'IN_PROGRESS':
      return { bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.45)', text: '#10b981' };
    case 'RESOLVED':
      return { bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.6)', text: '#10b981' };
    case 'REJECTED':
      return { bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.25)', text: '#10b981' };
    default:
      return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)', text: '#94a3b8' };
  }
}

function formatEnumLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL SECTORS');
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Fetch all issues
  const { data: issues = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const { data } = await api.get('/issues');
      return data || [];
    }});

  // Fetch notifications to display unread badge in dashboard header
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data || [];
    },
    refetchInterval: 30000});

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.read && !n.isRead).length
    : 0;

  // Optimistic vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ issueId, type }: { issueId: string; type: 'UP' | 'DOWN' }) => {
      const { data } = await api.post(`/issues/${issueId}/vote`, { type });
      return data;
    },
    onMutate: async ({ issueId, type }) => {
      await queryClient.cancelQueries({ queryKey: ['issues'] });
      const previousIssues = queryClient.getQueryData(['issues']);

      queryClient.setQueryData(['issues'], (old: any[] | undefined) => {
        if (!old) return [];
        return old.map((issue: any) => {
          if (issue.id === issueId) {
            const currentVote = issue.userVote;
            let newVote: 'UP' | 'DOWN' | null = type;
            let votesChange = 0;

            if (currentVote === type) {
              newVote = null;
              votesChange = type === 'UP' ? -1 : 1;
            } else if (currentVote) {
              newVote = type;
              votesChange = type === 'UP' ? 2 : -2;
            } else {
              newVote = type;
              votesChange = type === 'UP' ? 1 : -1;
            }

            return { ...issue, userVote: newVote, votes: (issue.votes || 0) + votesChange };
          }
          return issue;
        });
      });

      return { previousIssues };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousIssues) {
        queryClient.setQueryData(['issues'], context.previousIssues);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }});

  // Filter issues
  const filteredIssues = Array.isArray(issues) ? issues.filter((issue: any) => {
    const matchesSearch =
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea =
      selectedArea === 'ALL SECTORS' ||
      issue.area?.toLowerCase() === selectedArea.toLowerCase() ||
      issue.locationName?.toLowerCase().includes(selectedArea.toLowerCase());

    return matchesSearch && matchesArea;
  }) : [];

  const handleVote = (id: string, type: 'UP' | 'DOWN', event: any) => {
    event.stopPropagation();
    voteMutation.mutate({ issueId: id, type });
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setSelectedArea('ALL SECTORS');
    refetch();
  };

  // -- Issue Card matching web IssueCard.jsx exactly --
  const renderIssueCard = ({ item }: { item: any }) => {
    const statusBadge = getStatusBadgeStyles(item.status);

    return (
      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => router.push(`/issue/${item.id}`)}
        activeOpacity={0.9}
      >
        {/* Hero Image Section - matching web's aspect-video */}
        <View style={styles.imageContainer}>
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              source={{ uri: resolveImageUrl(item.imageUrls[0]) }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cardPlaceholder}>
              <View style={styles.placeholderIconBox}>
                {getCategoryIconComponent(item.category, 32, '#10b981')}
              </View>
            </View>
          )}

          {/* Status Badge overlaid on image top-left — matching web */}
          <View style={styles.statusOverlay}>
            <View style={[styles.statusBadge, {
              backgroundColor: statusBadge.bg}]}>
              <Text style={[styles.statusText, { color: statusBadge.text }]}>
                {formatEnumLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Content below image */}
        <View style={styles.cardContent}>
          {/* Timestamp with pulsing dot — matching web */}
          <View style={styles.timestampRow}>
            <View style={styles.pulsingDot} />
            <Text style={styles.timestampText}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>

          {/* Title — matching web's uppercase, tracking-tight */}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Location — matching web's MapPin + area */}
          <View style={styles.locationRow}>
            <MapPin size={12} color="#10b981" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.area || item.city || 'BENGALURU'}
            </Text>
          </View>

          {/* Footer with vote pill — matching web exactly */}
          <View style={styles.cardFooter}>
            <View style={styles.votePill} onStartShouldSetResponder={() => true}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  item.userVote === 'UP' && styles.voteButtonUpActive,
                ]}
                onPress={(e) => handleVote(item.id, 'UP', e)}
              >
                <ArrowBigUp
                  size={18}
                  color={item.userVote === 'UP' ? '#10b981' : '#94a3b8'}
                  fill={item.userVote === 'UP' ? '#10b981' : 'none'}
                />
              </TouchableOpacity>

              <Text style={[
                styles.voteCount,
                item.userVote && styles.voteCountActive,
              ]}>
                {item.votes || 0}
              </Text>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  item.userVote === 'DOWN' && styles.voteButtonDownActive,
                ]}
                onPress={(e) => handleVote(item.id, 'DOWN', e)}
              >
                <ArrowBigDown
                  size={18}
                  color={item.userVote === 'DOWN' ? '#ef4444' : '#94a3b8'}
                  fill={item.userVote === 'DOWN' ? '#ef4444' : 'none'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={isLoading ? [] : filteredIssues}
        renderItem={renderIssueCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            <View style={[styles.brandingHeader, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8) }]}>
              <View style={styles.brandingBrand}>
                <Logo size={24} />
                <Text style={styles.brandingTitle}>ResolveIt</Text>
              </View>
              <TouchableOpacity
                style={styles.bellButton}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
              >
                <Bell size={18} color="#ffffff" />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.controlsContainer}>
              <View style={styles.controlsRow}>
              {/* Search Input */}
                <View style={styles.searchWrapper}>
                  <Search size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search"
                    placeholderTextColor="#64748b"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={styles.areaSelector}
                  onPress={() => setShowAreaModal(!showAreaModal)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.areaSelectorText} numberOfLines={1}>
                    {selectedArea === 'ALL SECTORS' ? 'All areas' : selectedArea}
                  </Text>
                  <ChevronDown size={14} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => router.push('/(main)/report')}
                activeOpacity={0.85}
              >
                <PlusCircle size={16} color="#000000" />
                <Text style={styles.reportButtonText}>Report issue</Text>
              </TouchableOpacity>

              {showAreaModal && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    <TouchableOpacity
                      style={[styles.dropdownItem, selectedArea === 'ALL SECTORS' && styles.dropdownItemActive]}
                      onPress={() => { setSelectedArea('ALL SECTORS'); setShowAreaModal(false); }}
                    >
                      <Text style={[styles.dropdownItemText, selectedArea === 'ALL SECTORS' && styles.dropdownItemTextActive]}>
                        All areas
                      </Text>
                    </TouchableOpacity>
                    {OPERATIONAL_AREAS.map((area) => (
                      <TouchableOpacity
                        key={area.name}
                        style={[styles.dropdownItem, selectedArea === area.name && styles.dropdownItemActive]}
                        onPress={() => { setSelectedArea(area.name); setShowAreaModal(false); }}
                      >
                        <Text style={[styles.dropdownItemText, selectedArea === area.name && styles.dropdownItemTextActive]}>
                          {area.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={48} color="#10b981" style={{ opacity: 0.2, marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No reports</Text>
              <Text style={styles.emptySubtitle}>Try another area or refresh.</Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleRefresh}
                activeOpacity={0.85}
              >
                <Text style={styles.resetButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000'},
  brandingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 4,
    backgroundColor: '#000000'},
  brandingBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10},
  brandingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3},
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'},
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#10b981',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2},
  bellBadgeText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center'},

  // Controls
  controlsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    zIndex: 10,
    position: 'relative'},
  controlsRow: {
    flexDirection: 'row',
    gap: 10},
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    gap: 10},
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    height: '100%'},
  areaSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 8,
    height: 48,
    gap: 4,
    minWidth: 140},
  areaSelectorText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.0,
    flex: 1,
    textAlign: 'center'},
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8},
  reportButtonText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4},

  // Dropdown
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#000000',
    borderRadius: 16,
    maxHeight: 280,
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10},
  dropdownScroll: {
    padding: 6},
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10},
  dropdownItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)'},
  dropdownItemText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4},
  dropdownItemTextActive: {
    color: '#10b981'},

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16},
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700'},

  // List
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16},

  // Issue Card — matching web IssueCard.jsx
  issueCard: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%'},

  // Image section
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden'},
  cardImage: {
    width: '100%',
    height: '100%'},
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center'},
  placeholderIconBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#000000',
    opacity: 0.6},

  // Status badge overlaid on image
  statusOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10},
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8},
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5},

  // Content below image
  cardContent: {
    padding: 16,
    gap: 10},

  // Timestamp row with pulsing dot
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6},
  pulsingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10b981'},
  timestampText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5},

  // Title
  cardTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 20},

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  locationText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5},

  // Footer with vote pill
  cardFooter: {
    paddingTop: 12},
  votePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    gap: 2},
  voteButton: {
    padding: 4},
  voteButtonUpActive: {
    // no background fill on web, just color change
  },
  voteButtonDownActive: {
    // no background fill on web, just color change
  },
  voteCount: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    paddingHorizontal: 6,
    minWidth: 24,
    textAlign: 'center'},
  voteCountActive: {
    color: '#10b981'},

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 8},
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5},
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18},
  resetButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12},
  resetButtonText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3}});
