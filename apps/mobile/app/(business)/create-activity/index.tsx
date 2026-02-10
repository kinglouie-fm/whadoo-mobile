import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { theme } from "@/src/theme/theme";

export default function CreateActivityScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to activities tab, which will show the create UI
    router.replace("/(business)/(tabs)/activities");
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
