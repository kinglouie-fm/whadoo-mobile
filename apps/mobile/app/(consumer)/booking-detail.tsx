import { TopBar } from "@/src/components/TopBar";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { cancelBooking, fetchBooking } from "@/src/store/slices/bookings-slice";
import { theme } from "@/src/theme/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function BookingDetailScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const { currentBooking, bookingLoading, bookingError } = useAppSelector((state) => state.bookings);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        if (bookingId) {
            dispatch(fetchBooking(bookingId));
        }
    }, [bookingId]);

    const handleCancelBooking = () => {
        if (!currentBooking) return;

        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                {
                    text: "No",
                    style: "cancel",
                },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setIsCancelling(true);
                        try {
                            await dispatch(
                                cancelBooking({ bookingId: currentBooking.id })
                            ).unwrap();

                            Toast.show({
                                type: "success",
                                text1: "Booking Cancelled",
                                position: "bottom",
                            });

                            router.back();
                        } catch (error) {
                            Toast.show({
                                type: "error",
                                text1: "Failed to cancel booking",
                                position: "bottom",
                            });
                        } finally {
                            setIsCancelling(false);
                        }
                    },
                },
            ]
        );
    };

    if (bookingLoading || !currentBooking) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <TopBar title="Booking Details" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    if (bookingError) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <TopBar title="Booking Details" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{bookingError}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const activity = currentBooking.activitySnapshot;
    const business = currentBooking.businessSnapshot;
    const selection = currentBooking.selectionSnapshot;
    const price = currentBooking.priceSnapshot;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <TopBar title="Booking Details" />

            <ScrollView style={styles.scrollView}>
                {/* Status Section */}
                <View style={styles.section}>
                    <View style={[styles.statusBanner, styles[`status_${currentBooking.status}`]]}>
                        <Text style={styles.statusBannerText}>
                            {currentBooking.status === "active" && "✓ Booking Confirmed"}
                            {currentBooking.status === "cancelled" && "✕ Booking Cancelled"}
                            {currentBooking.status === "completed" && "✓ Completed"}
                        </Text>
                    </View>
                </View>

                {/* Activity & Business Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity & Business</Text>
                    <View style={styles.card}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        {business && (
                            <Text style={styles.businessName}>{business.name}</Text>
                        )}
                        {activity.city && (
                            <Text style={styles.location}>
                                📍 {activity.city}
                                {activity.address && `, ${activity.address}`}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Booking Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Info</Text>
                    <View style={styles.card}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date & Time:</Text>
                            <Text style={styles.detailValue}>
                                {new Date(currentBooking.slotStart).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                                {"\n"}
                                {new Date(currentBooking.slotStart).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Status:</Text>
                            <Text style={[styles.detailValue, styles.statusValue]}>
                                {currentBooking.status.charAt(0).toUpperCase() + currentBooking.status.slice(1)}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Participants:</Text>
                            <Text style={styles.detailValue}>
                                {currentBooking.participantsCount} {currentBooking.participantsCount === 1 ? "person" : "people"}
                            </Text>
                        </View>
                        {selection?.packageName && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Package:</Text>
                                <Text style={styles.detailValue}>{selection.packageName}</Text>
                            </View>
                        )}
                        {selection?.durationMinutes && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Duration:</Text>
                                <Text style={styles.detailValue}>{selection.durationMinutes} minutes</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Price Section */}
                {price && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Price</Text>
                        <View style={styles.card}>
                            {price.breakdown && (
                                <>
                                    {price.breakdown.basePricePerPerson && (
                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceLabel}>Base price per person:</Text>
                                            <Text style={styles.priceValue}>
                                                {price.currency} {price.breakdown.basePricePerPerson}
                                            </Text>
                                        </View>
                                    )}
                                    {price.breakdown.participantsCount && (
                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceLabel}>Participants:</Text>
                                            <Text style={styles.priceValue}>× {price.breakdown.participantsCount}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                            <View style={[styles.priceRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total:</Text>
                                <Text style={styles.totalValue}>
                                    {price.currency} {price.total}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Contact Section */}
                {business && (business.contactPhone || business.contactEmail) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact</Text>
                        <View style={styles.card}>
                            {business.contactPhone && (
                                <Text style={styles.contactInfo}>📞 {business.contactPhone}</Text>
                            )}
                            {business.contactEmail && (
                                <Text style={styles.contactInfo}>✉️ {business.contactEmail}</Text>
                            )}
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

                {/* Cancel Button (only for active bookings) */}
                {currentBooking.status === "active" && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelBooking}
                        disabled={isCancelling}
                    >
                        {isCancelling ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                        )}
                    </TouchableOpacity>
                )}
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
        padding: 20,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: 12,
    },
    statusBanner: {
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    status_active: {
        backgroundColor: theme.colors.accent,
    },
    status_cancelled: {
        backgroundColor: "#EF4444",
    },
    status_completed: {
        backgroundColor: "#10B981",
    },
    statusBannerText: {
        fontSize: 18,
        fontWeight: "800",
        color: theme.colors.bg,
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
    businessName: {
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
        alignItems: "flex-start",
    },
    detailLabel: {
        fontSize: 16,
        color: theme.colors.muted,
        fontWeight: "600",
        flex: 1,
    },
    detailValue: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: "700",
        flex: 1,
        textAlign: "right",
    },
    statusValue: {
        color: theme.colors.accent,
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
    contactInfo: {
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: 8,
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
    cancelButton: {
        backgroundColor: "#EF4444",
        paddingVertical: 16,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 32,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#FFF",
    },
});
