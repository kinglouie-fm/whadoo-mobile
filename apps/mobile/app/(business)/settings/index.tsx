// apps/mobile/app/(business)/settings/index.tsx
import { TopBar } from "@/src/components/TopBar";
import { theme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Row({
    icon,
    title,
    subtitle,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.divider,
            }}
        >
            <Ionicons name={icon} size={20} color={theme.colors.text} style={{ width: 20, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "700" }}>{title}</Text>
                {subtitle ? <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{subtitle}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} style={{ marginTop: 2 }} />
        </Pressable>
    );
}

export default function BusinessSettingsHome() {
    const router = useRouter();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Settings" />
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
                <Row
                    icon="person-circle-outline"
                    title="Account"
                    subtitle="Email, phone, password"
                    onPress={() => router.push("/(business)/settings/account")}
                />
                <Row
                    icon="business-outline"
                    title="Profile"
                    subtitle="Business info shown to users"
                    onPress={() => router.push("/(business)/settings/profile")}
                />
                <Row
                    icon="help-circle-outline"
                    title="Help / FAQ"
                    onPress={() => router.push("/(business)/settings/help")}
                />
                <Row
                    icon="lock-closed-outline"
                    title="Privacy Policy"
                    onPress={() => router.push("/(business)/settings/privacy")}
                />
                <Row
                    icon="document-text-outline"
                    title="Terms and Conditions"
                    onPress={() => router.push("/(business)/settings/terms")}
                />
            </View>
        </SafeAreaView>
    );
}