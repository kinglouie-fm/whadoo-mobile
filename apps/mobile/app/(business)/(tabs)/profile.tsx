import { useAuth } from '@/src/providers/auth-context';
import React from 'react';
import { Button, Text, View } from 'react-native';

export default function ProfileScreen() {
    const { role, setRole } = useAuth();

    return (
        <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>Current role: {role}</Text>

            <Button title="Switch to USER" onPress={() => setRole('user')} />
            <Button title="Switch to BUSINESS" onPress={() => setRole('business')} />
        </View>
    );
}
