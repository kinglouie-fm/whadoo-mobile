import { useBusiness } from "@/src/lib/use-business";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
    AvailabilityTemplate,
    deactivateTemplate,
    fetchTemplates,
} from "@/src/store/slices/availability-template-slice";
import { theme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type FilterStatus = "all" | "active" | "inactive";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(timeStr: string) {
    try {
        const date = new Date(timeStr);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    } catch {
        return timeStr;
    }
}

function formatDays(days: number[]) {
    return (days || [])
        .slice()
        .sort((a, b) => a - b)
        .map((d) => DAY_NAMES[d] || `${d}`)
        .join(", ");
}

type TemplateRowProps = {
    item: AvailabilityTemplate;
    selectMode: boolean;
    isSelected: boolean;
    onPress: () => void;
    onLongPress: () => void;
    onToggleSelected: () => void;
    onDeactivate: () => void;
};

const TemplateRow = memo(function TemplateRow({
    item,
    selectMode,
    isSelected,
    onPress,
    onLongPress,
    onToggleSelected,
    onDeactivate,
}: TemplateRowProps) {
    const swipeRef = useRef<Swipeable>(null);

    const isActive = item.status === "active";
    const statusLabel = isActive ? "Active" : "Inactive";

    const renderRightActions = () => {
        if (!isActive) return null; // ✅ no "activate" path exists
        return (
            <View style={styles.swipeActionsWrap}>
                <Pressable style={[styles.swipeActionBtn, styles.swipeDeactivate]} onPress={onDeactivate}>
                    <Ionicons name="pause-outline" size={18} color="#fff" />
                    <Text style={styles.swipeActionText}>Deactivate</Text>
                </Pressable>
            </View>
        );
    };

    return (
        <Swipeable
            ref={swipeRef}
            enabled={!selectMode && isActive} // ✅ only swipe for active templates
            renderRightActions={renderRightActions}
            overshootRight={false}
        >
            <Pressable
                style={[styles.row, selectMode && isSelected && styles.rowSelected]}
                onPress={onPress}
                onLongPress={onLongPress}
            >
                {/* ✅ checkbox only exists (and takes space) in select mode */}
                {selectMode ? (
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            onToggleSelected();
                        }}
                        style={styles.checkboxWrap}
                        hitSlop={8}
                    >
                        <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={22}
                            color={isSelected ? theme.colors.accent : theme.colors.muted}
                        />
                    </Pressable>
                ) : null}

                {/* Left icon placeholder */}
                <View style={styles.thumb}>
                    <Ionicons name="calendar-outline" size={18} color={theme.colors.text} />
                </View>

                {/* Main content */}
                <View style={styles.main}>
                    <View style={styles.titleRow}>
                        <Text style={styles.name} numberOfLines={1}>
                            {item.name}
                        </Text>
                    </View>

                    <Text style={styles.meta} numberOfLines={1}>
                        {formatDays(item.daysOfWeek)}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                        {formatTime(item.startTime)} – {formatTime(item.endTime)}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                        {item.slotDurationMinutes} min • Capacity: {item.capacity}
                    </Text>
                    <Text style={isActive ? styles.statusPillTextActive : styles.statusPillTextInactive}>{statusLabel}</Text>
                </View>

                {/* Right-side quick action + chevron */}
                <View style={styles.right}>
                    {/* ✅ Only show quick action if active (since we can't activate) */}
                    {isActive ? (
                        <Pressable
                            style={styles.rightIconBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                onDeactivate();
                            }}
                            hitSlop={10}
                        >
                            <Ionicons name="sync-outline" size={22} color={theme.colors.text} />
                        </Pressable>
                    ) : (
                        <View style={{ width: 34, height: 34 }} />
                    )}

                    <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
                </View>
            </Pressable>
        </Swipeable>
    );
});

export default function AvailabilityScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const { business, loading: businessLoading } = useBusiness();
    const { templates, loading, error } = useAppSelector((state) => state.availabilityTemplates);

    const businessId = business?.id;

    const [refreshing, setRefreshing] = useState(false);

    // Menu + filter
    const [menuVisible, setMenuVisible] = useState(false);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

    // Select mode
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const loadTemplates = async () => {
        if (!businessId) return;
        try {
            await dispatch(fetchTemplates(businessId)).unwrap();
        } catch (err) {
            console.error("Failed to load templates:", err);
        }
    };

    useEffect(() => {
        if (businessId) loadTemplates();
    }, [businessId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadTemplates();
        setRefreshing(false);
    };

    // ✅ Use top Tabs header (no second header inside screen)
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => null,
            headerRight: () => (
                <View style={styles.headerRight}>
                    <Pressable
                        style={styles.headerIconBtn}
                        onPress={() => router.push("/(business)/availability/detail")}
                    >
                        <Ionicons name="add" size={22} color={theme.colors.text} />
                    </Pressable>

                    <Pressable style={styles.headerIconBtn} onPress={() => setMenuVisible(true)}>
                        <Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.text} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, router]);

    const filteredTemplates = useMemo(() => {
        if (filterStatus === "all") return templates;
        return templates.filter((t) => t.status === filterStatus);
    }, [templates, filterStatus]);

    const selectedTemplates = useMemo(() => {
        return templates.filter((t) => selectedIds.has(t.id));
    }, [templates, selectedIds]);

    const deactivatableIds = useMemo(() => {
        return selectedTemplates.filter((t) => t.status === "active").map((t) => t.id);
    }, [selectedTemplates]);

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
    };

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const confirmDeactivate = (ids: string[], single = false) => {
        if (ids.length === 0) return;

        Alert.alert(
            "Deactivate Template",
            single
                ? "Are you sure you want to deactivate this template? It cannot be deactivated if linked to published activities."
                : "Deactivate selected templates? Templates linked to published activities cannot be deactivated.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Deactivate",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            for (const id of ids) {
                                await dispatch(deactivateTemplate(id)).unwrap();
                            }
                            await loadTemplates();
                            if (!single) exitSelectMode();
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "Failed to deactivate template(s)");
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: AvailabilityTemplate }) => {
        const isSelected = selectedIds.has(item.id);

        const onRowPress = () => {
            if (selectMode) toggleSelected(item.id);
            else router.push(`/(business)/availability/detail?id=${item.id}`);
        };

        const onRowLongPress = () => {
            if (!selectMode) {
                setSelectMode(true);
                setSelectedIds(new Set([item.id]));
            } else {
                toggleSelected(item.id);
            }
        };

        return (
            <TemplateRow
                item={item}
                selectMode={selectMode}
                isSelected={isSelected}
                onPress={onRowPress}
                onLongPress={onRowLongPress}
                onToggleSelected={() => toggleSelected(item.id)}
                onDeactivate={() => confirmDeactivate([item.id], true)}
            />
        );
    };

    if (businessLoading || !businessId) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.centerText}>Loading business information...</Text>
            </View>
        );
    }

    if (loading && templates.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable onPress={loadTemplates}>
                        <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                </View>
            ) : null}

            <FlatList
                data={filteredTemplates}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>No availability templates.</Text>
                        <Text style={styles.emptySub}>Create your first one to get started.</Text>
                    </View>
                }
            />

            {/* ✅ Select-mode bottom bar: only Deactivate + Cancel */}
            {selectMode && (
                <View style={styles.bottomBar}>
                    <Pressable
                        style={[
                            styles.bottomAction,
                            styles.actionDeactivate,
                            deactivatableIds.length === 0 && styles.actionDisabled,
                        ]}
                        disabled={deactivatableIds.length === 0}
                        onPress={() => confirmDeactivate(deactivatableIds, false)}
                    >
                        <Ionicons name="pause-outline" size={18} color="#fff" />
                    </Pressable>

                    <Pressable style={[styles.bottomAction, styles.actionCancel]} onPress={exitSelectMode}>
                        <Ionicons name="close" size={18} color="#fff" />
                    </Pressable>
                </View>
            )}

            {/* 3-dots menu */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuSheet}>
                        <Text style={styles.menuTitle}>Manage availability</Text>

                        <Pressable
                            style={styles.menuItem}
                            onPress={() => {
                                setMenuVisible(false);
                                setSelectMode(true);
                                setSelectedIds(new Set());
                            }}
                        >
                            <Ionicons name="checkbox-outline" size={18} color={theme.colors.text} />
                            <Text style={styles.menuItemText}>Select</Text>
                        </Pressable>

                        <View style={styles.menuDivider} />

                        <Text style={styles.menuSectionTitle}>Filter</Text>

                        {(["all", "active", "inactive"] as FilterStatus[]).map((s) => {
                            const active = filterStatus === s;
                            return (
                                <Pressable
                                    key={s}
                                    style={[styles.menuItem, active && styles.menuItemActive]}
                                    onPress={() => {
                                        setFilterStatus(s);
                                        setMenuVisible(false);
                                    }}
                                >
                                    <Ionicons
                                        name={active ? "radio-button-on" : "radio-button-off"}
                                        size={18}
                                        color={theme.colors.text}
                                    />
                                    <Text style={styles.menuItemText}>
                                        {s === "all" ? "All" : s === "active" ? "Active" : "Inactive"}
                                    </Text>
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
    container: { flex: 1, backgroundColor: theme.colors.bg },

    headerRight: { flexDirection: "row", gap: theme.spacing.sm, marginRight: theme.spacing.md },
    headerIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surface,
    },

    errorBanner: {
        backgroundColor: "#3A1B1B",
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    errorText: { color: "#FFB4B4", flex: 1, marginRight: theme.spacing.md },
    retryText: { color: theme.colors.accent, fontWeight: "700" },

    listContent: { padding: theme.spacing.lg, paddingBottom: 120 },

    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    rowSelected: { borderColor: theme.colors.accent },

    checkboxWrap: {
        marginRight: theme.spacing.md,
        alignItems: "center",
        justifyContent: "center",
    },

    thumb: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
        marginRight: theme.spacing.md,
    },

    main: { flex: 1, minWidth: 0 },
    titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    name: { color: theme.colors.text, fontSize: 16, fontWeight: "700", flex: 1 },
    meta: { color: theme.colors.muted, marginTop: 2, fontSize: 13 },

    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    statusPillTextActive: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
    statusPillTextInactive: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },

    right: { flexDirection: "row", alignItems: "center", gap: 10, marginLeft: theme.spacing.md },
    rightIconBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surface,
    },

    swipeActionsWrap: {
        justifyContent: "center",
        alignItems: "flex-end",
        marginBottom: theme.spacing.md,
        marginRight: theme.spacing.lg,
    },
    swipeActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        height: 44,
        borderRadius: 14,
    },
    swipeDeactivate: { backgroundColor: theme.colors.danger },
    swipeActionText: { color: "#fff", fontWeight: "800" },

    bottomBar: {
        position: "absolute",
        bottom: 22,
        alignSelf: "center",
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.35)",
        borderRadius: 999,
        padding: 10,
        gap: 10,
    },
    bottomAction: {
        width: 56,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    actionDeactivate: { backgroundColor: theme.colors.danger },
    actionCancel: { backgroundColor: "#2A2A2A" },
    actionDisabled: { opacity: 0.35 },

    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg },
    centerText: { color: theme.colors.muted, marginTop: 10 },

    empty: { alignItems: "center", paddingTop: 60 },
    emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
    emptySub: { color: theme.colors.muted, marginTop: 6 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    menuSheet: {
        backgroundColor: theme.colors.card,
        padding: theme.spacing.lg,
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    menuTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800", marginBottom: 12 },
    menuSectionTitle: { color: theme.colors.muted, fontSize: 12, fontWeight: "800", marginBottom: 8 },

    menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
    menuItemActive: { opacity: 0.9 },
    menuItemText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
    menuDivider: { height: 1, backgroundColor: theme.colors.divider, marginVertical: 10 },
});