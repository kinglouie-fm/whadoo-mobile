import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { apiDelete } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { ui } from "@/src/theme/ui";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OtherScreen() {
    const { signOut, role } = useAuth();
    const [busy, setBusy] = useState(false);

    const onDeleteAccount = async () => {
        if (role === "business") {
            Alert.alert(
                "Not available yet",
                "Business accounts can’t be deleted in-app for now. Please contact support to delete your business account."
            );
            return;
        }

        Alert.alert(
            "Delete account?",
            "This will permanently delete your account and your data. This action can’t be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setBusy(true);
                        try {
                            // Backend should: admin.auth().deleteUser(uid) + delete/soft-delete Postgres user
                            await apiDelete<{ ok: true }>("/me");

                            // Clear local Firebase session
                            await signOut();

                            Alert.alert("Deleted", "Your account has been deleted.");
                        } catch (e: any) {
                            Alert.alert("Delete failed", e?.message ?? String(e));
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
                <PrimaryButton
                    title={busy ? "Deleting..." : "Delete account"}
                    onPress={onDeleteAccount}
                    disabled={busy}
                />
                <PrimaryButton title="Sign out" onPress={signOut} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}
