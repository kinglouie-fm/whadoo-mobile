import { SecondaryButton, DangerButton, IconButton } from "./Button";
import {
  pickMultipleImages,
  uploadToStaging,
} from "@/src/lib/firebase-storage";
import { useAuth } from "@/src/providers/auth-context";
import { apiPost, apiDelete } from "@/src/lib/api";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import { typography } from "@/src/theme/typography";
import { MaterialIcons } from "@expo/vector-icons";

interface ImageItem {
  id: string;
  url: string;
  isThumbnail: boolean;
  isUploading?: boolean;
}

interface PendingImage {
  id: string;
  uri: string;
  width: number;
  height: number;
}

interface MultiImageUploadProps {
  activityId?: string; // Optional for new activities
  currentImages: ImageItem[];
  pendingImages: PendingImage[];
  onPendingImagesChange: (images: PendingImage[]) => void;
  onImagesChange?: () => void;
  maxImages?: number;
}

export function MultiImageUpload({
  activityId,
  currentImages,
  pendingImages,
  onPendingImagesChange,
  onImagesChange,
  maxImages = 5,
}: MultiImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const totalImages = currentImages.length + pendingImages.length;
  const remainingSlots = maxImages - totalImages;

  const handlePickImages = async () => {
    try {
      setError(null);
      
      // Check if at max capacity
      if (totalImages >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      const images = await pickMultipleImages();
      if (images.length === 0) return;

      // Check if adding these images would exceed the limit
      if (totalImages + images.length > maxImages) {
        setError(`You can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}`);
        return;
      }

      // Add to pending images (not uploaded yet)
      const newPendingImages = images.map((img) => ({
        id: `pending-${Date.now()}-${Math.random()}`,
        uri: img.uri,
        width: img.width || 900,
        height: img.height || 900,
      }));

      onPendingImagesChange([...pendingImages, ...newPendingImages]);
    } catch (err: any) {
      console.error("Pick images failed:", err);
      setError(err?.message || "Failed to select images");
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!activityId) return;
    
    try {
      setDeletingImageId(imageId);
      setError(null);
      await apiDelete(`/activities/${activityId}/images/${imageId}`);
      onImagesChange?.();
    } catch (err: any) {
      console.error("Delete image failed:", err);
      setError(err?.message || "Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleRemovePendingImage = (imageId: string) => {
    onPendingImagesChange(pendingImages.filter((img) => img.id !== imageId));
  };

  const renderUploadedImage = (item: ImageItem) => (
    <View style={styles.imageCard}>
      <Image source={{ uri: item.url }} style={styles.image} />
      {item.isThumbnail && (
        <View style={styles.thumbnailBadge}>
          <Text style={styles.thumbnailText}>MAIN</Text>
        </View>
      )}
      {deletingImageId === item.id ? (
        <View style={styles.deleteButton}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveImage(item.id)}
        >
          <MaterialIcons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPendingImage = (item: PendingImage) => (
    <View style={styles.imageCard}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <View style={styles.pendingBadge}>
        <MaterialIcons name="schedule" size={12} color="#fff" />
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleRemovePendingImage(item.id)}
      >
        <MaterialIcons name="close" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={[styles.imageCard, styles.addButton]}
      onPress={handlePickImages}
      disabled={totalImages >= maxImages}
    >
      <MaterialIcons name="add" size={40} color={theme.colors.muted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={ui.rowBetween}>
        <Text style={typography.label}>
          Activity Images ({totalImages}/{maxImages})
        </Text>
        {totalImages > 0 && (
          <Text style={[typography.captionSmall, styles.helperText]}>
            {remainingSlots > 0 ? `${remainingSlots} more allowed` : 'Max reached'}
          </Text>
        )}
      </View>

      {pendingImages.length > 0 && (
        <Text style={[typography.captionSmall, styles.pendingText]}>
          {pendingImages.length} image{pendingImages.length !== 1 ? 's' : ''} will be uploaded when you save
        </Text>
      )}

      {totalImages === 0 ? (
        <View style={styles.emptyContainer}>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={handlePickImages}
          >
            <MaterialIcons name="add-photo-alternate" size={48} color={theme.colors.muted} />
            <Text style={[typography.body, styles.emptyText]}>
              Add Images
            </Text>
            <Text style={[typography.captionSmall, styles.emptySubtext]}>
              Select up to {maxImages} images (900x900)
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {currentImages.map((item) => (
            <View key={item.id} style={styles.gridItem}>
              {renderUploadedImage(item)}
            </View>
          ))}
          {pendingImages.map((item) => (
            <View key={item.id} style={styles.gridItem}>
              {renderPendingImage(item)}
            </View>
          ))}
          {totalImages < maxImages && (
            <View style={styles.gridItem}>
              {renderAddButton()}
            </View>
          )}
        </View>
      )}

      {error && (
        <Text style={[typography.captionSmall, styles.errorText]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  helperText: {
    color: theme.colors.muted,
  },
  pendingText: {
    color: theme.colors.accent,
    fontStyle: "italic",
  },
  pendingBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  gridItem: {
    width: "30%",
    aspectRatio: 1,
  },
  imageCard: {
    width: "100%",
    height: "100%",
    position: "relative",
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.surface,
  },
  thumbnailBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thumbnailText: {
    ...typography.captionSmall,
    fontSize: 10,
    color: theme.colors.bg,
    fontWeight: "900",
  },
  deleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.divider,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },
  emptyAddButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.divider,
    borderStyle: "dashed",
    backgroundColor: theme.colors.surface,
    minWidth: 200,
  },
  emptyText: {
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  emptySubtext: {
    color: theme.colors.muted,
    textAlign: "center",
  },
  errorText: {
    color: theme.colors.danger,
  },
});
