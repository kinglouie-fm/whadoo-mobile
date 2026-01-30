import { isConsumerProfileComplete } from "@/src/lib/profile";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import Toast from "react-native-toast-message";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/src/providers/auth-context";
import { store } from "@/src/store";
import { Provider as ReduxProvider } from "react-redux";

import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, useFonts } from "@expo-google-fonts/roboto";

function RouteGuard() {
  const { firebaseUser, loadingAuth, role, loadingRole, appUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loadingAuth || loadingRole) return;

    const group = segments[0];
    const inAuth = group === "(auth)";
    const inConsumer = group === "(consumer)";
    const inBusiness = group === "(business)";

    if (!firebaseUser) {
      if (!inAuth) router.replace("/(auth)/login");
      return;
    }

    if (inAuth) {
      router.replace(role === "business" ? "/(business)/(tabs)" : "/(consumer)/(tabs)");
      return;
    }

    const inCompleteProfile =
      group === "(consumer)" && segments[1] === "complete-profile";

    if (role === "user") {
      const complete = isConsumerProfileComplete(appUser);
      if (!complete && !inCompleteProfile) {
        router.replace("/(consumer)/complete-profile");
        return;
      }
      if (complete && inCompleteProfile) {
        router.replace("/(consumer)/(tabs)");
        return;
      }
    }

    if (role === "business" && inConsumer) router.replace("/(business)/(tabs)");
    if (role === "user" && inBusiness) router.replace("/(consumer)/(tabs)");
  }, [firebaseUser, loadingAuth, loadingRole, role, segments, router, appUser]);

  if (loadingAuth || loadingRole) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === "web") return;
    GoogleSignin.configure({
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <RouteGuard />
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(consumer)" />
            <Stack.Screen name="(business)" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
        <Toast />
      </AuthProvider>
    </ReduxProvider>
  );
}
