import { ConsumerTabBar } from "@/src/components/ConsumerTabBar";
import { Tabs } from "expo-router";
import React from "react";

export default function ConsumerTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <ConsumerTabBar {...props} />}
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}