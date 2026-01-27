import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/providers/auth-context';

function RouteGuard() {
  const { firebaseUser, loadingAuth, role, loadingRole } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loadingAuth || loadingRole) return;

    const group = segments[0]; // "(auth)" | "(consumer)" | "(business)" | undefined
    const inAuth = group === '(auth)';
    const inConsumer = group === '(consumer)';
    const inBusiness = group === '(business)';

    // Not logged in → force auth
    if (!firebaseUser) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    // Logged in → never stay in auth group
    if (inAuth) {
      router.replace(role === 'business' ? '/(business)/(tabs)' : '/(consumer)/(tabs)');
      return;
    }

    // Logged in → enforce role area
    if (role === 'business' && inConsumer) {
      router.replace('/(business)/(tabs)');
      return;
    }
    if (role === 'user' && inBusiness) {
      router.replace('/(consumer)/(tabs)');
      return;
    }
  }, [firebaseUser, loadingAuth, loadingRole, role, segments, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Avoid GoogleSignin.configure running on web
  useEffect(() => {
    if (Platform.OS === 'web') return;
    // If you still want GoogleSignin.configure here, keep it behind Platform check
  }, []);

  return (
    <AuthProvider>
      <RouteGuard />

      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(consumer)" />
          <Stack.Screen name="(business)" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}