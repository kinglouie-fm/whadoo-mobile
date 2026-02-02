// apps/mobile/app/(business)/settings/profile/description.tsx
import { TopBar } from "@/src/components/TopBar";
import { apiPatch } from "@/src/lib/api";
import { useBusiness } from "@/src/lib/use-business";
import { theme } from "@/src/theme/theme";
import React, { useEffect, useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessDescriptionScreen() {
    const { business } = useBusiness();
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => setValue((business as any)?.description ?? ""), [business]);

    const save = async () => {
        setBusy(true);
        try {
            await apiPatch("/business/me", { description: value.trim() || null });
            Alert.alert("Saved");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Description" />
            <View style={{ padding: 16, gap: 12 }}>
                <TextInput
                    value={value}
                    onChangeText={setValue}
                    placeholder="Describe your business..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={6}
                    style={{
                        borderWidth: 1,
                        borderColor: theme.colors.divider,
                        borderRadius: 12,
                        padding: 12,
                        minHeight: 140,
                        textAlignVertical: "top",
                        color: theme.colors.text,
                    }}
                />
                <Button title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}