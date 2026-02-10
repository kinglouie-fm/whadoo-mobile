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
  danger,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  onPress: () => void;
  danger?: boolean;
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
        color={danger ? theme.colors.danger : theme.colors.text}
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

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={["top"]}
    >
      <TopBar title="Settings" />

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Row
          icon="settings"
          title="Account"
          onPress={() => router.push("/(consumer)/settings/account")}
        />
        <Row
          icon="person"
          title="Profile"
          onPress={() => router.push("/(consumer)/settings/profile")}
        />
        <Row
          icon="help"
          title="Help & FAQ"
          onPress={() => router.push("/(consumer)/settings/help")}
        />
        <Row
          icon="lock"
          title="Privacy Policy"
          onPress={() => router.push("/(consumer)/settings/privacy")}
        />
        <Row
          icon="description"
          title="Terms & Conditions"
          onPress={() => router.push("/(consumer)/settings/terms")}
        />
      </View>
    </SafeAreaView>
  );
}
