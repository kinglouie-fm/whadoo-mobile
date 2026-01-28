import { apiDelete } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import React, { useState } from "react";
import { Alert, Button, Text, View } from "react-native";

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
        <View style={{ flex: 1, padding: 20, backgroundColor: theme.colors.bg, gap: 12 }}>
            <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: "700" }}>Other</Text>

            <Button
                title={busy ? "Deleting..." : "Delete account"}
                onPress={onDeleteAccount}
                disabled={busy}
                color="#ff4d4d"
            />

            <Button title="Sign out" onPress={signOut} disabled={busy} color="#ff4d4d" />
        </View>
    );
}
