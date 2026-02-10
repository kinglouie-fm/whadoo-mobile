import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { apiPatch } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { ui } from "@/src/theme/ui";
import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LastNameScreen() {
    const { appUser, refreshMe } = useAuth();
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => setValue(appUser?.lastName ?? ""), [appUser?.lastName]);

    const save = async () => {
        setBusy(true);
        try {
            await apiPatch("/me", { lastName: value.trim() || null });
            await refreshMe();
            Alert.alert("Saved");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="Last Name" />
            <View style={[ui.contentPadding, { gap: 12 }]}>
                <FormInput
                    label="Last name"
                    value={value}
                    onChangeText={setValue}
                    placeholder="Last name"
                />
                <PrimaryButton title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            </View>
        </SafeAreaView>
    );
}
