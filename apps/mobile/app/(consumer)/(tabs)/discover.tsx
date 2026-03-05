import { Avatar } from "@/src/components/Avatar";
import { EmptyState } from "@/src/components/EmptyState";
import { useAuth } from "@/src/providers/auth-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  fetchGroupedCards,
  GroupedCard,
} from "@/src/store/slices/grouped-card-slice";
import {
  saveActivity,
  unsaveActivity,
} from "@/src/store/slices/saved-activity-slice";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

function HorizontalCard({
  card,
  onPress,
  onSavePress,
  isSaved,
}: {
  card: GroupedCard;
  onPress: () => void;
  onSavePress: () => void;
  isSaved: boolean;
}) {
  const firstImage = card.images?.[0] || card.thumbnailUrl;

  return (
    <Pressable onPress={onPress} style={styles.horizontalCard}>
      <View style={styles.horizontalImageContainer}>
        {firstImage ? (
          <Image
            source={{ uri: firstImage }}
            style={styles.horizontalImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.horizontalImage, styles.placeholderImage]}>
            <Text style={styles.placeholderEmoji}>📸</Text>
          </View>
        )}

        <Pressable
          onPress={onSavePress}
          style={[
            styles.bookmarkBadge,
            isSaved ? styles.bookmarkBadgeSaved : styles.bookmarkBadgeUnsaved,
          ]}
          hitSlop={8}
        >
          <MaterialIcons
            name="bookmark"
            size={18}
            color={isSaved ? theme.colors.accent : "#FFFFFF"}
          />
        </Pressable>
      </View>

      <View style={styles.horizontalCardContent}>
        <Text style={styles.horizontalTitle} numberOfLines={1}>
          {card.typeLabel}
        </Text>
        <Text style={styles.listBusinessName} numberOfLines={1}>
          {card.businessName}
        </Text>
        <View style={styles.horizontalLocationRow}>
          <MaterialIcons name="place" size={14} color={theme.colors.muted} />
          <Text style={styles.horizontalLocationText} numberOfLines={1}>
            {card.city}
          </Text>
        </View>
        <Text style={styles.horizontalPrice}>
          {card.priceFrom > 0 ? `${card.priceFrom.toFixed(0)}€` : "Contact"}
        </Text>
      </View>
    </Pressable>
  );
}

function ListItem({
  card,
  onPress,
  onSavePress,
  isSaved,
}: {
  card: GroupedCard;
  onPress: () => void;
  onSavePress: () => void;
  isSaved: boolean;
}) {
  const firstImage = card.images?.[0] || card.thumbnailUrl;
  const description = card.tags.length > 0 ? card.tags.join(", ") : "";
  const truncatedDescription =
    description.length > 80 ? description.substring(0, 80) + "…" : description;

  return (
    <Pressable onPress={onPress} style={styles.listItem}>
      <View style={styles.listImageContainer}>
        {firstImage ? (
          <Image
            source={{ uri: firstImage }}
            style={styles.listImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.listImage, styles.placeholderImage]}>
            <Text style={styles.placeholderEmojiSmall}>📸</Text>
          </View>
        )}

        <Pressable
          onPress={onSavePress}
          style={[
            styles.bookmarkBadgeSmall,
            isSaved ? styles.bookmarkBadgeSaved : styles.bookmarkBadgeUnsaved,
          ]}
          hitSlop={8}
        >
          <MaterialIcons
            name="bookmark"
            size={16}
            color={isSaved ? theme.colors.accent : "#FFFFFF"}
          />
        </Pressable>
      </View>

      <View style={styles.listContent}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {card.typeLabel}
        </Text>
        <Text style={styles.listBusinessName} numberOfLines={1}>
          {card.businessName}
        </Text>
        <Text style={styles.listPrice}>
          From:{" "}
          {card.priceFrom > 0 ? `${card.priceFrom.toFixed(0)}€` : "Contact"}
        </Text>
        {truncatedDescription ? (
          <Text style={styles.listDescription} numberOfLines={2}>
            {truncatedDescription}
          </Text>
        ) : null}
      </View>

      <View style={styles.listChevronWrap}>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={theme.colors.muted}
        />
      </View>
    </Pressable>
  );
}

/**
 * Route screen for (consumer)/(tabs)/discover.
 */
export default function DiscoveryListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { appUser } = useAuth();
  const { groups, loading, error, hasMore, nextCursor } = useAppSelector(
    (state) => state.groupedCards,
  );
  const savedActivities = useAppSelector(
    (state) => state.savedActivities.items,
  );

  useEffect(() => {
    if (groups.length === 0) {
      loadCards();
    }
  }, []);

  const avatarName = appUser
    ? [appUser.firstName, appUser.lastName].filter(Boolean).join(" ") || "User"
    : "User";

  const getLocation = () => {
    return appUser?.city || "Select location";
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: {
        backgroundColor: theme.colors.bg,
        height: 120,
      },
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <Avatar
            name={avatarName}
            photoAsset={(appUser as any)?.photoAsset}
            size={40}
          />
        </View>
      ),
      headerTitle: () => (
        <View style={styles.headerCenter}>
          <Text style={styles.locationLabel}>Your Location</Text>
          <View style={styles.locationRow}>
            <MaterialIcons
              name="location-on"
              size={16}
              color={theme.colors.text}
            />
            <Text style={styles.locationText}>{getLocation()}</Text>
          </View>
        </View>
      ),
      // headerRight: () => (
      //   <View style={styles.headerRight}>
      //     <IconButton icon="more-horiz" size={22} onPress={() => {}} />
      //   </View>
      // ),
    });
  }, [navigation, appUser]);

  const loadCards = async () => {
    try {
      await dispatch(fetchGroupedCards({})).unwrap();
    } catch (err) {
      console.error("Failed to load grouped cards:", err);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading || !nextCursor) return;
    try {
      await dispatch(
        fetchGroupedCards({
          cursor: nextCursor,
        }),
      ).unwrap();
    } catch (err) {
      console.error("Failed to load more cards:", err);
    }
  };

  const isSaved = (activityId: string) => {
    return savedActivities.some((item) => item.activityId === activityId);
  };

  const handleSaveToggle = async (card: GroupedCard) => {
    const saved = isSaved(card.representativeActivityId);
    try {
      if (saved) {
        await dispatch(unsaveActivity(card.representativeActivityId)).unwrap();
        Toast.show({
          type: "success",
          text1: "Removed from saved",
          position: "bottom",
        });
      } else {
        await dispatch(saveActivity(card.representativeActivityId)).unwrap();
        Toast.show({
          type: "success",
          text1: "Saved!",
          text2: "Activity added to your favorites",
          position: "bottom",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: saved ? "Failed to remove" : "Failed to save",
        text2: "Please try again",
        position: "bottom",
      });
    }
  };

  const handleCardPress = (card: GroupedCard) => {
    router.push({
      pathname: "/(consumer)/activity-detail",
      params: { 
        catalogGroupId: card.catalogGroupId,
        businessId: card.businessId,
      },
    });
  };

  const horizontalData = useMemo(() => groups.slice(0, 10), [groups]);
  const listData = useMemo(() => groups, [groups]);

  if (loading && groups.length === 0) {
    return (
      <SafeAreaView style={ui.container} edges={["top", "bottom"]}>
        <EmptyState
          icon="sync"
          title="Loading activities..."
          action={
            <ActivityIndicator size="large" color={theme.colors.accent} />
          }
        />
      </SafeAreaView>
    );
  }

  if (error && groups.length === 0) {
    return (
      <SafeAreaView style={ui.container} edges={["top", "bottom"]}>
        <EmptyState
          icon="error-outline"
          title="Failed to load activities"
          subtitle={error}
        />
      </SafeAreaView>
    );
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView style={ui.container} edges={["top", "bottom"]}>
        <EmptyState
          icon="explore-off"
          title="No activities found"
          subtitle="Check back later for new activities!"
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={ui.container}>
      <FlatList
        data={listData}
        keyExtractor={(item) => `${item.businessId}:${item.catalogGroupId}`}
        renderItem={({ item }) => (
          <ListItem
            card={item}
            onPress={() => handleCardPress(item)}
            onSavePress={() => handleSaveToggle(item)}
            isSaved={isSaved(item.representativeActivityId)}
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Activities</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
                style={styles.horizontalScroll}
              >
                {horizontalData.map((card) => (
                  <HorizontalCard
                    key={`${card.businessId}:${card.catalogGroupId}`}
                    card={card}
                    onPress={() => handleCardPress(card)}
                    onSavePress={() => handleSaveToggle(card)}
                    isSaved={isSaved(card.representativeActivityId)}
                  />
                ))}
              </ScrollView>
              <Text style={styles.sectionTitle}>Activities</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listFlatListContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={loadCards}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    marginLeft: theme.spacing.lg,
  },
  headerCenter: {
    alignItems: "center",
  },
  locationLabel: {
    ...typography.captionSmall,
    marginBottom: theme.spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  locationText: {
    ...typography.body,
    color: theme.colors.text,
  },
  headerRight: {
    marginRight: theme.spacing.lg,
  },
  listHeader: {
    paddingTop: 16,
  },
  sectionTitle: {
    ...typography.h3,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  horizontalScroll: {
    marginBottom: 24,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalCard: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: "hidden",
    marginRight: 12,
  },
  horizontalImageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  horizontalImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderEmojiSmall: {
    fontSize: 32,
  },
  bookmarkBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkBadgeSmall: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkBadgeSaved: {
    backgroundColor: "rgba(22,22,22,0.14)",
  },
  bookmarkBadgeUnsaved: {
    backgroundColor: "rgba(255,255,255,0.49)",
  },
  horizontalCardContent: {
    padding: 12,
  },
  horizontalTitle: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  horizontalLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  horizontalLocationText: {
    ...typography.captionSmall,
    color: theme.colors.muted,
    flex: 1,
  },
  horizontalPrice: {
    ...typography.caption,
    fontWeight: "700",
    color: theme.colors.text,
  },
  listFlatListContent: {
    paddingBottom: 100,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    gap: 12,
  },
  listImageContainer: {
    position: "relative",
  },
  listImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  listContent: {
    flex: 1,
    justifyContent: "center",
  },
  listTitle: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  listBusinessName: {
    ...typography.caption,
    color: theme.colors.muted,
    marginBottom: 4,
  },
  listPrice: {
    ...typography.caption,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 6,
  },
  listDescription: {
    ...typography.captionSmall,
    color: theme.colors.muted,
    lineHeight: 16,
  },
  listChevronWrap: {
    width: 28,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
