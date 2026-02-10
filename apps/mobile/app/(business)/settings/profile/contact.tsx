// apps/mobile/app/(business)/settings/profile/contact.tsx
import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { apiPatch } from "@/src/lib/api";
import { useBusiness } from "@/src/providers/business-context";
import { ui } from "@/src/theme/ui";
import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessContactScreen() {
    const { business, refetch } = useBusiness();
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
            await apiPatch("/businesses/me", {
                contactEmail: email.trim() || null,
                contactPhone: phone.trim() || null,
            });
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
            <TopBar title="Contact" />
            <View style={[ui.contentPadding, { gap: 12 }]}>
                <FormInput
                    label="Business phone"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Business phone"
                    keyboardType="phone-pad"
                />
                <FormInput
                    label="Business email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Business email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <PrimaryButton title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}