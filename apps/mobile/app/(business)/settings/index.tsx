// apps/mobile/app/(business)/settings/index.tsx
import { TopBar } from "@/src/components/TopBar";
import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Row({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <MaterialIcons
        name={icon}
        size={18}
        color={theme.colors.text}
        style={{ width: 20 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16 }}>{title}</Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={18}
        color={theme.colors.muted}
      />
    </Pressable>
  );
}

export default function BusinessSettingsHome() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={["top"]}
    >
      <TopBar title="Settings" />
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Row
          icon="person"
          title="Account"
          onPress={() => router.push("/(business)/settings/account")}
        />
        <Row
          icon="business"
          title="Profile"
          onPress={() => router.push("/(business)/settings/profile")}
        />
        <Row
          icon="help"
          title="Help / FAQ"
          onPress={() => router.push("/(business)/settings/help")}
        />
        <Row
          icon="lock"
          title="Privacy Policy"
          onPress={() => router.push("/(business)/settings/privacy")}
        />
        <Row
          icon="description"
          title="Terms and Conditions"
          onPress={() => router.push("/(business)/settings/terms")}
        />
      </View>
    </SafeAreaView>
  );
}
