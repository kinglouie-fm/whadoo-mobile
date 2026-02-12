import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GroupedCard } from "../store/slices/grouped-card-slice";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;

interface SwipeCardProps {
  card: GroupedCard;
}

export function SwipeCard({ card }: SwipeCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Use images array if available, otherwise fallback to thumbnailUrl
  const images =
    card.images && card.images.length > 0
      ? card.images
      : card.thumbnailUrl
        ? [card.thumbnailUrl]
        : [];

  useEffect(() => {
    if (images.length > 0) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && currentImageIndex < images.length - 1) {
          setCurrentImageIndex(currentImageIndex + 1);
        }
      });
    }
  }, [currentImageIndex, images.length]);

  const handleImageTap = (side: "left" | "right") => {
    if (side === "left" && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (side === "right" && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const truncateToLines = (text: string, maxLines: number = 2) => {
    // Rough estimate: ~40 chars per line for mobile
    const maxChars = maxLines * 40;
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars).trim() + "...";
  };

  const description = card.tags.length > 0 ? card.tags.join(", ") : "";

  return (
    <View style={styles.card}>
      {/* Image Section with Stories Progress */}
      <View style={styles.imageContainer}>
        {images.length > 0 ? (
          <>
            <Image
              source={{ uri: images[currentImageIndex] }}
              style={styles.image}
              resizeMode="cover"
            />

            {/* Tap Areas */}
            <TouchableOpacity
              style={styles.tapLeft}
              onPress={() => handleImageTap("left")}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.tapRight}
              onPress={() => handleImageTap("right")}
              activeOpacity={1}
            />

            {/* Stories Progress Bar */}
            {images.length > 1 && (
              <View style={styles.progressContainer}>
                {images.map((_, index) => (
                  <View key={index} style={styles.progressBarBg}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width:
                            index < currentImageIndex
                              ? "100%"
                              : index === currentImageIndex
                                ? progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ["0%", "100%"],
                                  })
                                : "0%",
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* "All In" Badge */}
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <MaterialIcons name="tag" style={styles.badgeIcon} size={16} />
                <Text style={styles.badgeText}>All In</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📸</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.title}>
          {card.typeLabel}, {card.city}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.fromLabel}>From:</Text>
          <Text style={styles.priceText}>
            {card.priceFrom > 0 ? `${card.priceFrom.toFixed(0)}€` : "Contact"}
          </Text>
        </View>

        {description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {truncateToLines(description, 2)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 600,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 380,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.surface,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 64,
  },
  tapLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "33%",
  },
  tapRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "33%",
  },
  progressContainer: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  badgeContainer: {
    position: "absolute",
    top: 24,
    left: 16,
    zIndex: 5,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.bg,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
    gap: 8,
  },
  fromLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  priceText: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  descriptionSection: {
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
  },
});
