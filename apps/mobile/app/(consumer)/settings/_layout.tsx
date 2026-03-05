import { Stack } from "expo-router";
import React from "react";

/**
 * Defines layout and navigation for (consumer)/settings/_layout routes.
 */
export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
}
