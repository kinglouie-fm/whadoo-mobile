import { BusinessTabBar } from "@/src/components/BusinessTabBar";
import { theme } from "@/src/theme/theme";
import { Tabs } from "expo-router";
import React from "react";

export default function BusinessTabsLayout() {
    return (
        <Tabs
            tabBar={(props) => <BusinessTabBar {...props} />}
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.bg },
                headerTintColor: theme.colors.text,
                headerShadowVisible: false,
                tabBarStyle: { backgroundColor: theme.colors.tabBarBg, borderTopColor: theme.colors.divider },
                tabBarActiveTintColor: theme.colors.accent,
                tabBarInactiveTintColor: theme.colors.tabIconInactive,
            }}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="activities" />
            <Tabs.Screen name="availability" />
            <Tabs.Screen name="profile" />
        </Tabs>
    );
}