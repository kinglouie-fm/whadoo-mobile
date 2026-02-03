// apps/mobile/app/(business)/settings/profile/location.tsx
import { TopBar } from "@/src/components/TopBar";
import { apiPatch } from "@/src/lib/api";
import { useBusiness } from "@/src/providers/business-context";
import { theme } from "@/src/theme/theme";
import React, { useEffect, useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessLocationScreen() {
    const { business, refetch } = useBusiness();
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => setValue((business as any)?.location ?? (business as any)?.address ?? ""), [business]);

    const save = async () => {
        setBusy(true);
        try {
            await apiPatch("/businesses/me", { location: value.trim() || null });
            await refetch();
            Alert.alert("Saved");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Location" />
            <View style={{ padding: 16, gap: 12 }}>
                <TextInput
                    value={value}
                    onChangeText={setValue}
                    placeholder="Address / city"
                    placeholderTextColor="#666"
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