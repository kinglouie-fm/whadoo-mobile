import { TopBar } from "@/src/components/TopBar";
import { useBusiness } from "@/src/providers/business-context";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Row({
  title,
  value,
  onPress,
}: {
  title: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <Text
        style={{ color: theme.colors.text, fontSize: 16, fontWeight: "600" }}
      >
        {title}
      </Text>
      <Text style={{ color: theme.colors.muted, marginTop: 4 }}>
        {value?.trim() ? value : "-"}
      </Text>
    </Pressable>
  );
}

export default function BusinessProfileSettingsScreen() {
  const { business } = useBusiness();
  const router = useRouter();

  const name = (business as any)?.name ?? "";
  const description = (business as any)?.description ?? "";
  const category =
    (business as any)?.category ?? (business as any)?.businessCategory ?? "";
  const location =
    (business as any)?.location ?? (business as any)?.address ?? "";
  const contactEmail =
    (business as any)?.contactEmail ?? (business as any)?.email ?? "";
  const contactPhone =
    (business as any)?.contactPhone ?? (business as any)?.phone ?? "";

  const logoAsset = (business as any)?.logoAsset;
  const hasLogo = !!(logoAsset?.storageKey && logoAsset?.downloadToken);

  return (
    <SafeAreaView style={ui.container} edges={["top"]}>
      <TopBar title="Profile" />

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Row
          title="Business Name"
          value={name}
          onPress={() => router.push("/(business)/settings/profile/name")}
        />
        <Row
          title="Description"
          value={description}
          onPress={() =>
            router.push("/(business)/settings/profile/description")
          }
        />
        <Row
          title="Logo"
          value={hasLogo ? "View" : "Upload"}
          onPress={() => router.push("/(business)/settings/profile/logo")}
        />
        <Row
          title="Business Category"
          value={category}
          onPress={() => router.push("/(business)/settings/profile/category")}
        />
        <Row
          title="Location"
          value={location}
          onPress={() => router.push("/(business)/settings/profile/location")}
        />
        <Row
          title="Contact"
          value={[contactPhone, contactEmail].filter(Boolean).join(" • ")}
          onPress={() => router.push("/(business)/settings/profile/contact")}
        />
      </View>
    </SafeAreaView>
  );
}
