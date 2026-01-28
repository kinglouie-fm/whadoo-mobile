import { Row } from "@/src/components/settings/Row";
import { useAuth } from "@/src/providers/auth-context";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function ProfileSettingsScreen() {
    const { appUser } = useAuth();
    const router = useRouter();

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "#111" }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 16 }}>Profile</Text>

            <Row title="First name" right={appUser?.firstName ?? ""} onPress={() => router.push("/settings/profile/first-name")} />
            <Row title="Last name" right={appUser?.lastName ?? ""} onPress={() => router.push("/settings/profile/last-name")} />
            <Row title="City" right={appUser?.city ?? ""} onPress={() => router.push("/settings/profile/city")} />
        </View>
    );
}
