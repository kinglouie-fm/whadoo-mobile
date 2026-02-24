import { getApp } from "@react-native-firebase/app";
import {
  getDownloadURL,
  getStorage,
  putFile,
  ref,
} from "@react-native-firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export interface UploadResult {
  storageKey: string;
  downloadURL: string;
}

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

import * as FileSystemLegacy from "expo-file-system/legacy";
import { cacheDirectory } from "expo-file-system/legacy";

export async function uploadToStaging(imageUri: string, firebaseUid: string) {
  const filename = `${uuidv4()}.png`;
  const storageKey = `staging/${firebaseUid}/${filename}`;

  const app = getApp();
  const storage = getStorage(app, `gs://${app.options.storageBucket}`);
  const storageRef = ref(storage, storageKey);

  // Copy into app-owned cache to normalize the path/handle
  const dest = `${cacheDirectory ?? ""}${filename}`;
  await FileSystemLegacy.copyAsync({ from: imageUri, to: dest });

  const uriForPutFile =
    Platform.OS === "ios" ? dest.replace("file://", "") : dest;

  console.log("[uploadToStaging] original", imageUri);
  console.log("[uploadToStaging] copiedTo", dest);
  console.log("[uploadToStaging] uriForPutFile", uriForPutFile);

  await putFile(storageRef, uriForPutFile, { contentType: "image/png" });
  const downloadURL = await getDownloadURL(storageRef);

  return { storageKey, downloadURL };
}
