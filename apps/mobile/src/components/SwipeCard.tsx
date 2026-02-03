import { theme } from "@/src/theme/theme";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { GroupedCard } from "../store/slices/grouped-card-slice";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;

interface SwipeCardProps {
  card: GroupedCard;
}

export function SwipeCard({ card }: SwipeCardProps) {
  const truncateDescription = (text: string | undefined, maxWords: number) => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  return (
    <View style={styles.card}>
      {card.thumbnailUrl && (
        <Image
          source={{ uri: card.thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{card.typeLabel}</Text>
        <Text style={styles.subtitle}>{card.businessName}</Text>
        <Text style={styles.location}>📍 {card.locationSummary}</Text>

        {card.priceFrom > 0 && (
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>From €{card.priceFrom.toFixed(2)}/person</Text>
          </View>
        )}

        {card.sampleDurations.length > 0 && (
          <View style={styles.durationsContainer}>
            {card.sampleDurations.map((duration, index) => (
              <View key={index} style={styles.durationChip}>
                <Text style={styles.durationText}>{duration} min</Text>
              </View>
            ))}
            {card.activityCount > card.sampleDurations.length && (
              <Text style={styles.moreText}>+{card.activityCount - card.sampleDurations.length} more</Text>
            )}
          </View>
        )}

        {card.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {card.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 580,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  image: {
    width: "100%",
    height: 280,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.muted,
    marginBottom: 12,
  },
  location: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 16,
  },
  pricePill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.bg,
  },
  durationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  durationChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  durationText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
  },
  moreText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.muted,
    alignSelf: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(100,100,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.accent,
  },
});
