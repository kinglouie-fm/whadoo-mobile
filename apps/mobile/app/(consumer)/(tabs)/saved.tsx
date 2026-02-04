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
import React, { useEffect, useLayoutEffect } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Saved",
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
          onPress={() => {
            // Show menu for "Choose" / "Filter" options
            // For now, just toggle multiselect mode
            dispatch(toggleMultiSelectMode());
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, multiSelectMode]);

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

  const renderRightActions = (activityId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleUnsave(activityId)}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: any) => {
    const isSelected = selectedIds.includes(item.activityId);

    return (
      <Swipeable
        renderRightActions={() => !multiSelectMode && renderRightActions(item.activityId)}
        enabled={!multiSelectMode}
      >
        <Pressable
          style={[styles.card, isSelected && styles.cardSelected]}
          onPress={() => handleCardPress(item.activityId, item.snapshot.catalogGroupId)}
        >
          {multiSelectMode && (
            <View style={styles.checkbox}>
              <Ionicons
                name={isSelected ? "checkbox" : "square-outline"}
                size={28}
                color={isSelected ? theme.colors.accent : theme.colors.muted}
              />
            </View>
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
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.activityId}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />

        {multiSelectMode && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                dispatch(toggleMultiSelectMode());
                dispatch(clearSelection());
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.deleteSelectedButton,
                selectedIds.length === 0 && styles.deleteSelectedButtonDisabled,
              ]}
              onPress={handleBulkDelete}
              disabled={selectedIds.length === 0}
            >
              <Text style={styles.deleteSelectedButtonText}>
                Delete ({selectedIds.length})
              </Text>
            </TouchableOpacity>
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
    width: 50,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    padding: 16,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  deleteSelectedButton: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteSelectedButtonDisabled: {
    opacity: 0.5,
  },
  deleteSelectedButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
