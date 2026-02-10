import { IconButton } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
import { StatusBadge } from "@/src/components/StatusBadge";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchBookings } from "@/src/store/slices/bookings-slice";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "upcoming" | "past";
type StatusFilter = "all" | "active" | "cancelled" | "completed";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "cancelled", label: "Cancelled" },
  { key: "completed", label: "Completed" },
];

export default function MyBookingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [filterVisible, setFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const upcomingState = useAppSelector((state) => state.bookings.upcoming);
  const pastState = useAppSelector((state) => state.bookings.past);
  const currentState = activeTab === "upcoming" ? upcomingState : pastState;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: theme.colors.bg, height: 120 },
      title: "My Bookings",
      headerTitleStyle: { color: theme.colors.text, fontWeight: "800" },
      headerShadowVisible: false,
      headerLeft: () => null,
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton
            icon="more-horiz"
            size={24}
            onPress={() => setFilterVisible(true)}
          />
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    dispatch(fetchBookings({ kind: activeTab }));
  }, [dispatch, activeTab]);

  const handleRefresh = () => {
    dispatch(fetchBookings({ kind: activeTab }));
  };

  const handleLoadMore = () => {
    if (currentState.nextCursor && !currentState.loading) {
      dispatch(
        fetchBookings({ kind: activeTab, cursor: currentState.nextCursor }),
      );
    }
  };

  const filteredItems = useMemo(() => {
    const items = currentState.items || [];
    if (statusFilter === "all") return items;
    return items.filter(
      (b: any) => String(b.status).toLowerCase() === statusFilter,
    );
  }, [currentState.items, statusFilter]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} • ${time}`;
  };

  const renderBookingCard = ({ item }: any) => {
    const booking = item;
    const activity = booking.activitySnapshot ?? {};
    const price = booking.priceSnapshot;

    const status = String(booking.status || "active").toLowerCase();

    const thumbUrl: string | null =
      activity?.thumbnailUrl ??
      activity?.imageUrl ??
      activity?.coverUrl ??
      null;

    const locationText = activity?.address || activity?.city || "—";
    const dateTimeText = booking?.slotStart
      ? formatDateTime(booking.slotStart)
      : "—";
    const participantsText = `${booking.participantsCount ?? 0} ${
      booking.participantsCount === 1 ? "person" : "people"
    }`;
    const priceText = price ? `${price.currency} ${price.total}` : "";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push(`/(consumer)/booking-detail?bookingId=${booking.id}`)
        }
        activeOpacity={0.85}
      >
        {/* thumbnail */}
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <Text style={styles.placeholderText}>📸</Text>
          </View>
        )}

        {/* content */}
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text
              style={[typography.body, styles.titleText]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {activity?.title || "Untitled"}
            </Text>

            {status !== "active" && (
              <StatusBadge
                status={status as "active" | "cancelled" | "completed"}
              />
            )}
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons
              name="event"
              size={16}
              color="rgba(255,255,255,0.78)"
            />
            <Text style={styles.subText} numberOfLines={1}>
              {dateTimeText}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons
              name="group"
              size={16}
              color="rgba(255,255,255,0.78)"
            />
            <Text style={styles.subText} numberOfLines={1}>
              {participantsText}
            </Text>
          </View>

          {priceText && (
            <View style={styles.infoRow}>
              <MaterialIcons
                name="payments"
                size={16}
                color="rgba(255,255,255,0.78)"
              />
              <Text style={styles.subText} numberOfLines={1}>
                Total: {priceText}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chevronWrap}>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color="rgba(255,255,255,0.78)"
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    const message =
      currentState.items.length > 0 && filteredItems.length === 0
        ? "No bookings match your filter."
        : activeTab === "upcoming"
          ? "You have no upcoming bookings yet."
          : "No past bookings yet.";

    return <EmptyState icon="calendar-month" title={message} />;
  };

  const renderFooter = () => {
    if (!currentState.loading || currentState.items.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.accent} />
      </View>
    );
  };

  return (
    <View style={ui.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.tabTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.tabActive]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.tabTextActive,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredItems}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!currentState.loading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={currentState.loading && currentState.items.length === 0}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent}
          />
        }
      />

      {/* Filter modal */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterVisible(false)}
        >
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>Filter</Text>
            <Text style={styles.menuSectionTitle}>Status</Text>

            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={styles.menuItem}
                  onPress={() => {
                    setStatusFilter(f.key);
                    setFilterVisible(false);
                  }}
                >
                  <MaterialIcons
                    name={
                      active ? "radio-button-checked" : "radio-button-unchecked"
                    }
                    size={18}
                    color={theme.colors.text}
                  />
                  <Text style={styles.menuItemText}>{f.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 16,
  },

  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  tabText: {
    ...typography.body,
    color: theme.colors.muted,
  },
  tabTextActive: {
    color: theme.colors.bg,
  },

  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 28,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  placeholderThumbnail: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 28,
  },

  cardContent: {
    flex: 1,
    minHeight: 64,
    justifyContent: "center",
    minWidth: 0,
  },

  titleRow: {
    ...ui.row,
    gap: 10,
    justifyContent: "space-between",
  },
  titleText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },

  infoRow: {
    ...ui.row,
    gap: 6,
    marginTop: 6,
  },
  subText: {
    ...typography.captionSmall,
    color: "rgba(255,255,255,0.78)",
    flex: 1,
  },

  chevronWrap: {
    width: 28,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 4,
  },

  footerLoader: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  menuTitle: {
    ...typography.body,
    fontWeight: "800",
    marginBottom: theme.spacing.md,
  },
  menuSectionTitle: {
    ...typography.label,
    marginBottom: theme.spacing.sm,
  },
  menuItem: {
    ...ui.row,
    gap: 10,
    paddingVertical: theme.spacing.md,
  },
  menuItemText: {
    ...typography.caption,
    fontWeight: "700",
  },
});
