import { pickImage, pickMultipleImages } from '../../lib/firebase-storage';
import * as ImagePicker from 'expo-image-picker';

describe('Firebase Storage Utilities', () => {
  describe('pickImage', () => {
    it('should return null when user cancels', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
      });

      const result = await pickImage();

      expect(result).toBeNull();
    });

    it('should return first asset when user selects image', async () => {
      const mockAsset = {
        uri: 'test-uri',
        width: 200,
        height: 200,
        mimeType: 'image/png',
      };

      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [mockAsset],
      });

      const result = await pickImage();

      expect(result).toEqual(mockAsset);
    });

    it('should throw error when permission denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({ status: 'denied' });

      await expect(pickImage()).rejects.toThrow(
        'Permission to access media library denied'
      );
    });
  });

  describe('pickMultipleImages', () => {
    it('should return empty array when user cancels', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
      });

      const result = await pickMultipleImages();

      expect(result).toEqual([]);
    });

    it('should return all assets when user selects multiple images', async () => {
      const mockAssets = [
        {
          uri: 'test-uri-1',
          width: 200,
          height: 200,
          mimeType: 'image/png',
        },
        {
          uri: 'test-uri-2',
          width: 300,
          height: 300,
          mimeType: 'image/jpeg',
        },
      ];

      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: mockAssets,
      });

      const result = await pickMultipleImages();

      expect(result).toEqual(mockAssets);
      expect(result.length).toBe(2);
    });
  });
});
