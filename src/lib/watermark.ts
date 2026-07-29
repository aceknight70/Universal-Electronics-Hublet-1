// watermark.ts
export interface WatermarkSettings {
  url: string;
  opacity: number;
  position: 'center' | 'bottom-right' | 'diagonal';
  scale: number;
}

export async function applyWatermark(
  file: File, 
  settings?: WatermarkSettings, 
  isThumbnail: boolean = false
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to get canvas context'));

      // Target max dimensions based on whether it's a thumbnail or full-res
      const MAX_WIDTH = isThumbnail ? 600 : 1200;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.floor(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      // If no watermark settings or URL, just resolve the resized image
      if (!settings || !settings.url) {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
        return;
      }

      // Draw watermark
      const wmImg = new Image();
      wmImg.crossOrigin = 'anonymous'; // Important for external URLs
      wmImg.onload = () => {
        ctx.globalAlpha = settings.opacity || 0.5;

        const wmScale = settings.scale || 0.2;
        const wmWidth = width * wmScale;
        const wmHeight = wmImg.height * (wmWidth / wmImg.width);

        if (settings.position === 'diagonal') {
          ctx.translate(width / 2, height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.drawImage(wmImg, -wmWidth / 2, -wmHeight / 2, wmWidth, wmHeight);
          ctx.rotate(Math.PI / 4);
          ctx.translate(-width / 2, -height / 2);
        } else if (settings.position === 'center') {
          ctx.drawImage(wmImg, (width - wmWidth) / 2, (height - wmHeight) / 2, wmWidth, wmHeight);
        } else {
          // Bottom right (default)
          const padding = width * 0.05;
          ctx.drawImage(wmImg, width - wmWidth - padding, height - wmHeight - padding, wmWidth, wmHeight);
        }

        ctx.globalAlpha = 1.0;

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      };

      wmImg.onerror = () => {
        // If watermark fails to load, just return the un-watermarked (but resized) image
        console.warn('Failed to load watermark image, saving without watermark');
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      };

      wmImg.src = settings.url;
    };
    
    img.onerror = () => reject(new Error('Failed to load original image'));
    img.src = url;
  });
}
