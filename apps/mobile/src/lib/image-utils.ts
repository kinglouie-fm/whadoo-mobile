export interface AssetData {
  storageKey?: string | null;
  downloadToken?: string | null;
}

export function buildImageUrl(asset?: AssetData | null): string | null {
  if (!asset?.storageKey || !asset?.downloadToken) return null;
  return `https://firebasestorage.googleapis.com/v0/b/${process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(asset.storageKey)}?alt=media&token=${asset.downloadToken}`;
}
