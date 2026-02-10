import { PrimaryButton } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
import { SelectableChip } from "@/src/components/SelectableChip";
import { TopBar } from "@/src/components/TopBar";
import { apiGet } from "@/src/lib/api";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
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
  const { activityId, participantsCount, packageName, packageCode } =
    useLocalSearchParams<{
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
        `/availability?activityId=${activityId}&date=${date}&partySize=${participantsCount}`,
      );

      // Map backend response to TimeSlot format
      const participants = parseInt(participantsCount, 10);
      const mapped = response.slots.map((slot: any) => {
        // Extract time from slotStart (ISO timestamp)
        const slotDate = new Date(slot.slotStart);
        const hours = String(slotDate.getHours()).padStart(2, "0");
        const minutes = String(slotDate.getMinutes()).padStart(2, "0");
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
        (slot) => slot.available && slot.remainingCapacity >= participants,
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
    const selectedSlot = availableSlots.find(
      (slot) => slot.time === selectedTime,
    );
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
    <SafeAreaView style={ui.container} edges={["top"]}>
      <TopBar title="Select Date & Time" />

      <ScrollView style={ui.scrollView}>
        {/* Participants Summary */}
        <View style={styles.summaryBox}>
          <Text style={typography.bodyMuted}>Participants:</Text>
          <Text style={typography.h4}>{participantsCount} people</Text>
        </View>

        {/* Calendar */}
        <View style={[ui.section, styles.sectionContent]}>
          <Text style={[typography.h3, styles.sectionTitle]}>Select a Date</Text>
          <Calendar
            minDate={today}
            onDayPress={handleDateSelect}
            markedDates={
              selectedDate
                ? {
                    [selectedDate]: {
                      selected: true,
                      selectedColor: theme.colors.accent,
                      selectedTextColor: theme.colors.bg,
                    },
                  }
                : {}
            }
            theme={{
              calendarBackground: theme.colors.bg,
              backgroundColor: theme.colors.bg,

              monthTextColor: theme.colors.text,
              dayTextColor: theme.colors.text,
              textDisabledColor: "rgba(255,255,255,0.25)",
              textSectionTitleColor: "rgba(255,255,255,0.55)",

              arrowColor: theme.colors.accent,
              todayTextColor: theme.colors.accent,
            }}
          />
        </View>

        {/* Time Slots */}
        {selectedDate && (
          <View style={[ui.section, styles.sectionContent]}>
            <Text style={[typography.h3, styles.sectionTitle]}>
              Available Times
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text
                  style={[typography.bodyMuted, { marginTop: theme.spacing.sm }]}
                >
                  Loading available times...
                </Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <EmptyState
                icon="schedule"
                title="No available times"
                subtitle="No available times for this date. Try another day."
              />
            ) : (
              <View style={styles.timeGrid}>
                {availableSlots.map((slot) => (
                  <View key={slot.time} style={styles.timeSlotWrapper}>
                    <SelectableChip
                      label={slot.time}
                      selected={selectedTime === slot.time}
                      onPress={() => handleTimeSelect(slot.time)}
                    />
                    <Text
                      style={[
                        typography.captionMuted,
                        { marginTop: theme.spacing.sm },
                      ]}
                    >
                      {slot.remainingCapacity} spots left
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Continue Button */}
        {selectedTime && (
          <View style={styles.continueButtonWrapper}>
            <PrimaryButton
              title="Continue to Overview"
              onPress={handleContinue}
              style={styles.continueButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summaryBox: {
    ...ui.card,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  timeSlotWrapper: {
    minWidth: "30%",
    alignItems: "center",
  },
  continueButtonWrapper: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  continueButton: {
    width: "100%",
  },
});
