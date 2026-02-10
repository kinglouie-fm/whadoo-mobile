import { apiPatch } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { PrimaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

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
        <View style={[ui.container, styles.container]}>
            <Text style={typography.h2}>
                Complete your profile
            </Text>
            <Text style={typography.bodyMuted}>
                We need this to confirm bookings.
            </Text>

            <FormInput
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
            />
            <FormInput
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
            />
            <FormInput
                label="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone number"
                keyboardType="phone-pad"
            />

            <PrimaryButton
                title="Continue"
                onPress={save}
                disabled={busy || !canContinue}
                loading={busy}
                style={styles.button}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        padding: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    button: {
        marginTop: theme.spacing.lg,
    },
});
