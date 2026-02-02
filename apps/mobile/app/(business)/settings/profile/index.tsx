// apps/mobile/app/(business)/settings/profile/index.tsx
import { TopBar } from "@/src/components/TopBar";
import { useBusiness } from "@/src/lib/use-business";
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
            <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{value?.trim() ? value : "-"}</Text>
        </Pressable>
    );
}

export default function BusinessProfileSettingsScreen() {
    const { business } = useBusiness();
    const router = useRouter();

    const name = (business as any)?.name ?? "";
    const description = (business as any)?.description ?? "";
    const category = (business as any)?.category ?? (business as any)?.businessCategory ?? "";
    const location = (business as any)?.location ?? (business as any)?.address ?? "";
    const contactEmail = (business as any)?.contactEmail ?? (business as any)?.email ?? "";
    const contactPhone = (business as any)?.contactPhone ?? (business as any)?.phone ?? "";

    const imagesCount = Array.isArray((business as any)?.images) ? (business as any).images.length : 0;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Profile" />

            <View style={{ flex: 1, paddingHorizontal: 16 }}>
                <Row title="Business Name" value={name} onPress={() => router.push("/(business)/settings/profile/name")} />
                <Row title="Description" value={description} onPress={() => router.push("/(business)/settings/profile/description")} />
                <Row title="Images" value={`${imagesCount} image${imagesCount === 1 ? "" : "s"}`} onPress={() => router.push("/(business)/settings/profile/images")} />
                <Row title="Business Category" value={category} onPress={() => router.push("/(business)/settings/profile/category")} />
                <Row title="Location" value={location} onPress={() => router.push("/(business)/settings/profile/location")} />
                <Row
                    title="Contact"
                    value={[contactPhone, contactEmail].filter(Boolean).join(" • ")}
                    onPress={() => router.push("/(business)/settings/profile/contact")}
                />
            </View>
        </SafeAreaView>
    );
}