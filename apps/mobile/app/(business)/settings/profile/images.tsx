// apps/mobile/app/(business)/settings/profile/images.tsx
import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { apiPatch } from "@/src/lib/api";
import { useBusiness } from "@/src/providers/business-context";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessImagesScreen() {
    const { business, refetch } = useBusiness();
    const initial = useMemo(() => (Array.isArray((business as any)?.images) ? (business as any).images : []), [business]);
    const [images, setImages] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);

    useEffect(() => setImages(initial), [initial]);

    const add = () => setImages((prev) => [...prev, ""]);
    const remove = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));
    const update = (idx: number, val: string) => setImages((prev) => prev.map((x, i) => (i === idx ? val : x)));

    const save = async () => {
        const cleaned = images.map((x) => x.trim()).filter(Boolean);
        setBusy(true);
        try {
            await apiPatch("/businesses/me", { images: cleaned });
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
            <TopBar title="Images" />
            <View style={[ui.contentPadding, { gap: 12 }]}>
                {images.length === 0 ? (
                    <Text style={{ color: theme.colors.muted }}>No images yet. Add at least one.</Text>
                ) : null}

                {images.map((url, idx) => (
                    <View key={idx} style={{ gap: 8 }}>
                        <FormInput
                            label={`Image URL ${idx + 1}`}
                            value={url}
                            onChangeText={(v) => update(idx, v)}
                            placeholder="https://..."
                            autoCapitalize="none"
                        />
                        <Pressable
                            onPress={() => remove(idx)}
                            style={{
                                alignSelf: "flex-start",
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 12,
                                backgroundColor: theme.colors.surface,
                                borderWidth: 1,
                                borderColor: theme.colors.divider,
                            }}
                        >
                            <Text style={{ color: theme.colors.danger, fontWeight: "800" }}>Remove</Text>
                        </Pressable>

                        <View style={{ height: 10 }} />
                    </View>
                ))}

                <PrimaryButton title="Add image" onPress={add} />
                <PrimaryButton title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}