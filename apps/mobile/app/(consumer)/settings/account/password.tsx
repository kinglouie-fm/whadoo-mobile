import { TopBar } from "@/src/components/TopBar";
import { PrimaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import {
    EmailAuthProvider,
    getAuth,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    updatePassword,
} from "@react-native-firebase/auth";
import React, { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PasswordScreen() {
  const auth = getAuth();
  const user = auth.currentUser;

  const providers = user?.providerData?.map((p) => p.providerId) ?? [];
  const isPasswordUser = providers.includes("password");

  const email = user?.email ?? "";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const canChange = useMemo(() => isPasswordUser, [isPasswordUser]);

  const doReset = async () => {
    if (!email) {
      Alert.alert("No email", "No email address found for this account.");
      return;
    }
    try {
      await sendPasswordResetEmail(getAuth(), email);
      Alert.alert("Sent", "Password reset email sent. Check your inbox.");
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? String(e));
    }
  };

  const save = async () => {
    if (!user) return;

    if (!canChange) {
      Alert.alert("Not available", "This account uses Google Sign-In.");
      return;
    }

    if (!currentPassword) {
      Alert.alert("Required", "Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      Alert.alert("Weak password", "Please use at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }
    if (!email) {
      Alert.alert("Error", "No email found for this account.");
      return;
    }

    setBusy(true);
    try {
      //  re-auth (required)
      const cred = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(user, cred);

      //  update password
      await updatePassword(user, newPassword);

      Alert.alert("Saved", "Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={ui.container} edges={["top"]}>
      <TopBar title="Password" />
      <View style={[ui.container, ui.contentPadding, { gap: 12 }]}>
        {!canChange ? (
          <Text style={{ color: theme.colors.muted }}>
            This account uses Google Sign-In. Password is managed by Google.
          </Text>
        ) : (
          <>
            <FormInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              secureTextEntry
            />

            <FormInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              secureTextEntry
            />

            <FormInput
              label="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm new password"
              secureTextEntry
            />

            <PrimaryButton title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            <PrimaryButton title="Forgot password? Send reset email" onPress={doReset} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
