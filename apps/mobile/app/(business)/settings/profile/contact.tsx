// apps/mobile/app/(business)/settings/profile/contact.tsx
import { TopBar } from "@/src/components/TopBar";
import { apiPatch } from "@/src/lib/api";
import { useBusiness } from "@/src/lib/use-business";
import { theme } from "@/src/theme/theme";
import React, { useEffect, useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessContactScreen() {
    const { business } = useBusiness();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setEmail((business as any)?.contactEmail ?? (business as any)?.email ?? "");
        setPhone((business as any)?.contactPhone ?? (business as any)?.phone ?? "");
    }, [business]);

    const save = async () => {
        setBusy(true);
        try {
            await apiPatch("/business/me", {
                contactEmail: email.trim() || null,
                contactPhone: phone.trim() || null,
            });
            Alert.alert("Saved");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Contact" />
            <View style={{ padding: 16, gap: 12 }}>
                <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Business phone"
                    placeholderTextColor="#666"
                    keyboardType="phone-pad"
                    style={{
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                        borderRadius: 12,
                        padding: 12,
                        color: theme.colors.text,
                    }}
                />
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Business email"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                        borderRadius: 12,
                        padding: 12,
                        color: theme.colors.text,
                    }}
                />
                <Button title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}