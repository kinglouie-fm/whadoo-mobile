import { PrimaryButton } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
import { TopBar } from "@/src/components/TopBar";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  clearCurrentActivity,
  clearCurrentGroup,
  fetchActivityGroup,
  fetchConsumerActivity,
} from "@/src/store/slices/consumer-activity-slice";
import {
  saveActivity,
  unsaveActivity,
} from "@/src/store/slices/saved-activity-slice";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = 400;

export default function ActivityDetailScreen() {
  const router = useRouter();
  const { activityId, catalogGroupId } = useLocalSearchParams<{
    activityId?: string;
    catalogGroupId?: string;
  }>();
  const dispatch = useAppDispatch();
  const { currentActivity, currentGroup, loading } = useAppSelector(
    (state) => state.consumerActivity,
  );
  const savedItems = useAppSelector((state) => state.savedActivities.items);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const progressAnims = useRef<Animated.Value[]>([]).current;

  const displayData =
    currentGroup ||
    (currentActivity
      ? {
          catalogGroupTitle: currentActivity.title,
          businessName: null,
          businessCity: currentActivity.city,
          businessAddress: currentActivity.address,
          businessImages: [],
          activities: [currentActivity],
        }
      : null);

  const representativeActivity = displayData?.activities[0];
  const representativeActivityId = representativeActivity?.id || activityId;

  // Get all images
  const images =
    representativeActivity?.images && representativeActivity.images.length > 0
      ? representativeActivity.images.map((img: any) => img.imageUrl)
      : displayData?.businessImages && displayData.businessImages.length > 0
        ? displayData.businessImages
        : [];

  useEffect(() => {
    if (images.length > 0) {
      progressAnims.length = images.length;
      for (let i = 0; i < images.length; i++) {
        if (!progressAnims[i]) {
          progressAnims[i] = new Animated.Value(0);
        }
      }
    }
  }, [images.length]);

  useEffect(() => {
    if (images.length > 0 && progressAnims[currentImageIndex]) {
      progressAnims[currentImageIndex].setValue(0);
      Animated.timing(progressAnims[currentImageIndex], {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && currentImageIndex < images.length - 1) {
          setCurrentImageIndex(currentImageIndex + 1);
        }
      });
    }
  }, [currentImageIndex, images.length]);

  useEffect(() => {
    if (catalogGroupId) {
      dispatch(fetchActivityGroup(catalogGroupId));
    } else if (activityId) {
      dispatch(fetchConsumerActivity(activityId));
    }
    return () => {
      dispatch(clearCurrentActivity());
      dispatch(clearCurrentGroup());
    };
  }, [activityId, catalogGroupId]);

  useEffect(() => {
    if (representativeActivityId) {
      const saved = savedItems.some(
        (item) => item.activityId === representativeActivityId,
      );
      setIsSaved(saved);
    }
  }, [representativeActivityId, savedItems]);

  const handleToggleSave = async () => {
    if (!representativeActivityId) return;

    try {
      if (isSaved) {
        await dispatch(unsaveActivity(representativeActivityId)).unwrap();
        Toast.show({
          type: "success",
          text1: "Removed from saved",
          position: "bottom",
        });
      } else {
        await dispatch(saveActivity(representativeActivityId)).unwrap();
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
        text1: "Failed",
        text2: "Please try again",
        position: "bottom",
      });
    }
  };

  const handleImageTap = (side: "left" | "right") => {
    if (side === "left" && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (side === "right" && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={ui.container} edges={["top"]}>
        <TopBar
          title="Activity Details"
          rightIcon={isSaved ? "favorite" : "favorite-outline"}
          onRightPress={handleToggleSave}
        />
        <View style={ui.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!displayData || !representativeActivity) {
    return (
      <SafeAreaView style={ui.container} edges={["top"]}>
        <TopBar
          title="Activity Details"
          rightIcon={isSaved ? "favorite" : "favorite-outline"}
          onRightPress={handleToggleSave}
        />
        <View style={ui.errorContainer}>
          <EmptyState icon="error-outline" title="Activity not found" />
        </View>
      </SafeAreaView>
    );
  }

  const lowestPrice = displayData.activities.reduce((min, act) => {
    const price = Number(act.priceFrom || 0);
    return price > 0 && (min === 0 || price < min) ? price : min;
  }, 0);

  return (
    <SafeAreaView style={ui.container} edges={["top"]}>
      <TopBar
        title=""
        rightIcon={isSaved ? "favorite" : "favorite-outline"}
        onRightPress={handleToggleSave}
      />

      <ScrollView style={ui.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Carousel with Stories Progress */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: images[currentImageIndex] }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
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
              </View>

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
                                  ? progressAnims[index]?.interpolate({
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
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <EmptyState icon="image-not-supported" title="No photos" />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={[typography.h1, { marginBottom: theme.spacing.sm }]}>
              {displayData.catalogGroupTitle || representativeActivity.title}
            </Text>
            {displayData.businessName && (
              <Text style={[typography.h4, { marginBottom: theme.spacing.sm }]}>
                {displayData.businessName}
              </Text>
            )}
            {displayData.businessCity && (
              <Text style={typography.bodyMuted}>
                📍 {displayData.businessCity}
                {displayData.businessAddress &&
                  `, ${displayData.businessAddress}`}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, { marginBottom: theme.spacing.md }]}>
              Information
            </Text>
            {representativeActivity.description && (
              <Text style={typography.body}>
                {representativeActivity.description}
              </Text>
            )}
          </View>

          {lowestPrice > 0 && (
            <View style={styles.section}>
              <Text style={[typography.h4, { marginBottom: theme.spacing.md }]}>
                From
              </Text>
              <Text style={typography.price}>€{lowestPrice.toFixed(2)}</Text>
            </View>
          )}
          {/* 
          {images.length > 0 && (
            <View style={styles.section}>
              <Text style={[typography.h4, { marginBottom: theme.spacing.md }]}>
                Photos
              </Text>
              <View style={styles.photosGrid}>
                {images.map((uri: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoCard}
                    onPress={() => setCurrentImageIndex(index)}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.photoThumbnail}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )} */}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Book"
          onPress={() => {
            if (catalogGroupId) {
              router.push({
                pathname: "/(consumer)/booking-options",
                params: { catalogGroupId },
              });
            } else if (representativeActivityId) {
              router.push({
                pathname: "/(consumer)/booking-options",
                params: { activityId: representativeActivityId },
              });
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
  },
  imageWrapper: {
    position: "relative",
  },
  heroImage: {
    width: width,
    height: IMAGE_HEIGHT,
    backgroundColor: theme.colors.surface,
  },
  tapLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width / 3,
  },
  tapRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: width / 3,
  },
  placeholderImage: {
    width: width,
    height: IMAGE_HEIGHT,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    position: "absolute",
    top: theme.spacing.lg,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: "row",
    gap: theme.spacing.sm / 2,
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
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
});
