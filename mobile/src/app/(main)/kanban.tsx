import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette } from '@/constants/palette';
import {
  Target,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  MapPin,
  GripVertical,
  AlertTriangle,
  RefreshCw} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLUMN_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 300);
const COLUMN_GAP = 12;

const COLUMNS = [
  { id: 'REPORTED', title: 'Reported', icon: Target, color: Palette.accent },
  { id: 'IN_PROGRESS', title: 'In progress', icon: Activity, color: '#f59e0b' },
  { id: 'RESOLVED', title: 'Resolved', icon: CheckCircle2, color: Palette.accent },
  { id: 'REJECTED', title: 'Rejected', icon: AlertCircle, color: Palette.danger },
] as const;

type Issue = {
  id: string;
  title: string;
  status: string;
  category?: string;
  area?: string;
  city?: string;
  slaBreached?: boolean;
};

function formatCategory(category?: string) {
  return (category || 'General').replace(/_/g, ' ');
}

export default function KanbanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: profile = {} } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data || {};
    }});

  const userRole = profile.role || 'CITIZEN';
  const userArea = profile.area || '';
  const isOfficer = ['OFFICER', 'PRESIDENT'].includes(userRole);

  const {
    data: issues = [],
    isLoading,
    isError,
    refetch,
    isRefetching} = useQuery<Issue[]>({
    queryKey: ['kanbanIssues', isOfficer],
    queryFn: async () => {
      if (isOfficer) {
        const res = await api.get('/issues?areaReports=true');
        if (res.data?.length > 0) return res.data;
      }
      const res = await api.get('/issues');
      return res.data || [];
    }});

  const updateStatusMutation = useMutation({
    mutationFn: async ({ issueId, newStatus }: { issueId: string; newStatus: string }) => {
      if (!isOfficer) throw new Error('UNAUTHORIZED');
      return api.patch(`/issues/${issueId}/status`, {
        newStatus,
        note: 'Updated from case board.'});
    },
    onMutate: ({ issueId }) => setUpdatingId(issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanIssues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: () => {
      Alert.alert('Update failed', 'You may not have permission for this case.');
    },
    onSettled: () => setUpdatingId(null)});

  const counts = useMemo(() => {
    const c = { REPORTED: 0, IN_PROGRESS: 0, RESOLVED: 0, REJECTED: 0, sla: 0 };
    issues.forEach((i) => {
      if (i.status in c) c[i.status as keyof typeof c]++;
      if (i.slaBreached) c.sla++;
    });
    return c;
  }, [issues]);

  const resolutionRate = issues.length
    ? Math.round((counts.RESOLVED / issues.length) * 100)
    : 0;
  const inHandling = counts.REPORTED + counts.IN_PROGRESS;

  const columnHeight = useMemo(() => {
    const reserved = insets.top + insets.bottom + 280;
    return Math.max(SCREEN_HEIGHT - reserved, 360);
  }, [insets.top, insets.bottom]);

  const canManageIssue = useCallback(
    (issue: Issue) => isOfficer && (userRole === 'PRESIDENT' || issue.area === userArea),
    [isOfficer, userRole, userArea]
  );

  const openStatusMenu = (issue: Issue) => {
    if (!canManageIssue(issue)) {
      router.push(`/issue/${issue.id}`);
      return;
    }

    Alert.alert(issue.title, 'Move this case to:', [
      { text: 'Reported', onPress: () => updateStatusMutation.mutate({ issueId: issue.id, newStatus: 'REPORTED' }) },
      { text: 'In progress', onPress: () => updateStatusMutation.mutate({ issueId: issue.id, newStatus: 'IN_PROGRESS' }) },
      { text: 'Resolved', onPress: () => updateStatusMutation.mutate({ issueId: issue.id, newStatus: 'RESOLVED' }) },
      { text: 'Rejected', onPress: () => updateStatusMutation.mutate({ issueId: issue.id, newStatus: 'REJECTED' }) },
      { text: 'View details', onPress: () => router.push(`/issue/${issue.id}`) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onCardPress = (issue: Issue) => {
    if (!isOfficer) {
      router.push(`/issue/${issue.id}`);
      return;
    }
    if (!canManageIssue(issue)) {
      Alert.alert(
        'Outside your sector',
        `This case is in ${issue.area || 'another area'}. Open details to view only?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View', onPress: () => router.push(`/issue/${issue.id}`) },
        ]
      );
      return;
    }
    openStatusMenu(issue);
  };

  const summaryStats = [
    { label: 'Total', value: issues.length, color: Palette.text },
    { label: 'Handling', value: inHandling, color: '#f59e0b' },
    { label: 'Resolved', value: counts.RESOLVED, color: Palette.accent },
    { label: 'SLA risk', value: counts.sla, color: counts.sla > 0 ? Palette.danger : Palette.textMuted },
  ];

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Palette.accent} />
        <Text style={styles.loadingText}>Loading board...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <AlertCircle size={36} color={Palette.danger} />
        <Text style={styles.errorTitle}>Could not load board</Text>
        <Text style={styles.errorSub}>Check your connection and try again.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Case board</Text>
          <View style={styles.badgeRow}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
            {!isOfficer ? (
              <Text style={styles.viewBadge}>View only</Text>
            ) : (
              <Text style={styles.viewBadge}>{userRole}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, isRefetching && styles.refreshBtnBusy]}
          onPress={() => refetch()}
          disabled={isRefetching}
          hitSlop={12}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={Palette.accent} />
          ) : (
            <RefreshCw size={18} color={Palette.accent} />
          )}
        </TouchableOpacity>
      </View>

      {/* Metrics */}
      <View style={styles.metricsWrap}>
        <View style={styles.rateCard}>
          <View style={styles.rateHeader}>
            <Text style={styles.rateLabel}>Resolution rate</Text>
            <Text style={styles.rateValue}>{resolutionRate}%</Text>
          </View>
          <View style={styles.rateTrack}>
            <View style={[styles.rateFill, { width: `${resolutionRate}%` }]} />
          </View>
          <Text style={styles.rateHint}>
            {isOfficer
              ? 'Tap a card to move it between columns.'
              : 'Swipe columns to see how cases move through the pipeline.'}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          {summaryStats.map((s) => (
            <View key={s.label} style={styles.statChip}>
              <Text style={styles.statChipLabel}>{s.label}</Text>
              <Text style={[styles.statChipValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.pipelineLabel}>Pipeline</Text>

      {/* Kanban columns — horizontal scroll only */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={COLUMN_WIDTH + COLUMN_GAP}
        snapToAlignment="start"
        contentContainerStyle={[
          styles.columnsScroll,
          { paddingBottom: insets.bottom + 88 },
        ]}
      >
        {COLUMNS.map((col) => {
          const colIssues = issues.filter((i) => i.status === col.id);
          const Icon = col.icon;

          return (
            <View
              key={col.id}
              style={[styles.column, { width: COLUMN_WIDTH, maxHeight: columnHeight }]}
            >
              <View style={styles.columnHeader}>
                <View style={[styles.columnIconWrap, { backgroundColor: `${col.color}18` }]}>
                  <Icon size={16} color={col.color} />
                </View>
                <Text style={styles.columnTitle}>{col.title}</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{colIssues.length}</Text>
                </View>
              </View>

              <ScrollView
                style={styles.columnScroll}
                contentContainerStyle={styles.columnBody}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {colIssues.length === 0 ? (
                  <View style={styles.emptyCol}>
                    <View style={styles.emptyRing}>
                      <Icon size={22} color={Palette.textMuted} />
                    </View>
                    <Text style={styles.emptyColTitle}>No cases</Text>
                    <Text style={styles.emptyColSub}>Nothing in this stage yet.</Text>
                  </View>
                ) : (
                  colIssues.map((issue) => {
                    const restricted = isOfficer && !canManageIssue(issue);
                    const updating = updatingId === issue.id;

                    return (
                      <Pressable
                        key={issue.id}
                        style={({ pressed }) => [
                          styles.card,
                          restricted && styles.cardRestricted,
                          pressed && styles.cardPressed,
                        ]}
                        onPress={() => onCardPress(issue)}
                        onLongPress={() => router.push(`/issue/${issue.id}`)}
                      >
                        {updating && (
                          <View style={styles.cardOverlay}>
                            <ActivityIndicator size="small" color={Palette.accent} />
                          </View>
                        )}

                        <View style={styles.cardTop}>
                          <Text style={styles.cardCategory} numberOfLines={1}>
                            {formatCategory(issue.category)}
                          </Text>
                          {isOfficer && (
                            <GripVertical
                              size={14}
                              color={restricted ? Palette.danger : Palette.textMuted}
                            />
                          )}
                        </View>

                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {issue.title}
                        </Text>

                        <View style={styles.cardBottom}>
                          <View style={styles.locationRow}>
                            <MapPin size={12} color={Palette.accent} />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {issue.area || issue.city || 'City wide'}
                            </Text>
                          </View>
                          {issue.slaBreached && (
                            <View style={styles.slaPill}>
                              <AlertTriangle size={10} color={Palette.danger} />
                              <Text style={styles.slaText}>Overdue</Text>
                            </View>
                          )}
                        </View>

                        {restricted && (
                          <Text style={styles.restrictedHint}>Outside your sector</Text>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.background},
  centered: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12},
  loadingText: {
    color: Palette.textMuted,
    fontSize: 13,
    fontWeight: '600'},
  errorTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8},
  errorSub: {
    color: Palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20},
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Palette.glass,
    borderRadius: 12},
  retryBtnText: {
    color: Palette.accent,
    fontSize: 14,
    fontWeight: '700'},

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12},
  headerLeft: {
    flex: 1,
    gap: 8},
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: -0.5},
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Palette.accentSurface},
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.accent},
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5},
  viewBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5},
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center'},
  refreshBtnBusy: {
    opacity: 0.7},

  metricsWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12},
  rateCard: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10},
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline'},
  rateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5},
  rateValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Palette.text},
  rateTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.glass,
    overflow: 'hidden'},
  rateFill: {
    height: '100%',
    backgroundColor: Palette.accent,
    borderRadius: 3},
  rateHint: {
    fontSize: 12,
    color: Palette.textMuted,
    lineHeight: 17},
  statsRow: {
    gap: 8,
    paddingRight: 20},
  statChip: {
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Palette.surface},
  statChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4},
  statChipValue: {
    fontSize: 20,
    fontWeight: '900'},

  pipelineLabel: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1},

  columnsScroll: {
    paddingHorizontal: 20,
    gap: COLUMN_GAP},
  column: {
    backgroundColor: Palette.surfaceElevated,
    borderRadius: 20,
    overflow: 'hidden'},
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Palette.glass},
  columnIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center'},
  columnTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Palette.text},
  countPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8},
  countText: {
    fontSize: 12,
    fontWeight: '900',
    color: Palette.textSecondary},
  columnScroll: {
    flex: 1},
  columnBody: {
    padding: 12,
    gap: 10,
    flexGrow: 1},

  emptyCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
    opacity: 0.7},
  emptyRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12},
  emptyColTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textSecondary},
  emptyColSub: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 4,
    textAlign: 'center'},

  card: {
    backgroundColor: Palette.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    position: 'relative'},
  cardPressed: {
    backgroundColor: Palette.surface},
  cardRestricted: {
    opacity: 0.75},
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2},
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8},
  cardCategory: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3},
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.text,
    lineHeight: 20,
    marginBottom: 12},
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 10},
  locationRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4},
  locationText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textMuted,
    textTransform: 'capitalize'},
  slaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Palette.dangerSurface},
  slaText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.danger,
    textTransform: 'uppercase'},
  restrictedHint: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.danger}});
