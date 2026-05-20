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
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { api } from '@/lib/api';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import { getCategoryIconComponent, getCategoryStyles } from '@/utils/helpers';
import { MapPin, Navigation, Rss, Layers } from 'lucide-react-native';

const BENGALURU_LAT = 12.9716;
const BENGALURU_LNG = 77.5946;

export default function MapExplorerScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  // Fetch all issues
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const { data } = await api.get('/issues');
      return data || [];
    },
  });

  // Calculate coordinates for issues
  const geocodedIssues = Array.isArray(issues) ? issues.map((issue: any) => {
    // If exact coords exist, use them
    if (issue.latitude && issue.longitude) {
      return {
        ...issue,
        lat: parseFloat(issue.latitude),
        lng: parseFloat(issue.longitude),
      };
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
        lng: matchedArea.lng + offsetLng,
      };
    }
    // Fallback to center
    return {
      ...issue,
      lat: BENGALURU_LAT + (Math.random() - 0.5) * 0.05,
      lng: BENGALURU_LNG + (Math.random() - 0.5) * 0.05,
    };
  }) : [];

  // Center on specific operational sector
  const focusOnArea = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 1000);
    }
  };

  const centerOnBengaluru = () => {
    focusOnArea(BENGALURU_LAT, BENGALURU_LNG);
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
              longitudeDelta: 0.08,
            }}
            customMapStyle={darkMapStyle}
          >
            {geocodedIssues.map((issue: any) => {
              const catStyles = getCategoryStyles(issue.category);
              return (
                <Marker
                  key={issue.id}
                  coordinate={{ latitude: issue.lat, longitude: issue.lng }}
                  pinColor={catStyles.color}
                >
                  <Callout
                    tooltip
                    onPress={() => router.push(`/issue/${issue.id}`)}
                  >
                    <View style={styles.calloutCard}>
                      <View style={styles.calloutHeader}>
                        <Text style={[styles.calloutCategory, { color: catStyles.color }]}>
                          {issue.category?.replace('_', ' ')}
                        </Text>
                      </View>
                      <Text style={styles.calloutTitle} numberOfLines={1}>
                        {issue.title}
                      </Text>
                      <Text style={styles.calloutDesc} numberOfLines={2}>
                        {issue.description}
                      </Text>
                      <View style={styles.calloutFooter}>
                        <Text style={styles.calloutLink}>TAP TO INVESTIGATE</Text>
                      </View>
                    </View>
                  </Callout>
                </Marker>
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
                onPress={centerOnBengaluru}
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

// Elegant pitch dark style mapping configuration for react-native-maps
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1a1a1a"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1a1a1a"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#333333"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#121212"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#0d0d0d"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8c8c8c"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#202020"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#282828"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#303030"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#050505"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  hudOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    left: 20,
    right: 20,
    pointerEvents: 'box-none',
  },
  hudHeader: {
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  hudTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },
  hudSubtitle: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  actionColumn: {
    position: 'absolute',
    right: 0,
    top: 90,
    gap: 12,
  },
  hudActionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  calloutCard: {
    width: 220,
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  calloutHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calloutCategory: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  calloutTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  calloutDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 8,
  },
  calloutFooter: {
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  calloutLink: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
