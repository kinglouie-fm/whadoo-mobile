// apps/mobile/app/(business)/settings/terms.tsx
import { TopBar } from "@/src/components/TopBar";
import { theme } from "@/src/theme/theme";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Terms" />
            <View style={{ padding: 16, gap: 8 }}>
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "800" }}>Terms and Conditions</Text>
                <Text style={{ color: theme.colors.muted }}>Add your terms text or link here.</Text>
            </View>
        </SafeAreaView>
    );
}