import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  FlatList,
  Dimensions,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useResolveItAuth } from '@/lib/auth';
import {
  getCategoryIconComponent,
  getCategoryStyles,
  getStatusStyles,
  formatDate,
  evaluateIntensityColor
} from '@/utils/helpers';
import {
  ArrowLeft,
  ThumbsUp,
  MapPin,
  Calendar,
  MessageSquare,
  Send,
  Shield,
  Activity,
  Compass,
  AlertTriangle
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userProfile, role } = useResolveItAuth();

  const [commentText, setCommentText] = useState('');
  
  // Official panel states
  const [newStatus, setNewStatus] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showOfficialPanel, setShowOfficialPanel] = useState(false);

  // Fetch issue details
  const { data: issue = {}, isLoading, error } = useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const { data } = await api.get(`/issues/${id}`);
      return data || {};
    },
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/issues/${id}/votes`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });

  // Add Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post(`/issues/${id}/comments`, { text });
      return data;
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
    },
    onError: (err) => {
      console.error(err);
      Alert.alert('TRANSMISSION FAILURE', 'Failed to register comment on the civic grid.');
    },
  });

  // Update Status mutation (Officers/Presidents only)
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/issues/${id}/status`, {
        status: newStatus,
        notes: officerNotes,
        pinCode: pinCode,
      });
      return data;
    },
    onSuccess: (data) => {
      setOfficerNotes('');
      setPinCode('');
      setShowOfficialPanel(false);
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      Alert.alert('LEADERSHIP ACTION LOGGED', `Issue status has been set to ${newStatus}.`);
    },
    onError: (err: any) => {
      console.error(err);
      Alert.alert(
        'AUTHORIZATION DENIED',
        err?.response?.data?.error || 'Invalid credentials or PIN Code for this operational sector.'
      );
    },
  });

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  const handleStatusSubmit = () => {
    if (!newStatus) {
      Alert.alert('Required Field', 'Please select a status.');
      return;
    }
    if (!pinCode) {
      Alert.alert('Required Field', 'Please enter your sector security PIN Code.');
      return;
    }
    updateStatusMutation.mutate();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>RESOLVING DETAILS...</Text>
      </View>
    );
  }

  if (error || !issue.id) {
    return (
      <View style={styles.loadingContainer}>
        <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>COULD NOT RESOLVE INCIDENT LOG</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>RETURN TO DASHBOARD</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catStyles = getCategoryStyles(issue.category);
  const statusStyles = getStatusStyles(issue.status);
  const hasVoted = issue.hasVoted || false;
  const isOfficer = role === 'PRESIDENT' || role === 'OFFICER';

  // Fallback images if none attached
  const evidenceImages = issue.images && issue.images.length > 0
    ? issue.images
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Detail Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          INCIDENT #{issue.id?.substring(0, 8).toUpperCase() || 'LOG'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Core details */}
        <View style={styles.glassCard}>
          <View style={styles.badgeRow}>
            {/* Category */}
            <View style={[styles.categoryBadge, { backgroundColor: catStyles.bgColor, borderColor: catStyles.borderColor }]}>
              {getCategoryIconComponent(issue.category, 14, catStyles.color)}
              <Text style={[styles.categoryText, { color: catStyles.color }]}>
                {issue.category?.replace('_', ' ')}
              </Text>
            </View>

            {/* Status */}
            <View style={[styles.statusBadge, { borderColor: statusStyles.borderColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyles.color }]} />
              <Text style={[styles.statusText, { color: statusStyles.color }]}>
                {statusStyles.text}
              </Text>
            </View>
          </View>

          <Text style={styles.issueTitle}>{issue.title}</Text>
          <Text style={styles.issueDesc}>{issue.description}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <MapPin size={14} color="#64748b" />
              <Text style={styles.metaText}>{issue.area || issue.locationName || 'Bengaluru'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#64748b" />
              <Text style={styles.metaText}>{formatDate(issue.createdAt)}</Text>
            </View>
          </View>

          {/* Intensity Slider Gauge */}
          {issue.severityScore && (
            <View style={styles.intensityContainer}>
              <Text style={styles.intensityLabel}>INCIDENT SEVERITY SCORE</Text>
              <View style={styles.intensityTrack}>
                <View
                  style={[
                    styles.intensityFill,
                    {
                      width: `${issue.severityScore * 10}%`,
                      backgroundColor: evaluateIntensityColor(issue.severityScore)
                    }
                  ]}
                />
              </View>
              <View style={styles.intensityFooter}>
                <Text style={styles.intensitySub}>LOW</Text>
                <Text style={[styles.intensityVal, { color: evaluateIntensityColor(issue.severityScore) }]}>
                  LEVEL {issue.severityScore}/10
                </Text>
                <Text style={styles.intensitySub}>CRITICAL</Text>
              </View>
            </View>
          )}

          {/* Tactical Vote Pill */}
          <TouchableOpacity
            style={[
              styles.votePill,
              hasVoted && styles.votedPill,
              upvoteMutation.isPending && { opacity: 0.6 }
            ]}
            onPress={() => upvoteMutation.mutate()}
            disabled={upvoteMutation.isPending}
            activeOpacity={0.8}
          >
            <ThumbsUp size={16} color={hasVoted ? '#000000' : '#10b981'} />
            <Text style={[styles.voteText, { color: hasVoted ? '#000000' : '#10b981' }]}>
              {hasVoted ? 'TRANSMITTED UPVOTE' : 'INITIATE TACTICAL UPVOTE'}
            </Text>
            <View style={[styles.voteCountBadge, { backgroundColor: hasVoted ? 'rgba(0,0,0,0.1)' : 'rgba(16,185,129,0.1)' }]}>
              <Text style={[styles.voteCountText, { color: hasVoted ? '#000000' : '#10b981' }]}>
                {issue.votesCount || issue.upvotes || 0}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Evidence Photos Gallery */}
        {evidenceImages.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>EVIDENCE VIEW</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContainer}>
              {evidenceImages.map((img: string, idx: number) => (
                <View key={idx} style={styles.galleryImageWrapper}>
                  <Image source={{ uri: img }} style={styles.galleryImage as any} resizeMode="cover" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Audit history of status updates */}
        {issue.history && issue.history.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>CHRONOLOGY AUDIT</Text>
            <View style={styles.timeline}>
              {issue.history.map((hist: any, index: number) => {
                const isLast = index === issue.history.length - 1;
                const histStatusStyles = getStatusStyles(hist.status);
                return (
                  <View key={hist.id || index} style={styles.timelineItem}>
                    <View style={styles.timelineDotContainer}>
                      <View style={[styles.timelineDot, { backgroundColor: histStatusStyles.color }]} />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStatus}>{histStatusStyles.text}</Text>
                      {hist.notes && <Text style={styles.timelineNotes}>{hist.notes}</Text>}
                      <Text style={styles.timelineDate}>{formatDate(hist.createdAt)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Official Action Control Room */}
        {isOfficer && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.officialToggle}
              onPress={() => setShowOfficialPanel(!showOfficialPanel)}
              activeOpacity={0.8}
            >
              <Shield size={16} color="#10b981" />
              <Text style={styles.officialToggleText}>LEADERSHIP RESOLUTION PANEL</Text>
              <Activity size={16} color="#10b981" />
            </TouchableOpacity>

            {showOfficialPanel && (
              <View style={styles.officialPanel}>
                <Text style={styles.panelLabel}>TRANSITION STATUS TO</Text>
                <View style={styles.statusButtons}>
                  {['IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((st) => {
                    const stStyles = getStatusStyles(st);
                    const isSelected = newStatus === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusSelector,
                          { borderColor: stStyles.borderColor },
                          isSelected && { backgroundColor: stStyles.color }
                        ]}
                        onPress={() => setNewStatus(st)}
                      >
                        <Text style={[styles.statusSelectorText, { color: isSelected ? '#000000' : stStyles.color }]}>
                          {st === 'IN_PROGRESS' ? 'PROCESSING' : st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.panelLabel}>OFFICER TRANSMISSION NOTES</Text>
                <View style={styles.panelInputWrapper}>
                  <TextInput
                    style={styles.panelInput}
                    placeholder="Provide official resolution logs..."
                    placeholderTextColor="#64748b"
                    value={officerNotes}
                    onChangeText={setOfficerNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <Text style={styles.panelLabel}>SECTOR AUTHORIZATION PIN</Text>
                <View style={[styles.panelInputWrapper, { height: 48 }]}>
                  <TextInput
                    style={styles.panelInput}
                    placeholder="ENTER SECURE SECURITY PIN CODE..."
                    placeholderTextColor="#64748b"
                    value={pinCode}
                    onChangeText={setPinCode}
                    secureTextEntry
                    keyboardType="number-pad"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.officialSubmit, updateStatusMutation.isPending && { opacity: 0.6 }]}
                  onPress={handleStatusSubmit}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.officialSubmitText}>EXECUTE STATUS SHIFT</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Discussion Block / Comments */}
        <View style={[styles.sectionContainer, { marginBottom: 60 }]}>
          <Text style={styles.sectionTitle}>PUBLIC DEBATE</Text>
          
          {/* Comments List */}
          {issue.comments && issue.comments.length > 0 ? (
            <View style={styles.commentsList}>
              {issue.comments.map((com: any) => (
                <View key={com.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {com.user?.name || 'ANONYMOUS OPERATOR'}
                    </Text>
                    <Text style={styles.commentDate}>
                      {formatDate(com.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{com.text}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyComments}>
              <MessageSquare size={20} color="#475569" style={{ marginBottom: 6 }} />
              <Text style={styles.emptyCommentsText}>NO LOGGED MESSAGES IN TRANSMISSION</Text>
            </View>
          )}

          {/* Add Comment Box */}
          <View style={styles.commentBox}>
            <TextInput
              style={styles.commentInput}
              placeholder="ENTER PUBLIC DISCUSSION FEEDBACK..."
              placeholderTextColor="#64748b"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={styles.commentSend}
              onPress={handleSendComment}
              disabled={addCommentMutation.isPending || !commentText.trim()}
              activeOpacity={0.8}
            >
              {addCommentMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Send size={16} color="#000000" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  headerBack: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  issueTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  issueDesc: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    paddingBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  intensityContainer: {
    marginBottom: 20,
  },
  intensityLabel: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  intensityTrack: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    borderRadius: 3,
  },
  intensityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  intensitySub: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
  },
  intensityVal: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  votePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  votedPill: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  voteText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  voteCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  voteCountText: {
    fontSize: 11,
    fontWeight: '900',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  galleryContainer: {
    gap: 12,
  },
  galleryImageWrapper: {
    width: width * 0.7,
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  timeline: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDotContainer: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
    gap: 4,
  },
  timelineStatus: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  timelineNotes: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  timelineDate: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  officialToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  officialToggleText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  officialPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  panelLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusSelector: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSelectorText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  panelInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  panelInput: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  officialSubmit: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialSubmitText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  commentsList: {
    gap: 10,
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  commentDate: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  commentText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
  },
  emptyComments: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyCommentsText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  commentBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 8,
    alignItems: 'center',
    height: 52,
  },
  commentInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  commentSend: {
    backgroundColor: '#10b981',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  backButton: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
