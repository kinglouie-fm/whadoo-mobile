import { Stack } from "expo-router";
import React from "react";

/**
 * Defines layout and navigation for (auth)/_layout routes.
 */
export default function AuthLayout() {
    return <Stack screenOptions={{ headerShown: false }} />;
}
