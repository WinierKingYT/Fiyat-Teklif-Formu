// Image Optimizer Utility
import Logger from '@/utils/logger';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

class ImageOptimizer {
    private maxWidth: number;
    private maxHeight: number;
    private quality: number;
    private maxFileSize: number;

    constructor() {
        this.maxWidth = 800; // Increased resolution for better quality
        this.maxHeight = 600;
        this.quality = 0.7;
        this.maxFileSize = 300 * 1024; // Increased target output size to 300KB
    }

    async optimizeImage(file: File, isStamp = false): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
                reject(new Error('Geçersiz dosya türü. Sadece JPEG, PNG, GIF ve WebP formatları desteklenir.'));
                return;
            }

            // Allow up to 10MB input
            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('Resim boyutu 10MB\'dan küçük olmalıdır'));
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas bağlamı alınamadı'));
                return;
            }
            const img = new Image();

            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                try {
                    const { width, height } = this.calculateScale(img.width, img.height);

                    canvas.width = width;
                    canvas.height = height;

                    ctx.imageSmoothingQuality = 'medium';

                    if (isStamp) {
                        ctx.clearRect(0, 0, width, height);
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    const mimeType = this.getOptimalFormat(file.type, isStamp);
                    const quality = this.calculateQuality(file.size, isStamp);

                    const optimizedDataUrl = canvas.toDataURL(mimeType, quality);

                    const optimizedSize = this.getBase64Size(optimizedDataUrl);

                    Logger.log(`Resim optimize edildi: ${(file.size / 1024).toFixed(1)}KB -> ${(optimizedSize / 1024).toFixed(1)}KB`);

                    // If still too large, try one more aggressive pass
                    if (optimizedSize > this.maxFileSize && !isStamp) {
                        const aggressiveQuality = quality * 0.7;
                        const reOptimizedDataUrl = canvas.toDataURL(mimeType, aggressiveQuality);
                        const reOptimizedSize = this.getBase64Size(reOptimizedDataUrl);

                        if (reOptimizedSize > this.maxFileSize * 1.5) { // Allow slightly over if needed
                            Logger.warn('Resim hedeflenen boyuta indirilemedi, ancak devam ediliyor.');
                        }
                        resolve(reOptimizedDataUrl);
                        return;
                    }

                    resolve(optimizedDataUrl);
                } catch (error: unknown) {
                    reject(error);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                const reader = new FileReader();
                reader.onload = (e: ProgressEvent<FileReader>) => {
                    const result = typeof e.target?.result === 'string' ? e.target.result : '';
                    if (!result || !result.startsWith('data:image/')) {
                        reject(new Error('Geçersiz resim verisi'));
                        return;
                    }
                    const resultSize = this.getBase64Size(result);
                    // If raw file is small enough, just use it
                    if (resultSize < this.maxFileSize * 2) {
                        resolve(result);
                    } else {
                        reject(new Error('Resim işlenemedi ve boyutu çok büyük'));
                    }
                };
                reader.onerror = () => reject(new Error('Resim yüklenemedi'));
                reader.readAsDataURL(file);
            };

            img.src = objectUrl;
        });
    }

    calculateScale(originalWidth: number, originalHeight: number) {
        let width = originalWidth;
        let height = originalHeight;

        if (width > this.maxWidth) {
            height = (height * this.maxWidth) / width;
            width = this.maxWidth;
        }

        if (height > this.maxHeight) {
            width = (width * this.maxHeight) / height;
            height = this.maxHeight;
        }

        return { width: Math.round(width), height: Math.round(height) };
    }

    getOptimalFormat(originalType: string, isStamp = false) {
        if (isStamp || originalType === 'image/png') {
            return 'image/png';
        }
        if (originalType === 'image/gif' || originalType === 'image/webp') {
            return 'image/jpeg';
        }
        return originalType === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    }

    calculateQuality(originalSize: number, isStamp = false) {
        if (isStamp) return 0.8;

        if (originalSize > 5 * 1024 * 1024) return 0.5; // Aggressive for >5MB
        if (originalSize > 2 * 1024 * 1024) return 0.6;
        if (originalSize > 1 * 1024 * 1024) return 0.7;
        return 0.8;
    }

    getBase64Size(base64String: string) {
        if (!base64String) return 0;
        const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
        const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
        return (base64Data.length * 3) / 4 - padding;
    }

    async validateImage(file: File) {
        const maxSize = 10 * 1024 * 1024; // 10MB Limit

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            throw new Error('Sadece JPEG, PNG, GIF ve WebP formatları desteklenir');
        }

        if (file.size > maxSize) {
            throw new Error('Resim boyutu 10MB\'dan küçük olmalıdır');
        }

        return true;
    }
}

export default ImageOptimizer;
