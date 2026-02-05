import { TopBar } from "@/src/components/TopBar";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { createBooking } from "@/src/store/slices/bookings-slice";
import { theme } from "@/src/theme/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function BookingOverviewScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { activityId, participantsCount, packageName, packageCode, slotStart, time } = useLocalSearchParams<{
        activityId: string;
        participantsCount: string;
        packageName?: string;
        packageCode?: string;
        slotStart: string;
        time: string;
    }>();

    const [isBooking, setIsBooking] = useState(false);
    const { currentActivity, currentGroup } = useAppSelector((state) => state.consumerActivity);

    // Find the activity data
    const activity = currentGroup?.activities.find(a => a.id === activityId) || currentActivity;

    // Find selected package price
    const selectedPackage = packageCode && activity?.config?.packages
        ? activity.config.packages.find((pkg: any) => pkg.code === packageCode)
        : null;
    const pricePerPerson = selectedPackage?.base_price || activity?.priceFrom || 0;

    const handleBook = async () => {
        if (!activityId || !slotStart || !participantsCount) {
            Toast.show({
                type: "error",
                text1: "Missing booking information",
                position: "bottom",
            });
            return;
        }

        setIsBooking(true);

        try {

            // Create selection data with package details for backend price calculation
            const selectionData = {
                packageName: packageName || null,
                packageCode: packageCode || null,
                packageId: packageCode || null,
                activityTitle: activity?.title || "",
            };

            await dispatch(
                createBooking({
                    activityId,
                    slotStart,
                    participantsCount: parseInt(participantsCount, 10),
                    selectionData,
                })
            ).unwrap();

            Toast.show({
                type: "success",
                text1: "Booking Confirmed!",
                text2: "See your booking in My Bookings",
                position: "bottom",
            });

            // Navigate to my bookings
            router.replace("/(consumer)/(tabs)/bookings");
        } catch (error: any) {
            let errorMessage = "Failed to create booking";
            
            // Handle specific error codes
            if (error.message?.includes("SLOT_FULL")) {
                errorMessage = "This time slot just filled up. Please choose another time.";
            } else if (error.message?.includes("PROFILE_INCOMPLETE")) {
                errorMessage = "Please complete your profile before booking";
                // Navigate to profile
                router.push("/(consumer)/profile");
            }

            Toast.show({
                type: "error",
                text1: "Booking Failed",
                text2: errorMessage,
                position: "bottom",
                visibilityTime: 4000,
            });
        } finally {
            setIsBooking(false);
        }
    };

    if (!activity) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <TopBar title="Overview" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Activity information not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <TopBar title="Overview" />

            <ScrollView style={styles.scrollView}>
                {/* Activity & Package Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity & Package</Text>
                    <View style={styles.card}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        {packageName && (
                            <Text style={styles.packageName}>Package: {packageName}</Text>
                        )}
                        <Text style={styles.location}>
                            {activity.city}
                            {activity.address && ` • ${activity.address}`}
                        </Text>
                    </View>
                </View>

                {/* Booking Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Details</Text>
                    <View style={styles.card}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date:</Text>
                            <Text style={styles.detailValue}>
                                {new Date(slotStart).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time:</Text>
                            <Text style={styles.detailValue}>{time}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Participants:</Text>
                            <Text style={styles.detailValue}>{participantsCount} people</Text>
                        </View>
                    </View>
                </View>

                {/* Price Section */}
                {pricePerPerson > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Price</Text>
                        <View style={styles.card}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Base price per person:</Text>
                                <Text style={styles.priceValue}>€{Number(pricePerPerson).toFixed(2)}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Participants:</Text>
                                <Text style={styles.priceValue}>× {participantsCount}</Text>
                            </View>
                            <View style={[styles.priceRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total:</Text>
                                <Text style={styles.totalValue}>
                                    €{(Number(pricePerPerson) * Number(participantsCount)).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Policy Note */}
                <View style={styles.section}>
                    <View style={styles.policyCard}>
                        <Text style={styles.policyText}>
                            Please arrive 10 minutes early for your appointment. If you need to cancel or
                            reschedule, please do so at least 24 hours in advance.
                        </Text>
                    </View>
                </View>

                {/* Book Button */}
                <TouchableOpacity
                    style={[styles.bookButton, isBooking && styles.bookButtonDisabled]}
                    onPress={handleBook}
                    disabled={isBooking}
                >
                    {isBooking ? (
                        <ActivityIndicator size="small" color={theme.colors.bg} />
                    ) : (
                        <Text style={styles.bookButtonText}>Confirm Booking</Text>
                    )}
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
    section: {
        padding: 20,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: 12,
    },
    card: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    activityTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: 4,
    },
    packageName: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.accent,
        marginBottom: 8,
    },
    location: {
        fontSize: 14,
        color: theme.colors.muted,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 16,
        color: theme.colors.muted,
        fontWeight: "600",
    },
    detailValue: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: "700",
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
    policyCard: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    policyText: {
        fontSize: 14,
        color: theme.colors.muted,
        lineHeight: 20,
    },
    bookButton: {
        backgroundColor: theme.colors.accent,
        paddingVertical: 16,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 32,
        borderRadius: 12,
        alignItems: "center",
    },
    bookButtonDisabled: {
        opacity: 0.6,
    },
    bookButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: theme.colors.bg,
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
});
