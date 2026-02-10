import { TopBar } from "@/src/components/TopBar";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Row({ title, value, onPress }: { title: string; value?: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.divider,
            }}
        >
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "600" }}>{title}</Text>
            <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{value ?? "-"}</Text>
        </Pressable>
    );
}

export default function ProfileSettingsScreen() {
    const { appUser } = useAuth();
    const router = useRouter();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Profile" />

            <View style={{ flex: 1, paddingHorizontal: 16 }}>
                <Row title="First Name" value={appUser?.firstName ?? ""} onPress={() => router.push("/(consumer)/settings/profile/first-name")} />
                <Row title="Last Name" value={appUser?.lastName ?? ""} onPress={() => router.push("/(consumer)/settings/profile/last-name")} />
                <Row title="City" value={appUser?.city ?? ""} onPress={() => router.push("/(consumer)/settings/profile/city")} />
            </View>
        </SafeAreaView>
    );
}
