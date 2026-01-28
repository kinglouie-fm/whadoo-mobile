import { useAuth } from "@/src/providers/auth-context";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";

function Avatar({ name }: { name: string }) {
    const initials =
        name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("") || "U";

    return (
        <View
            style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: "#222",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#333",
            }}
        >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>{initials}</Text>
        </View>
    );
}

function MenuRow({ title, subtitle, onPress }: { title: string; subtitle?: string; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#333" }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{title}</Text>
            {subtitle ? <Text style={{ color: "#777", marginTop: 4 }}>{subtitle}</Text> : null}
        </Pressable>
    );
}

export default function ConsumerProfileHome() {
    const { appUser, signOut } = useAuth();
    const router = useRouter();

    const name =
        [appUser?.firstName, appUser?.lastName].filter(Boolean).join(" ") ||
        appUser?.email ||
        "User";

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "#111" }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 16 }}>Profile</Text>

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <Avatar name={name} />

                <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>{name}</Text>
                    <Text style={{ color: "#aaa", marginTop: 2 }}>{appUser?.email ?? ""}</Text>
                </View>

                <Pressable onPress={() => router.push("/settings/profile")} style={{ padding: 10 }}>
                    <Text style={{ color: "#9eff00", fontWeight: "700" }}>Edit</Text>
                </Pressable>
            </View>

            {/* Quick actions */}
            <View style={{ marginTop: 8 }}>
                <MenuRow title="My Bookings" subtitle="View upcoming and past bookings" onPress={() => router.push("/bookings")} />
                <MenuRow title="Saved Activities" subtitle="Your saved activities" onPress={() => router.push("/saved")} />
                <MenuRow title="Settings" subtitle="Account, privacy, security" onPress={() => router.push("/settings")} />
            </View>

            {/* Logout */}
            <Pressable
                onPress={async () => {
                    try {
                        await signOut();
                    } catch (e: any) {
                        Alert.alert("Logout failed", e?.message ?? String(e));
                    }
                }}
                style={{ marginTop: 28 }}
            >
                <Text style={{ color: "#ff4d4d", fontSize: 16, fontWeight: "800" }}>Log out</Text>
                <Text style={{ color: "#777", marginTop: 2 }}>Log out of this account</Text>
            </Pressable>
        </View>
    );
}
