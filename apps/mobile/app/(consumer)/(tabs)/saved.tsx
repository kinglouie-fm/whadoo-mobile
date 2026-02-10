import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  bulkDeleteSavedActivities,
  clearSelection,
  fetchSavedActivities,
  toggleMultiSelectMode,
  toggleSelectActivity,
  unsaveActivity,
} from "@/src/store/slices/saved-activity-slice";
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
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { SafeAreaView } from "react-native-safe-area-context";

type SortMode = "recent" | "title" | "price";
const SORTS: { key: SortMode; label: string }[] = [
  { key: "recent", label: "Recently saved" },
  { key: "title", label: "Title (A–Z)" },
  { key: "price", label: "Price (low → high)" },
];

type SavedItem = {
  activityId: string;
  snapshot: {
    title?: string;
    thumbnailUrl?: string | null;
    city?: string | null;
    address?: string | null;
    priceFrom?: any;
    catalogGroupId?: string | null;
  };
};

export default function SavedActivitiesScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const navigation = useNavigation();

  const { items, loading, error, nextCursor, multiSelectMode, selectedIds } =
    useAppSelector((state) => state.savedActivities);

  const [menuVisible, setMenuVisible] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const openSwipeIdRef = useRef<string | null>(null);
  const swipeRefs = useRef<Record<string, Swipeable | null>>({});

  const closeOpenSwipeRow = () => {
    if (openSwipeIdRef.current) {
      swipeRefs.current[openSwipeIdRef.current]?.close?.();
      openSwipeIdRef.current = null;
    }
  };

  const exitSelectMode = () => {
    dispatch(toggleMultiSelectMode());
    dispatch(clearSelection());
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: multiSelectMode ? `${selectedIds.length} Selected` : "Saved",
      headerTitleStyle: { color: theme.colors.text, fontWeight: "800" },
      headerStyle: { backgroundColor: theme.colors.bg },
      headerShadowVisible: false,
      headerLeft: () => null,
      headerRight: () => (
        <Pressable
          style={styles.headerIconBtn}
          onPress={
            multiSelectMode ? exitSelectMode : () => setMenuVisible(true)
          }
        >
          <MaterialIcons
            name={multiSelectMode ? "close" : "more-horiz"}
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
      ),
    });
  }, [navigation, multiSelectMode, selectedIds.length]);

  useEffect(() => {
    dispatch(fetchSavedActivities());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchSavedActivities());
  };

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      dispatch(fetchSavedActivities({ cursor: nextCursor }));
    }
  };

  const handleUnsave = (activityId: string) => {
    dispatch(unsaveActivity(activityId));
  };

  const handleCardPress = (
    activityId: string,
    catalogGroupId: string | null | undefined,
  ) => {
    if (multiSelectMode) {
      dispatch(toggleSelectActivity(activityId));
      return;
    }

    if (catalogGroupId) {
      router.push({
        pathname: "/(consumer)/activity-detail",
        params: { catalogGroupId },
      });
    } else {
      router.push({
        pathname: "/(consumer)/activity-detail",
        params: { activityId },
      });
    }
  };

  const sortedItems = useMemo(() => {
    const arr = [...(items as SavedItem[])];

    if (sortMode === "title") {
      return arr.sort((a, b) =>
        String(a.snapshot?.title ?? "").localeCompare(
          String(b.snapshot?.title ?? ""),
        ),
      );
    }

    if (sortMode === "price") {
      return arr.sort((a, b) => {
        const pa =
          a.snapshot?.priceFrom != null
            ? Number(a.snapshot.priceFrom)
            : Number.POSITIVE_INFINITY;
        const pb =
          b.snapshot?.priceFrom != null
            ? Number(b.snapshot.priceFrom)
            : Number.POSITIVE_INFINITY;
        return pa - pb;
      });
    }

    return arr;
  }, [items, sortMode]);

  const confirmUnsave = (activityId: string, title?: string) => {
    Alert.alert(
      "Remove saved",
      `Remove "${title || "this activity"}" from saved?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => handleUnsave(activityId),
        },
      ],
    );
  };

  const confirmBulkDelete = () => {
    if (selectedIds.length === 0) return;

    Alert.alert(
      "Remove selected",
      `Remove ${selectedIds.length} saved activities?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => dispatch(bulkDeleteSavedActivities(selectedIds)),
        },
      ],
    );
  };

  const renderRightActions = (activityId: string, title?: string) => {
    return (
      <View style={styles.rightActionsWrap}>
        <Pressable
          style={styles.deleteAction}
          onPress={() => {
            closeOpenSwipeRow();
            confirmUnsave(activityId, title);
          }}
        >
          <MaterialIcons name="delete" size={20} color="#fff" />
        </Pressable>
      </View>
    );
  };

  const renderItem = ({ item }: { item: SavedItem }) => {
    const isSelected = selectedIds.includes(item.activityId);

    const locationText = item.snapshot?.address || item.snapshot?.city || "—";
    const priceText =
      item.snapshot?.priceFrom != null
        ? `From €${Number(item.snapshot.priceFrom).toFixed(2)}`
        : "";

    return (
      <Swipeable
        ref={(ref) => {
          swipeRefs.current[item.activityId] = ref;
        }}
        enabled={!multiSelectMode}
        onSwipeableWillOpen={() => {
          if (
            openSwipeIdRef.current &&
            openSwipeIdRef.current !== item.activityId
          ) {
            swipeRefs.current[openSwipeIdRef.current]?.close?.();
          }
          openSwipeIdRef.current = item.activityId;
        }}
        renderRightActions={() =>
          !multiSelectMode
            ? renderRightActions(item.activityId, item.snapshot?.title)
            : null
        }
      >
        <Pressable
          style={[styles.card, isSelected && styles.cardSelected]}
          onPress={() =>
            handleCardPress(item.activityId, item.snapshot?.catalogGroupId)
          }
          onLongPress={() => {
            if (!multiSelectMode) {
              dispatch(toggleMultiSelectMode());
              dispatch(clearSelection());
              dispatch(toggleSelectActivity(item.activityId));
            }
          }}
        >
          {multiSelectMode && (
            <Pressable
              onPress={() => dispatch(toggleSelectActivity(item.activityId))}
              style={[styles.checkbox, isSelected && styles.checkboxChecked]}
              hitSlop={10}
            >
              {isSelected ? (
                <MaterialIcons name="check" size={16} color={theme.colors.bg} />
              ) : null}
            </Pressable>
          )}

          {item.snapshot?.thumbnailUrl ? (
            <Image
              source={{ uri: item.snapshot.thumbnailUrl }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
              <Text style={styles.placeholderText}>📸</Text>
            </View>
          )}

          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={1}>
              {item.snapshot?.title || "Untitled"}
            </Text>

            <View style={styles.infoRow}>
              <MaterialIcons
                name="place"
                size={16}
                color={stylesVars.subText}
              />
              <Text style={styles.subText} numberOfLines={1}>
                {locationText}
              </Text>
            </View>

            {priceText ? (
              <View style={[styles.infoRow, { marginTop: 6 }]}>
                <MaterialIcons
                  name="local-offer"
                  size={16}
                  color={stylesVars.subText}
                />
                <Text style={styles.subText} numberOfLines={1}>
                  {priceText}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.chevronWrap}>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={stylesVars.subText}
            />
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load saved activities</Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="favorite-border"
            size={64}
            color={theme.colors.muted}
          />
          <Text style={styles.emptyTitle}>No saved activities yet</Text>
          <Text style={styles.emptySubtitle}>
            Swipe down on activities to save them
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <FlatList
          data={sortedItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.activityId}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onScrollBeginDrag={closeOpenSwipeRow}
        />

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
              <Text style={styles.menuTitle}>Manage saved</Text>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  if (!multiSelectMode) dispatch(toggleMultiSelectMode());
                  dispatch(clearSelection());
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

              <Text style={styles.menuSectionTitle}>Sort</Text>

              {SORTS.map((s) => {
                const active = sortMode === s.key;
                return (
                  <Pressable
                    key={s.key}
                    style={[styles.menuItem, active && styles.menuItemActive]}
                    onPress={() => {
                      setSortMode(s.key);
                      setMenuVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name={
                        active
                          ? "radio-button-checked"
                          : "radio-button-unchecked"
                      }
                      size={18}
                      color={theme.colors.text}
                    />
                    <Text style={styles.menuItemText}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>

        {multiSelectMode && (
          <View style={styles.bottomBar}>
            <Pressable
              style={[
                styles.bottomAction,
                styles.actionDelete,
                selectedIds.length === 0 && styles.actionDisabled,
              ]}
              disabled={selectedIds.length === 0}
              onPress={confirmBulkDelete}
            >
              <MaterialIcons name="delete" size={18} color="#fff" />
            </Pressable>

            <Pressable
              style={[styles.bottomAction, styles.actionCancel]}
              onPress={exitSelectMode}
            >
              <MaterialIcons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const stylesVars = {
  cardBg: "rgba(255,255,255,0.08)",
  opacity: 0.08,
  text: "#FFFFFF",
  subText: "rgba(255,255,255,0.78)",
};

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

  listContent: {
    padding: 16,
    paddingBottom: 130,
  },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.danger,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.colors.muted,
    marginTop: 8,
    textAlign: "center",
  },

  // --- card (match screenshot vibe) ---
  card: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: stylesVars.cardBg,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    gap: 12,

    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },

    // Android shadow
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

  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  placeholderThumbnail: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 28 },

  cardContent: { flex: 1, minHeight: 64, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "600", color: stylesVars.text },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  subText: {
    color: stylesVars.subText,
    fontSize: 12,
    flex: 1,
  },

  chevronWrap: {
    width: 28,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 4,
  },

  // swipe delete action (same as activities.tsx style)
  rightActionsWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  deleteAction: {
    width: 64,
    height: "100%",
    backgroundColor: theme.colors.danger,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  // floating multiselect bar
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
  actionDelete: { backgroundColor: theme.colors.danger },
  actionCancel: { backgroundColor: "#2A2A2A" },
  actionDisabled: { opacity: 0.35 },

  // menu sheet
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
  menuItemActive: { opacity: 0.9 },
  menuItemText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 10,
  },
});
