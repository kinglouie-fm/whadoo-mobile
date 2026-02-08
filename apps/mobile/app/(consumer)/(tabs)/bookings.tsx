import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchBookings } from "@/src/store/slices/bookings-slice";
import { theme } from "@/src/theme/theme";
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
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "upcoming" | "past";
type StatusFilter = "all" | "active" | "cancelled" | "completed";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "cancelled", label: "Cancelled" },
  { key: "completed", label: "Completed" },
];

const stylesVars = {
  cardBg: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  subText: "rgba(255,255,255,0.78)",
};

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
      title: "My Bookings",
      headerTitleStyle: { color: theme.colors.text, fontWeight: "800" },
      headerStyle: { backgroundColor: theme.colors.bg },
      headerShadowVisible: false,
      headerLeft: () => null,
      headerRight: () => (
        <Pressable
          style={styles.headerIconBtn}
          onPress={() => setFilterVisible(true)}
        >
          <MaterialIcons
            name="more-horiz"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
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
    const statusStyle =
      (styles as any)[`status_${status}`] ?? styles.status_active;

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
            <Text style={styles.title} numberOfLines={1}>
              {activity?.title || "Untitled"}
            </Text>

            <Text style={styles.statusText}>
              {String(booking.status).toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={16} color={stylesVars.subText} />
            <Text style={styles.subText} numberOfLines={1}>
              {dateTimeText}
            </Text>
          </View>

          <View style={[styles.infoRow, { marginTop: 6 }]}>
            <MaterialIcons name="group" size={16} color={stylesVars.subText} />
            <Text style={styles.subText} numberOfLines={1}>
              {participantsText}
            </Text>
          </View>

          {priceText ? (
            <View style={[styles.infoRow, { marginTop: 6 }]}>
              <MaterialIcons
                name="payments"
                size={16}
                color={stylesVars.subText}
              />
              <Text style={styles.subText} numberOfLines={1}>
                Total: {priceText}
              </Text>
            </View>
          ) : null}
        </View>

        {/* chevron */}
        <View style={styles.chevronWrap}>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={stylesVars.subText}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {currentState.items.length > 0 && filteredItems.length === 0
          ? "No bookings match your filter."
          : activeTab === "upcoming"
            ? "You have no upcoming bookings yet."
            : "No past bookings yet."}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!currentState.loading || currentState.items.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.accent} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  headerIconBtn: {
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },

  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
  },
  tabActive: { backgroundColor: theme.colors.accent },
  tabText: { fontSize: 16, fontWeight: "700", color: theme.colors.muted },
  tabTextActive: { color: theme.colors.bg },

  listContent: {
    padding: 16,
    paddingBottom: 28,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stylesVars.cardBg,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    gap: 12,

    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  placeholderThumbnail: { alignItems: "center", justifyContent: "center" },
  placeholderText: { fontSize: 28 },

  cardContent: { flex: 1, minHeight: 64, justifyContent: "center" },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, fontSize: 16, fontWeight: "800", color: stylesVars.text },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  subText: {
    color: stylesVars.subText,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  chevronWrap: {
    width: 28,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 4,
  },

  // status pill (keeps your status logic, but fits the new card)
  //   statusPill: {
  //     paddingHorizontal: 10,
  //     paddingVertical: 6,
  //     borderRadius: 999,
  //   },
  status_active: { backgroundColor: theme.colors.accent },
  status_cancelled: { backgroundColor: "#EF4444" },
  status_completed: { backgroundColor: "#10B981" },
  statusText: { fontSize: 11, fontWeight: "900", color: theme.colors.accent },

  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 16, color: theme.colors.muted, textAlign: "center" },

  footerLoader: { paddingVertical: 20, alignItems: "center" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  menuTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  menuSectionTitle: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  menuItemText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
});
