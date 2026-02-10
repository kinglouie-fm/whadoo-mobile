// apps/mobile/app/(business)/settings/account/other.tsx
import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { apiPatch } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OtherScreen() {
    const { signOut } = useAuth();
    const [busy, setBusy] = useState(false);

    const onDeactivate = async () => {
        Alert.alert(
            "Deactivate account?",
            "This will deactivate your business account. You can contact support to reactivate it.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Deactivate",
                    style: "destructive",
                    onPress: async () => {
                        setBusy(true);
                        try {
                            await apiPatch("/businesses/me", { status: "inactive" });
                            Alert.alert("Deactivated", "Your business account has been deactivated.");
                            await signOut();
                        } catch (e: any) {
                            Alert.alert("Failed", e?.message ?? String(e));
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="Other" />
            <View style={[ui.container, ui.contentPadding, { gap: 12 }]}>
                <Text style={{ color: theme.colors.muted }}>
                    Deactivation hides your business from users and stops new bookings.
                </Text>

                <PrimaryButton title={busy ? "Deactivating..." : "Deactivate account"} onPress={onDeactivate} disabled={busy} />
                <PrimaryButton title="Sign out" onPress={signOut} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}