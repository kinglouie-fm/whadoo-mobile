import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function TopBar({
  title,
  rightIcon,
  onRightPress,
}: {
  title: string;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightPress?: () => void;
}) {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const canGoBack = navigation?.canGoBack?.() ?? false;

  return (
    <View style={styles.container}>
      {/* Back */}
      <Pressable
        onPress={() => router.back()}
        disabled={!canGoBack}
        style={[styles.button, { opacity: canGoBack ? 1 : 0 }]}
        hitSlop={12}
      >
        <MaterialIcons
          name="chevron-left"
          size={22}
          color={theme.colors.text}
        />
      </Pressable>

      {/* Title */}
      <Text style={typography.h4}>{title}</Text>

      {/* Right (optional) */}
      {rightIcon ? (
        <Pressable
          onPress={onRightPress}
          style={styles.button}
          hitSlop={12}
        >
          <MaterialIcons name={rightIcon} size={18} color={theme.colors.text} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    width: 38,
    height: 38,
  },
});
