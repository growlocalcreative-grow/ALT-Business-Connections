/**
 * Utility for client-side image resizing and compression
 * to keep Firestore documents under the 1MB limit.
 */

export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

export async function resizeImage(file: File, options: ResizeOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > options.maxWidth) {
          height = Math.round((height * options.maxWidth) / width);
          width = options.maxWidth;
        }

        if (height > options.maxHeight) {
          width = Math.round((width * options.maxHeight) / height);
          height = options.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to low-quality JPEG to minimize base64 string size
        const dataUrl = canvas.toDataURL('image/jpeg', options.quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export const MAX_IMAGE_DIMENSION = 768;
export const LOGO_DIMENSION = 400;
export const DEFAULT_QUALITY = 0.7;
