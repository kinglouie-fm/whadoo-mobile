import {
    getAuth,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const signIn = async () => {
        setBusy(true);
        try {
            await signInWithEmailAndPassword(getAuth(), email.trim(), password);
            // RouteGuard handles redirect
        } catch (e: any) {
            Alert.alert("Sign in failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    const resetPassword = async () => {
        const e = email.trim();
        if (!e) {
            Alert.alert("Missing email", "Enter your email first, then tap 'Forgot password'.");
            return;
        }

        setBusy(true);
        try {
            await sendPasswordResetEmail(getAuth(), e);
            Alert.alert("Email sent", "If an account exists for this email, a reset link was sent.");
        } catch (e: any) {
            Alert.alert("Reset failed", e?.message ?? String(e));
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
            // RouteGuard handles redirect
        } catch (e: any) {
            Alert.alert("Google sign-in failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: "700" }}>Whadoo</Text>
            <Text style={{ opacity: 0.7 }}>Sign in to continue</Text>

            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />

            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />

            <Button title={busy ? "Please wait..." : "Sign in"} onPress={signIn} disabled={busy} />
            <Button title={busy ? "Please wait..." : "Sign in with Google"} onPress={signInGoogle} disabled={busy} />

            <Button title="Forgot password" onPress={resetPassword} disabled={busy} />

            <Link href="/(auth)/register" asChild>
                <Text style={{ marginTop: 8, textAlign: "center", textDecorationLine: "underline" }}>
                    Create an account
                </Text>
            </Link>
        </View>
    );
}
