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
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { api } from '@/lib/api';
import { OPERATIONAL_AREAS } from '@/utils/constants';
import { Navigation } from 'lucide-react-native';

const BENGALURU_LAT = 12.9716;
const BENGALURU_LNG = 77.5946;

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
  const webViewRef = useRef(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const { data } = await api.get('/issues');
      return data || [];
    }
  });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      } catch (err) {}
    })();
  }, []);

  const geocodedIssues = Array.isArray(issues) ? issues.map((issue: any) => {
    let lat = BENGALURU_LAT + (Math.random() - 0.5) * 0.05;
    let lng = BENGALURU_LNG + (Math.random() - 0.5) * 0.05;
    
    if (issue.latitude && issue.longitude) {
      lat = parseFloat(issue.latitude);
      lng = parseFloat(issue.longitude);
    } else {
      const matchedArea = OPERATIONAL_AREAS.find((a) => a.name.toLowerCase() === issue.area?.toLowerCase());
      if (matchedArea) {
        lat = matchedArea.lat + (Math.random() - 0.5) * 0.006;
        lng = matchedArea.lng + (Math.random() - 0.5) * 0.006;
      }
    }
    return { ...issue, lat, lng, color: getIntensityColor(issue.intensity) };
  }) : [];

  const markersJson = JSON.stringify(geocodedIssues.map(i => ({ id: i.id, lat: i.lat, lng: i.lng, color: i.color })));

  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      
      <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #0b0c10; overflow: hidden; }
          .leaflet-container { background: #0b0c10; cursor: crosshair; }
          .leaflet-tile { filter: brightness(1.5) contrast(1.2) sepia(0.3) hue-rotate(180deg) saturate(2); }
      </style>

  </head>
  <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${userLocation ? userLocation.latitude : BENGALURU_LAT}, ${userLocation ? userLocation.longitude : BENGALURU_LNG}], 13);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              maxZoom: 19
          }).addTo(map);

          const markers = ${markersJson};
          markers.forEach(m => {
              
              var neonHtml = "<div style='width:100%;height:100%;background:" + m.color + ";border:2px solid #fff;border-radius:50%;box-shadow: 0 0 15px " + m.color + ", 0 0 30px " + m.color + ";'></div>";
              var markerIcon = L.divIcon({ html: neonHtml, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
              const marker = L.marker([m.lat, m.lng], { icon: markerIcon }).addTo(map);
  
              marker.on('click', () => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', id: m.id }));
              });
          });

          ${userLocation ? `
          L.circleMarker([${userLocation.latitude}, ${userLocation.longitude}], {
              color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.5, radius: 10, weight: 3
          }).addTo(map);` : ''}

          window.addEventListener('message', function(event) {
              try {
                  const data = JSON.parse(event.data);
                  if (data.type === 'center') {
                      map.flyTo([data.lat, data.lng], 14, { duration: 1 });
                  }
              } catch (e) {}
          });
      </script>
  </body>
  </html>`;

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker_click' && data.id) {
        router.push(`/issue/${data.id}`);
      }
    } catch (e) {}
  };

  const centerOnUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'center',
          lat: location.coords.latitude,
          lng: location.coords.longitude
        }));
      } else {
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'center',
          lat: BENGALURU_LAT,
          lng: BENGALURU_LNG
        }));
      }
    } catch (err) {}
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
          <WebView
            ref={webViewRef}
            style={styles.map}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            onMessage={onMessage}
            scrollEnabled={false}
          />
          <SafeAreaView style={styles.hudOverlay}>
            <View style={styles.hudHeader}>
              <Text style={styles.hudTitle}>TACTICAL RADAR</Text>
              <Text style={styles.hudSubtitle}>{geocodedIssues.length} LIVE INCIDENTS RECORDED</Text>
            </View>
            <View style={styles.actionColumn}>
              <TouchableOpacity style={styles.hudActionButton} onPress={centerOnUserLocation}>
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
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#10b981', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  map: { flex: 1, width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  hudOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 36, left: 20, right: 20, pointerEvents: 'box-none' },
  hudHeader: { backgroundColor: '#000000', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14, elevation: 5 },
  hudTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  hudSubtitle: { color: '#10b981', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 4 },
  actionColumn: { position: 'absolute', right: 0, top: 90, gap: 12 },
  hudActionButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', elevation: 4 }
});
