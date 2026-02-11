// apps/mobile/app/(business)/settings/profile/images.tsx
import { TopBar } from "@/src/components/TopBar";
import { ImageUploadButton } from "@/src/components/ImageUploadButton";
import { useBusiness } from "@/src/providers/business-context";
import { ui } from "@/src/theme/ui";
import { typography } from "@/src/theme/typography";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessImagesScreen() {
    const { business, refetch } = useBusiness();

    // Get the first image from the legacy images array as fallback
    const logoUrl = (business as any)?.images?.[0] || null;

    return (
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="Business Logo" />
            <ScrollView contentContainerStyle={ui.contentPadding}>
                <Text style={typography.body}>
                    Upload a logo for your business. This will be displayed on your business profile and activities.
                </Text>

                <View style={{ marginTop: 24 }}>
                    <ImageUploadButton
                        currentImageUrl={logoUrl}
                        context={{
                            type: "business_logo",
                            entityId: business?.id,
                        }}
                        onUploadComplete={refetch}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}