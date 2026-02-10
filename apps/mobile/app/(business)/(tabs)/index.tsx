import { Avatar } from "@/src/components/Avatar";
import { IconButton } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
import { StatusBadge } from "@/src/components/StatusBadge";
import { useAuth } from "@/src/providers/auth-context";
import { useBusiness } from "@/src/providers/business-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  fetchBusinessBookings,
  fetchBusinessStats,
} from "@/src/store/slices/business-bookings-slice";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
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

  const avatarName = useMemo(() => {
    if (!appUser) return "Business";
    const first = appUser.firstName || "";
    const last = appUser.lastName || "";
    return `${first} ${last}`.trim() || "Business";
  }, [appUser]);

  const location = appUser?.city || "Your location";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: { backgroundColor: theme.colors.bg, height: 120 },
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <Avatar name={avatarName} photoUrl={appUser?.photoUrl} size={40} />
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
          <IconButton
            icon="settings"
            onPress={() => router.push("/(business)/settings")}
            size={22}
          />
        </View>
      ),
    });
  }, [navigation, router, avatarName, location, appUser?.photoUrl]);

  const isLoading = businessLoading || loading;
  const upcomingBookings = bookings.slice(0, 5); // Show first 5

  return (
    <View style={ui.container}>
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
            title="Manage availability"
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
              <EmptyState
                icon="calendar-month"
                title="No bookings yet"
                subtitle="When customers book your activities, they will show up here."
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
          style={{ marginVertical: theme.spacing.md / 2 }}
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

  const status =
    booking.status === "active" ||
    booking.status === "cancelled" ||
    booking.status === "completed"
      ? (booking.status as "active" | "cancelled" | "completed")
      : "active";

  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingTitle} numberOfLines={1}>
          {booking.activitySnapshot?.title || "Activity"}
        </Text>
        <StatusBadge status={status} />
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
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },

  headerLeft: {
    marginLeft: theme.spacing.lg,
  },
  headerCenter: {
    alignItems: "center",
  },
  locationLabel: {
    ...typography.captionSmall,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm / 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm / 2,
  },
  locationText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text,
  },
  headerRight: {
    marginRight: theme.spacing.lg,
  },

  // KPI row
  kpiRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md / 2,
    marginBottom: theme.spacing.lg,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md / 2,
  },
  kpiValue: {
    ...typography.h4,
    color: theme.colors.text,
  },
  kpiLabel: {
    ...typography.captionSmall,
    fontWeight: "700",
    color: theme.colors.muted,
  },

  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  linkText: {
    ...typography.caption,
    color: theme.colors.accent,
  },

  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
  },
  tileText: {
    flex: 1,
  },
  tileTitle: {
    ...typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm / 4,
  },
  tileSubtitle: {
    ...typography.captionSmall,
    color: theme.colors.muted,
  },

  listCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },

  bookingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  bookingTitle: {
    ...typography.caption,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  bookingDetails: {
    gap: theme.spacing.md / 2,
    marginBottom: theme.spacing.sm,
  },
  bookingDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md / 2,
  },
  bookingDetailText: {
    ...typography.captionSmall,
    color: theme.colors.muted,
  },
  bookingPrice: {
    ...typography.caption,
    color: theme.colors.accent,
    marginTop: theme.spacing.sm / 2,
  },
});
