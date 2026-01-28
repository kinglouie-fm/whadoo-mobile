import { apiPatch } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import React, { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function EditLastNameScreen() {
    const { appUser, refreshMe } = useAuth();
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => setValue(appUser?.lastName ?? ""), [appUser?.lastName]);

    const save = async () => {
        setBusy(true);
        try {
            await apiPatch("/me", { lastName: value.trim() || null });
            await refreshMe();
            Alert.alert("Saved", "Last name updated.");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "#111", gap: 12 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>Last name</Text>

            <TextInput
                value={value}
                onChangeText={setValue}
                placeholder="Last name"
                placeholderTextColor="#666"
                style={{ borderWidth: 1, borderColor: "#333", borderRadius: 12, padding: 12, color: "#fff" }}
            />

            <Button title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
        </View>
    );
}
