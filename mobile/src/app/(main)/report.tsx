import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/lib/api';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import { getCategoryIconComponent, getCategoryStyles } from '@/utils/helpers';
import { Shield, Camera, MapPin, CheckCircle, ArrowRight, ArrowLeft, Trash2, HelpCircle } from 'lucide-react-native';

const CATEGORIES = [
  { id: 'POTHOLE', label: 'POTHOLE' },
  { id: 'GARBAGE', label: 'GARBAGE DISPOSAL' },
  { id: 'WATER_LEAK', label: 'WATER LEAKAGE' },
  { id: 'POWER_CUT', label: 'POWER INFRASTRUCTURE' },
  { id: 'STREETLIGHT', label: 'STREETLIGHT DEFECT' },
  { id: 'BRIBERY', label: 'CORRUPTION & BRIBERY' },
  { id: 'SEWAGE', label: 'SEWAGE / DRAINAGE' },
  { id: 'TREE_FALLEN', label: 'FALLEN TREE obstruction' },
];

export default function ReportIssueScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [area, setArea] = useState('');
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Image picking
  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Evidence Limit Reached', 'You can upload a maximum of 3 evidence photographs.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll access is required to attach evidence.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

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
      const matchedArea = OPERATIONAL_AREAS.find((a) => a.name === area);
      if (matchedArea) {
        formData.append('latitude', String(matchedArea.lat));
        formData.append('longitude', String(matchedArea.lng));
      } else {
        formData.append('latitude', '12.9716');
        formData.append('longitude', '77.5946');
      }

      // Append images
      images.forEach((uri, idx) => {
        const filename = uri.split('/').pop() || `image_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('images', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type,
        } as any);
      });

      const { data } = await api.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      Alert.alert(
        'INCIDENT REPORTED',
        'Your report has been securely registered on the Bangalore civic grid.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    },
    onError: (err) => {
      console.error(err);
      Alert.alert('TRANSMISSION FAILURE', 'Failed to transmit report to the server. Please verify your connection.');
    },
  });

  const nextStep = () => {
    if (step === 1 && (!title.trim() || !description.trim())) {
      Alert.alert('Required Fields', 'Please enter both title and description before proceeding.');
      return;
    }
    if (step === 2 && !category) {
      Alert.alert('Required Field', 'Please select an incident category.');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!area) {
      Alert.alert('Required Field', 'Please select an operational area.');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SECURE SUBMISSION</Text>
        <Text style={styles.headerSubtitle}>
          STAGE 0{step}/03 • {step === 1 ? 'DETAILS' : step === 2 ? 'CLASSIFICATION' : 'LOCATION'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* STEP 1: Details */}
        {step === 1 && (
          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>INCIDENT TITLE</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Brief summary of the issue..."
                placeholderTextColor="#64748b"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="sentences"
              />
            </View>

            <Text style={styles.cardLabel}>DETAILED DESCRIPTION</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Provide precise details, landmarks, and relevant incident details..."
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                autoCapitalize="sentences"
              />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={nextStep} activeOpacity={0.8}>
              <Text style={styles.nextButtonText}>PROCEED TO CLASSIFICATION</Text>
              <ArrowRight size={18} color="#000000" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Classification, Images & Anonymous Toggle */}
        {step === 2 && (
          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>SELECT INCIDENT CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const catStyles = getCategoryStyles(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      isSelected && {
                        backgroundColor: catStyles.bgColor,
                        borderColor: '#10b981',
                      },
                    ]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    {getCategoryIconComponent(cat.id, 20, isSelected ? '#10b981' : '#64748b')}
                    <Text style={[styles.categoryItemText, isSelected && { color: '#ffffff', fontWeight: '900' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Evidence Picker */}
            <Text style={[styles.cardLabel, { marginTop: 24 }]}>evidence photographs ({images.length}/3)</Text>
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
                  <Text style={styles.cameraText}>CAPTURE</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Anonymous Toggle */}
            <View style={styles.anonymousPanel}>
              <View style={styles.anonymousHeader}>
                <Shield size={18} color={isAnonymous ? '#10b981' : '#64748b'} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.anonymousTitle}>REPORT ANONYMOUSLY</Text>
                  <Text style={styles.anonymousSub}>Wipe your operator signature from public ledger</Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: '#2e2e2e', true: 'rgba(16, 185, 129, 0.3)' }}
                  thumbColor={isAnonymous ? '#10b981' : '#a1a1aa'}
                />
              </View>
            </View>

            <View style={styles.navigationButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <ArrowLeft size={18} color="#ffffff" />
                <Text style={styles.backButtonText}>BACK</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nextButton, { flex: 1 }]} onPress={nextStep}>
                <Text style={styles.nextButtonText}>PROCEED TO LOCATION</Text>
                <ArrowRight size={18} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Location selector */}
        {step === 3 && (
          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>SELECT CITIZEN SECTOR</Text>
            <TouchableOpacity
              style={styles.areaSelectorTrigger}
              onPress={() => setShowAreaModal(!showAreaModal)}
            >
              <MapPin size={18} color="#10b981" />
              <Text style={styles.areaSelectorText}>
                {area ? area.toUpperCase() : 'SELECT BENGALURU SECTOR...'}
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
                      <Text style={styles.dropdownItemText}>{a.name.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.bulletinBox}>
              <Text style={styles.bulletinTitle}>LEGAL NOTICE</Text>
              <Text style={styles.bulletinText}>
                Reports transmitted to ResolveIt are securely catalogued and logged under public accountability ordinances. Please ensure all coordinates and statements are truthful and accurate.
              </Text>
            </View>

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
                    <Text style={styles.submitButtonText}>TRANSMIT REPORT</Text>
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
  },
  header: {
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
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 120, // tab space
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  cardLabel: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
    justifyContent: 'center',
  },
  input: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  textAreaWrapper: {
    height: 140,
    paddingVertical: 12,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 14,
    height: 56,
    gap: 8,
    marginTop: 8,
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  categoryItemText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  imageSelectorContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    marginTop: 4,
  },
  imageThumbnailWrapper: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  removeImageBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cameraText: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  anonymousPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  anonymousHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  anonymousTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  anonymousSub: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 14,
    width: 100,
    height: 56,
    gap: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  areaSelectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
    marginBottom: 16,
  },
  areaSelectorText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  areaDropdown: {
    backgroundColor: 'rgba(10, 10, 10, 0.98)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    maxHeight: 200,
    marginBottom: 20,
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
  bulletinBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  bulletinTitle: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  bulletinText: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },
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
    shadowRadius: 8,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
