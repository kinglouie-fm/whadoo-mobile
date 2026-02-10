// apps/mobile/app/(business)/settings/profile/description.tsx
import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { TextArea } from "@/src/components/Input";
import { apiPatch } from "@/src/lib/api";
import { useBusiness } from "@/src/providers/business-context";
import { ui } from "@/src/theme/ui";
import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessDescriptionScreen() {
    const { business, refetch } = useBusiness();
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => setValue((business as any)?.description ?? ""), [business]);

    const save = async () => {
        setBusy(true);
        try {
            await apiPatch("/businesses/me", { description: value.trim() || null });
            await refetch();
            Alert.alert("Saved");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="Description" />
            <View style={[ui.contentPadding, { gap: 12 }]}>
                <TextArea
                    label="Business description"
                    value={value}
                    onChangeText={setValue}
                    placeholder="Describe your business..."
                    numberOfLines={6}
                />
                <PrimaryButton title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}