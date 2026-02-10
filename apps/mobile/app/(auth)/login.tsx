import { theme } from "@/src/theme/theme";
import { GoogleAuthProvider, getAuth, signInWithCredential, signInWithEmailAndPassword } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

function InputLine(props: React.ComponentProps<typeof TextInput>) {
    return (
        <TextInput
            {...props}
            style={[
                {
                    height: 44,
                    borderBottomWidth: 1,
                    borderBottomColor: "#4a4a4a",
                    color: theme.colors.text,
                    fontFamily: theme.fonts.regular,
                    fontSize: 16,
                },
                props.style,
            ]}
            placeholderTextColor="#7a7a7a"
        />
    );
}

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
        <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 24, justifyContent: "center" }}>
            <Text style={{ fontFamily: theme.fonts.bold, color: theme.colors.text, fontSize: 26, textAlign: "center" }}>
                Welcome Back
            </Text>
            <Text style={{ fontFamily: theme.fonts.regular, color: theme.colors.muted, textAlign: "center", marginTop: 8, marginBottom: 26 }}>
                Please enter your details.
            </Text>

            <Text style={{ fontFamily: theme.fonts.medium, color: theme.colors.text, marginBottom: 6 }}>Email</Text>
            <InputLine value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

            <View style={{ height: 16 }} />

            <Text style={{ fontFamily: theme.fonts.medium, color: theme.colors.text, marginBottom: 6 }}>Password</Text>
            <InputLine value={password} onChangeText={setPassword} secureTextEntry />

            <View style={{ height: 10 }} />

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                    <Text style={{ fontFamily: theme.fonts.medium, color: theme.colors.muted }}>Forgot password?</Text>
                </Pressable>
            </View>

            <View style={{ height: 18 }} />

            <PrimaryButton title={busy ? "..." : "Login"} onPress={signIn} disabled={busy} />

            <View style={{ height: 18, flexDirection: "row", alignItems: "center", gap: 10, margin: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: "#3a3a3a" }} />
                <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>Or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "#3a3a3a" }} />
            </View>

            <OutlineButton title={busy ? "..." : "Continue with Google"} onPress={signInGoogle} disabled={busy} />

            <View style={{ marginTop: 18, alignItems: "center" }}>
                <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>
                    Don’t have an account?{" "}
                    <Link href="/(auth)/register" style={{ color: theme.colors.accent, fontFamily: theme.fonts.bold }}>
                        Register
                    </Link>
                </Text>
            </View>
        </View>
    );
}
