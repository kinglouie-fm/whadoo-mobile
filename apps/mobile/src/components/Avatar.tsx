import { buildImageUrl, type AssetData } from "@/src/lib/image-utils";
import { theme } from "@/src/theme/theme";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface AvatarProps {
  name: string;
  logoAsset?: AssetData | null;
  photoAsset?: AssetData | null;
  // Legacy support
  logoUrl?: string | null;
  photoUrl?: string | null;
  size?: number;
}

export function Avatar({
  name,
  logoAsset,
  photoAsset,
  logoUrl,
  photoUrl,
  size = 52,
}: AvatarProps) {
  const initials = getInitials(name);
  const radius = size / 2;

  // Prefer Asset data, fallback to legacy URL
  const imageUrl =
    buildImageUrl(logoAsset) ||
    buildImageUrl(photoAsset) ||
    logoUrl ||
    photoUrl;

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
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
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
