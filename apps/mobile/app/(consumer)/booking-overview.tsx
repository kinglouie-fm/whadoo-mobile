import { TopBar } from "@/src/components/TopBar";
import { Card, DetailCard, PriceSummaryCard } from "@/src/components/Card";
import { PrimaryButton } from "@/src/components/Button";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { createBooking } from "@/src/store/slices/bookings-slice";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import { typography } from "@/src/theme/typography";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function BookingOverviewScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    activityId,
    participantsCount,
    packageName,
    packageCode,
    slotStart,
    time,
  } = useLocalSearchParams<{
    activityId: string;
    participantsCount: string;
    packageName?: string;
    packageCode?: string;
    slotStart: string;
    time: string;
  }>();

  const [isBooking, setIsBooking] = useState(false);
  const { currentActivity, currentGroup } = useAppSelector(
    (state) => state.consumerActivity,
  );

  // Find the activity data
  const activity =
    currentGroup?.activities.find((a) => a.id === activityId) ||
    currentActivity;

  // Find selected package price
  const selectedPackage =
    packageCode && activity?.config?.packages
      ? activity.config.packages.find((pkg: any) => pkg.code === packageCode)
      : null;
  const pricePerPerson =
    selectedPackage?.base_price || activity?.priceFrom || 0;

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
        }),
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
      console.log(error);

      // Handle specific error codes
      if (error.message?.includes("SLOT_FULL")) {
        errorMessage =
          "This time slot just filled up. Please choose another time.";
      } else if (error.message?.includes("PROFILE_INCOMPLETE")) {
        errorMessage = "Please complete your profile before booking";
        // Navigate to profile
        router.push("/(consumer)/(tabs)/profile");
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
      <SafeAreaView style={ui.container} edges={["top"]}>
        <TopBar title="Overview" />
        <View style={ui.errorContainer}>
          <Text style={typography.body}>Activity information not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ui.container} edges={["top"]}>
      <TopBar title="Overview" />

      <ScrollView style={ui.scrollView}>
        {/* Activity & Package Section */}
        <View style={styles.section}>
          <Text style={typography.h3}>Activity & Package</Text>
          <Card style={styles.sectionCard}>
            <Text style={typography.h3}>{activity.title}</Text>
            {packageName && (
              <Text style={[typography.body, styles.packageName]}>Package: {packageName}</Text>
            )}
            <Text style={typography.captionMuted}>
              {activity.city}
              {activity.address && ` • ${activity.address}`}
            </Text>
          </Card>
        </View>

        {/* Booking Details Section */}
        <View style={styles.section}>
          <Text style={typography.h3}>Booking Details</Text>
          <Card style={styles.sectionCard}>
            <DetailCard
              label="Date:"
              value={new Date(slotStart).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
            <DetailCard label="Time:" value={time} />
            <DetailCard
              label="Participants:"
              value={`${participantsCount} people`}
              style={{ marginBottom: 0 }}
            />
          </Card>
        </View>

        {/* Price Section */}
        {pricePerPerson > 0 && (
          <View style={styles.section}>
            <Text style={typography.h3}>Price</Text>
            <PriceSummaryCard
              items={[
                {
                  label: "Base price per person:",
                  value: `€${Number(pricePerPerson).toFixed(2)}`,
                },
                {
                  label: "Participants:",
                  value: `× ${participantsCount}`,
                },
              ]}
              total={(Number(pricePerPerson) * Number(participantsCount)).toFixed(2)}
              currency="EUR"
              style={styles.sectionCard}
            />
          </View>
        )}

        {/* Policy Note */}
        <View style={styles.section}>
          <Card style={styles.sectionCard}>
            <Text style={typography.captionMuted}>
              Please arrive 10 minutes early for your appointment. If you need
              to cancel or reschedule, please do so at least 24 hours in
              advance.
            </Text>
          </Card>
        </View>

        {/* Book Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Confirm Booking"
            onPress={handleBook}
            disabled={isBooking}
            loading={isBooking}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: theme.spacing.lg,
    paddingBottom: 0,
  },
  sectionCard: {
    marginTop: theme.spacing.md,
  },
  packageName: {
    marginVertical: theme.spacing.sm,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 16,
    paddingBottom: 32,
  },
});
