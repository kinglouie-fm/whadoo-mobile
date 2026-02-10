import { PrimaryButton, SecondaryButton } from "@/src/components/Button";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { theme } from "@/src/theme/theme";
import { GoogleAuthProvider, getAuth, signInWithCredential } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { StyleSheet } from "react-native";

export default function AuthHomeScreen() {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    const signInGoogle = async () => {
        setBusy(true);
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const res = await GoogleSignin.signIn();
            const idToken = (res as any)?.idToken ?? (res as any)?.data?.idToken ?? null;
            if (!idToken) throw new Error("Google Sign-In did not return an idToken.");

            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(getAuth(), credential);
        } catch (e: any) {
            Alert.alert("Google sign-in failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={[ui.container, styles.container]}>
            <View style={styles.spacer} />

            <Text style={[typography.h2, styles.title]}>Welcome</Text>
            <Text style={[typography.bodyMuted, styles.subtitle]}>Sign in to continue</Text>

            <PrimaryButton title="Continue with Email" onPress={() => router.push("/(auth)/login")} disabled={busy} />
            <SecondaryButton title="Continue with Google" onPress={signInGoogle} disabled={busy} />

            <View style={styles.bottomSpacer} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.xl,
        justifyContent: "flex-end",
        gap: theme.spacing.md,
    },
    spacer: {
        flex: 1,
    },
    title: {
        textAlign: "center",
    },
    subtitle: {
        textAlign: "center",
        marginBottom: theme.spacing.md,
    },
    bottomSpacer: {
        height: theme.spacing.lg,
    },
});
