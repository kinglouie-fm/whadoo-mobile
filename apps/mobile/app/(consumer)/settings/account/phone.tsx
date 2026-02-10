import { TopBar } from "@/src/components/TopBar";
import { apiPatch } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import React, { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditPhoneScreen() {
    const { appUser, refreshMe } = useAuth();
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => setValue(appUser?.phoneNumber ?? ""), [appUser?.phoneNumber]);

    const save = async () => {
        setBusy(true);
        try {
            await apiPatch("/me", { phoneNumber: value.trim() || null });
            await refreshMe();
            Alert.alert("Saved", "Phone number updated.");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Phone" />
            <View style={{ flex: 1, padding: 20, gap: 12 }}>
                <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>Phone number</Text>

                <TextInput
                    value={value}
                    onChangeText={setValue}
                    placeholder="Phone number"
                    placeholderTextColor="#666"
                    keyboardType="phone-pad"
                    style={{ borderWidth: 1, borderColor: "#333", borderRadius: 12, padding: 12, color: "#fff" }}
                />

                <Button title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}
