import { Tabs } from 'expo-router';
import React from 'react';

export default function ConsumerTabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Discover' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
