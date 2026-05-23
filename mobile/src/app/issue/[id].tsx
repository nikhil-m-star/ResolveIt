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
  Dimensions,
  SafeAreaView,
  Platform,
  Alert,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, resolveImageUrl } from '@/lib/api';
import { useResolveItAuth } from '@/lib/auth';
import { WebView } from 'react-native-webview';
import {
  getCategoryIconComponent,
  getCategoryStyles,
  getStatusStyles,
  formatDate,
  evaluateIntensityColor
} from '@/utils/helpers';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MapPin,
  Calendar,
  MessageSquare,
  Send,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0b0c10" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a5b4fc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0c10" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#818cf8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c084fc" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#a5b4fc" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#064e3b" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#34d399" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#1e1b4b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#312e81" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4f46e5" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#5850ec" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#1e3a8a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#60a5fa" }] }
];

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useResolveItAuth();

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
    }});

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (type: 'UP' | 'DOWN') => {
      const { data } = await api.post(`/issues/${id}/vote`, { type });
      return data;
    },
    onMutate: async (type) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['issue', id] });
      await queryClient.cancelQueries({ queryKey: ['issues'] });

      // Snapshot previous values
      const previousIssue = queryClient.getQueryData(['issue', id]);
      const previousIssues = queryClient.getQueryData(['issues']);

      // Optimistically update the detailed issue
      queryClient.setQueryData(['issue', id], (old: any) => {
        if (!old) return old;
        const currentVote = old.userVote;
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

        return {
          ...old,
          userVote: newVote,
          votes: (old.votes || 0) + votesChange};
      });

      // Optimistically update issues feed cache
      queryClient.setQueryData(['issues'], (old: any[] | undefined) => {
        if (!old) return [];
        return old.map((iss: any) => {
          if (iss.id === id) {
            const currentVote = iss.userVote;
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

            return {
              ...iss,
              userVote: newVote,
              votes: (iss.votes || 0) + votesChange};
          }
          return iss;
        });
      });

      return { previousIssue, previousIssues };
    },
    onError: (err, type, context) => {
      // Rollback on error
      if (context?.previousIssue) {
        queryClient.setQueryData(['issue', id], context.previousIssue);
      }
      if (context?.previousIssues) {
        queryClient.setQueryData(['issues'], context.previousIssues);
      }
    },
    onSettled: () => {
      // Invalidate to synchronize
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }});

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
      Alert.alert('Could not add comment', 'Please try again.');
    }});

  // Update Status mutation (Officers/Presidents only)
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/issues/${id}/status`, {
        newStatus,
        note: officerNotes,
        pinCode: pinCode});
      return data;
    },
    onSuccess: (data) => {
      setOfficerNotes('');
      setPinCode('');
      setShowOfficialPanel(false);
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      Alert.alert('Status updated', `Issue set to ${newStatus}.`);
    },
    onError: (err: any) => {
      console.error(err);
      Alert.alert(
        'Update failed',
        err?.response?.data?.error || 'Check your permissions or PIN and try again.'
      );
    }});

  const deleteIssueMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/issues/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      Alert.alert('Deleted', 'Report has been removed.');
      router.replace('/(main)');
    },
    onError: (err: any) => {
      console.error(err);
      Alert.alert('Delete failed', err?.response?.data?.error || 'Unable to delete report.');
    }
  });

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  const handleStatusSubmit = () => {
    if (!newStatus) {
      Alert.alert('Missing status', 'Select a status.');
      return;
    }
    if (role !== 'PRESIDENT' && !pinCode) {
      Alert.alert('Missing PIN', 'Enter your PIN.');
      return;
    }
    updateStatusMutation.mutate();
  };

  const handleDeleteReport = () => {
    if (role !== 'PRESIDENT') return;
    Alert.alert(
      'Delete report?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteIssueMutation.mutate() }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading issue...</Text>
      </View>
    );
  }

  if (error || !issue.id) {
    return (
      <View style={styles.loadingContainer}>
        <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>Could not load issue</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catStyles = getCategoryStyles(issue.category);
  const statusStyles = getStatusStyles(issue.status);
  const isOfficer = role === 'PRESIDENT' || role === 'OFFICER';

  // Fallback images if none attached
  const evidenceImages = issue.imageUrls && issue.imageUrls.length > 0
    ? issue.imageUrls
    : [];

  


  
  const historyLogs = issue.statusHistory || [];

  const issueHtml = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #0b0c10; }
          .leaflet-container { background: #0b0c10; cursor: crosshair; }
          .leaflet-tile { filter: brightness(1.5) contrast(1.2) sepia(0.3) hue-rotate(180deg) saturate(2); }
          .neon-pulse {
              width: 100%; height: 100%; background: #ff00ff; border: 2px solid #00ffff;
              border-radius: 50%; box-shadow: 0 0 15px #ff00ff, 0 0 30px #00ffff;
              animation: pulsate 1s infinite alternate;
          }
          @keyframes pulsate { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.2); opacity: 1; } }
      </style>
  </head>
  <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${Number(issue.latitude) || 12.9716}, ${Number(issue.longitude) || 77.5946}], 15);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
          var neonIcon = L.divIcon({
              html: "<div class='neon-pulse'></div>",
              className: "",
              iconSize: [24, 24],
              iconAnchor: [12, 12]
          });
          L.marker([${Number(issue.latitude) || 12.9716}, ${Number(issue.longitude) || 77.5946}], { icon: neonIcon }).addTo(map);
      </script>
  </body>
  </html>`;
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Detail Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBack} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(main)');
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Issue #{issue.id?.substring(0, 8).toUpperCase() || 'DETAILS'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Core details */}
        <View style={styles.glassCard}>
          <View style={styles.badgeRow}>
            {/* Category */}
            <View style={[styles.categoryBadge, { backgroundColor: catStyles.bgColor }]}>
              {getCategoryIconComponent(issue.category, 14, catStyles.color)}
              <Text style={[styles.categoryText, { color: catStyles.color }]}>
                {issue.category?.replace(/_/g, ' ')}
              </Text>
            </View>

            {/* Status */}
            <View style={[styles.statusBadge, { backgroundColor: statusStyles.bgColor }]}>
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
              <MapPin size={14} color="#94a3b8" />
              <Text style={styles.metaText}>{issue.area || issue.locationName || 'Bengaluru'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#94a3b8" />
              <Text style={styles.metaText}>{formatDate(issue.createdAt)}</Text>
            </View>
          </View>

          {/* Intensity Slider Gauge */}
          {issue.severityScore && (
            <View style={styles.intensityContainer}>
              <Text style={styles.intensityLabel}>Severity</Text>
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
                <Text style={styles.intensitySub}>Low</Text>
                <Text style={[styles.intensityVal, { color: evaluateIntensityColor(issue.severityScore) }]}>
                  {issue.severityScore}/10
                </Text>
                <Text style={styles.intensitySub}>High</Text>
              </View>
            </View>
          )}

          {/* Bidirectional Tactical Vote Pill */}
          <View style={styles.votePillDetailContainer}>
            <Text style={styles.votePillDetailLabel}>Vote</Text>
            <View style={styles.votePillContainer}>
              <TouchableOpacity
                style={[
                  styles.voteArrowButton,
                  issue.userVote === 'UP' && styles.voteArrowUpActive
                ]}
                onPress={() => voteMutation.mutate('UP')}
              >
                <ArrowUp size={16} color={issue.userVote === 'UP' ? '#000000' : '#10b981'} />
              </TouchableOpacity>
              
              <Text style={[
                styles.votePillCount,
                issue.userVote === 'UP' && styles.votePillCountUp,
                issue.userVote === 'DOWN' && styles.votePillCountDown
              ]}>
                {issue.votes || 0}
              </Text>

              <TouchableOpacity
                style={[
                  styles.voteArrowButton,
                  issue.userVote === 'DOWN' && styles.voteArrowDownActive
                ]}
                onPress={() => voteMutation.mutate('DOWN')}
              >
                <ArrowDown size={16} color={issue.userVote === 'DOWN' ? '#000000' : '#ef4444'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Evidence Photos Gallery */}
        {evidenceImages.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContainer}>
              {evidenceImages.map((img: string, idx: number) => (
                <View key={idx} style={styles.galleryImageWrapper}>
                  <Image source={{ uri: resolveImageUrl(img) }} style={styles.galleryImage} resizeMode="cover" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Incident Radar Map */}
        {issue.latitude && issue.longitude && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapCard}>
              <WebView style={styles.detailMap} originWhitelist={["*"]} source={{ html: issueHtml }} scrollEnabled={true} nestedScrollEnabled={true} />
              <View style={styles.mapBadgeRow}>
                <Text style={styles.mapBadgeText}>LAT: {Number(issue.latitude).toFixed(4)}</Text>
                <Text style={styles.mapBadgeText}>LNG: {Number(issue.longitude).toFixed(4)}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1e293b',
                padding: 14,
                borderRadius: 12,
                marginTop: 16,
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#ffffff15',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 3
              }}
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`)}
            >
              <MapPin size={16} color="#2dd4bf" style={{ marginRight: 8 }} />
              <Text style={{ color: '#f8fafc', fontSize: 15, fontWeight: '600' }}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Audit history of status updates */}
        {historyLogs.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>History</Text>
            <View style={styles.timeline}>
              {historyLogs.map((hist: any, index: number) => {
                const isLast = index === historyLogs.length - 1;
                const histStatusStyles = getStatusStyles(hist.status || hist.newStatus);
                return (
                  <View key={hist.id || index} style={styles.timelineItem}>
                    <View style={styles.timelineDotContainer}>
                      <View style={[styles.timelineDot, { backgroundColor: histStatusStyles.color }]} />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineStatus}>{histStatusStyles.text}</Text>
                        <Text style={styles.timelineOperator}>
                          {hist.user?.name || 'ResolveIt team'}
                        </Text>
                      </View>
                      {hist.note && <Text style={styles.timelineNotes}>{hist.note}</Text>}
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
              <Text style={styles.officialToggleText}>Update status</Text>
              <Activity size={16} color="#10b981" />
            </TouchableOpacity>

            {showOfficialPanel && (
              <View style={styles.officialPanel}>
                <Text style={styles.panelLabel}>Status</Text>
                <View style={styles.statusButtons}>
                  {['IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((st) => {
                    const stStyles = getStatusStyles(st);
                    const isSelected = newStatus === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusSelector,
                          { backgroundColor: isSelected ? stStyles.color : stStyles.bgColor },
                        ]}
                        onPress={() => setNewStatus(st)}
                      >
                        <Text style={[styles.statusSelectorText, { color: isSelected ? '#000000' : stStyles.color }]}>
                          {st === 'IN_PROGRESS' ? 'IN PROGRESS' : st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.panelLabel}>Notes</Text>
                <View style={styles.panelInputWrapper}>
                  <TextInput
                    style={styles.panelInput}
                    placeholder="Add a note"
                    placeholderTextColor="#64748b"
                    value={officerNotes}
                    onChangeText={setOfficerNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {role !== 'PRESIDENT' && (
                  <>
                    <Text style={styles.panelLabel}>PIN</Text>
                    <View style={[styles.panelInputWrapper, { height: 48 }]}>
                      <TextInput
                        style={styles.panelInput}
                        placeholder="Enter PIN"
                        placeholderTextColor="#64748b"
                        value={pinCode}
                        onChangeText={setPinCode}
                        secureTextEntry
                        keyboardType="number-pad"
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.officialSubmit, updateStatusMutation.isPending && { opacity: 0.6 }]}
                  onPress={handleStatusSubmit}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.officialSubmitText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {role === 'PRESIDENT' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>President Action</Text>
            <TouchableOpacity
              style={[styles.deleteButton, deleteIssueMutation.isPending && { opacity: 0.6 }]}
              onPress={handleDeleteReport}
              activeOpacity={0.8}
              disabled={deleteIssueMutation.isPending}
            >
              {deleteIssueMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Report</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Discussion Block / Comments */}
        <View style={[styles.sectionContainer, { marginBottom: 60 }]}>
          <Text style={styles.sectionTitle}>Comments</Text>
          
          {/* Comments List */}
          {issue.comments && issue.comments.length > 0 ? (
            <View style={styles.commentsList}>
              {issue.comments.map((com: any) => (
                <View key={com.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {com.user?.name || 'Anonymous'}
                    </Text>
                    <Text style={styles.commentDate}>
                      {formatDate(com.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{com.comment}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyComments}>
              <MessageSquare size={20} color="#94a3b8" style={{ marginBottom: 6 }} />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
            </View>
          )}

          {/* Add Comment Box */}
          <View style={styles.commentBox}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment"
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
    paddingTop: Platform.OS === 'ios' ? 50 : 36},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16},
  headerBack: {
    padding: 6},
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2},
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20},
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24},
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16},
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6},
  categoryText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6},
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3},
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1},
  issueTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 10},
  issueDesc: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 20},
  metaGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 16},
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6},
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'},
  intensityContainer: {
    marginBottom: 20},
  intensityLabel: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8},
  intensityTrack: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden'},
  intensityFill: {
    height: '100%',
    borderRadius: 3},
  intensityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6},
  intensitySub: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '800'},
  intensityVal: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1},
  votePillDetailContainer: {
    marginTop: 10,
    gap: 8},
  votePillDetailLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5},
  votePillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 3,
    gap: 2},
  voteArrowButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)'},
  voteArrowUpActive: {
    backgroundColor: '#10b981'},
  voteArrowDownActive: {
    backgroundColor: '#ef4444'},
  votePillCount: {
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 12,
    color: '#94a3b8'},
  votePillCountUp: {
    color: '#10b981'},
  votePillCountDown: {
    color: '#ef4444'},
  sectionContainer: {
    marginBottom: 24},
  sectionTitle: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12},
  galleryContainer: {
    gap: 12},
  galleryImageWrapper: {
    width: width * 0.7,
    height: 180,
    borderRadius: 18,
    overflow: 'hidden'},
  galleryImage: {
    width: '100%',
    height: '100%'},
  timeline: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 16},
  timelineItem: {
    flexDirection: 'row',
    gap: 12},
  timelineDotContainer: {
    alignItems: 'center',
    width: 16},
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6},
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4},
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
    gap: 4},
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'},
  timelineStatus: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1},
  timelineOperator: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5},
  timelineNotes: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2},
  timelineDate: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4},
  officialToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52},
  officialToggleText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5},
  officialPanel: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    gap: 12},
  panelLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5},
  statusButtons: {
    flexDirection: 'row',
    gap: 8},
  statusSelector: {
    flex: 1,
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center'},
  statusSelectorText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1},
  panelInputWrapper: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8},
  panelInput: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'},
  officialSubmit: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center'},
  officialSubmitText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2},
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center'},
  deleteButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2},
  commentsList: {
    gap: 10,
    marginBottom: 16},
  commentCard: {
    backgroundColor: '#000000',
    borderRadius: 14,
    padding: 14,
    gap: 6},
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'},
  commentAuthor: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800'},
  commentDate: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600'},
  commentText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16},
  emptyComments: {
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 16},
  emptyCommentsText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1},
  commentBox: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 8,
    alignItems: 'center',
    height: 52},
  commentInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'},
  commentSend: {
    backgroundColor: '#10b981',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000'},
  loadingText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 12},
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16},
  mapCard: {
    backgroundColor: '#000000',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16},
  detailMap: {
    width: '100%',
    height: 180},
  mapBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: 8},
  mapBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5},
  backButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10},
  backText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5}});
