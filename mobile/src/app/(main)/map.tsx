import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { api } from '@/lib/api';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import { Navigation } from 'lucide-react-native';

const BENGALURU_LAT = 12.9716;
const BENGALURU_LNG = 77.5946;

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

const getIntensityColor = (intensity: number) => {
  const score = Number(intensity) || 5;
  if (score <= 3) return '#10b981'; // emerald
  if (score <= 5) return '#06b6d4'; // cyan
  if (score <= 7) return '#f59e0b'; // amber
  if (score <= 9) return '#f97316'; // orange
  return '#ef4444'; // red
};

export default function MapExplorerScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  // Fetch all issues
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const { data } = await api.get('/issues');
      return data || [];
    }});

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(status === 'granted');
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude};
          setUserLocation(coords);
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              ...coords,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03}, 1000);
          }
        }
      } catch (err) {
        console.error('Error fetching present location:', err);
      }
    })();
  }, []);

  // Calculate coordinates for issues
  const geocodedIssues = Array.isArray(issues) ? issues.map((issue: any) => {
    // If exact coords exist, use them
    if (issue.latitude && issue.longitude) {
      return {
        ...issue,
        lat: parseFloat(issue.latitude),
        lng: parseFloat(issue.longitude)};
    }
    // Fallback: look up sector area
    const matchedArea = OPERATIONAL_AREAS.find(
      (a) => a.name.toLowerCase() === issue.area?.toLowerCase()
    );
    if (matchedArea) {
      // Add slight random offset to prevent exact overlapping markers
      const offsetLat = (Math.random() - 0.5) * 0.006;
      const offsetLng = (Math.random() - 0.5) * 0.006;
      return {
        ...issue,
        lat: matchedArea.lat + offsetLat,
        lng: matchedArea.lng + offsetLng};
    }
    // Fallback to center
    return {
      ...issue,
      lat: BENGALURU_LAT + (Math.random() - 0.5) * 0.05,
      lng: BENGALURU_LNG + (Math.random() - 0.5) * 0.05};
  }) : [];

  // Center on specific operational sector
  const focusOnArea = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015}, 1000);
    }
  };

  const centerOnUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude};
        setUserLocation(coords);
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...coords,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015}, 1000);
        }
      } else {
        focusOnArea(BENGALURU_LAT, BENGALURU_LNG);
      }
    } catch (err) {
      console.error('Error centering on user location:', err);
      focusOnArea(BENGALURU_LAT, BENGALURU_LNG);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>BOOTING SATELLITE RADAR...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: BENGALURU_LAT,
              longitude: BENGALURU_LNG,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08}}
            customMapStyle={darkMapStyle}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {geocodedIssues.map((issue: any) => {
              const pinColor = getIntensityColor(issue.intensity);
              return (
                <Marker
                  key={issue.id}
                  coordinate={{ latitude: issue.lat, longitude: issue.lng }}
                  pinColor={pinColor}
                  onPress={() => router.push(`/issue/${issue.id}`)}
                />
              );
            })}
          </MapView>

          {/* Quick HUD overlay */}
          <SafeAreaView style={styles.hudOverlay}>
            <View style={styles.hudHeader}>
              <Text style={styles.hudTitle}>TACTICAL RADAR</Text>
              <Text style={styles.hudSubtitle}>
                {geocodedIssues.length} LIVE INCIDENTS RECORDED
              </Text>
            </View>

            {/* Float Command Actions */}
            <View style={styles.actionColumn}>
              <TouchableOpacity
                style={styles.hudActionButton}
                onPress={centerOnUserLocation}
                activeOpacity={0.8}
              >
                <Navigation size={18} color="#10b981" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16},
  loadingText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2},
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height},
  hudOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 20,
    right: 20,
    pointerEvents: 'box-none'},
  hudHeader: {
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5},
  hudTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3},
  hudSubtitle: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4},
  actionColumn: {
    position: 'absolute',
    right: 0,
    top: 90,
    gap: 12},
  hudActionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4},
  calloutCard: {
    width: 220,
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12},
  calloutHeader: {
    flexDirection: 'row',
    marginBottom: 6},
  calloutCategory: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5},
  calloutTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4},
  calloutDesc: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 8},
  calloutFooter: {
    paddingTop: 8},
  calloutLink: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center'},
  calloutIntensity: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 'auto'}});
