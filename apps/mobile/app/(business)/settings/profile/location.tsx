// apps/mobile/app/(business)/settings/profile/location.tsx
import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { apiPatch } from "@/src/lib/api";
import { useBusiness } from "@/src/providers/business-context";
import { ui } from "@/src/theme/ui";
import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
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
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="Location" />
            <View style={[ui.contentPadding, { gap: 12 }]}>
                <FormInput
                    label="Address / city"
                    value={value}
                    onChangeText={setValue}
                    placeholder="Address / city"
                />
                <PrimaryButton title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}