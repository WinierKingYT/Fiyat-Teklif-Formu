// Image Optimizer Utility
import Logger from './logger';

class ImageOptimizer {
    constructor() {
        this.maxWidth = 800; // Increased resolution for better quality
        this.maxHeight = 600;
        this.quality = 0.7;
        this.maxFileSize = 300 * 1024; // Increased target output size to 300KB
    }

    async optimizeImage(file, isStamp = false) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Geçersiz dosya türü'));
                return;
            }

            // Allow up to 10MB input
            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('Resim boyutu 10MB\'dan küçük olmalıdır'));
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    let { width, height } = this.calculateScale(img.width, img.height);

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
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target.result;
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

            img.src = URL.createObjectURL(file);
        });
    }

    calculateScale(originalWidth, originalHeight) {
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

    getOptimalFormat(originalType, isStamp = false) {
        if (isStamp || originalType === 'image/png') {
            return 'image/png';
        }
        if (originalType === 'image/gif') {
            return 'image/jpeg';
        }
        return originalType;
    }

    calculateQuality(originalSize, isStamp = false) {
        if (isStamp) return 0.8;

        if (originalSize > 5 * 1024 * 1024) return 0.5; // Aggressive for >5MB
        if (originalSize > 2 * 1024 * 1024) return 0.6;
        if (originalSize > 1 * 1024 * 1024) return 0.7;
        return 0.8;
    }

    getBase64Size(base64String) {
        if (!base64String) return 0;
        const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
        return (base64String.length * 3) / 4 - padding;
    }

    async validateImage(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB Limit
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Sadece JPEG, PNG, GIF ve WebP formatları desteklenir');
        }

        if (file.size > maxSize) {
            throw new Error('Resim boyutu 10MB\'dan küçük olmalıdır');
        }

        return true;
    }
}

export default ImageOptimizer;
