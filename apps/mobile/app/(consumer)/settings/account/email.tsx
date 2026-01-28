// app/(consumer)/settings/account/email.tsx

import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import {
    EmailAuthProvider,
    getAuth,
    getIdToken,
    reauthenticateWithCredential,
    reload,
    sendEmailVerification,
    updateEmail,
} from "@react-native-firebase/auth";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function EmailScreen() {
    const { refreshMe } = useAuth();

    const auth = getAuth();
    const user = auth.currentUser;

    const providers = user?.providerData?.map((p) => p.providerId) ?? [];
    const isPasswordUser = providers.includes("password");
    const canEdit = useMemo(() => isPasswordUser, [isPasswordUser]);

    const currentEmail = user?.email ?? "";

    const [newEmail, setNewEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [emailVerified, setEmailVerified] = useState(!!user?.emailVerified);

    // Refresh verified status whenever you open this screen
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                const u = getAuth().currentUser;
                if (!u) return;

                try {
                    await reload(u); // ✅ modular reload(user)
                    if (!cancelled) setEmailVerified(!!getAuth().currentUser?.emailVerified);
                } catch {
                    // ignore
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [user?.uid])
    );

    const sendVerify = async () => {
        const u = getAuth().currentUser;
        if (!u) return;

        try {
            await reload(u);
            if (getAuth().currentUser?.emailVerified) {
                setEmailVerified(true);
                Alert.alert("Already verified", "Your email is already verified.");
                return;
            }

            await sendEmailVerification(u);
            Alert.alert("Sent", "Verification email sent. Please check your inbox.");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        }
    };

    const saveEmail = async () => {
        const u = getAuth().currentUser;
        if (!u) return;

        if (!canEdit) {
            Alert.alert("Not editable", "This email is managed by your Google account.");
            return;
        }

        const email = u.email ?? "";
        const next = newEmail.trim();

        if (!next || !next.includes("@")) {
            Alert.alert("Invalid email", "Please enter a valid email address.");
            return;
        }
        if (!currentPassword) {
            Alert.alert("Required", "Please enter your current password.");
            return;
        }
        if (!email) {
            Alert.alert("Error", "No current email found for this account.");
            return;
        }

        setBusy(true);
        try {
            const cred = EmailAuthProvider.credential(email, currentPassword);
            await reauthenticateWithCredential(u, cred);

            await updateEmail(u, next);

            // after email change, it’s typically unverified again
            await sendEmailVerification(u);

            await getIdToken(u, true); // refresh token so backend gets updated email (if you sync it)
            await refreshMe();

            Alert.alert("Saved", "Email updated. Please verify the new email address.");
            setNewEmail("");
            setCurrentPassword("");

            await reload(u);
            setEmailVerified(!!getAuth().currentUser?.emailVerified);
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: theme.colors.bg, gap: 12 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>
                Current email: <Text style={{ color: theme.colors.muted }}>{currentEmail || "-"}</Text>
            </Text>

            {!emailVerified ? <Button title="Send verification email" onPress={sendVerify} /> : null}

            <View style={{ height: 12 }} />

            {!canEdit ? (
                <Text style={{ color: theme.colors.muted }}>
                    This email is managed by your Google account and can’t be changed here.
                </Text>
            ) : (
                <>
                    <TextInput
                        value={newEmail}
                        onChangeText={setNewEmail}
                        placeholder="New email address"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={{
                            borderWidth: 1,
                            borderColor: "#444",
                            borderRadius: 10,
                            padding: 12,
                            color: theme.colors.text,
                        }}
                        placeholderTextColor="#666"
                    />

                    <TextInput
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Current password (required)"
                        secureTextEntry
                        style={{
                            borderWidth: 1,
                            borderColor: "#444",
                            borderRadius: 10,
                            padding: 12,
                            color: theme.colors.text,
                        }}
                        placeholderTextColor="#666"
                    />

                    <Button title={busy ? "Saving..." : "Save"} onPress={saveEmail} disabled={busy} />
                </>
            )}
        </View>
    );
}
