import { TopBar } from "@/src/components/TopBar";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { clearCurrentActivity, clearCurrentGroup, fetchActivityGroup, fetchConsumerActivity } from "@/src/store/slices/consumer-activity-slice";
import { saveActivity, unsaveActivity } from "@/src/store/slices/saved-activity-slice";
import { theme } from "@/src/theme/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

export default function ActivityDetailScreen() {
    const router = useRouter();
    const { activityId, catalogGroupId } = useLocalSearchParams<{ activityId?: string; catalogGroupId?: string }>();
    const dispatch = useAppDispatch();
    const { currentActivity, currentGroup, loading } = useAppSelector((state) => state.consumerActivity);
    const savedItems = useAppSelector((state) => state.savedActivities.items);
    const [showPackages, setShowPackages] = useState(false);
    const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
    const [isSaved, setIsSaved] = useState(false);

    // Get the representative activity ID to check if saved
    const representativeActivityId = currentGroup?.activities[selectedActivityIndex]?.id ||
        currentActivity?.id ||
        activityId;

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

    // Check if activity is saved
    useEffect(() => {
        if (representativeActivityId) {
            const saved = savedItems.some(item => item.activityId === representativeActivityId);
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

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <TopBar
                    title="Activity Details"
                    rightIcon={isSaved ? "heart" : "heart-outline"}
                    onRightPress={handleToggleSave}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    // Use group data if available, otherwise fall back to single activity
    const displayData = currentGroup || (currentActivity ? {
        catalogGroupTitle: currentActivity.title,
        businessName: null,
        businessCity: currentActivity.city,
        businessAddress: currentActivity.address,
        businessImages: [],
        activities: [currentActivity]
    } : null);

    if (!displayData) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <TopBar
                    title="Activity Details"
                    rightIcon={isSaved ? "heart" : "heart-outline"}
                    onRightPress={handleToggleSave}
                />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Activity not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const selectedActivity = displayData.activities[selectedActivityIndex];
    const packages = selectedActivity?.config?.packages || [];
    const hasPackages = Array.isArray(packages) && packages.length > 0;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <TopBar
                title="Activity Details"
                rightIcon={isSaved ? "heart" : "heart-outline"}
                onRightPress={handleToggleSave}
            />
            <ScrollView style={styles.scrollView}>
                {/* Images */}
                {selectedActivity.images && selectedActivity.images.length > 0 ? (
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                        {selectedActivity.images.map((img: any) => (
                            <Image
                                key={img.id}
                                source={{ uri: img.imageUrl }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                ) : displayData.businessImages && displayData.businessImages.length > 0 ? (
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                        {displayData.businessImages.map((url: string, idx: number) => (
                            <Image
                                key={idx}
                                source={{ uri: url }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>📸</Text>
                    </View>
                )}

                <View style={styles.content}>
                    {/* Title and Location */}
                    <Text style={styles.title}>{displayData.catalogGroupTitle || selectedActivity.title}</Text>
                    <Text style={styles.subtitle}>{displayData.businessName}</Text>
                    {displayData.businessCity && (
                        <Text style={styles.location}>📍 {displayData.businessCity}{displayData.businessAddress ? `, ${displayData.businessAddress}` : ""}</Text>
                    )}

                    {/* Duration Selector (if multiple activities in group) */}
                    {displayData.activities.length > 1 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Duration</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.durationSelector}>
                                {displayData.activities.map((activity: any, index: number) => (
                                    <TouchableOpacity
                                        key={activity.id}
                                        style={[
                                            styles.durationChip,
                                            selectedActivityIndex === index && styles.durationChipSelected
                                        ]}
                                        onPress={() => setSelectedActivityIndex(index)}
                                    >
                                        <Text style={[
                                            styles.durationChipText,
                                            selectedActivityIndex === index && styles.durationChipTextSelected
                                        ]}>
                                            {activity.duration} min
                                        </Text>
                                        <Text style={[
                                            styles.durationChipPrice,
                                            selectedActivityIndex === index && styles.durationChipPriceSelected
                                        ]}>
                                            €{activity.priceFrom}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Price */}
                    {selectedActivity.priceFrom && (
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>From</Text>
                            <Text style={styles.priceValue}>€{Number(selectedActivity.priceFrom).toFixed(2)}</Text>
                            <Text style={styles.priceLabel}>/ person</Text>
                        </View>
                    )}

                    {/* Description */}
                    {selectedActivity.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About</Text>
                            <Text style={styles.description}>{selectedActivity.description}</Text>
                        </View>
                    )}

                    {/* Packages / Variants */}
                    {hasPackages && (
                        <View style={styles.section}>
                            <TouchableOpacity
                                style={styles.packageHeader}
                                onPress={() => setShowPackages(!showPackages)}
                            >
                                <Text style={styles.sectionTitle}>Packages Available ({packages.length})</Text>
                                <Text style={styles.expandIcon}>{showPackages ? "▼" : "▶"}</Text>
                            </TouchableOpacity>

                            {showPackages && (
                                <View style={styles.packagesList}>
                                    {packages.map((pkg: any, index: number) => (
                                        <View key={index} style={styles.packageCard}>
                                            <View style={styles.packageHeader}>
                                                <Text style={styles.packageTitle}>{pkg.title || "Package"}</Text>
                                                {pkg.is_default && (
                                                    <View style={styles.defaultBadge}>
                                                        <Text style={styles.defaultBadgeText}>Default</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {pkg.description && (
                                                <Text style={styles.packageDescription}>{pkg.description}</Text>
                                            )}
                                            {pkg.base_price && (
                                                <Text style={styles.packagePrice}>
                                                    €{pkg.base_price} {pkg.currency || "EUR"}
                                                </Text>
                                            )}
                                            {pkg.track_type && (
                                                <Text style={styles.packageDetail}>Track: {pkg.track_type}</Text>
                                            )}
                                            {pkg.min_participants && (
                                                <Text style={styles.packageDetail}>Min: {pkg.min_participants} participants</Text>
                                            )}
                                            {(pkg.age_min || pkg.age_max) && (
                                                <Text style={styles.packageDetail}>
                                                    Age: {pkg.age_min || "Any"} - {pkg.age_max || "Any"}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Book Button */}
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => {
                            // TODO: Navigate to booking flow
                            alert("Booking flow coming soon!");
                        }}
                    >
                        <Text style={styles.bookButtonText}>Book Now</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    imageScroll: {
        height: 300,
    },
    image: {
        width: width,
        height: 300,
        backgroundColor: theme.colors.surface,
    },
    placeholderImage: {
        width: "100%",
        height: 300,
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: 64,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: 4,
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
        marginBottom: 20,
    },
    durationSelector: {
        marginTop: 8,
    },
    durationChip: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 2,
        borderColor: theme.colors.divider,
        minWidth: 100,
        alignItems: "center",
    },
    durationChipSelected: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },
    durationChipText: {
        fontSize: 16,
        fontWeight: "700",
        color: theme.colors.text,
        marginBottom: 4,
    },
    durationChipTextSelected: {
        color: "#fff",
    },
    durationChipPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.muted,
    },
    durationChipPriceSelected: {
        color: "#fff",
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        marginBottom: 24,
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
    },
    priceLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.muted,
        marginRight: 6,
    },
    priceValue: {
        fontSize: 32,
        fontWeight: "800",
        color: theme.colors.accent,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.text,
    },
    packageHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    expandIcon: {
        fontSize: 18,
        color: theme.colors.muted,
    },
    packagesList: {
        marginTop: 12,
        gap: 12,
    },
    packageCard: {
        backgroundColor: theme.colors.card,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    packageTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.colors.text,
        marginBottom: 8,
    },
    defaultBadge: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    defaultBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.colors.bg,
    },
    packageDescription: {
        fontSize: 14,
        color: theme.colors.muted,
        marginBottom: 8,
    },
    packagePrice: {
        fontSize: 16,
        fontWeight: "700",
        color: theme.colors.accent,
        marginBottom: 4,
    },
    packageDetail: {
        fontSize: 14,
        color: theme.colors.text,
        marginTop: 4,
    },
    bookButton: {
        backgroundColor: theme.colors.accent,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 12,
    },
    bookButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: theme.colors.bg,
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
        fontSize: 18,
        fontWeight: "600",
        color: theme.colors.danger,
    },
});
