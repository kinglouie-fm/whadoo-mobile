import { theme } from "@/src/theme/theme";
import { getAuth, sendPasswordResetEmail } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
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

function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
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
      <Text
        style={{
          fontFamily: theme.fonts.bold,
          color: theme.colors.buttonTextOnAccent,
          fontSize: 16,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

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

      //  Best practice: generic response (no account enumeration)
      Alert.alert(
        "Check your inbox",
        "If this email is registered with an email/password login, you’ll receive a reset link.\n\nIf you signed up with Google, please use “Continue with Google”.",
      );

      router.back();
    } catch (err: any) {
      // Still avoid leaking whether the email exists.
      const code = err?.code as string | undefined;

      if (code === "auth/invalid-email") {
        Alert.alert("Invalid email", "Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        Alert.alert(
          "Try again later",
          "Too many attempts. Please wait a bit and try again.",
        );
      } else {
        //  Generic success message even on user-not-found etc.
        Alert.alert(
          "Check your inbox",
          "If this email is registered with an email/password login, you’ll receive a reset link.\n\nIf you signed up with Google, please use “Continue with Google”.",
        );
        router.back();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        padding: 24,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: theme.fonts.bold,
          color: theme.colors.text,
          fontSize: 24,
          textAlign: "center",
        }}
      >
        Confirm your email
      </Text>

      <Text
        style={{
          fontFamily: theme.fonts.regular,
          color: theme.colors.muted,
          textAlign: "center",
          marginTop: 10,
          marginBottom: 26,
        }}
      >
        Enter the email associated with your account and we’ll send a reset
        link.
      </Text>

      <Text
        style={{
          fontFamily: theme.fonts.medium,
          color: theme.colors.text,
          marginBottom: 6,
        }}
      >
        Enter your email
      </Text>
      <InputLine
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={{ height: 24 }} />

      <PrimaryButton
        title={busy ? "..." : "Send reset Link"}
        onPress={sendLink}
        disabled={busy}
      />

      <Pressable
        onPress={() => router.back()}
        style={{ marginTop: 18, alignItems: "center" }}
      >
        <Text
          style={{ fontFamily: theme.fonts.medium, color: theme.colors.muted }}
        >
          Back
        </Text>
      </Pressable>
    </View>
  );
}
