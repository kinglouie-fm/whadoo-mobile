import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from "@react-native-firebase/auth";
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
        } catch (e: any) {
            Alert.alert("Sign up failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    const signInGoogle = async () => {
        setBusy(true);
        try {
            // (works on iOS; harmless on iOS even though name says PlayServices)
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            const res = await GoogleSignin.signIn();
            const idToken = (res as any)?.idToken ?? (res as any)?.data?.idToken ?? null;

            if (!idToken) {
                throw new Error("Google Sign-In did not return an idToken.");
            }

            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(getAuth(), credential);
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
            <Button title={busy ? "Please wait..." : "Create account"} onPress={signUp} disabled={busy} />
            <Button title={busy ? "Please wait..." : "Sign in with Google"} onPress={signInGoogle} disabled={busy} />
        </View>
    );
}
