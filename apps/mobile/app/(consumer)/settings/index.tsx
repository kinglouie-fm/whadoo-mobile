import { TopBar } from "@/src/components/TopBar";
import { theme } from "@/src/theme/theme";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Settings" />

            <View style={{ flex: 1, paddingHorizontal: 16 }}>
                <Row title="Account" onPress={() => router.push("/(consumer)/settings/account")} />
                <Row title="Profile" onPress={() => router.push("/(consumer)/settings/profile")} />
                <Row title="Help & FAQ" onPress={() => { }} />
                <Row title="Privacy Policy" onPress={() => { }} />
                <Row title="Terms & Conditions" onPress={() => { }} />
            </View>
        </SafeAreaView>
    );
}