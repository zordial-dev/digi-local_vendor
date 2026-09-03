import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PickedImageResult {
  uri: string;
  base64?: string;
  fileName?: string;
  mimeType?: string;
  file?: any;
}

/**
 * Compresses an image file/data URL using canvas (Web) to keep payload under 80KB.
 */
function compressImageOnWeb(file: File, maxDimension = 600, quality = 0.6): Promise<{ dataUrl: string; base64: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Only = compressedDataUrl.split('base64,')[1] || compressedDataUrl;
          resolve({ dataUrl: compressedDataUrl, base64: base64Only });
        } else {
          const raw = (e.target?.result as string) || '';
          const b64 = raw.includes('base64,') ? raw.split('base64,')[1] : raw;
          resolve({ dataUrl: raw, base64: b64 });
        }
      };
      img.onerror = () => {
        const raw = (e.target?.result as string) || '';
        const b64 = raw.includes('base64,') ? raw.split('base64,')[1] : raw;
        resolve({ dataUrl: raw, base64: b64 });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve({ dataUrl: '', base64: '' });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Universal Image Picker that works reliably on:
 * - macOS (Safari, Chrome, Edge, Firefox, Desktop web)
 * - iOS / Android (Expo Native)
 * Automatically compresses images to prevent 413 Payload Too Large errors.
 */
export async function pickImageFromDevice(options?: {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
}): Promise<PickedImageResult | null> {
  const isWeb = Platform.OS === 'web' || (typeof window !== 'undefined' && typeof document !== 'undefined');

  if (isWeb && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,image/png,image/jpeg,image/jpg,image/webp,image/gif';
        input.style.display = 'none';

        input.onchange = async (e: any) => {
          const files = e?.target?.files;
          if (files && files.length > 0) {
            const file = files[0];
            const fileName = file.name || `image_${Date.now()}.jpg`;
            const mimeType = 'image/jpeg';

            const { dataUrl, base64 } = await compressImageOnWeb(file, 600, options?.quality ?? 0.6);

            resolve({
              uri: dataUrl,
              base64,
              fileName,
              mimeType,
              file,
            });
            input.remove();
          } else {
            resolve(null);
            input.remove();
          }
        };

        input.oncancel = () => {
          resolve(null);
          input.remove();
        };

        document.body.appendChild(input);
        input.click();
      } catch (err) {
        console.warn('DOM file input failed, falling back to expo-image-picker:', err);
        fallbackExpoPicker(options).then(resolve);
      }
    });
  }

  return fallbackExpoPicker(options);
}

/**
 * Capture photo from camera (on Mac/Web, triggers camera capture or opens file dialog)
 */
export async function captureImageFromDevice(options?: {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
}): Promise<PickedImageResult | null> {
  const isWeb = Platform.OS === 'web' || (typeof window !== 'undefined' && typeof document !== 'undefined');

  if (isWeb && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
        input.style.display = 'none';

        input.onchange = async (e: any) => {
          const files = e?.target?.files;
          if (files && files.length > 0) {
            const file = files[0];
            const fileName = file.name || `camera_${Date.now()}.jpg`;
            const mimeType = 'image/jpeg';

            const { dataUrl, base64 } = await compressImageOnWeb(file, 600, options?.quality ?? 0.6);

            resolve({
              uri: dataUrl,
              base64,
              fileName,
              mimeType,
              file,
            });
            input.remove();
          } else {
            resolve(null);
            input.remove();
          }
        };

        input.oncancel = () => {
          resolve(null);
          input.remove();
        };

        document.body.appendChild(input);
        input.click();
      } catch (_) {
        fallbackExpoCamera(options).then(resolve);
      }
    });
  }

  return fallbackExpoCamera(options);
}

async function fallbackExpoPicker(options?: {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
}): Promise<PickedImageResult | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted' && Platform.OS !== 'web') {
      throw new Error('Gallery permission is required to select photos.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect ?? [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        base64: asset.base64 || undefined,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
      };
    }
  } catch (err: any) {
    console.error('Expo ImagePicker error:', err);
    throw err;
  }
  return null;
}

async function fallbackExpoCamera(options?: {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
}): Promise<PickedImageResult | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted' && Platform.OS !== 'web') {
      throw new Error('Camera permission is required to capture photos.');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect ?? [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        base64: asset.base64 || undefined,
        fileName: asset.fileName || `capture_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
      };
    }
  } catch (err: any) {
    console.error('Expo Camera error:', err);
    throw err;
  }
  return null;
}
