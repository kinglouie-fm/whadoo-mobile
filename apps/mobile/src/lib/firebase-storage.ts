import { getAuth } from "@react-native-firebase/auth";
import * as ImagePicker from "expo-image-picker";

export interface UploadResult {
  storageKey: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Pick an image from the media library.
 */
export async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to access media library denied");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.9,
    exif: false,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

/**
 * Pick multiple images from the media library.
 */
export async function pickMultipleImages(): Promise<
  ImagePicker.ImagePickerAsset[]
> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to access media library denied");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    quality: 0.9,
    exif: false,
  });

  if (result.canceled) return [];
  return result.assets;
}

/**
 * Upload an image to the staging area.
 */
export async function uploadToStaging(
  asset: ImagePicker.ImagePickerAsset,
): Promise<UploadResult> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL!;

  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();

  const formData = new FormData();

  const mimeType = asset.mimeType || "image/jpeg";
  const ext = mimeType.split("/")[1]?.split("+")[0] || "jpg";

  formData.append("image", {
    uri: asset.uri,
    name: asset.fileName || `upload.${ext}`,
    type: mimeType,
  } as any);

  const response = await fetch(`${API_URL}/assets/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Upload failed (${response.status})`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        const errorMap: Record<string, string> = {
          INVALID_FILE_TYPE:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
          FILE_TOO_LARGE: "File is too large. Maximum size is 10MB.",
          MAX_IMAGES_REACHED: "Activity already has the maximum of 5 images.",
          RATE_LIMIT_EXCEEDED:
            "Too many uploads. Please wait before trying again.",
        };
        errorMessage = errorMap[errorData.error] || errorData.error;
      }
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}
