import { TopBar } from "@/src/components/TopBar";
import { apiGet } from "@/src/lib/api";
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
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

interface TimeSlot {
    slotId?: string;
    slotStart: string;
    time: string;
    available: boolean;
    remainingCapacity: number;
}

export default function BookingSelectDateTimeScreen() {
    const router = useRouter();
    const { activityId, participantsCount, packageName, packageCode } = useLocalSearchParams<{
        activityId: string;
        participantsCount: string;
        packageName?: string;
        packageCode?: string;
    }>();

    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    const fetchAvailability = async (date: string) => {
        if (!activityId || !participantsCount) return;

        setLoading(true);
        try {
            const response = await apiGet<{ slots: any[] }>(
                `/availability?activityId=${activityId}&date=${date}&partySize=${participantsCount}`
            );

            // Map backend response to TimeSlot format
            const participants = parseInt(participantsCount, 10);
            const mapped = response.slots.map((slot: any) => {
                // Extract time from slotStart (ISO timestamp)
                const slotDate = new Date(slot.slotStart);
                const hours = String(slotDate.getHours()).padStart(2, '0');
                const minutes = String(slotDate.getMinutes()).padStart(2, '0');
                const time = `${hours}:${minutes}`;

                return {
                    slotId: slot.slotId,
                    slotStart: slot.slotStart,
                    time,
                    available: slot.available,
                    remainingCapacity: slot.remainingCapacity,
                };
            });

            // Filter slots that are available
            const filtered = mapped.filter(
                (slot) => slot.available && slot.remainingCapacity >= participants
            );

            setAvailableSlots(filtered);
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Failed to load availability",
                position: "bottom",
            });
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDate) {
            fetchAvailability(selectedDate);
        }
    }, [selectedDate]);

    const handleDateSelect = (day: any) => {
        setSelectedDate(day.dateString);
        setSelectedTime(""); // Reset time selection
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const handleContinue = () => {
        if (!selectedDate || !selectedTime) {
            Toast.show({
                type: "error",
                text1: "Please select date and time",
                position: "bottom",
            });
            return;
        }

        // Find the selected slot to get the full slotStart timestamp
        const selectedSlot = availableSlots.find(slot => slot.time === selectedTime);
        if (!selectedSlot) {
            Toast.show({
                type: "error",
                text1: "Invalid slot selected",
                position: "bottom",
            });
            return;
        }

        // Navigate to overview screen
        router.push({
            pathname: "/(consumer)/booking-overview",
            params: {
                activityId,
                participantsCount,
                packageName: packageName || "",
                packageCode: packageCode || "",
                slotStart: selectedSlot.slotStart, // Pass the full ISO timestamp
                time: selectedTime, // Also pass formatted time for display
            },
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <TopBar title="Select Date & Time" />

            <ScrollView style={styles.scrollView}>
                {/* Participants Summary */}
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Participants:</Text>
                    <Text style={styles.summaryValue}>{participantsCount} people</Text>
                </View>

                {/* Calendar */}
                <View style={styles.calendarContainer}>
                    <Text style={styles.sectionTitle}>Select a Date</Text>
                    <Calendar
                        minDate={today}
                        markedDates={
                            selectedDate
                                ? {
                                    [selectedDate]: {
                                        selected: true,
                                        selectedColor: theme.colors.accent,
                                    },
                                }
                                : {}
                        }
                        onDayPress={handleDateSelect}
                        theme={{
                            todayTextColor: theme.colors.accent,
                            arrowColor: theme.colors.accent,
                            monthTextColor: theme.colors.text,
                            textMonthFontWeight: "700",
                            textDayFontSize: 16,
                            textMonthFontSize: 18,
                        }}
                    />
                </View>

                {/* Time Slots */}
                {selectedDate && (
                    <View style={styles.timeSlotsContainer}>
                        <Text style={styles.sectionTitle}>Available Times</Text>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={theme.colors.accent} />
                                <Text style={styles.loadingText}>Loading available times...</Text>
                            </View>
                        ) : availableSlots.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    No available times for this date. Try another day.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.timeGrid}>
                                {availableSlots.map((slot) => (
                                    <TouchableOpacity
                                        key={slot.time}
                                        style={[
                                            styles.timeSlot,
                                            selectedTime === slot.time && styles.timeSlotSelected,
                                        ]}
                                        onPress={() => handleTimeSelect(slot.time)}
                                    >
                                        <Text
                                            style={[
                                                styles.timeSlotText,
                                                selectedTime === slot.time && styles.timeSlotTextSelected,
                                            ]}
                                        >
                                            {slot.time}
                                        </Text>
                                        <Text style={styles.capacityText}>
                                            {slot.remainingCapacity} spots left
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Continue Button */}
                {selectedTime && (
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.continueButtonText}>Continue to Overview</Text>
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
    summaryBox: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    summaryLabel: {
        fontSize: 16,
        color: theme.colors.muted,
        fontWeight: "600",
    },
    summaryValue: {
        fontSize: 18,
        color: theme.colors.text,
        fontWeight: "800",
    },
    calendarContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: 16,
    },
    timeSlotsContainer: {
        padding: 20,
        paddingTop: 0,
    },
    loadingContainer: {
        padding: 20,
        alignItems: "center",
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: theme.colors.muted,
    },
    emptyContainer: {
        padding: 20,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.muted,
        textAlign: "center",
    },
    timeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    timeSlot: {
        backgroundColor: theme.colors.surface,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.divider,
        minWidth: "30%",
        alignItems: "center",
    },
    timeSlotSelected: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },
    timeSlotText: {
        fontSize: 16,
        fontWeight: "700",
        color: theme.colors.text,
    },
    timeSlotTextSelected: {
        color: theme.colors.bg,
    },
    capacityText: {
        fontSize: 12,
        color: theme.colors.muted,
        marginTop: 4,
    },
    continueButton: {
        backgroundColor: theme.colors.accent,
        paddingVertical: 16,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 32,
        borderRadius: 12,
        alignItems: "center",
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: theme.colors.bg,
    },
});
