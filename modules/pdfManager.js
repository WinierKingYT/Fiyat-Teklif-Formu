// PDF yönetimi modülü
class PDFManager {
    constructor(app) {
        this.app = app;
    }

    async previewPDF() {
        try {
            Logger.log('PDF önizleme hazırlanıyor...');
            
            const quoteData = await this.app.prepareQuoteDataForPreview();
            Logger.log('Hazırlanan veri:', quoteData);
            
            const minimalData = this.removeImagesFromQuoteData(quoteData);
            
            localStorage.removeItem('currentQuoteData');
            this.app.safeLocalStorageSet('currentQuoteData', minimalData);
            Logger.log('Minimal localStorage kaydedildi');
            
            try {
                await this.app.db.savePreviewData(quoteData);
                Logger.log('IndexedDB kaydedildi');
            } catch (dbError) {
                Logger.warn('IndexedDB kaydedilemedi, sadece localStorage kullanılacak:', dbError);
            }
            
            const previewUrl = `preview.html`;
            Logger.log('Preview URL:', previewUrl);
            
            const previewWindow = window.open(previewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            
            if (previewWindow) {
                this.app.showNotification('PDF önizleme açılıyor...', 'success');
            } else {
                this.app.showNotification('Popup engellendi! Lütfen tarayıcınızda popup\'lara izin verin.', 'error');
                
                if (confirm('Popup engellendi. Preview aynı sekmede açılsın mı?')) {
                    window.location.href = previewUrl;
                }
            }
        } catch (error) {
            Logger.error('PDF önizleme hatası:', error);
            this.app.showNotification('PDF oluşturulurken hata oluştu: ' + error.message, 'error');
        }
    }

    removeImagesFromQuoteData(quoteData) {
        const minimalData = JSON.parse(JSON.stringify(quoteData));
        
        if (minimalData.company) {
            minimalData.company.logo = null;
        }
        
        if (minimalData.signatures) {
            minimalData.signatures.seller = null;
            minimalData.signatures.stamp = null;
        }
        
        if (minimalData.items) {
            minimalData.items.forEach(item => {
                item.image = null;
            });
        }
        
        return minimalData;
    }

    async quickDownloadPDF() {
        try {
            const quoteData = await this.app.prepareQuoteDataForPreview();
            
            const minimalData = this.removeImagesFromQuoteData(quoteData);
            
            localStorage.removeItem('currentQuoteData');
            this.app.safeLocalStorageSet('currentQuoteData', minimalData);
            
            this.app.db.savePreviewData(quoteData).catch(error => {
                Logger.warn('IndexedDB kaydedilemedi:', error);
            });
            
            const previewWindow = window.open(`preview.html?autoDownload=true`, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            
            if (previewWindow) {
                this.app.showNotification('PDF indirme hazırlanıyor...', 'success');
            } else {
                this.app.showNotification('Popup engellendi! Lütfen tarayıcınızda popup\'lara izin verin.', 'error');
            }
        } catch (error) {
            Logger.error('PDF indirme hatası:', error);
            this.app.showNotification('PDF indirilirken hata oluştu', 'error');
        }
    }
}