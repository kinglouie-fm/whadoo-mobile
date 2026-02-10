import { IconButton } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
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
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
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
      headerStyle: { backgroundColor: theme.colors.bg, height: 120 },
      headerShadowVisible: false,
      headerLeft: () => null,
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton
            icon={multiSelectMode ? "close" : "more-horiz"}
            size={24}
            onPress={
              multiSelectMode ? exitSelectMode : () => setMenuVisible(true)
            }
          />
        </View>
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
      <SafeAreaView style={ui.container} edges={["top"]}>
        <View style={ui.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && items.length === 0) {
    return (
      <SafeAreaView style={ui.container} edges={["top"]}>
        <View style={ui.errorContainer}>
          <Text style={typography.body}>Failed to load saved activities</Text>
          <Pressable onPress={handleRefresh}>
            <Text style={typography.body}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={ui.container} edges={["top"]}>
        <EmptyState
          icon="favorite-border"
          title="No saved activities yet"
          subtitle="Swipe down on activities to save them"
        />
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={ui.container}>
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
      </View>
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
  headerRight: {
    marginRight: 16,
  },

  listContent: {
    padding: 16,
    paddingBottom: 130,
  },

  card: {
    position: "relative",
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
  },
  title: typography.body,

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
  menuItemActive: {
    opacity: 0.9,
  },
  menuItemText: {
    ...typography.caption,
    fontWeight: "700",
  },
  menuDivider: {
    ...ui.divider,
    marginVertical: 10,
  },
});
