import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable } from "react-native";

export const baseStackOptions = {
  headerShown: true,
  headerTitleAlign: "center" as const,
  headerStyle: { backgroundColor: theme.colors.bg },
  headerTintColor: theme.colors.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: theme.colors.bg },
  headerBackButtonMenuEnabled: false,
};

export const stackOptionsWithBack = ({ navigation }: any) => ({
  ...baseStackOptions,
  headerLeft: () => (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={12}
      style={{ paddingHorizontal: 8, paddingVertical: 6 }}
    >
      <MaterialIcons name="chevron-left" size={22} color={theme.colors.text} />
    </Pressable>
  ),
});
