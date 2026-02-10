import { FormInput } from "@/src/components/Input";
import { PrimaryButton, SecondaryButton } from "@/src/components/Button";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { theme } from "@/src/theme/theme";
import { GoogleAuthProvider, getAuth, signInWithCredential, signInWithEmailAndPassword } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native";

export default function LoginScreen() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const signIn = async () => {
        setBusy(true);
        try {
            await signInWithEmailAndPassword(getAuth(), email.trim(), password);
        } catch (e: any) {
            Alert.alert("Sign in failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

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
            <Text style={[typography.h2, styles.title]}>Welcome Back</Text>
            <Text style={[typography.bodyMuted, styles.subtitle]}>Please enter your details.</Text>

            <FormInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <FormInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
            />

            <View style={styles.forgotRow}>
                <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                    <Text style={typography.captionMuted}>Forgot password?</Text>
                </Pressable>
            </View>

            <PrimaryButton title={busy ? "..." : "Login"} onPress={signIn} disabled={busy} loading={busy} />

            <View style={styles.dividerRow}>
                <View style={[styles.divider, ui.divider]} />
                <Text style={typography.captionMuted}>Or</Text>
                <View style={[styles.divider, ui.divider]} />
            </View>

            <SecondaryButton title={busy ? "..." : "Continue with Google"} onPress={signInGoogle} disabled={busy} />

            <View style={styles.footer}>
                <Text style={typography.bodyMuted}>
                    Don’t have an account?{" "}
                    <Link href="/(auth)/register" style={styles.link}>
                        Register
                    </Link>
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.xl,
        justifyContent: "center",
    },
    title: {
        textAlign: "center",
    },
    subtitle: {
        textAlign: "center",
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    forgotRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: theme.spacing.lg,
    },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        marginVertical: theme.spacing.lg,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    footer: {
        marginTop: theme.spacing.lg,
        alignItems: "center",
    },
    link: {
        color: theme.colors.accent,
        fontWeight: "700",
    },
});
