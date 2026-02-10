import { useAuth } from "@/src/providers/auth-context";
import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useLayoutEffect, useMemo } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Avatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string | null;
}) {
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
        <Image
          source={{ uri: photoUrl }}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
          {initials}
        </Text>
      )}
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
  icon: keyof typeof MaterialIcons.glyphMap;
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
      <MaterialIcons
        name={icon}
        size={20}
        color={danger ? theme.colors.danger : theme.colors.text}
        style={{ width: 20, marginTop: 2 }}
      />

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: danger ? theme.colors.danger : theme.colors.text,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={{ color: theme.colors.muted, marginTop: 4, fontSize: 12 }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <MaterialIcons
        name="chevron-right"
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
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Profile",
      headerTitleStyle: { color: theme.colors.text, fontWeight: "800" },
      headerStyle: { backgroundColor: theme.colors.bg, height: 120 },
      headerShadowVisible: false,

      //  tab screen => no back button
      headerLeft: () => null,

      //  optional 3-dots (same pattern as other tabs)
      headerRight: () => null,
      // headerRight: () => (
      //   <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginRight: theme.spacing.md }}>
      //     <Pressable
      //       style={{
      //         width: 36,
      //         height: 36,
      //         borderRadius: 18,
      //         alignItems: "center",
      //         justifyContent: "center",
      //         backgroundColor: theme.colors.surface,
      //       }}
      //       onPress={() => {}}
      //     >
      //       <MaterialIcons name="more-horiz" size={22} color={theme.colors.text} />
      //     </Pressable>
      //   </View>
      // ),
    });
  }, [navigation]);

  const name = useMemo(
    () =>
      [appUser?.firstName, appUser?.lastName].filter(Boolean).join(" ") ||
      "User",
    [appUser?.firstName, appUser?.lastName],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={["top"]}
    >
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
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 18,
                fontWeight: "800",
              }}
            >
              {name}
            </Text>
            <Text style={{ color: theme.colors.muted, marginTop: 6 }}>
              Bookings completed: {stats?.bookingsCompleted ?? 0}
            </Text>
          </View>
        </View>

        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.divider,
          }}
        >
          <Row
            icon="calendar-month"
            title="My Bookings"
            subtitle="View upcoming and past bookings"
            onPress={() => router.push("/(consumer)/(tabs)/bookings")}
          />
          <Row
            icon="bookmark"
            title="Saved Activities"
            subtitle="Your saved activities"
            onPress={() => router.push("/(consumer)/(tabs)/saved")}
          />
          <Row
            icon="settings"
            title="Settings"
            subtitle="Account, profile, privacy"
            onPress={() => router.push("/(consumer)/settings")}
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
          <MaterialIcons
            name="logout"
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
