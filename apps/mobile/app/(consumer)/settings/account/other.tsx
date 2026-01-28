import { useAuth } from "@/src/providers/auth-context";
import { getAuth, sendEmailVerification } from "@react-native-firebase/auth";
import React from "react";
import { Alert, Button, Text, View } from "react-native";

export default function OtherScreen() {
    const { signOut } = useAuth();
    const fbUser = getAuth().currentUser;

    const verifyEmail = async () => {
        if (!fbUser) return;
        try {
            await sendEmailVerification(fbUser);
            Alert.alert("Sent", "Verification email sent.");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "#111", gap: 12 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>Other</Text>

            <Button title="Send verification email" onPress={verifyEmail} />
            <Button title="Sign out" onPress={signOut} color="#ff4d4d" />
        </View>
    );
}
