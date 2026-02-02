import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
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
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#2b2b2b",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={{ width: "100%", height: "100%" }} />
            ) : (
                <Text style={{ color: theme.colors.text, fontWeight: "800" }}>{initials}</Text>
            )}
        </View>
    );
}

function TopBar({ title }: { title: string }) {
    const router = useRouter();
    const navigation = useNavigation();

    const canGoBack = navigation.canGoBack();

    return (
        <View
            style={{
                paddingHorizontal: 16,
                paddingTop: 6,
                paddingBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
            }}
        >
            <Pressable
                onPress={() => router.back()}
                disabled={!canGoBack}
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: "#1f1f1f",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: canGoBack ? 1 : 0,
                }}
            >
                <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </Pressable>

            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "700" }}>{title}</Text>

            <Pressable
                onPress={() => { }}
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: "#1f1f1f",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.text} />
            </Pressable>
        </View>
    );
}

function Row({
    icon,
    title,
    subtitle,
    onPress,
    danger,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    danger?: boolean;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                borderTopWidth: 1,
                borderTopColor: theme.colors.divider,
            }}
        >
            <Ionicons
                name={icon}
                size={20}
                color={danger ? theme.colors.danger : theme.colors.text}
                style={{ width: 20, marginTop: 2 }}
            />

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        color: danger ? theme.colors.danger : theme.colors.text,
                        fontSize: 18,
                    }}
                >
                    {title}
                </Text>

                {subtitle ? (
                    <Text style={{ color: theme.colors.muted, marginTop: 4 }}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.muted}
                style={{ marginTop: 2 }}
            />
        </Pressable>
    );
}

export default function ConsumerProfileHome() {
    const { appUser, stats, signOut } = useAuth();
    const router = useRouter();

    const name = useMemo(() => {
        return (
            [appUser?.firstName, appUser?.lastName].filter(Boolean).join(" ") ||
            "User"
        );
    }, [appUser?.firstName, appUser?.lastName]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Profile" />

            <View style={{ paddingHorizontal: 16 }}>

                <View
                    style={{
                        backgroundColor: theme.colors.card,
                        borderRadius: 18,
                        padding: 14,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 14,
                    }}
                >
                    <Avatar name={name} photoUrl={appUser?.photoUrl} />

                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "800" }}>{name}</Text>
                        <Text style={{ color: theme.colors.muted, marginTop: 6 }}>
                            Total bookings: {stats?.totalBookings ?? 0}
                        </Text>
                    </View>
                </View>

                {/* Rows (no subscription card) */}
                <View style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
                    <Row
                        icon="calendar-outline"
                        title="My Bookings"
                        subtitle="View upcoming and past bookings"
                        onPress={() => router.push("/bookings")}
                    />
                    <Row
                        icon="heart-outline"
                        title="Saved Activities"
                        subtitle="Your saved activities"
                        onPress={() => router.push("/saved")}
                    />
                    <Row
                        icon="cog-outline"
                        title="Settings"
                        subtitle="Account, profile, privacy"
                        onPress={() => router.push("/settings")}
                    />
                </View>

                <Pressable
                    onPress={async () => {
                        try {
                            await signOut();
                        } catch (e: any) {
                            Alert.alert("Logout failed", e?.message ?? String(e));
                        }
                    }}
                    style={{
                        paddingVertical: 32,
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 12,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.divider,
                    }}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={20}
                        color={theme.colors.danger}
                        style={{ width: 20, marginTop: 2 }}
                    />

                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.colors.danger, fontSize: 18 }}>
                            Log Out
                        </Text>
                        <Text style={{ color: theme.colors.muted, marginTop: 4 }}>
                            Log out the account
                        </Text>
                    </View>
                </Pressable>

            </View>
        </SafeAreaView>
    );
}
