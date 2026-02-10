import { theme } from "@/src/theme/theme";
import { Stack } from "expo-router";
import React from "react";

export default function ConsumerLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.bg },
            }}
        >
            {/* Mandatory wall screen */}
            <Stack.Screen
                name="complete-profile"
                options={{
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />

            {/* tab navigator group */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Settings stack */}
            <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
    );
}
