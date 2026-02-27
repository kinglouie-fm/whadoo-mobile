import '@testing-library/react-native/extend-expect';

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({
    options: {
      storageBucket: 'test-bucket',
    },
  })),
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-uid',
      getIdToken: jest.fn(() => Promise.resolve('test-token')),
    },
  })),
}));

jest.mock('@react-native-firebase/storage', () => ({}));

// Mock expo modules
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [
        {
          uri: 'test-image-uri',
          width: 100,
          height: 100,
          mimeType: 'image/jpeg',
        },
      ],
    })
  ),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
