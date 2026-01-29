import { apiPatch } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

export default function CompleteProfileScreen() {
    const { appUser, refreshMe } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setFirstName(appUser?.firstName ?? "");
        setLastName(appUser?.lastName ?? "");
        setPhoneNumber(appUser?.phoneNumber ?? "");
    }, [appUser?.firstName, appUser?.lastName, appUser?.phoneNumber]);

    const canContinue =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        phoneNumber.trim().length > 0;

    const save = async () => {
        if (!canContinue) {
            Alert.alert("Missing info", "Please fill in first name, last name and phone number.");
            return;
        }

        setBusy(true);
        try {
            await apiPatch<{ user: any }>("/me", {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phoneNumber.trim(),
            });

            await refreshMe(); // RouteGuard will automatically move you to tabs
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 24, justifyContent: "center", gap: 14 }}>
            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: "700" }}>
                Complete your profile
            </Text>
            <Text style={{ color: theme.colors.muted }}>
                We need this to confirm bookings.
            </Text>

            <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="#7a7a7a"
                style={{ borderBottomWidth: 1, borderBottomColor: "#4a4a4a", color: theme.colors.text, paddingVertical: 10 }}
            />
            <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor="#7a7a7a"
                style={{ borderBottomWidth: 1, borderBottomColor: "#4a4a4a", color: theme.colors.text, paddingVertical: 10 }}
            />
            <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone number"
                placeholderTextColor="#7a7a7a"
                keyboardType="phone-pad"
                style={{ borderBottomWidth: 1, borderBottomColor: "#4a4a4a", color: theme.colors.text, paddingVertical: 10 }}
            />

            <Pressable
                onPress={save}
                disabled={busy || !canContinue}
                style={{
                    marginTop: 18,
                    height: 54,
                    borderRadius: 999,
                    backgroundColor: theme.colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: busy || !canContinue ? 0.6 : 1,
                }}
            >
                <Text style={{ color: theme.colors.buttonTextOnAccent, fontWeight: "700" }}>
                    {busy ? "Saving..." : "Continue"}
                </Text>
            </Pressable>
        </View>
    );
}
