// apps/mobile/app/(business)/settings/account/index.tsx
import { TopBar } from "@/src/components/TopBar";
import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import { getAuth } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Row({ title, right, onPress }: { title: string; right?: string; onPress?: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={{
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.divider,
                flexDirection: "row",
                justifyContent: "space-between",
            }}
        >
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>{title}</Text>
            {right ? <Text style={{ color: theme.colors.muted }}>{right}</Text> : <Text style={{ color: "#666" }}>{onPress ? ">" : ""}</Text>}
        </Pressable>
    );
}

export default function BusinessAccountScreen() {
    const { appUser } = useAuth();
    const router = useRouter();

    const fbUser = getAuth().currentUser;
    const providers = fbUser?.providerData?.map((p) => p.providerId) ?? [];
    const isPasswordUser = providers.includes("password");

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["top"]}>
            <TopBar title="Account" />
            <View style={{ flex: 1, padding: 20, backgroundColor: theme.colors.bg }}>
                <Row title="User ID" right={appUser?.id ?? "-"} />
                <Row
                    title="E-mail Address"
                    right={fbUser?.email ?? appUser?.email ?? "-"}
                    onPress={() => router.push("/(business)/settings/account/email")}
                />
                <Row
                    title="Phone Number"
                    right={appUser?.phoneNumber ?? "Not set"}
                    onPress={() => router.push("/(business)/settings/account/phone")}
                />
                <Row
                    title="Password"
                    right={isPasswordUser ? "" : "Google account"}
                    onPress={() => router.push("/(business)/settings/account/password")}
                />
                <Row title="Other" onPress={() => router.push("/(business)/settings/account/other")} />
            </View>
        </SafeAreaView>
    );
}