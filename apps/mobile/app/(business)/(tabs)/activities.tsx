import { useBusiness } from "@/src/lib/use-business";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
    Activity,
    deactivateActivity,
    fetchActivities,
    publishActivity,
    unpublishActivity,
} from "@/src/store/slices/activity-slice";
import { theme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

type FilterStatus = "all" | "draft" | "published" | "inactive";
const FILTERS: FilterStatus[] = ["all", "draft", "published", "inactive"];

export default function ActivitiesScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const dispatch = useAppDispatch();

    const { business, loading: businessLoading } = useBusiness();
    const { activities, loading, error } = useAppSelector((state) => state.activities);

    const businessId = business?.id;

    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [menuVisible, setMenuVisible] = useState(false);

    const openSwipeIdRef = useRef<string | null>(null);
    const swipeRefs = useRef<Record<string, Swipeable | null>>({});

    const selectedCount = selectedIds.size;

    const selectedActivities = useMemo(
        () => activities.filter((a) => selectedIds.has(a.id)),
        [activities, selectedIds]
    );

    const publishableIds = useMemo(
        () =>
            selectedActivities
                .filter((a) => a.status === "draft" && !!a.availabilityTemplateId)
                .map((a) => a.id),
        [selectedActivities]
    );

    const unpublishableIds = useMemo(
        () => selectedActivities.filter((a) => a.status === "published").map((a) => a.id),
        [selectedActivities]
    );

    const deactivatableIds = useMemo(
        () => selectedActivities.filter((a) => a.status !== "inactive").map((a) => a.id),
        [selectedActivities]
    );

    const activatableIds = useMemo(
        () => selectedActivities.filter((a) => a.status === "inactive").map((a) => a.id),
        [selectedActivities]
    );

    const hasPublished = useMemo(
        () => selectedActivities.some((a) => a.status === "published"),
        [selectedActivities]
    );

    const hasInactive = useMemo(
        () => selectedActivities.some((a) => a.status === "inactive"),
        [selectedActivities]
    );

    const loadActivities = async () => {
        if (!businessId) return;
        const status = filterStatus === "all" ? undefined : filterStatus;
        try {
            await dispatch(fetchActivities({ businessId, status })).unwrap();
        } catch (err) {
            console.error("Failed to load activities:", err);
        }
    };

    useEffect(() => {
        if (businessId) loadActivities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessId, filterStatus]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadActivities();
        setRefreshing(false);
    };

    const closeOpenSwipeRow = () => {
        if (openSwipeIdRef.current) {
            swipeRefs.current[openSwipeIdRef.current]?.close();
            openSwipeIdRef.current = null;
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
    };

    const handlePublishError = (err: any) => {
        const errorCode = err?.code;
        const errorMessage = err?.message;
        const missingFields = err?.missingFields;

        switch (errorCode) {
            case "TEMPLATE_REQUIRED":
                Alert.alert(
                    "Link Availability Template",
                    "You must link an availability template before publishing.",
                    [{ text: "OK" }]
                );
                break;
            case "TEMPLATE_NOT_FOUND":
                Alert.alert(
                    "Template Not Found",
                    "The linked availability template no longer exists. Please link a different template.",
                    [{ text: "OK" }]
                );
                break;
            case "TEMPLATE_INACTIVE":
                Alert.alert(
                    "Template Inactive",
                    "The linked availability template is inactive. Activate it or link a different template.",
                    [{ text: "OK" }]
                );
                break;
            case "REQUIRED_FIELDS_MISSING":
                Alert.alert(
                    "Missing Required Fields",
                    `Please fill in: ${missingFields?.join(", ") || "unknown"}`,
                    [{ text: "OK" }]
                );
                break;
            default:
                Alert.alert("Publish Failed", errorMessage || "An error occurred while publishing.", [
                    { text: "OK" },
                ]);
        }
    };

    const handlePublish = async (activityId: string) => {
        try {
            await dispatch(publishActivity(activityId)).unwrap();
            Toast.show({ type: "success", text1: "Success", text2: "Activity published" });
            loadActivities();
        } catch (err: any) {
            handlePublishError(err);
        }
    };

    const handleUnpublish = async (activityId: string) => {
        try {
            await dispatch(unpublishActivity(activityId)).unwrap();
            Toast.show({ type: "success", text1: "Success", text2: "Activity unpublished" });
            loadActivities();
        } catch (err: any) {
            Alert.alert("Error", err?.message || "Failed to unpublish activity");
        }
    };

    const handleDeactivate = async (activityId: string) => {
        try {
            await dispatch(deactivateActivity(activityId)).unwrap();
            Toast.show({ type: "success", text1: "Success", text2: "Activity deactivated" });
            loadActivities();
        } catch (err: any) {
            Alert.alert("Error", err?.message || "Failed to deactivate activity");
        }
    };

    const confirmDeactivate = (activityId: string, title?: string) => {
        Alert.alert("Deactivate Activity", `Deactivate "${title || "this activity"}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Deactivate", style: "destructive", onPress: () => handleDeactivate(activityId) },
        ]);
    };

    const bulkDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        Alert.alert("Deactivate selected", `Deactivate ${selectedIds.size} selected activities?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Deactivate",
                style: "destructive",
                onPress: async () => {
                    try {
                        const ids = Array.from(selectedIds);
                        await Promise.all(ids.map((id) => dispatch(deactivateActivity(id)).unwrap()));
                        Toast.show({
                            type: "success",
                            text1: "Done",
                            text2: `${ids.length} activities deactivated`,
                        });
                        exitSelectMode();
                        loadActivities();
                    } catch (err: any) {
                        Alert.alert("Error", err?.message || "Failed to deactivate selected activities");
                    }
                },
            },
        ]);
    };

    const bulkPublishSelected = async () => {
        if (publishableIds.length === 0) return;

        // Publish can fail per item with missing template etc, so run sequentially and show first error nicely.
        try {
            for (const id of publishableIds) {
                await dispatch(publishActivity(id)).unwrap();
            }
            Toast.show({
                type: "success",
                text1: "Published",
                text2: `${publishableIds.length} activities published`,
            });
            exitSelectMode();
            loadActivities();
        } catch (err: any) {
            handlePublishError(err);
        }
    };

    const bulkUnpublishSelected = async () => {
        if (unpublishableIds.length === 0) return;
        try {
            await Promise.all(unpublishableIds.map((id) => dispatch(unpublishActivity(id)).unwrap()));
            Toast.show({
                type: "success",
                text1: "Unpublished",
                text2: `${unpublishableIds.length} activities unpublished`,
            });
            exitSelectMode();
            loadActivities();
        } catch (err: any) {
            Alert.alert("Error", err?.message || "Failed to unpublish selected activities");
        }
    };

    const bulkDeactivateSelected = async () => {
        if (deactivatableIds.length === 0) return;
        Alert.alert("Deactivate selected", `Deactivate ${deactivatableIds.length} selected activities?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Deactivate",
                style: "destructive",
                onPress: async () => {
                    try {
                        await Promise.all(deactivatableIds.map((id) => dispatch(deactivateActivity(id)).unwrap()));
                        Toast.show({
                            type: "success",
                            text1: "Deactivated",
                            text2: `${deactivatableIds.length} activities deactivated`,
                        });
                        exitSelectMode();
                        loadActivities();
                    } catch (err: any) {
                        Alert.alert("Error", err?.message || "Failed to deactivate selected activities");
                    }
                },
            },
        ]);
    };

    const bulkActivateSelected = () => {
        if (activatableIds.length === 0) return;
        // You don't currently have an "activate/reactivate" thunk in your slice.
        // Keep UI now, wire later.
        Alert.alert(
            "Activate (not implemented yet)",
            "You selected inactive activities. Add an activate/reactivate endpoint + thunk, then wire it here.",
            [{ text: "OK" }]
        );
    };

    const openHeaderMenu = () => {
        if (selectMode) return;
        setMenuVisible(true);
    };

    const statusBadge = (item: Activity) => {
        if (item.status === "published") return { label: "Published", color: theme.colors.accent };
        if (item.status === "inactive") return { label: "Inactive", color: theme.colors.muted };
        if (!item.availabilityTemplateId) return { label: "Needs Template", color: theme.colors.danger };
        return { label: "Not Published", color: theme.colors.muted };
    };

    const openRowActions = (item: Activity) => {
        if (selectMode) return;

        const canPublish = item.status === "draft" && !!item.availabilityTemplateId;

        const buttons: any[] = [
            {
                text: "Open / Edit",
                onPress: () => router.push(`/(business)/activities/detail?id=${item.id}`),
            },
        ];

        if (item.status === "draft") {
            buttons.push({
                text: canPublish ? "Publish" : "Publish (needs template)",
                onPress: () =>
                    canPublish ? handlePublish(item.id) : handlePublishError({ code: "TEMPLATE_REQUIRED" }),
            });
        }

        if (item.status === "published") {
            buttons.push({ text: "Unpublish", onPress: () => handleUnpublish(item.id) });
        }

        if (item.status !== "inactive") {
            buttons.push({
                text: "Deactivate",
                style: "destructive",
                onPress: () => confirmDeactivate(item.id, item.title),
            });
        }

        buttons.push({ text: "Cancel", style: "cancel" });

        Alert.alert(item.title, "What do you want to do?", buttons);
    };

    const renderRightActions = (item: Activity) => {
        return (
            <View style={styles.rightActionsWrap}>
                <Pressable
                    style={styles.deleteAction}
                    onPress={() => {
                        closeOpenSwipeRow();
                        confirmDeactivate(item.id, item.title);
                    }}
                >
                    <Ionicons name="trash" size={20} color="#fff" />
                </Pressable>
            </View>
        );
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            title: selectMode ? `${selectedCount} Selected` : "Manage Activities",
            headerLeft: () => null,
            headerRight: () => (
                <View style={styles.headerRight}>
                    {!selectMode && (
                        <Pressable
                            style={styles.headerIconBtn}
                            onPress={() => router.push("/(business)/activities/detail")}
                        >
                            <Ionicons name="add" size={22} color={theme.colors.text} />
                        </Pressable>
                    )}

                    <Pressable
                        style={styles.headerIconBtn}
                        onPress={selectMode ? exitSelectMode : openHeaderMenu}
                    >
                        <Ionicons
                            name={selectMode ? "close" : "ellipsis-horizontal"}
                            size={22}
                            color={theme.colors.text}
                        />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, router, selectMode, selectedCount, filterStatus]);

    const renderItem = ({ item }: { item: Activity }) => {
        const badge = statusBadge(item);
        const checked = selectedIds.has(item.id);

        return (
            <Swipeable
                ref={(ref) => {
                    swipeRefs.current[item.id] = ref;
                }}
                enabled={!selectMode}
                onSwipeableWillOpen={() => {
                    if (openSwipeIdRef.current && openSwipeIdRef.current !== item.id) {
                        swipeRefs.current[openSwipeIdRef.current]?.close();
                    }
                    openSwipeIdRef.current = item.id;
                }}
                renderRightActions={() => renderRightActions(item)}
            >
                <Pressable
                    style={styles.rowCard}
                    onPress={() => {
                        if (selectMode) toggleSelect(item.id);
                        else router.push(`/(business)/activities/detail?id=${item.id}`);
                    }}
                    onLongPress={() => openRowActions(item)}
                >
                    {/* ✅ Only take space when selectMode is ON */}
                    {selectMode && (
                        <Pressable
                            onPress={() => toggleSelect(item.id)}
                            style={[styles.checkbox, checked && styles.checkboxChecked]}
                            hitSlop={10}
                        >
                            {checked ? <Ionicons name="checkmark" size={16} color={theme.colors.bg} /> : null}
                        </Pressable>
                    )}

                    {/* thumbnail placeholder */}
                    <View style={styles.thumb} />

                    {/* content */}
                    <View style={styles.content}>
                        <Text style={styles.title} numberOfLines={1}>
                            {item.title}
                        </Text>

                        <View style={styles.metaRow}>
                            <Ionicons name="location-outline" size={14} color={theme.colors.muted} />
                            <Text style={styles.metaText} numberOfLines={1}>
                                {item.address ? item.address : item.city ? item.city : "—"}
                            </Text>
                        </View>

                        <Text style={[styles.statusText, { color: badge.color }]} numberOfLines={1}>
                            {badge.label}
                        </Text>
                    </View>

                    {/* ✅ action icon + chevron */}
                    <View style={styles.trailing}>
                        <Pressable
                            onPress={() => openRowActions(item)}
                            hitSlop={10}
                            disabled={selectMode}
                            style={({ pressed }) => [
                                styles.trailingIconBtn,
                                pressed && !selectMode ? styles.pressed : null,
                                selectMode ? styles.disabled : null,
                            ]}
                        >
                            <Ionicons name="sync-outline" size={18} color={theme.colors.muted} />
                        </Pressable>

                        <View style={styles.chevronWrap}>
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
                        </View>
                    </View>
                </Pressable>
            </Swipeable>
        );
    };

    const listEmpty = useMemo(() => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No activities.</Text>
                <Text style={styles.emptySubtext}>Tap + to create your first activity.</Text>
            </View>
        );
    }, [loading]);

    if (businessLoading || !businessId) {
        return (
            <View style={styles.screen}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
                <Text style={styles.emptySubtext}>Loading business information…</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadActivities}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            <FlatList
                data={activities}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                ListEmptyComponent={listEmpty}
                onScrollBeginDrag={closeOpenSwipeRow}
            />

            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuSheet}>
                        <Text style={styles.menuTitle}>Manage activities</Text>

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

                        {FILTERS.map((s) => {
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
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Pressable>
            </Modal>

            {/* ✅ Select mode bottom action bar: cancel + delete + publish/unpublish + activate/deactivate */}
            {selectMode && (
                <View style={styles.bottomBar}>
                    {/* Publish OR Unpublish (never both) */}
                    {!hasPublished ? (
                        <Pressable
                            style={[
                                styles.bottomAction,
                                styles.actionPublish,
                                publishableIds.length === 0 && styles.actionDisabled,
                            ]}
                            disabled={publishableIds.length === 0}
                            onPress={bulkPublishSelected}
                        >
                            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                        </Pressable>
                    ) : (
                        <Pressable
                            style={[
                                styles.bottomAction,
                                styles.actionUnpublish,
                                unpublishableIds.length === 0 && styles.actionDisabled,
                            ]}
                            disabled={unpublishableIds.length === 0}
                            onPress={bulkUnpublishSelected}
                        >
                            <Ionicons name="cloud-download-outline" size={18} color="#fff" />
                        </Pressable>
                    )}

                    {/* Activate OR Deactivate (never both) */}
                    {hasInactive ? (
                        <Pressable
                            style={[
                                styles.bottomAction,
                                styles.actionActivate,
                                activatableIds.length === 0 && styles.actionDisabled,
                            ]}
                            disabled={activatableIds.length === 0}
                            onPress={bulkActivateSelected}
                        >
                            <Ionicons name="play-outline" size={18} color="#fff" />
                        </Pressable>
                    ) : (
                        <Pressable
                            style={[
                                styles.bottomAction,
                                styles.actionDeactivate,
                                deactivatableIds.length === 0 && styles.actionDisabled,
                            ]}
                            disabled={deactivatableIds.length === 0}
                            onPress={bulkDeactivateSelected}
                        >
                            <Ionicons name="pause-outline" size={18} color="#fff" />
                        </Pressable>
                    )}

                    {/* Delete + Cancel always */}
                    <Pressable style={[styles.bottomAction, styles.actionDelete]} onPress={bulkDeleteSelected}>
                        <Ionicons name="trash" size={18} color="#fff" />
                    </Pressable>

                    <Pressable style={[styles.bottomAction, styles.actionCancel]} onPress={exitSelectMode}>
                        <Ionicons name="close" size={18} color="#fff" />
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.bg },

    errorBanner: {
        backgroundColor: "rgba(255,77,77,0.15)",
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    errorText: { color: theme.colors.danger, flex: 1, marginRight: 12 },
    retryText: { color: theme.colors.accent, fontWeight: "700" },

    listContent: {
        padding: theme.spacing.lg,
        paddingBottom: 130,
    },

    rowCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        gap: theme.spacing.md, // ✅ checkbox only adds space when rendered
    },

    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: theme.colors.muted,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    checkboxChecked: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },

    thumb: {
        width: 56,
        height: 56,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.avatarFallback,
    },

    content: { flex: 1 },
    title: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },

    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
    metaText: { color: theme.colors.muted, fontSize: 13, flex: 1 },

    statusText: { marginTop: 6, fontSize: 13, fontWeight: "700" },

    trailing: { flexDirection: "row", alignItems: "center" },
    trailingIconBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    chevronWrap: { paddingLeft: 2 },

    pressed: { opacity: 0.65 },
    disabled: { opacity: 0.4 },

    rightActionsWrap: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    deleteAction: {
        width: 64,
        height: "100%",
        backgroundColor: theme.colors.danger,
        borderRadius: theme.radius.lg,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: theme.spacing.md,
    },

    emptyContainer: { alignItems: "center", paddingVertical: 48 },
    emptyText: { color: theme.colors.text, fontSize: 18, fontWeight: "800" },
    emptySubtext: { color: theme.colors.muted, marginTop: 8 },

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

    actionPublish: { backgroundColor: "#22C55E" }, // green
    actionUnpublish: { backgroundColor: "#F59E0B" }, // amber
    actionActivate: { backgroundColor: "#3B82F6" }, // blue
    actionDeactivate: { backgroundColor: "#6B7280" }, // gray
    actionDelete: { backgroundColor: theme.colors.danger },
    actionCancel: { backgroundColor: "#2A2A2A" },

    actionDisabled: { opacity: 0.35 },

    headerRight: { flexDirection: "row", gap: theme.spacing.sm, marginRight: theme.spacing.md },
    headerIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surface,
    },

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