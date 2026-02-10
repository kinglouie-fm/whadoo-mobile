import { TopBar } from "@/src/components/TopBar";
import { useBusiness } from "@/src/providers/business-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  clearBusinessBookings,
  fetchBusinessBookings,
} from "@/src/store/slices/business-bookings-slice";
import { theme } from "@/src/theme/theme";
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
          <Text style={styles.bookingTitle} numberOfLines={1}>
            {item.activitySnapshot?.title || "Activity"}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons
        name="calendar-month"
        size={64}
        color={theme.colors.muted}
      />
      <Text style={styles.emptyTitle}>No bookings found</Text>
      <Text style={styles.emptyText}>
        {selectedTab === "upcoming"
          ? "You don't have any upcoming bookings yet."
          : selectedTab === "past"
            ? "No past bookings to show."
            : "No bookings to display."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.muted,
  },
  tabTextActive: {
    color: theme.colors.bg,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  bookingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: "600",
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.accent,
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
