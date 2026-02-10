import { TopBar } from "@/src/components/TopBar";
import { apiPatch } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import React, { useEffect, useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FirstNameScreen() {
    const { appUser, refreshMe } = useAuth();
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => setValue(appUser?.firstName ?? ""), [appUser?.firstName]);

    const save = async () => {
        setBusy(true);
        try {
            await apiPatch("/me", { firstName: value.trim() || null });
            await refreshMe();
            Alert.alert("Saved");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="First Name" />
            <View style={{ padding: 16, gap: 12 }}>
                <TextInput
                    value={value}
                    onChangeText={setValue}
                    placeholder="First name"
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
