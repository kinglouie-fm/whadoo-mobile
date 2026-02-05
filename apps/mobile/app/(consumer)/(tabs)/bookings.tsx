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
                <Pressable style={styles.headerIconBtn} onPress={() => setFilterVisible(true)}>
                    <MaterialIcons name="more-horiz" size={24} color={theme.colors.text} />
                </Pressable>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        // Fetch on mount and tab change
        dispatch(fetchBookings({ kind: activeTab }));
    }, [dispatch, activeTab]);

    const handleRefresh = () => {
        dispatch(fetchBookings({ kind: activeTab }));
    };

    const handleLoadMore = () => {
        if (currentState.nextCursor && !currentState.loading) {
            dispatch(fetchBookings({ kind: activeTab, cursor: currentState.nextCursor }));
        }
    };

    const filteredItems = useMemo(() => {
        const items = currentState.items || [];
        if (statusFilter === "all") return items;
        return items.filter((b: any) => String(b.status).toLowerCase() === statusFilter);
    }, [currentState.items, statusFilter]);

    const renderBookingCard = ({ item }: any) => {
        const booking = item;
        const activity = booking.activitySnapshot;
        const price = booking.priceSnapshot;

        const statusStyle =
            (styles as any)[`status_${String(booking.status).toLowerCase()}`] ?? styles.status_active;

        return (
            <TouchableOpacity
                style={styles.bookingCard}
                onPress={() => router.push(`/(consumer)/booking-detail?bookingId=${booking.id}`)}
            >
                {/* Status Badge */}
                <View style={[styles.statusBadge, statusStyle]}>
                    <Text style={styles.statusText}>{String(booking.status).toUpperCase()}</Text>
                </View>

                {/* Activity Title */}
                <Text style={styles.activityTitle} numberOfLines={1}>
                    {activity?.title}
                </Text>

                {/* Date & Time */}
                <Text style={styles.dateTime}>
                    {new Date(booking.slotStart).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                    {" • "}
                    {new Date(booking.slotStart).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Text>

                {/* Location */}
                {activity?.city && <Text style={styles.location}>📍 {activity.city}</Text>}

                {/* Participants */}
                <Text style={styles.participants}>
                    👥 {booking.participantsCount}{" "}
                    {booking.participantsCount === 1 ? "person" : "people"}
                </Text>

                {/* Price */}
                {price && (
                    <Text style={styles.price}>
                        Total: {price.currency} {price.total}
                    </Text>
                )}
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
                    <Text style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}>
                        Upcoming
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === "past" && styles.tabActive]}
                    onPress={() => setActiveTab("past")}
                >
                    <Text style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}>
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
                <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
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
                                        name={active ? "radio-button-checked" : "radio-button-unchecked"}
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
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },

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
    tabActive: {
        backgroundColor: theme.colors.accent,
    },
    tabText: {
        fontSize: 16,
        fontWeight: "700",
        color: theme.colors.muted,
    },
    tabTextActive: {
        color: theme.colors.bg,
    },

    listContent: {
        padding: 20,
        gap: 16,
    },

    bookingCard: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        position: "relative",
    },

    statusBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    status_active: {
        backgroundColor: theme.colors.accent,
    },
    status_cancelled: {
        backgroundColor: "#EF4444",
    },
    status_completed: {
        backgroundColor: "#10B981",
    },
    statusText: {
        fontSize: 11,
        fontWeight: "800",
        color: theme.colors.bg,
    },

    activityTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: theme.colors.text,
        marginBottom: 8,
        marginRight: 80,
    },
    dateTime: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.text,
        marginBottom: 6,
    },
    location: {
        fontSize: 14,
        color: theme.colors.muted,
        marginBottom: 4,
    },
    participants: {
        fontSize: 14,
        color: theme.colors.muted,
        marginBottom: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: "700",
        color: theme.colors.accent,
    },

    emptyContainer: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.muted,
        textAlign: "center",
    },

    footerLoader: {
        paddingVertical: 20,
        alignItems: "center",
    },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    menuSheet: {
        backgroundColor: theme.colors.card,
        padding: 16,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    menuTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800", marginBottom: 12 },
    menuSectionTitle: { color: theme.colors.muted, fontSize: 12, fontWeight: "800", marginBottom: 8 },
    menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
    menuItemText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
});
