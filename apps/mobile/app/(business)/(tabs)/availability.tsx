import { useBusiness } from "@/src/providers/business-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  AvailabilityTemplate,
  deactivateTemplate,
  fetchTemplates,
} from "@/src/store/slices/availability-template-slice";
import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import Swipeable from "react-native-gesture-handler/Swipeable";

type FilterStatus = "all" | "active" | "inactive";
const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(timeStr: string) {
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Luxembourg",
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

const stylesVars = {
  cardBg: "rgba(255,255,255,0.08)", //  same vibe as saved.tsx
  text: "#FFFFFF",
  subText: "rgba(255,255,255,0.78)",
  iconBg: "rgba(255,255,255,0.25)",
};

export default function AvailabilityScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { business, loading: businessLoading } = useBusiness();
  const { templates, loading, error } = useAppSelector(
    (state) => state.availabilityTemplates,
  );

  const businessId = business?.id;

  const [refreshing, setRefreshing] = useState(false);

  // menu + filter
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedCount = selectedIds.size;

  //  keep only one swipe row open at a time (same pattern as saved/activities)
  const openSwipeIdRef = useRef<string | null>(null);
  const swipeRefs = useRef<Record<string, Swipeable | null>>({});

  const closeOpenSwipeRow = () => {
    if (openSwipeIdRef.current) {
      swipeRefs.current[openSwipeIdRef.current]?.close?.();
      openSwipeIdRef.current = null;
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTemplates();
    setRefreshing(false);
  };

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

  const filteredTemplates = useMemo(() => {
    if (filterStatus === "all") return templates;
    return templates.filter((t) => t.status === filterStatus);
  }, [templates, filterStatus]);

  const selectedTemplates = useMemo(
    () => templates.filter((t) => selectedIds.has(t.id)),
    [templates, selectedIds],
  );

  const deactivatableIds = useMemo(
    () =>
      selectedTemplates.filter((t) => t.status === "active").map((t) => t.id),
    [selectedTemplates],
  );

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
              Alert.alert(
                "Error",
                err.message || "Failed to deactivate template(s)",
              );
            }
          },
        },
      ],
    );
  };

  const openHeaderMenu = () => {
    if (selectMode) return;
    setMenuVisible(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: theme.colors.bg, height: 120 },
      title: selectMode ? `${selectedCount} Selected` : "Manage Availabilities",
      headerTitleStyle: { color: theme.colors.text, fontWeight: "800" },
      headerShadowVisible: false,
      headerLeft: () => null,
      headerRight: () => (
        <View style={styles.headerRight}>
          {!selectMode && (
            <Pressable
              style={styles.headerIconBtn}
              onPress={() => router.push("/(business)/availability/detail")}
            >
              <MaterialIcons name="add" size={22} color={theme.colors.text} />
            </Pressable>
          )}

          <Pressable
            style={styles.headerIconBtn}
            onPress={selectMode ? exitSelectMode : openHeaderMenu}
          >
            <MaterialIcons
              name="more-horiz"
              size={22}
              color={theme.colors.text}
            />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, router, selectMode, selectedCount]);

  const renderRightActions = (item: AvailabilityTemplate) => {
    // only swipe action for active templates
    if (item.status !== "active" || selectMode) return null;

    return (
      <View style={styles.rightActionsWrap}>
        <Pressable
          style={styles.deactivateAction}
          onPress={() => {
            closeOpenSwipeRow();
            confirmDeactivate([item.id], true);
          }}
        >
          <MaterialIcons name="pause" size={20} color="#fff" />
        </Pressable>
      </View>
    );
  };

  const renderItem = ({ item }: { item: AvailabilityTemplate }) => {
    const isSelected = selectedIds.has(item.id);
    const isActive = item.status === "active";

    const daysText = formatDays(item.daysOfWeek);
    const timeText = `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`;
    const metaText = `${item.slotDurationMinutes} min • Capacity: ${item.capacity}`;
    const statusLabel = isActive ? "Active" : "Inactive";
    const statusColor = isActive ? theme.colors.accent : theme.colors.muted;

    return (
      <Swipeable
        ref={(ref) => {
          swipeRefs.current[item.id] = ref;
        }}
        enabled={!selectMode && isActive}
        onSwipeableWillOpen={() => {
          if (openSwipeIdRef.current && openSwipeIdRef.current !== item.id) {
            swipeRefs.current[openSwipeIdRef.current]?.close?.();
          }
          openSwipeIdRef.current = item.id;
        }}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        <Pressable
          style={[styles.card, selectMode && isSelected && styles.cardSelected]}
          onPress={() => {
            if (selectMode) toggleSelected(item.id);
            else router.push(`/(business)/availability/detail?id=${item.id}`);
          }}
          onLongPress={() => {
            if (!selectMode) {
              setSelectMode(true);
              setSelectedIds(new Set([item.id]));
            } else {
              toggleSelected(item.id);
            }
          }}
        >
          {selectMode && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                toggleSelected(item.id);
              }}
              style={[styles.checkbox, isSelected && styles.checkboxChecked]}
              hitSlop={10}
            >
              {isSelected ? (
                <MaterialIcons name="check" size={16} color={theme.colors.bg} />
              ) : null}
            </Pressable>
          )}

          <View style={styles.iconBox}>
            <MaterialIcons
              name="calendar-month"
              size={22}
              color={stylesVars.text}
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>

            <View style={styles.infoRow}>
              <MaterialIcons
                name="repeat"
                size={16}
                color={stylesVars.subText}
              />
              <Text style={styles.subText} numberOfLines={1}>
                {daysText || "—"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons
                name="access-time"
                size={16}
                color={stylesVars.subText}
              />
              <Text style={styles.subText} numberOfLines={1}>
                {timeText}
              </Text>
            </View>

            <View style={[styles.infoRow, { marginTop: 6 }]}>
              <MaterialIcons
                name="timer"
                size={16}
                color={stylesVars.subText}
              />
              <Text style={styles.subText} numberOfLines={1}>
                {metaText}
              </Text>
            </View>

            {/*  status stays as simple text line (no pill) */}
            <Text
              style={[styles.statusText, { color: statusColor }]}
              numberOfLines={1}
            >
              {statusLabel}
            </Text>
          </View>

          <View style={styles.trailing}>
            {isActive ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  confirmDeactivate([item.id], true);
                }}
                hitSlop={10}
                disabled={selectMode}
                style={({ pressed }) => [
                  styles.trailingIconBtn,
                  pressed && !selectMode ? styles.pressed : null,
                  selectMode ? styles.disabled : null,
                ]}
              >
                <MaterialIcons
                  name="sync"
                  size={18}
                  color={stylesVars.subText}
                />
              </Pressable>
            ) : (
              <View style={{ width: 34, height: 34 }} />
            )}

            <View style={styles.chevronWrap}>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color={stylesVars.subText}
              />
            </View>
          </View>
        </Pressable>
      </Swipeable>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScrollBeginDrag={closeOpenSwipeRow}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No availability templates.</Text>
            <Text style={styles.emptySub}>
              Create your first one to get started.
            </Text>
          </View>
        }
      />

      {/*  Select-mode bottom bar: only Deactivate + Cancel */}
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
            <MaterialIcons name="pause" size={18} color="#fff" />
          </Pressable>

          <Pressable
            style={[styles.bottomAction, styles.actionCancel]}
            onPress={exitSelectMode}
          >
            <MaterialIcons name="close" size={18} color="#fff" />
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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
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
              <MaterialIcons
                name="check-box"
                size={18}
                color={theme.colors.text}
              />
              <Text style={styles.menuItemText}>Select</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Text style={styles.menuSectionTitle}>Filter</Text>

            {FILTERS.map((f) => {
              const active = filterStatus === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => {
                    setFilterStatus(f.key);
                    setMenuVisible(false);
                  }}
                >
                  <MaterialIcons
                    name="radio-button-off"
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
  container: { flex: 1, backgroundColor: theme.colors.bg },

  headerRight: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },

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

  listContent: { padding: 16, paddingBottom: 10 },

  //  card matches saved.tsx style, but with icon instead of image
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
  cardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },

  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: stylesVars.iconBg,
    alignItems: "center",
    justifyContent: "center",
  },

  cardContent: { flex: 1, minHeight: 64, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "600", color: stylesVars.text },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  subText: {
    color: stylesVars.subText,
    fontSize: 12,
    flex: 1,
  },

  statusText: { marginTop: 6, fontSize: 12 },

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
    marginBottom: 14,
  },
  deactivateAction: {
    width: 64,
    height: "100%",
    backgroundColor: theme.colors.danger,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

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

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
  },
  centerText: { color: theme.colors.muted, marginTop: 10 },

  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  emptySub: { color: theme.colors.muted, marginTop: 6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
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
  menuItemActive: { opacity: 0.9 },
  menuItemText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 10,
  },
});
