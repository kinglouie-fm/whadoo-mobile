import { useAuth } from "@/src/providers/auth-context";
import { Avatar } from "@/src/components/Avatar";
import { Card } from "@/src/components/Card";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import { typography } from "@/src/theme/typography";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useLayoutEffect, useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <Pressable onPress={onPress} style={styles.row}>
      <MaterialIcons
        name={icon}
        size={20}
        color={danger ? theme.colors.danger : theme.colors.text}
        style={styles.rowIcon}
      />

      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.body,
            danger && { color: theme.colors.danger },
          ]}
        >
          {title}
        </Text>

        {subtitle && (
          <Text style={[typography.captionSmall, styles.rowSubtitle]}>
            {subtitle}
          </Text>
        )}
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
    <SafeAreaView style={ui.container} edges={["top"]}>
      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <Avatar name={name} photoAsset={(appUser as any)?.photoAsset} />

          <View style={{ flex: 1 }}>
            <Text style={typography.h4}>{name}</Text>
            <Text style={[typography.captionMuted, styles.statsText]}>
              Bookings completed: {stats?.bookingsCompleted ?? 0}
            </Text>
          </View>
        </Card>

        <View style={styles.menuSection}>
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

        <Row
          icon="logout"
          title="Log Out"
          subtitle="Log out the account"
          danger
          onPress={async () => {
            try {
              await signOut();
            } catch (e: any) {
              Alert.alert("Logout failed", e?.message ?? String(e));
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  statsText: {
    marginTop: 6,
  },
  menuSection: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  row: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  rowIcon: {
    width: 20,
    marginTop: 2,
  },
  rowSubtitle: {
    marginTop: 4,
  },
});
