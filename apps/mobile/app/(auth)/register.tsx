import {
    createUserWithEmailAndPassword,
    getAuth,
    sendEmailVerification,
} from "@react-native-firebase/auth";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function RegisterScreen() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [busy, setBusy] = useState(false);

    const signUp = async () => {
        const e = email.trim();

        if (!e) return Alert.alert("Missing", "Email is required.");
        if (password.length < 6) return Alert.alert("Weak password", "Password must be at least 6 characters.");
        if (password !== password2) return Alert.alert("Mismatch", "Passwords do not match.");

        setBusy(true);
        try {
            const cred = await createUserWithEmailAndPassword(getAuth(), e, password);

            // Send verification email (optional MVP improvement)
            if (cred.user && !cred.user.emailVerified) {
                await sendEmailVerification(cred.user);
                Alert.alert(
                    "Verification email sent",
                    "Please check your inbox to verify your email. You can still continue for now."
                );
            }

            // Firebase is logged in now, RouteGuard will redirect,
            // but we can also nudge navigation:
            router.replace("/(consumer)/(tabs)");
        } catch (err: any) {
            Alert.alert("Create account failed", err?.message ?? String(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: "700" }}>Create account</Text>

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
                placeholder="Password (min 6)"
                secureTextEntry
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />

            <TextInput
                value={password2}
                onChangeText={setPassword2}
                placeholder="Confirm password"
                secureTextEntry
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />

            <Button title={busy ? "Creating..." : "Create account"} onPress={signUp} disabled={busy} />

            <Link href="/(auth)/login" asChild>
                <Text style={{ marginTop: 8, textAlign: "center", textDecorationLine: "underline" }}>
                    Already have an account? Sign in
                </Text>
            </Link>
        </View>
    );
}
