import { SwipeCard } from "@/src/components/SwipeCard";
import { useAuth } from "@/src/providers/auth-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  advanceCard,
  fetchGroupedCards,
  recordSwipe,
  resetFeed,
} from "@/src/store/slices/grouped-card-slice";
import { saveActivity } from "@/src/store/slices/saved-activity-slice";
import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { height } = Dimensions.get("window");

export default function DiscoverySwipeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { appUser } = useAuth();
  const { groups, currentIndex, loading, error, hasMore, nextCursor } =
    useAppSelector((state) => state.groupedCards);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    loadCards();
  }, []);

  const getInitials = () => {
    if (!appUser) return "U";
    const first = appUser.firstName?.charAt(0) || "";
    const last = appUser.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

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
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitials}>{getInitials()}</Text>
          </View>
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
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable style={styles.headerIconBtn}>
            <MaterialIcons
              name="more-horiz"
              size={22}
              color={theme.colors.text}
            />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, appUser]);

  const loadCards = async () => {
    dispatch(resetFeed());
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

  const handleSwipeLeft = (cardIndex: number) => {
    const card = groups[cardIndex];
    if (card) {
      dispatch(
        recordSwipe({
          direction: "left",
          catalogGroupId: card.catalogGroupId,
          activityId: card.representativeActivityId,
          city: card.city,
          typeId: card.typeId,
        }),
      );
    }
    dispatch(advanceCard());
    checkLoadMore(cardIndex);
  };

  const handleSwipeRight = (cardIndex: number) => {
    const card = groups[cardIndex];
    if (card) {
      dispatch(
        recordSwipe({
          direction: "right",
          catalogGroupId: card.catalogGroupId,
          activityId: card.representativeActivityId,
          city: card.city,
          typeId: card.typeId,
        }),
      );
      // Navigate to detail screen
      router.push({
        pathname: "/(consumer)/booking-options",
        params: { catalogGroupId: card.catalogGroupId },
      });
    }
    dispatch(advanceCard());
    checkLoadMore(cardIndex);
  };

  const handleSwipeTop = (cardIndex: number) => {
    const card = groups[cardIndex];
    if (card) {
      dispatch(
        recordSwipe({
          direction: "up",
          catalogGroupId: card.catalogGroupId,
          activityId: card.representativeActivityId,
          city: card.city,
          typeId: card.typeId,
        }),
      );
      // Navigate to detail screen
      router.push({
        pathname: "/(consumer)/activity-detail",
        params: { catalogGroupId: card.catalogGroupId },
      });
    }
    dispatch(advanceCard());
    checkLoadMore(cardIndex);
  };

  const handleSwipeBottom = async (cardIndex: number) => {
    const card = groups[cardIndex];
    if (card) {
      dispatch(
        recordSwipe({
          direction: "down",
          catalogGroupId: card.catalogGroupId,
          activityId: card.representativeActivityId,
          city: card.city,
          typeId: card.typeId,
        }),
      );
      // Save activity
      try {
        await dispatch(saveActivity(card.representativeActivityId)).unwrap();
        Toast.show({
          type: "success",
          text1: "Saved!",
          text2: "Activity added to your favorites",
          position: "bottom",
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Failed to save",
          text2: "Please try again",
          position: "bottom",
        });
      }
    }
    dispatch(advanceCard());
    checkLoadMore(cardIndex);
  };

  const checkLoadMore = (cardIndex: number) => {
    // Load more when we're 3 cards away from the end
    if (cardIndex >= groups.length - 3) {
      loadMore();
    }
  };

  if (loading && groups.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && groups.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load activities</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCards}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activities found</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new activities!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.swipeContainer}>
        <Swiper
          ref={swiperRef}
          cards={groups}
          renderCard={(card) => (card ? <SwipeCard card={card} /> : <View />)}
          onSwipedLeft={handleSwipeLeft}
          onSwipedRight={handleSwipeRight}
          onSwipedTop={handleSwipeTop}
          onSwipedBottom={handleSwipeBottom}
          cardIndex={currentIndex}
          backgroundColor="transparent"
          stackSize={3}
          stackSeparation={15}
          animateOverlayLabelsOpacity
          animateCardOpacity
          verticalSwipe
          horizontalSwipe
          disableBottomSwipe={false}
          disableTopSwipe={false}
          cardVerticalMargin={0}
          containerStyle={{ transform: [{ translateY: -40 }] }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  headerLeft: {
    marginLeft: 16,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  headerCenter: {
    alignItems: "center",
  },
  locationLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  headerRight: {
    marginRight: 16,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  swipeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.danger,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.bg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: theme.colors.muted,
    textAlign: "center",
  },
});
