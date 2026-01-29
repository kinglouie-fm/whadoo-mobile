import { theme } from "@/src/theme/theme";
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification } from "@react-native-firebase/auth";
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

export default function RegisterScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [pw1, setPw1] = useState("");
    const [pw2, setPw2] = useState("");
    const [agree, setAgree] = useState(false);
    const [busy, setBusy] = useState(false);

    const register = async () => {
        const e = email.trim();

        if (!e) return Alert.alert("Missing", "Email is required.");
        if (pw1.length < 6) return Alert.alert("Weak password", "Password must be at least 6 characters.");
        if (pw1 !== pw2) return Alert.alert("Mismatch", "Passwords do not match.");
        if (!agree) return Alert.alert("Terms", "Please agree to the Terms and Conditions.");

        setBusy(true);
        try {
            const cred = await createUserWithEmailAndPassword(getAuth(), e, pw1);

            if (cred.user && !cred.user.emailVerified) {
                await sendEmailVerification(cred.user);
            }

            // RouteGuard will redirect after /me
            router.replace("/(consumer)/(tabs)");
        } catch (err: any) {
            // common: email already in use (maybe Google). Keep message MVP-friendly.
            Alert.alert(
                "Register failed",
                err?.message?.includes("email-already-in-use")
                    ? "This email is already in use. Try logging in or continue with Google."
                    : err?.message ?? String(err)
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 24, justifyContent: "center" }}>
            <Text style={{ fontFamily: theme.fonts.bold, color: theme.colors.text, fontSize: 26, textAlign: "center" }}>
                Register to join us
            </Text>
            <Text style={{ fontFamily: theme.fonts.regular, color: theme.colors.muted, textAlign: "center", marginTop: 8, marginBottom: 26 }}>
                Please enter your details.
            </Text>

            <Text style={{ fontFamily: theme.fonts.medium, color: theme.colors.text, marginBottom: 6 }}>Email</Text>
            <InputLine value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

            <View style={{ height: 16 }} />

            <Text style={{ fontFamily: theme.fonts.medium, color: theme.colors.text, marginBottom: 6 }}>Create Password</Text>
            <InputLine value={pw1} onChangeText={setPw1} secureTextEntry />

            <View style={{ height: 16 }} />

            <Text style={{ fontFamily: theme.fonts.medium, color: theme.colors.text, marginBottom: 6 }}>Confirm Password</Text>
            <InputLine value={pw2} onChangeText={setPw2} secureTextEntry />

            <View style={{ height: 16 }} />

            <Pressable onPress={() => setAgree((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                    style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: agree ? theme.colors.accent : "#6a6a6a",
                        backgroundColor: agree ? theme.colors.accent : "transparent",
                    }}
                />
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.regular }}>
                    I agree to Terms and condition
                </Text>
            </Pressable>

            <View style={{ height: 18 }} />

            <PrimaryButton title={busy ? "..." : "Register"} onPress={register} disabled={busy} />

            <View style={{ marginTop: 18, alignItems: "center" }}>
                <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>
                    Have an account?{" "}
                    <Link href="/(auth)/login" style={{ color: theme.colors.accent, fontFamily: theme.fonts.bold }}>
                        Login
                    </Link>
                </Text>
            </View>
        </View>
    );
}
