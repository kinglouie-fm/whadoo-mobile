// apps/mobile/app/(business)/settings/account/email.tsx
import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import * as Auth from "@react-native-firebase/auth";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmailScreen() {
    const { refreshMe } = useAuth();

    const auth = Auth.getAuth();
    const user = auth.currentUser;

    const providers = user?.providerData?.map((p) => p.providerId) ?? [];
    const isPasswordUser = providers.includes("password");
    const canEdit = useMemo(() => isPasswordUser, [isPasswordUser]);

    const [newEmail, setNewEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [emailVerified, setEmailVerified] = useState(!!user?.emailVerified);

    const currentEmail = user?.email ?? "";

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                const u = Auth.getAuth().currentUser;
                if (!u) return;
                try {
                    await Auth.reload(u);
                    if (!cancelled) setEmailVerified(!!Auth.getAuth().currentUser?.emailVerified);
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
        const u = Auth.getAuth().currentUser;
        if (!u) return;

        try {
            await Auth.reload(u);
            if (Auth.getAuth().currentUser?.emailVerified) {
                setEmailVerified(true);
                Alert.alert("Already verified", "Your email is already verified.");
                return;
            }
            await Auth.sendEmailVerification(u);
            Alert.alert("Sent", "Verification email sent. Please check your inbox.");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        }
    };

    const saveEmail = async () => {
        const u = Auth.getAuth().currentUser;
        if (!u) return;

        if (!canEdit) {
            Alert.alert("Not editable", "This email is managed by your Google account.");
            return;
        }

        const next = newEmail.trim();
        const email = u.email ?? "";

        if (!next || !next.includes("@")) return Alert.alert("Invalid email", "Please enter a valid email address.");
        if (!email) return Alert.alert("Error", "No current email found for this account.");
        if (!currentPassword) return Alert.alert("Required", "Please enter your current password.");

        setBusy(true);
        try {
            const cred = Auth.EmailAuthProvider.credential(email, currentPassword);
            await Auth.reauthenticateWithCredential(u, cred);

            const verifyBeforeUpdateEmailFn = (Auth as any).verifyBeforeUpdateEmail as
                | undefined
                | ((user: any, newEmail: string) => Promise<void>);

            if (typeof verifyBeforeUpdateEmailFn !== "function") {
                Alert.alert(
                    "Needs update",
                    "Your Firebase project uses Email Enumeration Protection, so updateEmail is blocked. " +
                    "Update @react-native-firebase/auth to a version that supports verifyBeforeUpdateEmail."
                );
                return;
            }

            await verifyBeforeUpdateEmailFn(u, next);

            Alert.alert("Check your new email", "We sent a confirmation link to your new email address. Open it to complete the change.");

            await Auth.getIdToken(u, true);
            await refreshMe();
            setNewEmail("");
            setCurrentPassword("");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="E-Mail" />
            <View style={[ui.container, ui.contentPadding, { gap: 12 }]}>
                <Text style={{ color: theme.colors.text, fontSize: 16 }}>
                    Current email: <Text style={{ color: theme.colors.muted }}>{currentEmail || "-"}</Text>
                </Text>

                <Text style={{ color: theme.colors.muted }}>Status: {emailVerified ? "Verified" : "Not verified"}</Text>

                {!emailVerified ? <PrimaryButton title="Send verification email" onPress={sendVerify} /> : null}

                <View style={{ height: 12 }} />

                {!canEdit ? (
                    <Text style={{ color: theme.colors.muted }}>This email is managed by your Google account and can’t be changed here.</Text>
                ) : (
                    <>
                        <FormInput
                            label="New email address"
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder="New email address"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <FormInput
                            label="Current password (required)"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Current password (required)"
                            secureTextEntry
                        />

                        <PrimaryButton title={busy ? "Saving..." : "Save"} onPress={saveEmail} disabled={busy} />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}