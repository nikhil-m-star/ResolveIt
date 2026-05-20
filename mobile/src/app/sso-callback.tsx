import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the home screen which will handle authenticated navigation transition
    router.replace('/');
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}
