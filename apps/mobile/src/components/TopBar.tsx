import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

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
      {/* Back */}
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
          opacity: canGoBack ? 1 : 0, // keeps title centered
        }}
        hitSlop={12}
      >
        <MaterialIcons
          name="chevron-left"
          size={22}
          color={theme.colors.text}
        />
      </Pressable>

      {/* Title */}
      <Text
        style={{ color: theme.colors.text, fontSize: 18, fontWeight: "700" }}
      >
        {title}
      </Text>

      {/* Right (optional) */}
      {rightIcon ? (
        <Pressable
          onPress={onRightPress}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#1f1f1f",
            alignItems: "center",
            justifyContent: "center",
          }}
          hitSlop={12}
        >
          <MaterialIcons name={rightIcon} size={18} color={theme.colors.text} />
        </Pressable>
      ) : (
        <View style={{ width: 38, height: 38 }} />
      )}
    </View>
  );
}
