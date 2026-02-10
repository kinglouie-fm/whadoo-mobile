// apps/mobile/app/(business)/settings/account/phone.tsx
import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { apiPatch } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
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
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="Phone" />
            <View style={[ui.container, ui.contentPadding, { gap: 12 }]}>
                <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: "800" }}>Phone number</Text>

                <FormInput
                    label="Phone number"
                    value={value}
                    onChangeText={setValue}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                />

                <PrimaryButton title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}