import { theme } from "@/src/theme/theme";
import { GoogleAuthProvider, getAuth, signInWithCredential } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

function PrimaryButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={{
                height: 54,
                borderRadius: 999,
                backgroundColor: theme.colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: disabled ? 0.6 : 1,
            }}
        >
            <Text style={{ fontFamily: theme.fonts.bold, color: theme.colors.buttonTextOnAccent, fontSize: 16 }}>{title}</Text>
        </Pressable>
    );
}

function OutlineButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={{
                height: 54,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#5a5a5a",
                alignItems: "center",
                justifyContent: "center",
                opacity: disabled ? 0.6 : 1,
            }}
        >
            <Text style={{ fontFamily: theme.fonts.medium, color: theme.colors.text, fontSize: 16 }}>{title}</Text>
        </Pressable>
    );
}

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
        <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 24, justifyContent: "flex-end", gap: 12 }}>
            <View style={{ flex: 1 }} />

            <Text style={{ fontFamily: theme.fonts.bold, color: theme.colors.text, fontSize: 28, textAlign: "center" }}>
                Welcome
            </Text>
            <Text style={{ fontFamily: theme.fonts.regular, color: theme.colors.muted, textAlign: "center", marginBottom: 12 }}>
                Sign in to continue
            </Text>

            <PrimaryButton title="Continue with Email" onPress={() => router.push("/(auth)/login")} disabled={busy} />
            <OutlineButton title="Continue with Google" onPress={signInGoogle} disabled={busy} />

            <View style={{ height: 22 }} />
        </View>
    );
}
