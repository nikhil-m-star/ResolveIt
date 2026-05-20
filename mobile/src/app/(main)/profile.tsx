import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useResolveItAuth } from '@/lib/auth';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import { getCategoryStyles, getStatusStyles, formatDate } from '@/utils/helpers';
import { LogOut, MapPin, User, Award, Shield, ChevronDown, CheckCircle2, ShieldAlert, AlertTriangle, Sparkles, LayoutGrid, Users, TrendingUp } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { userProfile, logout } = useResolveItAuth() as any;
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Fetch full profile info from aligned /users/me endpoint
  const { data: profile = {} as any, isLoading, isError } = useQuery<any>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data || {};
    }});

  const selectedArea = profile?.area || userProfile?.area || '';

  // Mutation to update sector preference targeting PATCH /users/me
  const updateSectorMutation = useMutation({
    mutationFn: async (areaName: string) => {
      const { data } = await api.patch('/users/me', {
        area: areaName,
        city: 'Bengaluru'});
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Area updated', `Your area is now ${data.area || selectedArea}.`);
    },
    onError: (err) => {
      console.error(err);
      Alert.alert('Update failed', 'Could not save your area.');
    }});

  const handleAreaChange = (areaName: string) => {
    setShowAreaModal(false);
    updateSectorMutation.mutate(areaName);
  };

  const userIssues = profile.issues || [];
  const reportedCount = profile._count?.issues || 0;
  const resolvedCount = profile._count?.resolvedIssues || 0;
  const votesGivenCount = profile._count?.votes || 0;

  const isOfficer = profile?.role === 'OFFICER' || profile?.role === 'PRESIDENT';

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 55 : 40) + 8 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PROFILE</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <LogOut size={14} color="#ef4444" />
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>Could not load profile</Text>
          <Text style={styles.errorSubtext}>Please try again.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Identity Card */}
          <View style={styles.glassCard}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarWrapper}>
                {user?.imageUrl ? (
                  <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
                ) : (
                  <User size={32} color="#10b981" />
                )}
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Active</Text>
                </View>
              </View>
              <View style={styles.identityDetails}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile.name?.toUpperCase() || userProfile?.name?.toUpperCase() || 'ANONYMOUS OPERATOR'}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {profile.email || userProfile?.email || 'N/A'}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.roleContainer}>
                    <Shield size={10} color="#000000" />
                    <Text style={styles.roleText}>{profile.role || 'CITIZEN'}</Text>
                  </View>
                  <View style={styles.levelContainer}>
                    <Text style={styles.levelText}>
                      Level 0{profile.role === 'PRESIDENT' ? 4 : profile.role === 'OFFICER' ? 3 : 1}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.locationSummary}>
              <MapPin size={14} color="#94a3b8" />
              <Text style={styles.locationText}>
                {profile.city && profile.area ? `${profile.area}, ${profile.city}` : 'Location not set'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Stats</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Award size={18} color="#10b981" />
              <Text style={styles.metricValue}>{reportedCount}</Text>
              <Text style={styles.metricLabel}>Reported</Text>
            </View>

            <View style={styles.metricCard}>
              <CheckCircle2 size={18} color="#10b981" />
              <Text style={styles.metricValue}>{resolvedCount}</Text>
              <Text style={styles.metricLabel}>Resolved</Text>
            </View>

            <View style={styles.metricCard}>
              <MapPin size={18} color="#10b981" />
              <Text style={styles.metricValue}>{votesGivenCount}</Text>
              <Text style={styles.metricLabel}>Votes</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.glassCard}>
            <Text style={styles.cardInfoLabel}>Area</Text>
            <TouchableOpacity
              style={styles.areaSelectorTrigger}
              onPress={() => setShowAreaModal(!showAreaModal)}
              disabled={updateSectorMutation.isPending}
            >
              <MapPin size={16} color="#10b981" />
              <Text style={styles.areaSelectorText}>
                {selectedArea || 'Select area'}
              </Text>
              {updateSectorMutation.isPending ? (
                <ActivityIndicator size={12} color="#10b981" />
              ) : (
                <ChevronDown size={14} color="#10b981" />
              )}
            </TouchableOpacity>

            {showAreaModal && (
              <View style={styles.areaDropdown}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {OPERATIONAL_AREAS.map((a) => (
                    <TouchableOpacity
                      key={a.name}
                      style={styles.dropdownItem}
                      onPress={() => handleAreaChange(a.name)}
                    >
                      <Text style={styles.dropdownItemText}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {!isOfficer && (
            <View style={styles.deploymentCard}>
              <View style={styles.deploymentHeader}>
                <ShieldAlert size={16} color="#10b981" />
                <Text style={styles.deploymentTitle}>Access</Text>
              </View>
              <View style={styles.clearanceBadge}>
                <Text style={styles.clearanceText}>Citizen</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionLabel}>Tools</Text>
          <View style={styles.adminHubGrid}>
            <TouchableOpacity
              style={styles.adminHubCard}
              onPress={() => router.push('/ai-insights')}
              activeOpacity={0.8}
            >
              <View style={styles.adminHubHeader}>
                <Sparkles size={16} color="#10b981" />
                <Text style={styles.adminHubTitle}>AI INSIGHTS</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminHubCard}
              onPress={() => router.push('/kanban')}
              activeOpacity={0.8}
            >
              <View style={styles.adminHubHeader}>
                <LayoutGrid size={16} color="#10b981" />
                <Text style={styles.adminHubTitle}>CASE BOARD</Text>
              </View>
            </TouchableOpacity>

            {(profile?.role === 'OFFICER' || profile?.role === 'PRESIDENT') && (
              <TouchableOpacity
                style={styles.adminHubCard}
                onPress={() => router.push('/admin')}
                activeOpacity={0.8}
              >
                <View style={styles.adminHubHeader}>
                  <TrendingUp size={16} color="#10b981" />
                  <Text style={styles.adminHubTitle}>ADMIN PANEL</Text>
                </View>
              </TouchableOpacity>
            )}

            {profile?.role === 'PRESIDENT' && (
              <TouchableOpacity
                style={styles.adminHubCard}
                onPress={() => router.push('/users')}
                activeOpacity={0.8}
              >
                <View style={styles.adminHubHeader}>
                  <Users size={16} color="#10b981" />
                  <Text style={styles.adminHubTitle}>USER DIRECTORY</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionLabel}>My reports</Text>
          {userIssues.length === 0 ? (
            <View style={styles.emptyLedger}>
              <Text style={styles.emptyLedgerText}>No reports yet</Text>
            </View>
          ) : (
            <View style={styles.ledgerContainer}>
              {userIssues.map((issue: any) => {
                const statusStyles = getStatusStyles(issue.status);
                const catStyles = getCategoryStyles(issue.category);
                return (
                  <TouchableOpacity
                    key={issue.id}
                    style={styles.ledgerItem}
                    onPress={() => router.push(`/issue/${issue.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.ledgerDetails}>
                      <Text style={styles.ledgerTitle} numberOfLines={1}>
                        {issue.title}
                      </Text>
                      <View style={styles.ledgerMeta}>
                        <Text style={[styles.ledgerCategory, { color: catStyles.color }]}>
                          {issue.category?.replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.ledgerDot}>•</Text>
                        <Text style={styles.ledgerDate}>{formatDate(issue.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={[styles.ledgerBadge, { backgroundColor: statusStyles.bgColor }]}>
                      <Text style={[styles.ledgerBadgeText, { color: statusStyles.color }]}>
                        {statusStyles.text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16},
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4},
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 2,
    marginTop: 2},
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6},
  logoutText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5},
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 120},
  glassCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden'},
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16},
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'},
  avatarImage: {
    width: 69,
    height: 69,
    borderRadius: 18},
  verifiedBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1},
  verifiedText: {
    color: '#000000',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 1},
  identityDetails: {
    flex: 1,
    gap: 4},
  profileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5},
  profileEmail: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600'},
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4},
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4},
  roleText: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1},
  levelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3},
  levelText: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1},
  locationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    gap: 8},
  locationText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5},
  sectionLabel: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: 'uppercase'},
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24},
  metricCard: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6},
  metricValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1},
  metricLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1},
  cardInfoLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10},
  areaSelectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 10},
  areaSelectorText: {
    flex: 1,
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2},
  areaDropdown: {
    backgroundColor: '#000000',
    borderRadius: 16,
    maxHeight: 180,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10},
  dropdownScroll: {
    padding: 8},
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8},
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2},
  deploymentCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    gap: 10},
  deploymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  deploymentTitle: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5},
  deploymentDescription: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase'},
  clearanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'},
  clearanceText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2},
  emptyLedger: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center'},
  emptyLedgerText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4},
  emptyLedgerSub: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600'},
  ledgerContainer: {
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8},
  ledgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14},
  ledgerDetails: {
    flex: 1,
    gap: 4,
    paddingRight: 10},
  ledgerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'},
  ledgerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  ledgerCategory: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1},
  ledgerDot: {
    color: '#94a3b8',
    fontSize: 10},
  ledgerDate: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600'},
  ledgerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10},
  ledgerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'},
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
    textAlign: 'center'},
  adminHubGrid: {
    marginBottom: 24,
    gap: 12},
  adminHubCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 18,
    gap: 8},
  adminHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10},
  adminHubTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2},
  adminHubDesc: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingLeft: 26}});
