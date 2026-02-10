import { useAuth } from "@/src/providers/auth-context";
import { useBusiness } from "@/src/providers/business-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  fetchBusinessBookings,
  fetchBusinessStats,
} from "@/src/store/slices/business-bookings-slice";
import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessHomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { appUser } = useAuth();
  const { business, loading: businessLoading } = useBusiness();
  const dispatch = useAppDispatch();
  const { stats, bookings, loading } = useAppSelector(
    (state) => state.businessBookings,
  );

  useEffect(() => {
    if (business?.id) {
      dispatch(fetchBusinessStats(business.id));
      dispatch(
        fetchBusinessBookings({ businessId: business.id, kind: "upcoming" }),
      );
    }
  }, [business?.id, dispatch]);

  const handleRefresh = () => {
    if (business?.id) {
      dispatch(fetchBusinessStats(business.id));
      dispatch(
        fetchBusinessBookings({ businessId: business.id, kind: "upcoming" }),
      );
    }
  };

  const initials = useMemo(() => {
    if (!appUser) return "B";
    const first = appUser.firstName?.charAt(0) || "";
    const last = appUser.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "B";
  }, [appUser]);

  const location = appUser?.city || "Your location";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: { backgroundColor: theme.colors.bg },
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
        </View>
      ),
      headerTitle: () => (
        <View style={styles.headerCenter}>
          <Text style={styles.locationLabel}>Business</Text>
          <View style={styles.locationRow}>
            <MaterialIcons
              name="location-on"
              size={16}
              color={theme.colors.text}
            />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.push("/(business)/settings")}
          >
            <MaterialIcons
              name="settings"
              size={22}
              color={theme.colors.text}
            />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, router, initials, location]);

  const isLoading = businessLoading || loading;
  const upcomingBookings = bookings.slice(0, 5); // Show first 5

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent}
          />
        }
      >
        {/* Top KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard
            label="Today"
            value={stats?.todayCount?.toString() || "0"}
            icon="calendar-month"
            loading={loading}
          />
          <KpiCard
            label="Upcoming"
            value={stats?.upcomingCount?.toString() || "0"}
            icon="timeline"
            loading={loading}
          />
          <KpiCard
            label="Revenue"
            value={`€${stats?.totalRevenue?.toFixed(2) || "0.00"}`}
            icon="attach-money"
            loading={loading}
          />
        </View>

        {/* Primary actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>

          <ActionTile
            title="Create activity"
            subtitle="Add a new activity or package"
            icon="add-circle-outline"
            onPress={() => router.push("/(business)/(tabs)/activities")}
          />

          <ActionTile
            title="Manage bookings"
            subtitle="See upcoming bookings & cancellations"
            icon="list"
            onPress={() => router.push("/(business)/bookings")}
          />

          <ActionTile
            title="Availability"
            subtitle="Opening hours, slot duration, templates"
            icon="timeline"
            onPress={() => router.push("/(business)/(tabs)/availability")}
          />

          <ActionTile
            title="Analytics"
            subtitle="Views, swipes, conversion"
            icon="pie-chart-outline"
            onPress={() => router.push("/(business)/analytics")}
          />
        </View>

        {/* Upcoming bookings preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming bookings</Text>
            <Pressable onPress={() => router.push("/(business)/bookings")}>
              <Text style={styles.linkText}>See all</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.listCard}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
            </View>
          ) : upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <BookingPreviewCard key={booking.id} booking={booking} />
            ))
          ) : (
            <View style={styles.listCard}>
              <Text style={styles.listEmptyTitle}>No bookings yet</Text>
              <Text style={styles.listEmptySub}>
                When customers book your activities, they will show up here.
              </Text>
            </View>
          )}
        </View>

        {/* Tips / onboarding */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Improve your conversion</Text>
            <Text style={styles.tipText}>
              Add packages (e.g. Standard / Premium) and a strong thumbnail.
            </Text>
            <Pressable
              style={styles.tipBtn}
              onPress={() => router.push("/(business)/(tabs)/activities")}
            >
              <Text style={styles.tipBtnText}>Add packages</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  loading?: boolean;
}) {
  return (
    <View style={styles.kpiCard}>
      <MaterialIcons name={icon} size={18} color={theme.colors.text} />
      {loading ? (
        <ActivityIndicator
          size="small"
          color={theme.colors.accent}
          style={{ marginVertical: 6 }}
        />
      ) : (
        <Text style={styles.kpiValue}>{value}</Text>
      )}
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function BookingPreviewCard({ booking }: { booking: any }) {
  const slotDate = new Date(booking.slotStart);
  const dateStr = slotDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeStr = slotDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const statusColor =
    booking.status === "active"
      ? theme.colors.accent
      : booking.status === "cancelled"
        ? theme.colors.muted
        : theme.colors.text;

  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingTitle} numberOfLines={1}>
          {booking.activitySnapshot?.title || "Activity"}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {booking.status}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.bookingDetailRow}>
          <MaterialIcons
            name="calendar-month"
            size={14}
            color={theme.colors.muted}
          />
          <Text style={styles.bookingDetailText}>
            {dateStr} at {timeStr}
          </Text>
        </View>
        <View style={styles.bookingDetailRow}>
          <MaterialIcons name="people" size={14} color={theme.colors.muted} />
          <Text style={styles.bookingDetailText}>
            {booking.participantsCount}{" "}
            {booking.participantsCount === 1 ? "person" : "people"}
          </Text>
        </View>
      </View>

      {booking.paymentAmount && (
        <Text style={styles.bookingPrice}>
          €{Number(booking.paymentAmount).toFixed(2)}
        </Text>
      )}
    </View>
  );
}

function ActionTile({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <View style={styles.tileIcon}>
        <MaterialIcons name={icon} size={22} color={theme.colors.text} />
      </View>
      <View style={styles.tileText}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={18}
        color={theme.colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },

  // header styles (same vibe as consumer)
  headerLeft: {
    marginLeft: 16,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  headerCenter: {
    alignItems: "center",
  },
  locationLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  headerRight: {
    marginRight: 16,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },

  // KPI row
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.muted,
  },

  section: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.accent,
  },

  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    marginBottom: 10,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
  },
  tileText: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
  },

  listCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  listEmptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 4,
  },
  listEmptySub: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 17,
  },

  tipCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 17,
    marginBottom: 12,
  },
  tipBtn: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tipBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.bg,
  },

  bookingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  bookingDetails: {
    gap: 6,
    marginBottom: 8,
  },
  bookingDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bookingDetailText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: "600",
  },
  bookingPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.accent,
    marginTop: 4,
  },
});
