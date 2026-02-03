import { TopBar } from "@/src/components/TopBar";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchActivity } from "@/src/store/slices/activity-slice";
import { theme } from "@/src/theme/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivityDetailScreen() {
    const router = useRouter();
    const { activityId } = useLocalSearchParams<{ activityId: string }>();
    const dispatch = useAppDispatch();
    const { currentActivity, loading } = useAppSelector((state) => state.activities);
    const [showPackages, setShowPackages] = useState(false);

    useEffect(() => {
        if (activityId) {
            // TODO: This should use consumer endpoint instead
            dispatch(fetchActivity(activityId));
        }
    }, [activityId]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <TopBar title="Activity Details" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    if (!currentActivity) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <TopBar title="Activity Details" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Activity not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const packages = currentActivity.config?.packages || [];
    const hasPackages = Array.isArray(packages) && packages.length > 0;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <TopBar title="Activity Details" />
            <ScrollView style={styles.scrollView}>
                {/* Images */}
                {currentActivity.images && currentActivity.images.length > 0 && (
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                        {currentActivity.images.map((img) => (
                            <Image
                                key={img.id}
                                source={{ uri: img.imageUrl }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                )}

                <View style={styles.content}>
                    {/* Title and Location */}
                    <Text style={styles.title}>{currentActivity.title}</Text>
                    {currentActivity.city && (
                        <Text style={styles.location}>📍 {currentActivity.city}{currentActivity.address ? `, ${currentActivity.address}` : ""}</Text>
                    )}

                    {/* Price */}
                    {currentActivity.priceFrom && (
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>From</Text>
                            <Text style={styles.priceValue}>€{Number(currentActivity.priceFrom).toFixed(2)}</Text>
                            <Text style={styles.priceLabel}>/ person</Text>
                        </View>
                    )}

                    {/* Description */}
                    {currentActivity.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About</Text>
                            <Text style={styles.description}>{currentActivity.description}</Text>
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
        width: 400,
        height: 300,
        backgroundColor: theme.colors.surface,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: 8,
    },
    location: {
        fontSize: 16,
        color: theme.colors.muted,
        marginBottom: 20,
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
