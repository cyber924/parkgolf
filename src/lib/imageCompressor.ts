/**
 * Client-side high-fidelity image compression utility
 * Ensures images meet Firestore storage size limits (< 200KB)
 */

interface CompressionResult {
  compressedBase64: string;
  sizeKB: number;
}

export const compressImageBase64 = (
  base64Str: string,
  maxDimension: number = 800,
  initialQuality: number = 0.8
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    // If the image is not a base64 string, return it as is (or if it's already a regular URL)
    if (!base64Str.startsWith('data:image')) {
      resolve({ compressedBase64: base64Str, sizeKB: 0 });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale proportionally if dimensions exceed max
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Fill white background for JPEGs (handles transparent PNG backgrounds elegantly)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively compress to meet strict 200KB threshold if needed
        let quality = initialQuality;
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        let sizeInBytes = Math.round((compressedBase64.length * 3) / 4);
        let sizeKB = sizeInBytes / 1024;

        // Recursive or iterative adjustment to satisfy < 200KB limit
        while (sizeKB > 195 && quality > 0.1) {
          quality -= 0.1;
          compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          sizeInBytes = Math.round((compressedBase64.length * 3) / 4);
          sizeKB = sizeInBytes / 1024;
        }

        resolve({ compressedBase64, sizeKB });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = base64Str;
  });
};

/**
 * Calculates approximate size of base64 data string in KB
 */
export const getBase64SizeKB = (base64Str: string): number => {
  if (!base64Str) return 0;
  if (!base64Str.startsWith('data:image')) return 0;
  const contentWithoutHeader = base64Str.split(',')[1] || base64Str;
  const sizeInBytes = Math.round((contentWithoutHeader.length * 3) / 4);
  return sizeInBytes / 1024;
};
