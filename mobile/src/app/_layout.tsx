import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, StatusBar as RNStatusBar } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useResolveItAuth, ResolveItAuthProvider } from '@/lib/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isSignedIn, isLoaded } = useResolveItAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    RNStatusBar.setHidden(true, 'none');
  }, []);

  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
      <Stack.Screen name="issue/[id]" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ResolveItAuthProvider>
        <SafeAreaProvider>
          <StatusBar hidden={true} />
          <RootLayoutNav />
        </SafeAreaProvider>
      </ResolveItAuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center'}});
