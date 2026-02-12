import { getApp } from "@react-native-firebase/app";
import {
  getDownloadURL,
  getStorage,
  putFile,
  ref,
} from "@react-native-firebase/storage";
import * as ImagePicker from "expo-image-picker";
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

export async function uploadToStaging(
  imageUri: string,
  firebaseUid: string,
): Promise<UploadResult> {
  const filename = `${uuidv4()}.jpg`;
  const storageKey = `staging/${firebaseUid}/${filename}`;

  const app = getApp();
  const storage = getStorage(app);

  const storageRef = ref(storage, storageKey);

  await putFile(storageRef, imageUri);
  const downloadURL = await getDownloadURL(storageRef);

  return { storageKey, downloadURL };
}
