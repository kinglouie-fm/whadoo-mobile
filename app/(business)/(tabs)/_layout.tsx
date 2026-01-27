import { Tabs } from 'expo-router';
import React from 'react';

export default function BusinessTabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
            <Tabs.Screen name="activities" options={{ title: 'Activities' }} />
            <Tabs.Screen name="availability" options={{ title: 'Availability' }} />
            <Tabs.Screen name="profile" options={{ title: 'Business' }} />
        </Tabs>
    );
}
