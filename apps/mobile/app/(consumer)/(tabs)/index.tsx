import { Avatar } from "@/src/components/Avatar";
import { IconButton, PrimaryButton } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
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
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

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
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton
            icon="more-horiz"
            size={22}
            onPress={() => {}}
          />
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
          action={<PrimaryButton title="Retry" onPress={loadCards} />}
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
    <SafeAreaView style={ui.container} edges={["top", "bottom"]}>
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
          stackSeparation={theme.spacing.md}
          animateOverlayLabelsOpacity
          animateCardOpacity
          verticalSwipe
          horizontalSwipe
          disableBottomSwipe={false}
          disableTopSwipe={false}
          cardVerticalMargin={0}
          containerStyle={{ transform: [{ translateY: -theme.spacing.xxl }] }}
        />
      </View>
    </SafeAreaView>
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
  swipeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
