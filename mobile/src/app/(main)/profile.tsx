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
  Alert
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useResolveItAuth } from '@/lib/auth';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import { getCategoryStyles, getStatusStyles, formatDate } from '@/utils/helpers';
import { LogOut, MapPin, User, Award, Shield, ChevronDown, CheckCircle2 } from 'lucide-react-native';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { userProfile, role, logout } = useResolveItAuth() as any;
  const [selectedArea, setSelectedArea] = useState(userProfile?.area || '');
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Fetch full profile info from ResolveIt API
  const { data: profile = {} as any, isLoading } = useQuery<any>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/profile');
      return data || {};
    },
  });

  // Mutation to update sector preference
  const updateSectorMutation = useMutation({
    mutationFn: async (areaName: string) => {
      const { data } = await api.post('/profile', {
        area: areaName,
        city: 'Bengaluru',
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('PREFERENCE REGISTERED', `Your reporting sector has been set to ${data.area || selectedArea}.`);
    },
    onError: (err) => {
      console.error(err);
      Alert.alert('UPDATE FAILURE', 'Failed to register preferred sector on the backend.');
    },
  });

  const handleAreaChange = (areaName: string) => {
    setSelectedArea(areaName);
    setShowAreaModal(false);
    updateSectorMutation.mutate(areaName);
  };

  // Get issues reported by this user
  const userIssues = profile.issues || [];
  const resolvedCount = Array.isArray(userIssues)
    ? userIssues.filter((i: any) => i.status === 'RESOLVED').length
    : 0;

  // Compute total impact points: e.g. 100 for each resolved, 20 for each reported
  const totalImpact = (userIssues.length * 20) + (resolvedCount * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>OPERATOR PROFILE</Text>
          <Text style={styles.headerSubtitle}>ACCOUNTABILITY STANDING</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <LogOut size={16} color="#ef4444" />
          <Text style={styles.logoutText}>TERMINATE</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Identity Card */}
          <View style={styles.glassCard}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarWrapper}>
                <User size={32} color="#10b981" />
              </View>
              <View style={styles.identityDetails}>
                <Text style={styles.profileName}>
                  {profile.name?.toUpperCase() || userProfile?.name?.toUpperCase() || 'ANONYMOUS OPERATOR'}
                </Text>
                <Text style={styles.profileEmail}>
                  {profile.email || userProfile?.email || 'N/A'}
                </Text>
                <View style={styles.roleContainer}>
                  <Shield size={12} color="#10b981" />
                  <Text style={styles.roleText}>{role || 'CITIZEN'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Impact Meter Grid */}
          <Text style={styles.sectionLabel}>IMPACT ASSESSMENT</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Award size={20} color="#10b981" />
              <Text style={styles.metricValue}>{totalImpact}</Text>
              <Text style={styles.metricLabel}>IMPACT INDEX</Text>
            </View>

            <View style={styles.metricCard}>
              <CheckCircle2 size={20} color="#10b981" />
              <Text style={styles.metricValue}>{userIssues.length}</Text>
              <Text style={styles.metricLabel}>TRANSMITTED</Text>
            </View>

            <View style={styles.metricCard}>
              <MapPin size={20} color="#10b981" />
              <Text style={styles.metricValue}>{resolvedCount}</Text>
              <Text style={styles.metricLabel}>RESOLVED</Text>
            </View>
          </View>

          {/* Sector Config */}
          <Text style={styles.sectionLabel}>MONITORING PREFERENCES</Text>
          <View style={styles.glassCard}>
            <Text style={styles.cardInfoLabel}>PREFERRED BENGALURU SECTOR</Text>
            <TouchableOpacity
              style={styles.areaSelectorTrigger}
              onPress={() => setShowAreaModal(!showAreaModal)}
              disabled={updateSectorMutation.isPending}
            >
              <MapPin size={16} color="#10b981" />
              <Text style={styles.areaSelectorText}>
                {selectedArea ? selectedArea.toUpperCase() : 'SELECT PREFERRED SECTOR...'}
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
                      <Text style={styles.dropdownItemText}>{a.name.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Reported Ledger List */}
          <Text style={styles.sectionLabel}>TRANSMISSION LEDGER</Text>
          {userIssues.length === 0 ? (
            <View style={styles.emptyLedger}>
              <Text style={styles.emptyLedgerText}>LEDGER REGISTER IS EMPTY</Text>
              <Text style={styles.emptyLedgerSub}>You have not filed any civic alerts yet.</Text>
            </View>
          ) : (
            <View style={styles.ledgerContainer}>
              {userIssues.map((issue: any) => {
                const statusStyles = getStatusStyles(issue.status);
                const catStyles = getCategoryStyles(issue.category);
                return (
                  <View key={issue.id} style={styles.ledgerItem}>
                    <View style={styles.ledgerDetails}>
                      <Text style={styles.ledgerTitle}>{issue.title}</Text>
                      <View style={styles.ledgerMeta}>
                        <Text style={[styles.ledgerCategory, { color: catStyles.color }]}>
                          {issue.category?.replace('_', ' ')}
                        </Text>
                        <Text style={styles.ledgerDot}>•</Text>
                        <Text style={styles.ledgerDate}>{formatDate(issue.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={[styles.ledgerBadge, { borderColor: statusStyles.borderColor }]}>
                      <Text style={[styles.ledgerBadgeText, { color: statusStyles.color }]}>
                        {statusStyles.text}
                      </Text>
                    </View>
                  </View>
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 120, // tab space
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityDetails: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  profileEmail: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  roleText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionLabel: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardInfoLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  areaSelectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  areaSelectorText: {
    flex: 1,
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  areaDropdown: {
    backgroundColor: 'rgba(10, 10, 10, 0.98)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    maxHeight: 180,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
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
  emptyLedger: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyLedgerText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  emptyLedgerSub: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '600',
  },
  ledgerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ledgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  ledgerDetails: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  ledgerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  ledgerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ledgerCategory: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ledgerDot: {
    color: '#475569',
    fontSize: 10,
  },
  ledgerDate: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  ledgerBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ledgerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
