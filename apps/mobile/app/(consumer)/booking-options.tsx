import { TopBar } from "@/src/components/TopBar";
import { Card, PriceSummaryCard } from "@/src/components/Card";
import { PrimaryButton } from "@/src/components/Button";
import { SelectableChip } from "@/src/components/SelectableChip";
import { ScreenContainer } from "@/src/components/ScreenContainer";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchActivityGroup, fetchConsumerActivity } from "@/src/store/slices/consumer-activity-slice";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import { typography } from "@/src/theme/typography";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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

    return (
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="Booking Options" />
            <ScreenContainer loading={loading} error={!displayData || !selectedActivity ? "Activity not found" : undefined}>
                {!loading && displayData && selectedActivity && (

            <ScrollView style={ui.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Duration Selector */}
                {displayData.activities.length > 1 && (
                    <View style={ui.section}>
                        <Text style={typography.h3}>Select Duration</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                            {displayData.activities.map((activity: any, index: number) => (
                                <View key={activity.id} style={styles.chipWrapper}>
                                    <SelectableChip
                                        label={`${activity.duration} min`}
                                        selected={selectedActivityIndex === index}
                                        onPress={() => setSelectedActivityIndex(index)}
                                    />
                                    <Text style={[typography.captionMuted, styles.chipPrice]}>
                                        €{activity.priceFrom}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Package Selection */}
                {hasPackages && (
                    <View style={ui.section}>
                        <Text style={typography.h3}>Select Package</Text>
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
                                        <View style={ui.rowBetween}>
                                            <Text style={typography.h4}>{pkg.title || "Package"}</Text>
                                            {pkg.is_default && (
                                                <View style={styles.defaultBadge}>
                                                    <Text style={styles.defaultBadgeText}>Default</Text>
                                                </View>
                                            )}
                                        </View>
                                        {pkg.description && (
                                            <Text style={[typography.captionMuted, styles.packageDescription]}>{pkg.description}</Text>
                                        )}
                                        {pkg.base_price && (
                                            <Text style={[typography.body, styles.packagePrice]}>
                                                €{pkg.base_price} {pkg.currency || "EUR"}
                                                {(pkg.pricing_type || "per_person") === "per_person"
                                                    ? " per person"
                                                    : " (group rate)"}
                                            </Text>
                                        )}
                                        {pkg.track_type && (
                                            <Text style={typography.caption}>Track: {pkg.track_type}</Text>
                                        )}
                                        {pkg.player_count && (
                                            <Text style={typography.caption}>Players: {pkg.player_count}</Text>
                                        )}
                                        {pkg.includes_wine && (
                                            <Text style={typography.caption}>✓ Wine pairing included</Text>
                                        )}
                                        {pkg.includes_extras && (
                                            <Text style={typography.caption}>✓ Extra decorations included</Text>
                                        )}
                                        {(pkg.min_participants || pkg.max_participants) && (
                                            <Text style={typography.caption}>
                                                {pkg.min_participants === pkg.max_participants
                                                    ? `${pkg.min_participants} participants`
                                                    : `${pkg.min_participants || 1}-${pkg.max_participants || "Any"} participants`}
                                            </Text>
                                        )}
                                        {(pkg.age_min || pkg.age_max) && (
                                            <Text style={typography.caption}>
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
                <View style={ui.section}>
                    <Text style={typography.h3}>Participants</Text>
                    {selectedPackage && (minParticipants > 1 || maxParticipants < 20) && (
                        <Text style={[typography.captionMuted, styles.participantHint]}>
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
                    <View style={ui.section}>
                        <Text style={typography.h3}>Price Summary</Text>
                        {pricingType === 'fixed' ? (
                            <PriceSummaryCard
                                items={[
                                    {
                                        label: "Group rate:",
                                        value: `€${hasPackages && packages[selectedPackageIndex]?.base_price
                                            ? packages[selectedPackageIndex].base_price
                                            : selectedActivity.priceFrom}`,
                                    },
                                    {
                                        label: "Participants:",
                                        value: `${participantsCount} ${participantsCount === 1 ? "person" : "people"}`,
                                    },
                                ]}
                                total={hasPackages && packages[selectedPackageIndex]?.base_price
                                    ? Number(packages[selectedPackageIndex].base_price).toFixed(2)
                                    : Number(selectedActivity.priceFrom).toFixed(2)}
                                currency="EUR"
                                style={styles.priceCardMargin}
                            />
                        ) : (
                            <PriceSummaryCard
                                items={[
                                    {
                                        label: "Per person:",
                                        value: `€${hasPackages && packages[selectedPackageIndex]?.base_price
                                            ? packages[selectedPackageIndex].base_price
                                            : selectedActivity.priceFrom}`,
                                    },
                                    {
                                        label: "Participants:",
                                        value: `× ${participantsCount}`,
                                    },
                                ]}
                                total={(
                                    (hasPackages && packages[selectedPackageIndex]?.base_price
                                        ? Number(packages[selectedPackageIndex].base_price)
                                        : Number(selectedActivity.priceFrom)) * participantsCount
                                ).toFixed(2)}
                                currency="EUR"
                                style={styles.priceCardMargin}
                            />
                        )}
                    </View>
                )}

                    <View style={styles.buttonContainer}>
                        <PrimaryButton title="Select Date & Time" onPress={handleContinue} />
                    </View>
                </ScrollView>
                )}
            </ScreenContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 40,
    },
    chipsScroll: {
        marginTop: theme.spacing.md,
    },
    chipWrapper: {
        marginRight: theme.spacing.md,
    },
    chipPrice: {
        marginTop: 4,
        textAlign: "center",
    },
    packagesList: {
        gap: theme.spacing.md,
        marginTop: theme.spacing.md,
    },
    packageCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 2,
        borderColor: theme.colors.divider,
    },
    packageCardSelected: {
        borderColor: theme.colors.accent,
        backgroundColor: theme.colors.card,
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
        marginBottom: theme.spacing.sm,
    },
    packagePrice: {
        color: theme.colors.accent,
        marginBottom: 4,
        fontWeight: "700",
    },
    participantHint: {
        marginBottom: theme.spacing.md,
        textAlign: "center",
    },
    participantsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.md,
        marginTop: theme.spacing.md,
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
    priceCardMargin: {
        marginTop: theme.spacing.md,
    },
    buttonContainer: {
        marginTop: theme.spacing.md,
    },
});
