import { theme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={({ navigation }) => ({
                headerShown: true,
                headerTitleAlign: "center",
                headerStyle: { backgroundColor: theme.colors.bg },
                headerTintColor: theme.colors.text,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: theme.colors.bg },

                headerLeft: () => (
                    <Pressable
                        onPress={() => navigation.goBack()}
                        hitSlop={12}
                        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
                    >
                        <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
                    </Pressable>
                ),

                headerBackButtonMenuEnabled: false,
            })}
        >
            <Stack.Screen name="index" options={{ title: "Settings" }} />

            <Stack.Screen name="account/index" options={{ title: "Account" }} />
            <Stack.Screen name="account/email" options={{ title: "E-Mail Address" }} />
            <Stack.Screen name="account/phone" options={{ title: "Phone Number" }} />
            <Stack.Screen name="account/password" options={{ title: "Password" }} />
            <Stack.Screen name="account/other" options={{ title: "Other" }} />

            <Stack.Screen name="profile/index" options={{ title: "Profile" }} />
            <Stack.Screen name="profile/first-name" options={{ title: "First Name" }} />
            <Stack.Screen name="profile/last-name" options={{ title: "Last Name" }} />
            <Stack.Screen name="profile/city" options={{ title: "City" }} />
        </Stack>
    );
}
