import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Image,
  Switch,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { api } from '@/lib/api';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import { getCategoryIconComponent, getCategoryStyles } from '@/utils/helpers';
import { Shield, Camera, MapPin, CheckCircle, ArrowRight, ArrowLeft, Trash2, HelpCircle, Bot, Navigation } from 'lucide-react-native';

const CATEGORIES = [
  { id: 'POTHOLE', label: 'POTHOLE' },
  { id: 'GARBAGE', label: 'GARBAGE' },
  { id: 'WATER_LEAK', label: 'WATER LEAK' },
  { id: 'POWER_CUT', label: 'POWER CUT' },
  { id: 'STREETLIGHT', label: 'STREETLIGHT' },
  { id: 'BRIBERY', label: 'BRIBERY' },
  { id: 'SEWAGE', label: 'SEWAGE' },
  { id: 'TREE_FALLEN', label: 'FALLEN TREE' },
];

export default function ReportIssueScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [area, setArea] = useState('');
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [customCoordinates, setCustomCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // AI analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRecommendedCategory, setAiRecommendedCategory] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  // Trigger AI analyzers on description blur
  const handleBlurAI = async () => {
    if (!title.trim() || !description.trim() || title.length < 5) return;
    setIsAnalyzing(true);
    setDuplicateWarning(null);
    try {
      const [catRes, dupRes] = await Promise.allSettled([
        api.post('/issues/auto-categorize', { title, description }),
        api.post('/issues/check-duplicate', { 
          title, 
          description, 
          city: 'Bengaluru', 
          area: area || 'General' 
        })
      ]);
      
      if (catRes.status === 'fulfilled' && catRes.value.data?.category) {
        const suggested = catRes.value.data.category;
        setAiRecommendedCategory(suggested);
        setCategory(suggested);
      }
      
      if (dupRes.status === 'fulfilled' && dupRes.value.data?.isDuplicate) {
        setDuplicateWarning(dupRes.value.data);
      }
    } catch (err) {
      console.error('AI analysis failed silently', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-detect present location using GPS
  const handleAutoDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Allow location access to detect your area.');
        setIsDetectingLocation(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const { latitude, longitude } = location.coords;
      setCustomCoordinates({ latitude, longitude });
      
      // Find closest OPERATIONAL_AREA
      let closestArea = OPERATIONAL_AREAS[0];
      let minDistanceSq = Infinity;
      
      OPERATIONAL_AREAS.forEach((a) => {
        const distanceSq = Math.pow(a.lat - latitude, 2) + Math.pow(a.lng - longitude, 2);
        if (distanceSq < minDistanceSq) {
          minDistanceSq = distanceSq;
          closestArea = a;
        }
      });
      
      setArea(closestArea.name);
      Alert.alert(
        'Location found',
        `Area: ${closestArea.name}\n${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      );
    } catch (err) {
      console.error('Error auto-detecting location:', err);
      Alert.alert('Location error', 'Could not detect your location. Choose your area manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Enforce anonymous mode for corruption & bribery reports
  useEffect(() => {
    if (category === 'BRIBERY') {
      setIsAnonymous(true);
    }
  }, [category]);

  // Image picking
  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit reached', 'You can add up to 3 photos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Photos needed', 'Allow photo access to attach images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7});

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('area', area);
      formData.append('isAnonymous', String(isAnonymous));

      // Append coordinates if available
      if (customCoordinates) {
        formData.append('latitude', String(customCoordinates.latitude));
        formData.append('longitude', String(customCoordinates.longitude));
      } else {
        const matchedArea = OPERATIONAL_AREAS.find((a) => a.name === area);
        if (matchedArea) {
          formData.append('latitude', String(matchedArea.lat));
          formData.append('longitude', String(matchedArea.lng));
        } else {
          formData.append('latitude', '12.9716');
          formData.append('longitude', '77.5946');
        }
      }

      // Append images
      images.forEach((uri, idx) => {
        const filename = uri.split('/').pop() || `image_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('images', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type} as any);
      });

      const { data } = await api.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'}});
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      Alert.alert(
        'Report sent',
        'Your issue has been submitted.',
        [{ text: 'OK', onPress: () => router.replace(`/issue/${data.id}`) }]
      );
    },
    onError: (err) => {
      console.error(err);
      Alert.alert('Could not submit', 'Check your connection and try again.');
    }});

  const nextStep = () => {
    if (step === 1) {
      if (!title.trim() || !description.trim()) {
        Alert.alert('Missing details', 'Add a title and description first.');
        return;
      }
      handleBlurAI();
    }
    if (step === 2 && !category) {
      Alert.alert('Missing category', 'Select a category.');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!area) {
      Alert.alert('Missing area', 'Select an area.');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 55 : 40) + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report issue</Text>
        <Text style={styles.headerSubtitle}>
          Step {step} of 3
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* STEP 1: Details */}
        {step === 1 && (
          <View style={styles.glassCard}>
            {/* Duplicate warning banner */}
            {duplicateWarning && (
              <View style={styles.duplicateWarningContainer}>
                <HelpCircle size={20} color="#10b981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.duplicateWarningTitle}>Possible duplicate</Text>
                  <Text style={styles.duplicateWarningText}>{duplicateWarning.reasoning}</Text>
                </View>
              </View>
            )}

            {/* AI loading indicator */}
            {isAnalyzing && (
              <View style={styles.aiLoadingBadge}>
                <ActivityIndicator size="small" color="#10b981" />
                <Text style={styles.aiLoadingText}>Checking details...</Text>
              </View>
            )}

            <Text style={styles.cardLabel}>TITLE</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Short title"
                placeholderTextColor="#64748b"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="sentences"
              />
            </View>

            <Text style={styles.cardLabel}>DESCRIPTION</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What happened?"
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
                onBlur={handleBlurAI}
                multiline
                numberOfLines={6}
                autoCapitalize="sentences"
              />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={nextStep} activeOpacity={0.8}>
              <Text style={styles.nextButtonText}>NEXT</Text>
              <ArrowRight size={18} color="#000000" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Classification, Images & Anonymous Toggle */}
        {step === 2 && (
          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const isRecommended = aiRecommendedCategory === cat.id;
                const catStyles = getCategoryStyles(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      isSelected && {
                        backgroundColor: catStyles.bgColor},
                    ]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    {isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <Bot size={8} color="#000000" />
                        <Text style={styles.recommendedBadgeText}>Suggested</Text>
                      </View>
                    )}
                    {getCategoryIconComponent(cat.id, 20, isSelected ? '#10b981' : '#94a3b8')}
                    <Text style={[styles.categoryItemText, isSelected && { color: '#ffffff', fontWeight: '900' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Evidence Picker */}
            <Text style={[styles.cardLabel, { marginTop: 24 }]}>Photos ({images.length}/3)</Text>
            <View style={styles.imageSelectorContainer}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imageThumbnailWrapper}>
                  <Image source={{ uri }} style={styles.imageThumbnail} />
                  <TouchableOpacity style={styles.removeImageBadge} onPress={() => removeImage(idx)}>
                    <Trash2 size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                  <Camera size={24} color="#10b981" />
                  <Text style={styles.cameraText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Anonymous Toggle & Safeguard */}
            <View style={styles.anonymousPanel}>
              <View style={styles.anonymousHeader}>
                <Shield size={18} color={isAnonymous ? '#10b981' : '#94a3b8'} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.anonymousTitle}>Anonymous</Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  disabled={category === 'BRIBERY'} // Enforce anonymous for corruption
                  trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(16, 185, 129, 0.3)' }}
                  thumbColor={isAnonymous ? '#10b981' : '#64748b'}
                />
              </View>
              {category === 'BRIBERY' && (
                <View style={styles.safeguardContainer}>
                  <Text style={styles.safeguardText}>
                    Required for bribery reports.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.navigationButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <ArrowLeft size={18} color="#ffffff" />
                <Text style={styles.backButtonText}>BACK</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nextButton, { flex: 1 }]} onPress={nextStep}>
                <Text style={styles.nextButtonText}>NEXT</Text>
                <ArrowRight size={18} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Location selector */}
        {step === 3 && (
          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>Area</Text>
            
            <TouchableOpacity
              style={[styles.autoDetectButton, isDetectingLocation && { opacity: 0.6 }]}
              onPress={handleAutoDetectLocation}
              disabled={isDetectingLocation}
              activeOpacity={0.8}
            >
              {isDetectingLocation ? (
                <ActivityIndicator color="#10b981" />
              ) : (
                <>
                  <Navigation size={14} color="#10b981" />
                  <Text style={styles.autoDetectButtonText}>Use my location</Text>
                </>
              )}
            </TouchableOpacity>

            {customCoordinates && (
              <View style={styles.detectedCoordsBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.detectedCoordsText}>
                  {customCoordinates.latitude.toFixed(4)}, {customCoordinates.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            <View style={{ marginVertical: 8 }} />

            <TouchableOpacity
              style={styles.areaSelectorTrigger}
              onPress={() => setShowAreaModal(!showAreaModal)}
            >
              <MapPin size={18} color="#10b981" />
              <Text style={styles.areaSelectorText}>
                {area || 'Select area'}
              </Text>
            </TouchableOpacity>

            {showAreaModal && (
              <View style={styles.areaDropdown}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {OPERATIONAL_AREAS.map((a) => (
                    <TouchableOpacity
                      key={a.name}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setArea(a.name);
                        setShowAreaModal(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.navigationButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <ArrowLeft size={18} color="#ffffff" />
                <Text style={styles.backButtonText}>BACK</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submitMutation.isPending && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>SUBMIT</Text>
                    <CheckCircle size={18} color="#000000" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 120, // tab space
  },
  glassCard: {
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: 20},
  duplicateWarningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12},
  duplicateWarningTitle: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4},
  duplicateWarningText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14},
  aiLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10},
  aiLoadingText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5},
  cardLabel: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase'},
  inputWrapper: {
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
    justifyContent: 'center'},
  input: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1},
  textAreaWrapper: {
    height: 140,
    paddingVertical: 12},
  textArea: {
    height: '100%',
    textAlignVertical: 'top'},
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 14,
    height: 56,
    gap: 8,
    marginTop: 8},
  nextButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2},
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16},
  categoryItem: {
    width: '48%',
    backgroundColor: '#000000',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    minHeight: 80},
  categoryItemText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center'},
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4},
  recommendedBadgeText: {
    color: '#000000',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1},
  imageSelectorContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    marginTop: 4},
  imageThumbnailWrapper: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'},
  imageThumbnail: {
    width: '100%',
    height: '100%'},
  removeImageBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'},
  imagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4},
  cameraText: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1},
  anonymousPanel: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24},
  anonymousHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12},
  anonymousTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5},
  anonymousSub: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2},
  safeguardContainer: {
    marginTop: 12,
    paddingTop: 12},
  safeguardText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 13},
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8},
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    width: 100,
    height: 56,
    gap: 8},
  backButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2},
  areaSelectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
    marginBottom: 16},
  areaSelectorText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2},
  areaDropdown: {
    backgroundColor: '#000000',
    borderRadius: 16,
    maxHeight: 200,
    marginBottom: 20,
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
  bulletinBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24},
  bulletinTitle: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6},
  bulletinText: {
    color: '#cbd5e1',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600'},
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 14,
    height: 56,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8},
  submitButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2},
  autoDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%'},
  autoDetectButtonText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2},
  detectedCoordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    width: '100%'},
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'},
  detectedCoordsText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5}});
