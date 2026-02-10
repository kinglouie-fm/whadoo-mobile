// apps/mobile/app/(business)/settings/profile/category.tsx
import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { apiPatch } from "@/src/lib/api";
import { useBusiness } from "@/src/providers/business-context";
import { ui } from "@/src/theme/ui";
import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessCategoryScreen() {
    const { business, refetch } = useBusiness();
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setValue((business as any)?.category ?? (business as any)?.businessCategory ?? "");
    }, [business]);

    const save = async () => {
        setBusy(true);
        try {
            await apiPatch("/businesses/me", { category: value.trim() || null });
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
            <TopBar title="Business Category" />
            <View style={[ui.contentPadding, { gap: 12 }]}>
                <FormInput
                    label="Business category"
                    value={value}
                    onChangeText={setValue}
                    placeholder="e.g., Karting, Restaurant, Fitness"
                />
                <PrimaryButton title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}