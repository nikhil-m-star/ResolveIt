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
  Share,
  Platform
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Download,
  ArrowLeft
} from 'lucide-react-native';

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857', '#94a3b8'];

export default function AdminScreen() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  // Fetch admin stats from /admin/stats
  const { data: stats, isLoading, isError } = useQuery<any>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
    retry: false
  });

  // Fetch all issues for CSV data log export
  const { data: issues = [] } = useQuery<any[]>({
    queryKey: ['adminIssuesExport'],
    queryFn: async () => {
      const res = await api.get('/issues');
      return res.data || [];
    },
    enabled: !!stats // Only fetch if user actually has admin permission
  });

  const handleExportCSV = async () => {
    if (!issues || issues.length === 0) {
      Alert.alert('ERROR', 'No operational logs available to export.');
      return;
    }

    setIsExporting(true);

    try {
      const headers = ['ID', 'Title', 'Category', 'Status', 'Intensity', 'City', 'Area', 'Created At', 'SLA Breached'];
      const rows = issues.map((issue) => [
        issue.id,
        `"${(issue.title || '').replace(/"/g, '""')}"`,
        issue.category,
        issue.status,
        issue.intensity || 'N/A',
        `"${issue.city}"`,
        `"${issue.area || ''}"`,
        new Date(issue.createdAt).toISOString(),
        issue.slaBreached ? 'Yes' : 'No',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      // Trigger native share dialog to export CSV
      await Share.share({
        message: csvContent,
        title: `resolveit-intelligence-export-${new Date().getTime()}.csv`});

      Alert.alert('SUCCESS', 'Intelligence log data export completed.');
    } catch (err) {
      console.error(err);
      Alert.alert('EXPORT FAILED', 'Failed to share operational CSV data.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>COLLECTING Strategic STATS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !stats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>METRICS UNAVAILABLE</Text>
          <Text style={styles.errorSubtext}>
            Ensure you have the required Official clearance to access the Command Center.
          </Text>
          <TouchableOpacity style={styles.exitButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.exitButtonText}>EXIT SECTOR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryBreakdown = Array.isArray(stats.categoryBreakdown) ? stats.categoryBreakdown : [];
  const maxCategoryCount = categoryBreakdown.reduce((max: number, cat: any) => Math.max(max, cat.count || 0), 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={16} color="#10b981" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SECTOR INTELLIGENCE</Text>
          <Text style={styles.headerSubtitle}>STRATEGIC METRICS HUD</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Intro Indicators & Export Trigger */}
        <View style={styles.commandIntroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.intelBadge}>
              <Activity size={10} color="#10b981" />
              <Text style={styles.intelBadgeText}>INTELLIGENCE ACTIVE</Text>
            </View>
            <View style={styles.rootBeacon}>
              <View style={styles.beaconDot} />
              <Text style={styles.beaconText}>LIVE SYSTEM FEED</Text>
            </View>
          </View>
          <Text style={styles.commandTitle}>ADMIN PORTAL</Text>
          <Text style={styles.commandDesc}>
            Real-time visual reports of civic intensity spreads, operational SLA limits, and category densities.
          </Text>

          <TouchableOpacity
            style={styles.exportCSVButton}
            onPress={handleExportCSV}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Download size={14} color="#000000" />
            )}
            <Text style={styles.exportCSVText}>LOG DATA EXPORT (CSV)</Text>
          </TouchableOpacity>
        </View>

        {/* Strategic HUD Panels */}
        <Text style={styles.sectionTitle}>STRATEGIC KPIS</Text>
        <View style={styles.kpiGrid}>
          {/* Card 1: Total Reports */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconContainer}>
              <BarChart3 size={16} color="#10b981" />
            </View>
            <Text style={styles.kpiLabel}>TOTAL REPORTS</Text>
            <Text style={styles.kpiValue}>{stats.total}</Text>
            <Text style={styles.kpiTrend}>+8.2% VS LAST MONTH</Text>
          </View>

          {/* Card 2: Success Rate */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconContainer}>
              <CheckCircle size={16} color="#10b981" />
            </View>
            <Text style={styles.kpiLabel}>SUCCESS RATE</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>{stats.resolutionRate}%</Text>
            <Text style={styles.kpiTrend}>CLEARANCE OPTIMIZED</Text>
          </View>

          {/* Card 3: Active Operations */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconContainer}>
              <Activity size={16} color="#10b981" />
            </View>
            <Text style={styles.kpiLabel}>ACTIVE OPERATIONS</Text>
            <Text style={styles.kpiValue}>{stats.inProgress}</Text>
            <Text style={styles.kpiTrend}>FIELD RESPONSE ACTIVE</Text>
          </View>

          {/* Card 4: Critical Breaches */}
          <View style={[styles.kpiCard, stats.slaBreached > 0 && styles.kpiCardSlaAlert]}>
            <View style={styles.kpiIconContainer}>
              <AlertTriangle size={16} color={stats.slaBreached > 0 ? '#ef4444' : '#10b981'} />
            </View>
            <View style={styles.kpiAlertHeader}>
              <Text style={styles.kpiLabel}>CRITICAL BREACHES</Text>
              {stats.slaBreached > 0 && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalBadgeText}>CRITICAL</Text>
                </View>
              )}
            </View>
            <Text style={[styles.kpiValue, stats.slaBreached > 0 && { color: '#ef4444' }]}>
              {stats.slaBreached}
            </Text>
            <Text style={[styles.kpiTrend, stats.slaBreached > 0 && { color: '#ef4444' }]}>
              {stats.slaBreached > 0 ? 'IMMEDIATE ACTION REQUIRED' : 'OPERATIONS WITHIN SLA'}
            </Text>
          </View>
        </View>

        {/* Visual Spread Analysis Percentage bars */}
        <Text style={styles.sectionTitle}>RESOURCE SPREAD & DENSITY</Text>
        <View style={styles.densityCard}>
          <Text style={styles.densityCardLabel}>CATEGORY INCIDENT DISTRIBUTION</Text>

          {categoryBreakdown.length === 0 ? (
            <View style={styles.emptyDensityContainer}>
              <Text style={styles.emptyDensityText}>AWAITING SECTOR DATA...</Text>
            </View>
          ) : (
            <View style={styles.densityList}>
              {categoryBreakdown.map((item: any, index: number) => {
                const count = item.count || 0;
                const percentage = Math.round((count / (stats.total || 1)) * 100);
                const fillPercentage = Math.round((count / maxCategoryCount) * 100);
                const color = COLORS[index % COLORS.length];

                return (
                  <View key={index} style={styles.densityRow}>
                    <View style={styles.densityMetaRow}>
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {item.category?.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.categoryStats}>
                        {count} CASES ({percentage}%)
                      </Text>
                    </View>

                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${fillPercentage}%`,
                            backgroundColor: color,
                            shadowColor: color},
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
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
  commandIntroCard: {
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24},
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12},
  intelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4},
  intelBadgeText: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1},
  rootBeacon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5},
  beaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'},
  beaconText: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1},
  commandTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8},
  commandDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 20},
  exportCSVButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 16,
    height: 46,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4},
  exportCSVText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5},
  sectionTitle: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16},
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24},
  kpiCard: {
    width: '48.2%',
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 16,
    gap: 8},
  kpiCardSlaAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)'},
  kpiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start'},
  kpiAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'},
  criticalBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1},
  criticalBadgeText: {
    color: '#ffffff',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.5},
  kpiLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1},
  kpiValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5},
  kpiTrend: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4},
  densityCard: {
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20},
  densityCardLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 20},
  emptyDensityContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center'},
  emptyDensityText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2},
  densityList: {
    gap: 16},
  densityRow: {
    gap: 8},
  densityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline'},
  categoryName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 10},
  categoryStats: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5},
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden'},
  barFill: {
    height: '100%',
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5},
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
    letterSpacing: 1.5}});
