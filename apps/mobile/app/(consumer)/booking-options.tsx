import { TopBar } from "@/src/components/TopBar";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchActivityGroup, fetchConsumerActivity } from "@/src/store/slices/consumer-activity-slice";
import { theme } from "@/src/theme/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function BookingOptionsScreen() {
    const router = useRouter();
    const { activityId, catalogGroupId } = useLocalSearchParams<{
        activityId?: string;
        catalogGroupId?: string;
    }>();
    const dispatch = useAppDispatch();
    const { currentActivity, currentGroup, loading } = useAppSelector((state) => state.consumerActivity);

    const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
    const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);
    const [participantsCount, setParticipantsCount] = useState(2);

    useEffect(() => {
        if (catalogGroupId) {
            dispatch(fetchActivityGroup(catalogGroupId));
        } else if (activityId) {
            dispatch(fetchConsumerActivity(activityId));
        }
    }, [activityId, catalogGroupId]);

    const displayData =
        currentGroup || (currentActivity ? { activities: [currentActivity] } : null);

    const selectedActivity = displayData?.activities[selectedActivityIndex];
    const packages = selectedActivity?.config?.packages || [];
    const hasPackages = Array.isArray(packages) && packages.length > 0;
    const selectedPackage = hasPackages ? packages[selectedPackageIndex] : null;

    // Get min/max participant constraints from selected package
    const minParticipants = selectedPackage?.min_participants || 1;
    const maxParticipants = selectedPackage?.max_participants || 20;

    // Get pricing type (default to per_person for backward compatibility)
    const pricingType = selectedPackage?.pricing_type || 'per_person';

    useEffect(() => {
        if (hasPackages) {
            const defaultIndex = packages.findIndex((pkg: any) => pkg.is_default);
            setSelectedPackageIndex(defaultIndex >= 0 ? defaultIndex : 0);
        }
    }, [selectedActivityIndex, hasPackages, packages]);

    // Update participants to meet new package constraints when package changes
    useEffect(() => {
        if (selectedPackage) {
            const min = selectedPackage.min_participants || 1;
            const max = selectedPackage.max_participants || 20;
            
            if (participantsCount < min) {
                setParticipantsCount(min);
            } else if (participantsCount > max) {
                setParticipantsCount(max);
            }
        }
    }, [selectedPackageIndex, selectedPackage]);

    const handleContinue = () => {
        if (!selectedActivity) {
            Toast.show({
                type: "error",
                text1: "Activity not found",
                position: "bottom",
            });
            return;
        }

        // Validate participant count against package constraints
        if (selectedPackage) {
            if (selectedPackage.min_participants && participantsCount < selectedPackage.min_participants) {
                Toast.show({
                    type: "error",
                    text1: "Not enough participants",
                    text2: `This package requires at least ${selectedPackage.min_participants} participants`,
                    position: "bottom",
                });
                return;
            }
            if (selectedPackage.max_participants && participantsCount > selectedPackage.max_participants) {
                Toast.show({
                    type: "error",
                    text1: "Too many participants",
                    text2: `This package allows maximum ${selectedPackage.max_participants} participants`,
                    position: "bottom",
                });
                return;
            }
        }

        let packageName = selectedActivity.title || "";
        let packageCode = "";

        if (hasPackages && packages[selectedPackageIndex]) {
            packageName = packages[selectedPackageIndex].title || packageName;
            packageCode = packages[selectedPackageIndex].code || "";
        }

        router.push({
            pathname: "/(consumer)/booking-select-datetime",
            params: {
                activityId: selectedActivity.id,
                participantsCount: participantsCount.toString(),
                packageName,
                packageCode,
            },
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <TopBar title="Booking Options" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    if (!displayData || !selectedActivity) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <TopBar title="Booking Options" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Activity not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <TopBar title="Booking Options" />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Duration Selector */}
                {displayData.activities.length > 1 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Duration</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {displayData.activities.map((activity: any, index: number) => (
                                <TouchableOpacity
                                    key={activity.id}
                                    style={[
                                        styles.durationChip,
                                        selectedActivityIndex === index && styles.durationChipSelected,
                                    ]}
                                    onPress={() => setSelectedActivityIndex(index)}
                                >
                                    <Text
                                        style={[
                                            styles.durationChipText,
                                            selectedActivityIndex === index && styles.durationChipTextSelected,
                                        ]}
                                    >
                                        {activity.duration} min
                                    </Text>
                                    <Text
                                        style={[
                                            styles.durationChipPrice,
                                            selectedActivityIndex === index && styles.durationChipPriceSelected,
                                        ]}
                                    >
                                        €{activity.priceFrom}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Package Selection */}
                {hasPackages && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Package</Text>
                        <View style={styles.packagesList}>
                            {packages.map((pkg: any, index: number) => {
                                const isSelected = selectedPackageIndex === index;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.packageCard,
                                            isSelected && styles.packageCardSelected,
                                        ]}
                                        onPress={() => setSelectedPackageIndex(index)}
                                    >
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
                                                {(pkg.pricing_type || "per_person") === "per_person"
                                                    ? " per person"
                                                    : " (group rate)"}
                                            </Text>
                                        )}
                                        {pkg.track_type && (
                                            <Text style={styles.packageDetail}>Track: {pkg.track_type}</Text>
                                        )}
                                        {pkg.player_count && (
                                            <Text style={styles.packageDetail}>Players: {pkg.player_count}</Text>
                                        )}
                                        {pkg.includes_wine && (
                                            <Text style={styles.packageDetail}>✓ Wine pairing included</Text>
                                        )}
                                        {pkg.includes_extras && (
                                            <Text style={styles.packageDetail}>✓ Extra decorations included</Text>
                                        )}
                                        {(pkg.min_participants || pkg.max_participants) && (
                                            <Text style={styles.packageDetail}>
                                                {pkg.min_participants === pkg.max_participants
                                                    ? `${pkg.min_participants} participants`
                                                    : `${pkg.min_participants || 1}-${pkg.max_participants || "Any"} participants`}
                                            </Text>
                                        )}
                                        {(pkg.age_min || pkg.age_max) && (
                                            <Text style={styles.packageDetail}>
                                                Age: {pkg.age_min || "Any"} - {pkg.age_max || "Any"}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Participants Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Participants</Text>
                    {selectedPackage && (minParticipants > 1 || maxParticipants < 20) && (
                        <Text style={styles.participantHint}>
                            {minParticipants === maxParticipants
                                ? `This package is for ${minParticipants} participants`
                                : `This package requires ${minParticipants}-${maxParticipants} participants`}
                        </Text>
                    )}
                    <View style={styles.participantsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.participantButton,
                                participantsCount <= minParticipants && styles.participantButtonDisabled,
                            ]}
                            onPress={() => setParticipantsCount(Math.max(minParticipants, participantsCount - 1))}
                            disabled={participantsCount <= minParticipants}
                        >
                            <Text
                                style={[
                                    styles.participantButtonText,
                                    participantsCount <= minParticipants && styles.participantButtonTextDisabled,
                                ]}
                            >
                                −
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.participantsCount}>{participantsCount}</Text>
                        <TouchableOpacity
                            style={[
                                styles.participantButton,
                                participantsCount >= maxParticipants && styles.participantButtonDisabled,
                            ]}
                            onPress={() => setParticipantsCount(Math.min(maxParticipants, participantsCount + 1))}
                            disabled={participantsCount >= maxParticipants}
                        >
                            <Text
                                style={[
                                    styles.participantButtonText,
                                    participantsCount >= maxParticipants && styles.participantButtonTextDisabled,
                                ]}
                            >
                                +
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Price Breakdown */}
                {selectedActivity.priceFrom && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Price Summary</Text>
                        <View style={styles.priceCard}>
                            {pricingType === 'fixed' ? (
                                <>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>Group rate:</Text>
                                        <Text style={styles.priceValue}>
                                            €
                                            {hasPackages && packages[selectedPackageIndex]?.base_price
                                                ? packages[selectedPackageIndex].base_price
                                                : selectedActivity.priceFrom}
                                        </Text>
                                    </View>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>Participants:</Text>
                                        <Text style={styles.priceValue}>
                                            {participantsCount} {participantsCount === 1 ? "person" : "people"}
                                        </Text>
                                    </View>
                                    <View style={[styles.priceRow, styles.totalRow]}>
                                        <Text style={styles.totalLabel}>Total:</Text>
                                        <Text style={styles.totalValue}>
                                            €
                                            {hasPackages && packages[selectedPackageIndex]?.base_price
                                                ? Number(packages[selectedPackageIndex].base_price).toFixed(2)
                                                : Number(selectedActivity.priceFrom).toFixed(2)}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>Per person:</Text>
                                        <Text style={styles.priceValue}>
                                            €
                                            {hasPackages && packages[selectedPackageIndex]?.base_price
                                                ? packages[selectedPackageIndex].base_price
                                                : selectedActivity.priceFrom}
                                        </Text>
                                    </View>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>Participants:</Text>
                                        <Text style={styles.priceValue}>× {participantsCount}</Text>
                                    </View>
                                    <View style={[styles.priceRow, styles.totalRow]}>
                                        <Text style={styles.totalLabel}>Total:</Text>
                                        <Text style={styles.totalValue}>
                                            €
                                            {(
                                                (hasPackages && packages[selectedPackageIndex]?.base_price
                                                    ? Number(packages[selectedPackageIndex].base_price)
                                                    : Number(selectedActivity.priceFrom)) * participantsCount
                                            ).toFixed(2)}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                    <Text style={styles.continueButtonText}>Select Date & Time</Text>
                </TouchableOpacity>
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
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
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
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: theme.colors.muted,
        textAlign: "center",
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: 16,
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
        color: theme.colors.bg,
    },
    durationChipPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.muted,
    },
    durationChipPriceSelected: {
        color: theme.colors.bg,
    },
    packagesList: {
        gap: 12,
    },
    packageCard: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.divider,
    },
    packageCardSelected: {
        borderColor: theme.colors.accent,
        backgroundColor: theme.colors.card,
    },
    packageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    packageTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.colors.text,
        flex: 1,
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
    participantHint: {
        fontSize: 14,
        color: theme.colors.muted,
        marginBottom: 12,
        textAlign: "center",
    },
    participantsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surface,
        padding: 20,
        borderRadius: 12,
    },
    participantButton: {
        backgroundColor: theme.colors.accent,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    participantButtonDisabled: {
        backgroundColor: theme.colors.muted,
        opacity: 0.3,
    },
    participantButtonText: {
        fontSize: 24,
        fontWeight: "800",
        color: theme.colors.bg,
    },
    participantButtonTextDisabled: {
        opacity: 0.5,
    },
    participantsCount: {
        fontSize: 32,
        fontWeight: "800",
        color: theme.colors.text,
        marginHorizontal: 32,
        minWidth: 60,
        textAlign: "center",
    },
    priceCard: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 16,
        color: theme.colors.muted,
    },
    priceValue: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: "600",
    },
    totalRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    totalLabel: {
        fontSize: 18,
        color: theme.colors.text,
        fontWeight: "800",
    },
    totalValue: {
        fontSize: 24,
        color: theme.colors.accent,
        fontWeight: "800",
    },
    continueButton: {
        backgroundColor: theme.colors.accent,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 16,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: theme.colors.bg,
    },
});
