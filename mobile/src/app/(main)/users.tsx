import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Platform
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import { useRouter } from 'expo-router';
import {
  Users,
  ShieldCheck,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Mail,
  MapPin,
  AlertCircle,
  ArrowLeft
} from 'lucide-react-native';

export default function UserManagementScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [promoArea, setPromoArea] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);

  // Fetch users targeting /users/admin/all
  const { data: users = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/users/admin/all');
      return res.data || [];
    },
    retry: false // Access restriction failures shouldn't spam retry
  });

  // Promote/Update personnel role targeting PATCH /users/admin/role/:userId
  const roleMutation = useMutation({
    mutationFn: async ({ userId, role, area }: { userId: string; role: string; area?: string }) => {
      return api.patch(`/users/admin/role/${userId}`, { role, area });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      Alert.alert('SUCCESS', 'Personnel status updated successfully.');
      setPromotingUserId(null);
      setPromoArea('');
      setShowPromoModal(false);
    },
    onError: () => {
      Alert.alert('UPDATE FAILURE', 'Failed to synchronize personnel modifications on the server.');
    }});

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleMakeOfficerPress = (userId: string) => {
    setPromotingUserId(userId);
    setPromoArea('');
    setShowPromoModal(true);
  };

  const handleDemoteOfficerPress = (u: any) => {
    Alert.alert(
      'CONFIRM DEMOTION',
      `Are you sure you want to demote officer "${u.name}" back to citizen?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DEMOTE',
          style: 'destructive',
          onPress: () => roleMutation.mutate({ userId: u.id, role: 'CITIZEN' })},
      ]
    );
  };

  const handlePromoSubmit = () => {
    if (!promotingUserId) return;
    if (!promoArea.trim()) {
      Alert.alert('AREA REQUIRED', 'Please assign an operational area sector.');
      return;
    }
    roleMutation.mutate({
      userId: promotingUserId,
      role: 'OFFICER',
      area: promoArea.trim()
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>SYNCING SECURITY LISTS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <AlertCircle size={32} color="#ef4444" style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>ACCESS RESTRICTED</Text>
          <Text style={styles.errorSubtext}>
            You do not have the required permissions to access the Presidential Command Center.
          </Text>
          <TouchableOpacity style={styles.exitButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.exitButtonText}>EXIT AREA</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={16} color="#10b981" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>COMMAND CENTER</Text>
          <Text style={styles.headerSubtitle}>PERSONNEL DATABASE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Subtitle & Badge Indicators */}
        <View style={styles.introRow}>
          <View style={styles.liveBadge}>
            <Users size={12} color="#10b981" />
            <Text style={styles.liveText}>ACCESS MANAGEMENT</Text>
          </View>
          <Text style={styles.introDescription}>
            Presidential security portal to manage user permissions, designate city sector officers, and inspect active clearings.
          </Text>
        </View>

        {/* HUD Analytics Row */}
        <View style={styles.hudGrid}>
          <View style={styles.hudCard}>
            <Text style={styles.hudLabel}>TOTAL USERS</Text>
            <Text style={styles.hudValue}>{users.length}</Text>
          </View>
          <View style={styles.hudCardActive}>
            <Text style={styles.hudLabelActive}>ACTIVE OFFICERS</Text>
            <Text style={styles.hudValueActive}>
              {users.filter((u) => u.role !== 'CITIZEN').length}
            </Text>
          </View>
        </View>

        {/* Control Bar: Search & Filter */}
        <View style={styles.controlBar}>
          <View style={styles.searchContainer}>
            <Search size={14} color="#10b981" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="SEARCH PERSONNEL..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
            />
            {searchQuery.trim() !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.8}>
                <Text style={styles.clearSearchText}>CLEAR</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            {['ALL', 'CITIZEN', 'OFFICER', 'PRESIDENT'].map((pillRole) => {
              const label = pillRole === 'CITIZEN' ? 'USER' : pillRole === 'PRESIDENT' ? 'ADMIN' : pillRole;
              const isActive = roleFilter === pillRole;
              return (
                <TouchableOpacity
                  key={pillRole}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setRoleFilter(pillRole)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Personnel Database List */}
        <Text style={styles.sectionTitle}>PERSONNEL INDEX ({filteredUsers.length})</Text>
        <View style={styles.usersList}>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptySearchContainer}>
              <Text style={styles.emptySearchTitle}>NO RECORD FOUND</Text>
              <Text style={styles.emptySearchSub}>
                Adjust search queries or filters.
              </Text>
            </View>
          ) : (
            filteredUsers.map((u) => {
              const initial = (u.name || 'A').charAt(0).toUpperCase();
              const isPresident = u.role === 'PRESIDENT';
              const isOfficer = u.role === 'OFFICER';

              return (
                <View key={u.id} style={styles.userRow}>
                  <View style={styles.userIdentityRow}>
                    <View
                      style={[
                        styles.avatarContainer,
                        isPresident && styles.avatarPresident,
                        isOfficer && styles.avatarOfficer,
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          isPresident && styles.avatarTextPresident,
                          isOfficer && styles.avatarTextOfficer,
                        ]}
                      >
                        {initial}
                      </Text>
                    </View>

                    <View style={styles.userDetails}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {u.name?.toUpperCase() || 'ANONYMOUS'}
                      </Text>
                      <View style={styles.userEmailRow}>
                        <Mail size={10} color="#94a3b8" />
                        <Text style={styles.userEmail} numberOfLines={1}>
                          {u.email}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.userMetaRow}>
                    <View style={styles.userScope}>
                      <MapPin size={10} color="#10b981" />
                      <Text style={styles.userScopeText} numberOfLines={1}>
                        {u.area ? u.area.toUpperCase() : 'CITY Wide'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.roleBadge,
                        isPresident && styles.roleBadgePresident,
                        isOfficer && styles.roleBadgeOfficer,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          isPresident && styles.roleBadgeTextPresident,
                          isOfficer && styles.roleBadgeTextOfficer,
                        ]}
                      >
                        {isPresident ? 'SUPER ADMIN' : isOfficer ? 'CITY OFFICER' : 'ACTIVE USER'}
                      </Text>
                    </View>
                  </View>

                  {/* Impact Metrics Row */}
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{u._count?.issues || 0}</Text>
                      <Text style={styles.metricLabel}>REPORTS</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={[styles.metricVal, { color: '#10b981' }]}>
                        {u.resolvedCount || 0}
                      </Text>
                      <Text style={styles.metricLabel}>CLEARANCE</Text>
                    </View>
                  </View>

                  {/* Promotion Actions */}
                  <View style={styles.actionsContainer}>
                    {u.role === 'CITIZEN' ? (
                      <TouchableOpacity
                        style={styles.promoteButton}
                        onPress={() => handleMakeOfficerPress(u.id)}
                        disabled={roleMutation.isPending}
                        activeOpacity={0.8}
                      >
                        <ArrowUpCircle size={14} color="#000000" />
                        <Text style={styles.promoteButtonText}>UPGRADE TO OFFICER</Text>
                      </TouchableOpacity>
                    ) : u.role === 'OFFICER' ? (
                      <TouchableOpacity
                        style={styles.demoteButton}
                        onPress={() => handleDemoteOfficerPress(u)}
                        disabled={roleMutation.isPending}
                        activeOpacity={0.8}
                      >
                        <ArrowDownCircle size={14} color="#94a3b8" />
                        <Text style={styles.demoteButtonText}>DEMOTE TO CITIZEN</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.systemRootLabel}>
                        <Text style={styles.systemRootText}>SYSTEM ROOT RESTRICTED</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Promotion Sector Selector Modal */}
      <Modal
        visible={showPromoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPromoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalShieldIconContainer}>
              <ShieldCheck size={28} color="#10b981" />
            </View>

            <Text style={styles.modalTitle}>ASSIGN SECTOR SCOPE</Text>
            <Text style={styles.modalSubtitle}>
              Select the operational sector coverage area assigned to this officer.
            </Text>

            {/* Bangalore Sector Dropdown scroll */}
            <View style={styles.modalSectorsListWrapper}>
              <ScrollView style={styles.modalSectorsScroll} nestedScrollEnabled>
                {OPERATIONAL_AREAS.map((sector) => (
                  <TouchableOpacity
                    key={sector.name}
                    style={[
                      styles.modalSectorItem,
                      promoArea === sector.name && styles.modalSectorItemActive,
                    ]}
                    onPress={() => setPromoArea(sector.name)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.modalSectorText,
                        promoArea === sector.name && styles.modalSectorTextActive,
                      ]}
                    >
                      {sector.name.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPromoModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handlePromoSubmit}
                disabled={roleMutation.isPending}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>
                  {roleMutation.isPending ? 'SYNCING...' : 'SAVE CHANGES'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 50 : 36},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16},
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12},
  headerTitleContainer: {
    flex: 1},
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2},
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1.5,
    marginTop: 2},
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 120},
  introRow: {
    marginBottom: 20,
    gap: 8},
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
    width: 170},
  liveText: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1},
  introDescription: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    textTransform: 'uppercase'},
  hudGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20},
  hudCard: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 16},
  hudCardActive: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 16},
  hudLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4},
  hudLabelActive: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4},
  hudValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1},
  hudValueActive: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1},
  controlBar: {
    gap: 12,
    marginBottom: 20},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16},
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5},
  clearSearchText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1},
  filterPillsContainer: {
    gap: 8,
    paddingVertical: 4},
  filterPill: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center'},
  filterPillActive: {
    backgroundColor: '#10b981'},
  filterPillText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5},
  filterPillTextActive: {
    color: '#000000'},
  sectionTitle: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16},
  usersList: {
    gap: 16},
  emptySearchContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center'},
  emptySearchTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4},
  emptySearchSub: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600'},
  userRow: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 16},
  userIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12},
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'},
  avatarPresident: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)'},
  avatarOfficer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)'},
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'},
  avatarTextPresident: {
    color: '#ffffff'},
  avatarTextOfficer: {
    color: '#10b981'},
  userDetails: {
    flex: 1,
    gap: 4},
  userName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1},
  userEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6},
  userEmail: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600'},
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12},
  userMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'},
  userScope: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6},
  userScopeText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1},
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3},
  roleBadgePresident: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)'},
  roleBadgeOfficer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)'},
  roleBadgeText: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1},
  roleBadgeTextPresident: {
    color: '#10b981'},
  roleBadgeTextOfficer: {
    color: '#10b981'},
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12},
  metricCard: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center'},
  metricVal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'},
  metricLabel: {
    color: '#94a3b8',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2},
  actionsContainer: {
    marginTop: 4},
  promoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 40,
    gap: 6},
  promoteButtonText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5},
  demoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    height: 40,
    gap: 6},
  demoteButtonText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5},
  systemRootLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'},
  systemRootText: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12},
  loadingText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2},
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40},
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6},
  errorSubtext: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20},
  exitButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center'},
  exitButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5},
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20},
  modalContentCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8},
  modalShieldIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16},
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6},
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    textTransform: 'uppercase',
    marginBottom: 20},
  modalSectorsListWrapper: {
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden'},
  modalSectorsScroll: {
    padding: 6},
  modalSectorItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4},
  modalSectorItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)'},
  modalSectorText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5},
  modalSectorTextActive: {
    color: '#10b981',
    fontWeight: '900'},
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10},
  modalCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'},
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5},
  modalSaveButton: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center'},
  modalSaveText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5}});
