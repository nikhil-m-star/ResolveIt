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
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import {
  getCategoryIconComponent,
  getCategoryStyles,
  getStatusStyles,
  formatDate
} from '@/utils/helpers';
import { Search, Filter, ArrowUp, ThumbsUp, MapPin, ChevronDown, PlusCircle } from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL SECTORS');
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Fetch all issues
  const { data: issues = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const { data } = await api.get('/issues');
      return data || [];
    },
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const { data } = await api.post(`/issues/${issueId}/votes`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });

  // Filter issues based on search query and area
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

  const handleUpvote = (id: string, event: any) => {
    event.stopPropagation();
    upvoteMutation.mutate(id);
  };

  const renderIssueCard = ({ item }: { item: any }) => {
    const catStyles = getCategoryStyles(item.category);
    const statusStyles = getStatusStyles(item.status);
    const hasVoted = item.hasVoted || false;

    return (
      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => router.push(`/issue/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: catStyles.bgColor, borderColor: catStyles.borderColor }]}>
            {getCategoryIconComponent(item.category, 14, catStyles.color)}
            <Text style={[styles.categoryText, { color: catStyles.color }]}>
              {item.category?.replace('_', ' ')}
            </Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { borderColor: statusStyles.borderColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyles.color }]} />
            <Text style={[styles.statusText, { color: statusStyles.color }]}>
              {statusStyles.text}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.locationWrapper}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.locationText}>
            {item.area || item.locationName || 'Bengaluru'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>

          {/* Upvote Button */}
          <TouchableOpacity
            style={[
              styles.voteButton,
              hasVoted && styles.votedButton,
              upvoteMutation.isPending && { opacity: 0.6 }
            ]}
            onPress={(e) => handleUpvote(item.id, e)}
            activeOpacity={0.7}
            disabled={upvoteMutation.isPending}
          >
            <ThumbsUp size={14} color={hasVoted ? '#000000' : '#10b981'} />
            <Text style={[styles.voteCount, { color: hasVoted ? '#000000' : '#10b981' }]}>
              {item.votesCount || item.upvotes || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>RESOLVE IT</Text>
          <Text style={styles.headerSubtitle}>MONITORING ACTIVE REPORTS</Text>
        </View>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => router.push('/(main)/report')}
        >
          <PlusCircle size={24} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter Panel */}
      <View style={styles.searchPanel}>
        <View style={styles.searchWrapper}>
          <Search size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="FILTER BY KEYWORD..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Area Dropdown Trigger */}
        <TouchableOpacity
          style={styles.filterTrigger}
          onPress={() => setShowAreaModal(!showAreaModal)}
        >
          <Filter size={16} color="#10b981" />
          <Text style={styles.filterTriggerText}>{selectedArea.toUpperCase()}</Text>
          <ChevronDown size={14} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Inline Area Selector Modal (Dropdown) */}
      {showAreaModal && (
        <View style={styles.dropdownContainer}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedArea('ALL SECTORS');
                setShowAreaModal(false);
              }}
            >
              <Text style={styles.dropdownItemText}>ALL SECTORS</Text>
            </TouchableOpacity>
            {OPERATIONAL_AREAS.map((area) => (
              <TouchableOpacity
                key={area.name}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedArea(area.name);
                  setShowAreaModal(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{area.name.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filteredIssues}
          renderItem={renderIssueCard}
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
              <Text style={styles.emptyText}>NO ACTIVE ALERTS DETECTED</Text>
              <Text style={styles.emptySubtext}>
                SUBMIT A REPORT OR CHANGE FILTERS TO SEE RESULTS
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
    fontSize: 24,
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
  floatingButton: {
    padding: 6,
  },
  searchPanel: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    zIndex: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    height: '100%',
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  filterTriggerText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 144,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(10, 10, 10, 0.98)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    maxHeight: 280,
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  dropdownScroll: {
    padding: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100, // accommodate bottom tab bar
    gap: 14,
  },
  issueCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  locationText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  votedButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  voteCount: {
    fontSize: 11,
    fontWeight: '900',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 16,
  },
});
