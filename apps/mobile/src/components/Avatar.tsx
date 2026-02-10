import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { theme } from "@/src/theme/theme";

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
}

export function Avatar({ name, photoUrl, size = 52 }: AvatarProps) {
  const initials = getInitials(name);
  const radius = size / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2b2b2b",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    color: theme.colors.text,
    fontWeight: "800",
  },
});
