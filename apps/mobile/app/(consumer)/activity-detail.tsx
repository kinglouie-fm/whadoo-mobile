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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <TopBar
          title="Activity Details"
          rightIcon={isSaved ? "favorite" : "favorite-outline"}
          onRightPress={handleToggleSave}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!displayData || !representativeActivity) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <TopBar
          title="Activity Details"
          rightIcon={isSaved ? "favorite" : "favorite-outline"}
          onRightPress={handleToggleSave}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Activity not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const lowestPrice = displayData.activities.reduce((min, act) => {
    const price = Number(act.priceFrom || 0);
    return price > 0 && (min === 0 || price < min) ? price : min;
  }, 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TopBar
        title=""
        rightIcon={isSaved ? "favorite" : "favorite-outline"}
        onRightPress={handleToggleSave}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={styles.placeholderText}>📸</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {displayData.catalogGroupTitle || representativeActivity.title}
            </Text>
            {displayData.businessName && (
              <Text style={styles.subtitle}>{displayData.businessName}</Text>
            )}
            {displayData.businessCity && (
              <Text style={styles.location}>
                📍 {displayData.businessCity}
                {displayData.businessAddress &&
                  `, ${displayData.businessAddress}`}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            {representativeActivity.description && (
              <Text style={styles.description}>
                {representativeActivity.description}
              </Text>
            )}
          </View>

          {lowestPrice > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>From</Text>
              <Text style={styles.priceValue}>€{lowestPrice.toFixed(2)}</Text>
            </View>
          )}

          {images.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
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
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bookButton}
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
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: "center",
  },
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
  placeholderText: {
    fontSize: 64,
  },
  progressContainer: {
    position: "absolute",
    top: 16,
    left: 12,
    right: 12,
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
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 24,
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
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: theme.colors.muted,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoCard: {
    width: (width - 56) / 2,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  photoThumbnail: {
    width: "100%",
    height: "100%",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  bookButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.bg,
  },
});
