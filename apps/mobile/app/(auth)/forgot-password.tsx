import { PrimaryButton, SecondaryButton } from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { getAuth, sendPasswordResetEmail } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const sendLink = async () => {
    const e = email.trim();
    if (!e) return Alert.alert("Missing", "Please enter your email.");

    setBusy(true);
    try {
      await sendPasswordResetEmail(getAuth(), e);

      Alert.alert(
        "Check your inbox",
        'If this email is registered with an email/password login, you\'ll receive a reset link.\n\nIf you signed up with Google, please use "Continue with Google".',
      );

      router.back();
    } catch (err: any) {
      const code = err?.code as string | undefined;

      if (code === "auth/invalid-email") {
        Alert.alert("Invalid email", "Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        Alert.alert(
          "Try again later",
          "Too many attempts. Please wait a bit and try again.",
        );
      } else {
        Alert.alert(
          "Check your inbox",
          'If this email is registered with an email/password login, you\'ll receive a reset link.\n\nIf you signed up with Google, please use "Continue with Google".',
        );
        router.back();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[ui.container, styles.container]}>
      <Text style={[typography.h3, styles.title]}>Confirm your email</Text>
      <Text style={[typography.bodyMuted, styles.subtitle]}>
        Enter the email associated with your account and we'll send a reset
        link.
      </Text>

      <FormInput
        label="Enter your email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.spacer} />

      <PrimaryButton
        title={busy ? "..." : "Send reset Link"}
        onPress={sendLink}
        disabled={busy}
        loading={busy}
      />

      <SecondaryButton
        title="Back"
        onPress={() => router.back()}
        style={styles.backButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  spacer: {
    height: theme.spacing.xl,
  },
  backButton: {
    marginTop: theme.spacing.lg,
    alignSelf: "center",
  },
});
