import { theme } from "@/src/theme/theme";
import {
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
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
        } catch (e: any) {
            Alert.alert("Sign in failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    const signUp = async () => {
        setBusy(true);
        try {
            await createUserWithEmailAndPassword(getAuth(), email.trim(), password);

            const user = getAuth().currentUser;
            if (user && !user.emailVerified) {
                await sendEmailVerification(user);
                Alert.alert("Account created", "Verification email sent. Please check your inbox.");
            } else {
                Alert.alert("Account created", "You can now sign in.");
            }
        } catch (e: any) {
            Alert.alert("Sign up failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    const forgotPassword = async () => {
        const e = email.trim();
        if (!e) {
            Alert.alert("Enter email", "Please type your email address first.");
            return;
        }
        setBusy(true);
        try {
            await sendPasswordResetEmail(getAuth(), e);
            Alert.alert("Sent", "Password reset email sent. Check your inbox.");
        } catch (err: any) {
            Alert.alert("Failed", err?.message ?? String(err));
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
        <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12, backgroundColor: theme.colors.bg }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: theme.colors.text }}>Whadoo</Text>
            <Text style={{ opacity: 0.7, color: theme.colors.muted }}>Sign in to continue</Text>

            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, borderColor: "#444", borderRadius: 10, padding: 12, color: theme.colors.text }}
                placeholderTextColor="#666"
            />

            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                style={{ borderWidth: 1, borderColor: "#444", borderRadius: 10, padding: 12, color: theme.colors.text }}
                placeholderTextColor="#666"
            />

            <Button title={busy ? "Please wait..." : "Sign in"} onPress={signIn} disabled={busy} />
            <Button title={busy ? "Please wait..." : "Create account"} onPress={signUp} disabled={busy} />
            <Button title={busy ? "Please wait..." : "Sign in with Google"} onPress={signInGoogle} disabled={busy} />
            <Button title="Forgot password" onPress={forgotPassword} disabled={busy} />
        </View>
    );
}
