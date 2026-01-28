import { theme } from "@/src/theme/theme";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

function Row({ title, onPress }: { title: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.divider,
            }}
        >
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>{title}</Text>
        </Pressable>
    );
}

export default function SettingsScreen() {
    const router = useRouter();

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: theme.colors.bg }}>
            <Row title="Account" onPress={() => router.push("/settings/account")} />
            <Row title="Profile" onPress={() => router.push("/settings/profile")} />
            <Row title="Help & FAQ" onPress={() => { }} />
            <Row title="Privacy Policy" onPress={() => { }} />
            <Row title="Terms & Conditions" onPress={() => { }} />
        </View>
    );
}
