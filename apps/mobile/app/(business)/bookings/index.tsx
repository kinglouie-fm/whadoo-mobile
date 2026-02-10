import { EmptyState } from "@/src/components/EmptyState";
import { StatusBadge } from "@/src/components/StatusBadge";
import { TopBar } from "@/src/components/TopBar";
import { useBusiness } from "@/src/providers/business-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  clearBusinessBookings,
  fetchBusinessBookings,
} from "@/src/store/slices/business-bookings-slice";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabKind = "upcoming" | "past" | "all";

export default function BusinessBookingsScreen() {
  const { business } = useBusiness();
  const dispatch = useAppDispatch();
  const { bookings, loading, cursor, hasMore } = useAppSelector(
    (state) => state.businessBookings,
  );
  const [selectedTab, setSelectedTab] = useState<TabKind>("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (business?.id) {
      dispatch(clearBusinessBookings());
      const kind = selectedTab === "all" ? undefined : selectedTab;
      dispatch(fetchBusinessBookings({ businessId: business.id, kind }));
    }
  }, [business?.id, selectedTab, dispatch]);

  const handleRefresh = async () => {
    if (!business?.id) return;
    setRefreshing(true);
    dispatch(clearBusinessBookings());
    const kind = selectedTab === "all" ? undefined : selectedTab;
    await dispatch(fetchBusinessBookings({ businessId: business.id, kind }));
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!business?.id || !hasMore || loading) return;
    const kind = selectedTab === "all" ? undefined : selectedTab;
    dispatch(
      fetchBusinessBookings({
        businessId: business.id,
        kind,
        cursor: cursor || undefined,
      }),
    );
  };

  const renderBookingCard = ({ item }: { item: any }) => {
    const slotDate = new Date(item.slotStart);
    const dateStr = slotDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timeStr = slotDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const statusColor =
      item.status === "active"
        ? theme.colors.accent
        : item.status === "cancelled"
          ? theme.colors.muted
          : theme.colors.text;

    return (
      <TouchableOpacity style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text
            style={[typography.body, styles.titleText]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.activitySnapshot?.title || "Activity"}
          </Text>

          {String(item.status).toLowerCase() !== "active" && (
            <StatusBadge
              status={
                String(item.status).toLowerCase() as
                  | "active"
                  | "cancelled"
                  | "completed"
              }
            />
          )}
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons
              name="calendar-month"
              size={14}
              color={theme.colors.muted}
            />
            <Text style={styles.detailText}>
              {dateStr} at {timeStr}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="people" size={14} color={theme.colors.muted} />
            <Text style={styles.detailText}>
              {item.participantsCount}{" "}
              {item.participantsCount === 1 ? "person" : "people"}
            </Text>
          </View>
          {item.selectionSnapshot?.packageName && (
            <View style={styles.detailRow}>
              <MaterialIcons
                name="price-change"
                size={14}
                color={theme.colors.muted}
              />
              <Text style={styles.detailText}>
                {item.selectionSnapshot.packageName}
              </Text>
            </View>
          )}
        </View>

        {item.paymentAmount && (
          <Text style={styles.bookingPrice}>
            €{Number(item.paymentAmount).toFixed(2)}
          </Text>
        )}

        <Text style={styles.bookingId}>ID: {item.id.substring(0, 8)}</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const subtitle =
      selectedTab === "upcoming"
        ? "You don't have any upcoming bookings yet."
        : selectedTab === "past"
          ? "No past bookings to show."
          : "No bookings to display.";

    return (
      <EmptyState
        icon="calendar-month"
        title="No bookings found"
        subtitle={subtitle}
      />
    );
  };

  return (
    <SafeAreaView style={ui.container} edges={["top"]}>
      <TopBar title="Bookings" />

      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "upcoming" && styles.tabActive]}
          onPress={() => setSelectedTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "upcoming" && styles.tabTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "past" && styles.tabActive]}
          onPress={() => setSelectedTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "past" && styles.tabTextActive,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "all" && styles.tabActive]}
          onPress={() => setSelectedTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "all" && styles.tabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings list */}
      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={loading ? null : renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && bookings.length > 0 ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.accent}
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: ui.container,
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  tabText: {
    ...typography.caption,
    fontWeight: "800",
    color: theme.colors.muted,
  },
  tabTextActive: {
    color: theme.colors.bg,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  bookingCard: {
    ...ui.card,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  bookingHeader: {
    ...ui.rowBetween,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  titleText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  bookingDetails: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    ...ui.row,
    gap: theme.spacing.sm,
  },
  detailText: {
    ...typography.caption,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.accent,
    marginBottom: theme.spacing.sm,
  },
  bookingId: {
    ...typography.captionSmall,
  },
});
