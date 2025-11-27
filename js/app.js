let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new TeklifMasterApp();
    
    const initializeWithRetry = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                await app.initialize();
                break;
            } catch (error) {
                Logger.error(`Initialization attempt ${i + 1} failed:`, error);
                if (i === retries - 1) {
                    app.showNotification('Uygulama başlatılamadı. Lütfen sayfayı yenileyin.', 'error');
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    };
    
    initializeWithRetry();
});

Logger.log('TeklifMaster Pro v2.2 - OPTİMİZE EDİLMİŞ sürüm yüklendi!');