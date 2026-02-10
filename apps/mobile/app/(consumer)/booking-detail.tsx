import { TopBar } from "@/src/components/TopBar";
import { Card, DetailCard } from "@/src/components/Card";
import { DangerButton } from "@/src/components/Button";
import { StatusBadge } from "@/src/components/StatusBadge";
import { ScreenContainer } from "@/src/components/ScreenContainer";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { cancelBooking, fetchBooking } from "@/src/store/slices/bookings-slice";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import { typography } from "@/src/theme/typography";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
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

    const activity = currentBooking?.activitySnapshot;
    const business = currentBooking?.businessSnapshot;
    const selection = currentBooking?.selectionSnapshot;
    const price = currentBooking?.priceSnapshot;

    return (
        <SafeAreaView style={ui.container} edges={["top"]}>
            <TopBar title="Booking Details" />
            <ScreenContainer loading={bookingLoading || !currentBooking} error={bookingError ?? undefined}>
                {currentBooking && (
                <ScrollView style={ui.scrollView}>
                {/* Status Section */}
                <View style={styles.section}>
                    <View style={styles.statusContainer}>
                        <StatusBadge status={currentBooking.status} />
                    </View>
                </View>

                {/* Activity & Business Section */}
                <View style={styles.section}>
                    <Text style={typography.h3}>Activity & Business</Text>
                    <Card style={styles.sectionCard}>
                        <Text style={typography.h3}>{activity?.title || ""}</Text>
                        {business && (
                            <Text style={[typography.body, styles.businessName]}>{business.name}</Text>
                        )}
                        {activity?.city && (
                            <Text style={typography.captionMuted}>
                                📍 {activity.city}
                                {activity.address ? `, ${activity.address}` : ""}
                            </Text>
                        )}
                    </Card>
                </View>

                {/* Booking Info Section */}
                <View style={styles.section}>
                    <Text style={typography.h3}>Booking Info</Text>
                    <Card style={styles.sectionCard}>
                        <DetailCard
                            label="Date & Time:"
                            value={
                                `${new Date(currentBooking.slotStart).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}\n${new Date(currentBooking.slotStart).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}`
                            }
                        />
                        <DetailCard
                            label="Status:"
                            value={currentBooking.status.charAt(0).toUpperCase() + currentBooking.status.slice(1)}
                        />
                        <DetailCard
                            label="Participants:"
                            value={`${currentBooking.participantsCount} ${currentBooking.participantsCount === 1 ? "person" : "people"}`}
                        />
                        {selection?.packageName && (
                            <DetailCard label="Package:" value={selection.packageName} />
                        )}
                        {selection?.durationMinutes && (
                            <DetailCard label="Duration:" value={`${selection.durationMinutes} minutes`} style={{ marginBottom: 0 }} />
                        )}
                    </Card>
                </View>

                {/* Price Section */}
                {price && (
                    <View style={styles.section}>
                        <Text style={typography.h3}>Price</Text>
                        <Card style={styles.sectionCard}>
                            {price.breakdown && (
                                <>
                                    {price.breakdown.basePricePerPerson && (
                                        <DetailCard
                                            label="Base price per person:"
                                            value={`${price.currency} ${price.breakdown.basePricePerPerson}`}
                                        />
                                    )}
                                    {price.breakdown.participantsCount && (
                                        <DetailCard
                                            label="Participants:"
                                            value={`× ${price.breakdown.participantsCount}`}
                                        />
                                    )}
                                </>
                            )}
                            <View style={styles.totalRow}>
                                <Text style={typography.h4}>Total:</Text>
                                <Text style={typography.price}>
                                    {price.currency} {price.total}
                                </Text>
                            </View>
                        </Card>
                    </View>
                )}

                {/* Contact Section */}
                {business && (business.contactPhone || business.contactEmail) && (
                    <View style={styles.section}>
                        <Text style={typography.h3}>Contact</Text>
                        <Card style={styles.sectionCard}>
                            {business.contactPhone && (
                                <Text style={typography.body}>📞 {business.contactPhone}</Text>
                            )}
                            {business.contactEmail && (
                                <Text style={typography.body}>✉️ {business.contactEmail}</Text>
                            )}
                        </Card>
                    </View>
                )}

                {/* Policy Note */}
                <View style={styles.section}>
                    <Card style={styles.sectionCard}>
                        <Text style={typography.captionMuted}>
                            Please arrive 10 minutes early for your appointment. If you need to cancel or
                            reschedule, please do so at least 24 hours in advance.
                        </Text>
                    </Card>
                </View>

                {/* Cancel Button (only for active bookings) */}
                {currentBooking.status === "active" && (
                    <View style={styles.buttonContainer}>
                        <DangerButton
                            title="Cancel Booking"
                            onPress={handleCancelBooking}
                            disabled={isCancelling}
                        />
                    </View>
                )}
            </ScrollView>
                )}
            </ScreenContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    section: {
        padding: theme.spacing.lg,
        paddingBottom: 0,
    },
    statusContainer: {
        alignItems: "center",
    },
    sectionCard: {
        marginTop: theme.spacing.md,
    },
    businessName: {
        color: theme.colors.accent,
        marginVertical: theme.spacing.sm,
    },
    totalRow: {
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    buttonContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 16,
        paddingBottom: 32,
    },
});
