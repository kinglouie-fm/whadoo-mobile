import { apiPatch, apiPost } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function ProfileScreen() {
    const { appUser, firebaseUser, role, refreshMe, signOut, loadingRole } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [city, setCity] = useState("");
    const [busy, setBusy] = useState(false);

    const router = useRouter();

    const createBusinessAndSwitch = async () => {
        try {
            // minimal create: name required — replace this with a small form later
            const data = await apiPost<{ business: any }>("/businesses", {
                name: "My Business",
            });

            await refreshMe(); // role becomes business
            // RouteGuard will also redirect, but this makes it immediate:
            router.replace("/(business)/(tabs)");
        } catch (e: any) {
            Alert.alert("Failed", e?.message ?? String(e));
        }
    };

    useEffect(() => {
        setFirstName(appUser?.firstName ?? "");
        setLastName(appUser?.lastName ?? "");
        setPhoneNumber(appUser?.phoneNumber ?? "");
        setCity(appUser?.city ?? "");
    }, [appUser?.firstName, appUser?.lastName, appUser?.phoneNumber, appUser?.city]);

    const save = async () => {
        setBusy(true);
        try {
            const payload = {
                firstName: firstName.trim() || undefined,
                lastName: lastName.trim() || undefined,
                phoneNumber: phoneNumber.trim() || undefined,
                city: city.trim() || undefined,
            };

            await apiPatch<{ user: any }>("/me", payload);
            await refreshMe();
            Alert.alert("Saved", "Profile updated.");
        } catch (e: any) {
            Alert.alert("Save failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 24, gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>Profile</Text>

            <Text>Role: {loadingRole ? "Loading..." : role}</Text>
            <Text>UID: {firebaseUser?.uid ?? "-"}</Text>
            <Text>Email: {appUser?.email ?? firebaseUser?.email ?? "-"}</Text>

            <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />
            <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />
            <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone number"
                keyboardType="phone-pad"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />
            <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />

            <Button title="Create business (MVP)" onPress={createBusinessAndSwitch} />
            <Button title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            <Button title="Refresh" onPress={refreshMe} />
            <Button title="Sign out" onPress={signOut} />
        </View>
    );
}
