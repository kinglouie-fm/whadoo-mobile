import { SecondaryButton } from "./Button";
import { pickImage, uploadToStaging } from "@/src/lib/firebase-storage";
import { useAuth } from "@/src/providers/auth-context";
import { apiPost } from "@/src/lib/api";
import React, { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { theme } from "@/src/theme/theme";
import { ui } from "@/src/theme/ui";
import { typography } from "@/src/theme/typography";

interface ImageUploadButtonProps {
  currentImageUrl?: string | null;
  context: {
    type: "user_avatar" | "business_logo";
    entityId?: string;
  };
  onUploadComplete?: () => void;
}

export function ImageUploadButton({
  currentImageUrl,
  context,
  onUploadComplete,
}: ImageUploadButtonProps) {
  const { appUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async () => {
    try {
      setError(null);
      const image = await pickImage();
      if (!image) return;

      setPreviewUri(image.uri);
      setUploading(true);

      // Upload to staging
      const uploadResult = await uploadToStaging(image.uri, appUser!.firebaseUid);

      // Finalize with backend
      await apiPost("/assets/finalize", {
        storageKey: uploadResult.storageKey,
        contentType: "image/jpeg",
        width: image.width,
        height: image.height,
        context,
      });

      setUploading(false);
      onUploadComplete?.();
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err?.message || "Upload failed");
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {(currentImageUrl || previewUri) && (
        <Image
          source={{ uri: previewUri || currentImageUrl! }}
          style={styles.preview}
        />
      )}
      {uploading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <Text style={typography.caption}>Uploading...</Text>
        </View>
      ) : (
        <SecondaryButton
          title={currentImageUrl ? "Change Image" : "Upload Image"}
          onPress={handlePick}
        />
      )}
      {error && (
        <Text style={[typography.captionSmall, styles.errorText]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    ...ui.row,
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.danger,
  },
});
