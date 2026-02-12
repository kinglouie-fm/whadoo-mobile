import { TopBar } from "@/src/components/TopBar";
import { ImageUploadButton } from "@/src/components/ImageUploadButton";
import { useAuth } from "@/src/providers/auth-context";
import { buildImageUrl } from "@/src/lib/image-utils";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
    const { appUser, refreshMe } = useAuth();
    const router = useRouter();

    const photoUrl = buildImageUrl((appUser as any)?.photoAsset);

    return (
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="Profile" />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={ui.contentPadding}>
                <ImageUploadButton
                    currentImageUrl={photoUrl}
                    context={{ type: "user_avatar" }}
                    onUploadComplete={refreshMe}
                />

                <View style={{ marginTop: theme.spacing.lg }}>
                    <Row title="First Name" value={appUser?.firstName ?? ""} onPress={() => router.push("/(consumer)/settings/profile/first-name")} />
                    <Row title="Last Name" value={appUser?.lastName ?? ""} onPress={() => router.push("/(consumer)/settings/profile/last-name")} />
                    <Row title="City" value={appUser?.city ?? ""} onPress={() => router.push("/(consumer)/settings/profile/city")} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
