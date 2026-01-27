import { useAuth } from "@/src/providers/auth-context";
import React from "react";
import { Button, Text, View } from "react-native";

export default function ProfileScreen() {
    const { appUser, role, firebaseUser, refreshMe, signOut, loadingRole } = useAuth();

    return (
        <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>Profile</Text>

            <Text>Role (from DB): {loadingRole ? "Loading..." : role}</Text>
            <Text>Firebase UID: {firebaseUser?.uid ?? "-"}</Text>
            <Text>Email: {appUser?.email ?? firebaseUser?.email ?? "-"}</Text>
            <Text>Phone: {appUser?.phoneNumber ?? "-"}</Text>

            <Button title="Refresh" onPress={refreshMe} />
            <Button title="Sign out" onPress={signOut} />
        </View>
    );
}
