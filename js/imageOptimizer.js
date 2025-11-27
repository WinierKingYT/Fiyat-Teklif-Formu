// ==================== GELİŞTİRİLMİŞ RESİM OPTİMİZASYON SİSTEMİ ====================
class ImageOptimizer {
    constructor() {
        this.maxWidth = 400;
        this.maxHeight = 300;
        this.quality = 0.6;
        this.maxFileSize = 200 * 1024;
    }

    async optimizeImage(file, isStamp = false) {
        // ==================== GELİŞTİRİLMİŞ RESİM OPTİMİZASYON SİSTEMİ ====================
        class ImageOptimizer {
            constructor() {
                this.maxWidth = 400;
                this.maxHeight = 300;
                this.quality = 0.6;
                this.maxFileSize = 200 * 1024;
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

                            if (optimizedSize > this.maxFileSize && !isStamp) {
                                // Try aggressive optimization if still too large
                                const aggressiveQuality = quality * 0.7;
                                const reOptimizedDataUrl = canvas.toDataURL(mimeType, aggressiveQuality);
                                const reOptimizedSize = this.getBase64Size(reOptimizedDataUrl);

                                if (reOptimizedSize > this.maxFileSize * 1.5) {
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

                if (width > 800) { // Increased resolution
                    height = (height * 800) / width;
                    width = 800;
                }

                if (height > 600) {
                    width = (width * 600) / height;
                    height = 600;
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

                if (originalSize > 5 * 1024 * 1024) return 0.5;
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
    }
}