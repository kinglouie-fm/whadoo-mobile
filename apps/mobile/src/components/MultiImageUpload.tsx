import { SecondaryButton, DangerButton, IconButton } from "./Button";
import {
  pickMultipleImages,
  uploadToStaging,
} from "@/src/lib/firebase-storage";
import { useAuth } from "@/src/providers/auth-context";
import { apiPost } from "@/src/lib/api";
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

interface MultiImageUploadProps {
  activityId: string;
  currentImages: ImageItem[];
  onImagesChange?: () => void;
}

export function MultiImageUpload({
  activityId,
  currentImages,
  onImagesChange,
}: MultiImageUploadProps) {
  const { appUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickImages = async () => {
    try {
      setError(null);
      const images = await pickMultipleImages();
      if (images.length === 0) return;

      setUploading(true);

      // Upload each image
      for (const image of images) {
        const uploadResult = await uploadToStaging(
          image.uri,
          appUser!.firebaseUid,
        );

        // Finalize with backend
        await apiPost("/assets/finalize", {
          storageKey: uploadResult.storageKey,
          contentType: "image/jpeg",
          width: image.width,
          height: image.height,
          context: {
            type: "activity_image",
            entityId: activityId,
            isThumbnail: false,
          },
        });
      }

      setUploading(false);
      onImagesChange?.();
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err?.message || "Upload failed");
      setUploading(false);
    }
  };

  const handleSetThumbnail = async (imageId: string) => {
    try {
      // TODO: Call API to set thumbnail
      // await apiPatch(`/activities/${activityId}/images/${imageId}`, { isThumbnail: true });
      onImagesChange?.();
    } catch (err: any) {
      setError(err?.message || "Failed to set thumbnail");
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      // TODO: Call API to remove image
      // await apiDelete(`/activities/${activityId}/images/${imageId}`);
      onImagesChange?.();
    } catch (err: any) {
      setError(err?.message || "Failed to remove image");
    }
  };

  const renderImage = ({ item }: { item: ImageItem }) => (
    <View style={styles.imageCard}>
      <Image source={{ uri: item.url }} style={styles.image} />
      {item.isThumbnail && (
        <View style={styles.thumbnailBadge}>
          <Text style={styles.thumbnailText}>THUMBNAIL</Text>
        </View>
      )}
      <View style={styles.imageActions}>
        {!item.isThumbnail && (
          <IconButton
            icon="star-outline"
            size={18}
            onPress={() => handleSetThumbnail(item.id)}
          />
        )}
        <IconButton
          icon="delete-outline"
          size={18}
          onPress={() => handleRemoveImage(item.id)}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={ui.rowBetween}>
        <Text style={typography.label}>Activity Images</Text>
        <SecondaryButton
          title="+ Add Images"
          onPress={handlePickImages}
          disabled={uploading}
        />
      </View>

      {uploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <Text style={typography.caption}>Uploading images...</Text>
        </View>
      )}

      {currentImages.length > 0 ? (
        <FlatList
          data={currentImages}
          renderItem={renderImage}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      ) : (
        <Text style={[typography.bodyMuted, styles.emptyText]}>
          No images yet. Add at least one image.
        </Text>
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
  loadingContainer: {
    ...ui.row,
    gap: theme.spacing.sm,
  },
  row: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  imageCard: {
    flex: 1,
    position: "relative",
    maxWidth: "48%",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  thumbnailBadge: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  thumbnailText: {
    ...typography.captionSmall,
    color: theme.colors.bg,
    fontWeight: "900",
  },
  imageActions: {
    position: "absolute",
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.danger,
  },
});
