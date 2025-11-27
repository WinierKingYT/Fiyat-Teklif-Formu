// Depolama yönetimi modülü
class StorageManager {
    constructor(app) {
        this.app = app;
    }

    async optimizedSaveFormState() {
        try {
            if (this.app.isSaving) return;
            this.app.isSaving = true;

            const now = Date.now();
            if (now - this.app.lastSaveTime < 5000) {
                return;
            }

            Logger.log('OPTİMİZE KAYIT BAŞLATILDI');
            
            const minimalState = {
                id: 'currentFormState',
                timestamp: new Date().toISOString(),
                formData: this.app.collectMinimalFormData(),
                items: this.app.collectItemsData(),
                itemCounter: this.app.itemCounter,
                currentQuoteId: this.app.currentQuoteId
            };

            await this.app.db.optimizedPut('formState', minimalState);
            this.app.safeLocalStorageSet(this.app.formStateKey, minimalState);

            this.app.lastSaveTime = now;
            this.app.updateLastSaved();
            
            Logger.log('OPTİMİZE KAYIT TAMAMLANDI');
            
        } catch (error) {
            Logger.error('Optimize kayıt hatası:', error);
            this.app.emergencyMinimalBackup();
        } finally {
            this.app.isSaving = false;
        }
    }

    async superRestore() {
        Logger.log('SÜPER GERİ YÜKLEME BAŞLATILDI...');
        
        try {
            this.app.isRestoringState = true;
            
            let restoredData = null;
            let restoreSource = '';

            try {
                const dbState = await this.app.db.get('formState', 'currentFormState');
                if (dbState && this.app.isValidFormState(dbState)) {
                    restoredData = dbState;
                    restoreSource = 'IndexedDB';
                    Logger.log('ANA VERİ - IndexedDB başarıyla yüklendi');
                }
            } catch (dbError) {
                Logger.warn('IndexedDB ana veri yüklenemedi:', dbError);
            }

            if (!restoredData) {
                try {
                    const localState = this.app.safeLocalStorageGet(this.app.formStateKey);
                    if (localState && this.app.isValidFormState(localState)) {
                        restoredData = localState;
                        restoreSource = 'localStorage';
                        Logger.log('YEDEK VERİ - localStorage başarıyla yüklendi');
                    }
                } catch (localError) {
                    Logger.warn('LocalStorage yedek veri yüklenemedi:', localError);
                }
            }

            let emergencyItems = null;
            if (!restoredData) {
                try {
                    const emergencyBackup = this.app.safeLocalStorageGet('teklifmaster_minimal_v2');
                    if (emergencyBackup && emergencyBackup.items) {
                        emergencyItems = emergencyBackup;
                        restoreSource = 'Acil Yedek';
                        Logger.log('ACİL YEDEK - Ürünler yüklendi');
                    }
                } catch (e) {
                    Logger.warn('Acil yedek yüklenemedi:', e);
                }
            }

            if (restoredData) {
                this.app.populateForm(restoredData.formData);
                this.app.currentQuoteId = restoredData.currentQuoteId || this.app.currentQuoteId;
                this.app.itemCounter = restoredData.itemCounter || this.app.itemCounter;

                document.getElementById('itemsTableBody').innerHTML = '';
                if (restoredData.items && restoredData.items.length > 0) {
                    for (const item of restoredData.items) {
                        this.app.addItem(item);
                    }
                    Logger.log(`${restoredData.items.length} ÜRÜN GERİ YÜKLENDİ`);
                }
            } else if (emergencyItems) {
                document.getElementById('itemsTableBody').innerHTML = '';
                this.app.itemCounter = emergencyItems.itemCounter || this.app.itemCounter;
                this.app.currentQuoteId = emergencyItems.currentQuoteId || this.app.currentQuoteId;
                for (const item of emergencyItems.items) {
                    this.app.addItem(item);
                }
                Logger.log(`ACİL YEDEKTEN ${emergencyItems.items.length} ÜRÜN GERİ YÜKLENDİ`);
            } else {
                Logger.log('Yedek bulunamadı, yeni başlatılıyor');
                this.app.addItem();
            }

            this.app.safeLocalStorageSet('currentQuoteId', this.app.currentQuoteId);
            this.app.safeLocalStorageSet('itemCounter', this.app.itemCounter);

            this.app.updateTotals();
            Logger.log(`SÜPER GERİ YÜKLEME TAMAMLANDI - Kaynak: ${restoreSource || 'Yeni Başlatma'}`);
            
        } catch (error) {
            Logger.error('SÜPER GERİ YÜKLEME HATASI:', error);
            this.app.addItem();
        } finally {
            this.app.isRestoringState = false;
        }
    }

    async syncDataBetweenStorages() {
        try {
            Logger.log('Veri senkronizasyonu başlatılıyor...');
            
            const dbState = await this.app.db.get('formState', 'currentFormState');
            const localState = this.app.safeLocalStorageGet(this.app.formStateKey);
            
            if (dbState && localState) {
                const dbTime = new Date(dbState.timestamp).getTime();
                const localTime = new Date(localState.timestamp).getTime();
                
                if (localTime > dbTime) {
                    await this.app.db.put('formState', localState);
                    Logger.log('localStorage -> IndexedDB senkronize edildi');
                } else if (dbTime > localTime) {
                    this.app.safeLocalStorageSet(this.app.formStateKey, dbState);
                    Logger.log('IndexedDB -> localStorage senkronize edildi');
                }
            } else if (dbState && !localState) {
                this.app.safeLocalStorageSet(this.app.formStateKey, dbState);
                Logger.log('IndexedDB -> localStorage kopyalandı');
            } else if (!dbState && localState) {
                await this.app.db.put('formState', localState);
                Logger.log('localStorage -> IndexedDB kopyalandı');
            }
            
            Logger.log('Veri senkronizasyonu tamamlandı');
        } catch (error) {
            Logger.error('Veri senkronizasyon hatası:', error);
        }
    }
}