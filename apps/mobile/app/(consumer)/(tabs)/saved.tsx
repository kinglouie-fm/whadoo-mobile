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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavedActivitiesScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const navigation = useNavigation();
  const { items, loading, error, nextCursor, multiSelectMode, selectedIds } = useAppSelector(
    (state) => state.savedActivities
  );
  type SortMode = "recent" | "title" | "price";
  const SORTS: { key: SortMode; label: string }[] = [
    { key: "recent", label: "Recently saved" },
    { key: "title", label: "Title (A–Z)" },
    { key: "price", label: "Price (low → high)" },
  ];

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

  const sortedItems = useMemo(() => {
    const arr = [...items];
    if (sortMode === "title") {
      return arr.sort((a, b) =>
        String(a.snapshot?.title ?? "").localeCompare(String(b.snapshot?.title ?? ""))
      );
    }
    if (sortMode === "price") {
      return arr.sort((a, b) => {
        const pa = a.snapshot?.priceFrom != null ? Number(a.snapshot.priceFrom) : Number.POSITIVE_INFINITY;
        const pb = b.snapshot?.priceFrom != null ? Number(b.snapshot.priceFrom) : Number.POSITIVE_INFINITY;
        return pa - pb;
      });
    }
    // "recent" -> keep backend ordering
    return arr;
  }, [items, sortMode]);

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
          style={{
            marginRight: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.surface,
          }}
          onPress={multiSelectMode ? exitSelectMode : () => setMenuVisible(true)}
        >
          <Ionicons
            name={multiSelectMode ? "close" : "ellipsis-horizontal"}
            size={22}
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

  const handleCardPress = (activityId: string, catalogGroupId: string | null) => {
    if (multiSelectMode) {
      dispatch(toggleSelectActivity(activityId));
    } else {
      // Navigate to activity detail
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
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      dispatch(bulkDeleteSavedActivities(selectedIds));
    }
  };

  const renderRightActions = (activityId: string, title?: string) => {
    return (
      <View style={styles.rightActionsWrap}>
        <Pressable
          style={styles.deleteAction}
          onPress={() => {
            closeOpenSwipeRow();
            Alert.alert("Remove saved", `Remove "${title || "this activity"}" from saved?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Remove", style: "destructive", onPress: () => handleUnsave(activityId) },
            ]);
          }}
        >
          <Ionicons name="trash" size={20} color="#fff" />
        </Pressable>
      </View>
    );
  };

  const renderItem = ({ item }: any) => {
    const isSelected = selectedIds.includes(item.activityId);

    return (
      <Swipeable
        ref={(ref) => {
          swipeRefs.current[item.activityId] = ref;
        }}
        enabled={!multiSelectMode}
        onSwipeableWillOpen={() => {
          if (openSwipeIdRef.current && openSwipeIdRef.current !== item.activityId) {
            swipeRefs.current[openSwipeIdRef.current]?.close?.();
          }
          openSwipeIdRef.current = item.activityId;
        }}
        renderRightActions={() =>
          !multiSelectMode ? renderRightActions(item.activityId, item.snapshot?.title) : null
        }
      >
        <Pressable
          style={[styles.card, multiSelectMode && { gap: 12, padding: 12 }, isSelected && styles.cardSelected]}
          onPress={() => handleCardPress(item.activityId, item.snapshot.catalogGroupId)}
        >
          <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
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
                  <Ionicons name="checkbox-outline" size={18} color={theme.colors.text} />
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
                      <Ionicons
                        name={active ? "radio-button-on" : "radio-button-off"}
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
            <Pressable
              onPress={() => dispatch(toggleSelectActivity(item.activityId))}
              style={[styles.checkbox, isSelected && styles.checkboxChecked]}
              hitSlop={10}
            >
              {isSelected ? (
                <Ionicons name="checkmark" size={16} color={theme.colors.bg} />
              ) : null}
            </Pressable>
          )}
          {item.snapshot.thumbnailUrl ? (
            <Image
              source={{ uri: item.snapshot.thumbnailUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
              <Text style={styles.placeholderText}>📸</Text>
            </View>
          )}
          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={2}>
              {item.snapshot.title}
            </Text>
            {item.snapshot.city && (
              <Text style={styles.location}>📍 {item.snapshot.city}</Text>
            )}
            {item.snapshot.priceFrom && (
              <Text style={styles.price}>From €{Number(item.snapshot.priceFrom).toFixed(2)}</Text>
            )}
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
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={theme.colors.muted} />
          <Text style={styles.emptyTitle}>No saved activities yet</Text>
          <Text style={styles.emptySubtitle}>Swipe down on activities to save them</Text>
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

        {multiSelectMode && (
          <View style={styles.bottomBar}>
            <Pressable
              style={[
                styles.bottomAction,
                styles.actionDelete,
                selectedIds.length === 0 && styles.actionDisabled,
              ]}
              disabled={selectedIds.length === 0}
              onPress={() => {
                if (selectedIds.length === 0) return;
                Alert.alert("Remove selected", `Remove ${selectedIds.length} saved activities?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => dispatch(bulkDeleteSavedActivities(selectedIds)),
                  },
                ]);
              }}
            >
              <Ionicons name="trash" size={18} color="#fff" />
            </Pressable>

            <Pressable style={[styles.bottomAction, styles.actionCancel]} onPress={exitSelectMode}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
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
  listContent: {
    padding: 16,
    paddingBottom: 130,
  },
  card: {
    flexDirection: "row",
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardSelected: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.accent,
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
  thumbnail: {
    width: 100,
    height: 100,
  },
  placeholderThumbnail: {
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.accent,
  },
  deleteButton: {
    backgroundColor: theme.colors.danger,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
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

  rightActionsWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  deleteAction: {
    width: 64,
    height: "100%",
    backgroundColor: theme.colors.danger,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

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
  menuTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800", marginBottom: 12 },
  menuSectionTitle: { color: theme.colors.muted, fontSize: 12, fontWeight: "800", marginBottom: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  menuItemActive: { opacity: 0.9 },
  menuItemText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  menuDivider: { height: 1, backgroundColor: theme.colors.divider, marginVertical: 10 },
});
