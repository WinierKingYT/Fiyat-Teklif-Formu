// ==================== GELİŞTİRİLMİŞ TEKLİFMASTER APP - MODÜLER SÜRÜM ====================
class TeklifMasterApp {
    constructor() {
        this.version = '2.2.0';
        this.isInitialized = false;
        this.autoSaveInterval = null;
        this.autoSaveTimeout = null;
        this.isSaving = false;
        this.lastSaveTime = 0;
        this.MIN_SAVE_INTERVAL = 30000;
        this.debounceDelay = 2000;
        
        this.currentQuoteId = this.safeLocalStorageGet('currentQuoteId', null);
        this.itemCounter = parseInt(this.safeLocalStorageGet('itemCounter', '0'));
        
        this.signaturePad = null;
        this.isRestoringState = false;
        this.isOnline = navigator.onLine;
        
        this.db = new IndexedDBManager();
        this.imageOptimizer = new ImageOptimizer();
        this.saveDebouncer = new Debouncer(this.debounceDelay);
        
        this.setupNetworkListener();
        this.setupErrorHandling();
        this.setupMemoryManagement();
        
        this.formStateKey = 'teklifmaster_formstate';
        
        this.demoCustomers = [
            {
                name: "Ahmet Yılmaz",
                company: "Yılmaz Ltd. Şti.",
                email: "ahmet@yilmazltd.com",
                phone: "+90 555 123 4567",
                address: "Maslak Mah. No:123 İstanbul",
                lastUsed: new Date().toISOString(),
                quoteCount: 3
            }
        ];
        
        this.demoProducts = [
            {
                name: "Web Sitesi Tasarımı",
                description: "Kurumsal web sitesi tasarımı ve geliştirmesi",
                price: 5000,
                taxRate: 18,
                category: "Hizmet",
                unit: "Adet"
            }
        ];
    }

    safeLocalStorageGet(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            Logger.warn(`localStorage get error (${key}):`, error);
            return defaultValue;
        }
    }

    safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            Logger.warn(`localStorage set error (${key}):`, error);
            return false;
        }
    }

    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            if (e.error === null && e.message === 'Script error.') return;
            this.handleGlobalError(e.error || e);
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.handleGlobalError(e.reason);
        });
    }

    handleGlobalError(error) {
        if (!error || (error instanceof ErrorEvent && error.message === 'Script error.')) return;
        
        Logger.error('Global error caught:', error);
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        
        if (this.isCriticalError(error)) {
            this.showNotification(`Bir hata oluştu: ${errorMessage}`, 'error');
        }
    }

    isCriticalError(error) {
        if (!error) return false;
        const criticalErrors = ['QuotaExceededError', 'InvalidStateError', 'UnknownError'];
        return criticalErrors.some(critical => error.name && error.name.includes(critical));
    }

    setupNetworkListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('İnternet bağlantısı sağlandı', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('İnternet bağlantısı kesildi - Çevrimdışı mod', 'warning');
        });
    }

    setupMemoryManagement() {
        window.addEventListener('beforeunload', () => {
            this.cleanupMemory();
        });

        setInterval(() => {
            this.cleanupMemory();
        }, 5 * 60 * 1000);
    }

    cleanupMemory() {
        try {
            document.querySelectorAll('img[src^="blob:"]').forEach(img => {
                if (img.src && !img.classList.contains('keep-alive')) {
                    URL.revokeObjectURL(img.src);
                }
            });

            if (window.gc) {
                window.gc();
            }

            Logger.log('Bellek temizliği tamamlandı');
        } catch (error) {
            Logger.error('Bellek temizleme hatası:', error);
        }
    }

    // 🔄 OPTİMİZE EDİLMİŞ KAYIT SİSTEMİ
    async optimizedSaveFormState() {
        try {
            if (this.isSaving) return;
            this.isSaving = true;

            const now = Date.now();
            if (now - this.lastSaveTime < 5000) {
                return;
            }

            Logger.log('OPTİMİZE KAYIT BAŞLATILDI');
            
            const minimalState = {
                id: 'currentFormState',
                timestamp: new Date().toISOString(),
                formData: this.collectMinimalFormData(),
                items: this.collectItemsData(),
                itemCounter: this.itemCounter,
                currentQuoteId: this.currentQuoteId
            };

            await this.db.optimizedPut('formState', minimalState);
            this.safeLocalStorageSet(this.formStateKey, minimalState);

            this.lastSaveTime = now;
            this.updateLastSaved();
            
            Logger.log('OPTİMİZE KAYIT TAMAMLANDI');
            
        } catch (error) {
            Logger.error('Optimize kayıt hatası:', error);
            this.emergencyMinimalBackup();
        } finally {
            this.isSaving = false;
        }
    }

    collectMinimalFormData() {
        const getValue = id => {
            const element = document.getElementById(id);
            return element ? element.value : '';
        };

        return {
            quote: {
                title: getValue('quoteTitle'),
                number: getValue('quoteNumber'),
                date: getValue('quoteDate')
            },
            customer: {
                name: getValue('customerName'),
                company: getValue('customerCompany')
            },
            company: {
                name: getValue('companyName')
            }
        };
    }

    emergencyMinimalBackup() {
        try {
            const backup = {
                items: this.collectItemsData(),
                itemCounter: this.itemCounter,
                currentQuoteId: this.currentQuoteId,
                timestamp: Date.now()
            };
            this.safeLocalStorageSet('teklifmaster_minimal_v2', backup);
        } catch (e) {
            Logger.error('Acil yedek başarısız:', e);
        }
    }

    startOptimizedAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            const now = Date.now();
            if (now - this.lastSaveTime >= this.MIN_SAVE_INTERVAL) {
                this.optimizedSaveFormState();
            }
        }, 30000);
        
        const immediateSaveElements = document.querySelectorAll(`
            .item-description, .item-notes, .item-quantity, 
            .item-price, .item-tax, .item-unit,
            #customerName, #customerCompany, #quoteTitle
        `);
        
        immediateSaveElements.forEach(element => {
            element.addEventListener('input', () => {
                this.saveDebouncer.debounce(() => {
                    if (!this.isRestoringState) {
                        this.optimizedSaveFormState();
                    }
                })();
            });
        });
        
        window.addEventListener('beforeunload', () => {
            if (this.isInitialized && !this.isRestoringState) {
                this.cleanupMemory();
                this.optimizedSaveFormState();
            }
        });
        
        Logger.log('OPTİMİZE OTOMATİK KAYIT AKTİF');
    }

    async superRestore() {
        Logger.log('SÜPER GERİ YÜKLEME BAŞLATILDI...');
        
        try {
            this.isRestoringState = true;
            
            let restoredData = null;
            let restoreSource = '';

            try {
                const dbState = await this.db.get('formState', 'currentFormState');
                if (dbState && this.isValidFormState(dbState)) {
                    restoredData = dbState;
                    restoreSource = 'IndexedDB';
                    Logger.log('ANA VERİ - IndexedDB başarıyla yüklendi');
                }
            } catch (dbError) {
                Logger.warn('IndexedDB ana veri yüklenemedi:', dbError);
            }

            if (!restoredData) {
                try {
                    const localState = this.safeLocalStorageGet(this.formStateKey);
                    if (localState && this.isValidFormState(localState)) {
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
                    const emergencyBackup = this.safeLocalStorageGet('teklifmaster_minimal_v2');
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
                this.populateForm(restoredData.formData);
                this.currentQuoteId = restoredData.currentQuoteId || this.currentQuoteId;
                this.itemCounter = restoredData.itemCounter || this.itemCounter;

                document.getElementById('itemsTableBody').innerHTML = '';
                if (restoredData.items && restoredData.items.length > 0) {
                    for (const item of restoredData.items) {
                        this.addItem(item);
                    }
                    Logger.log(`${restoredData.items.length} ÜRÜN GERİ YÜKLENDİ`);
                }
            } else if (emergencyItems) {
                document.getElementById('itemsTableBody').innerHTML = '';
                this.itemCounter = emergencyItems.itemCounter || this.itemCounter;
                this.currentQuoteId = emergencyItems.currentQuoteId || this.currentQuoteId;
                for (const item of emergencyItems.items) {
                    this.addItem(item);
                }
                Logger.log(`ACİL YEDEKTEN ${emergencyItems.items.length} ÜRÜN GERİ YÜKLENDİ`);
            } else {
                Logger.log('Yedek bulunamadı, yeni başlatılıyor');
                this.addItem();
            }

            this.safeLocalStorageSet('currentQuoteId', this.currentQuoteId);
            this.safeLocalStorageSet('itemCounter', this.itemCounter);

            this.updateTotals();
            Logger.log(`SÜPER GERİ YÜKLEME TAMAMLANDI - Kaynak: ${restoreSource || 'Yeni Başlatma'}`);
            
        } catch (error) {
            Logger.error('SÜPER GERİ YÜKLEME HATASI:', error);
            this.addItem();
        } finally {
            this.isRestoringState = false;
        }
    }

    isValidFormState(state) {
        if (!state) return false;
        if (!state.formData || !state.items) return false;
        if (typeof state.itemCounter !== 'number') return false;
        return true;
    }

    async initialize() {
        if (this.isInitialized) return;

        Logger.log('TEKLİFMASTER PRO - MODÜLER SÜRÜM BAŞLATILIYOR...');
                
        try {
            await this.db.initialize();
            await this.db.cleanupOldData();
            
            await this.syncDataBetweenStorages();
            await this.superRestore();
            
            this.setupEventListeners();
            this.startOptimizedAutoSave();
            
            await this.updateSystemStatus();
            
            this.isInitialized = true;
            Logger.log('TEKLİFMASTER PRO - MODÜLER SÜRÜM HAZIR!');
            
        } catch (error) {
            Logger.error('Başlatma hatası:', error);
            this.addItem();
            this.showNotification('Sistem başlatıldı. Veriler korunuyor!', 'warning');
        }
    }

    async syncDataBetweenStorages() {
        try {
            Logger.log('Veri senkronizasyonu başlatılıyor...');
            
            const dbState = await this.db.get('formState', 'currentFormState');
            const localState = this.safeLocalStorageGet(this.formStateKey);
            
            if (dbState && localState) {
                const dbTime = new Date(dbState.timestamp).getTime();
                const localTime = new Date(localState.timestamp).getTime();
                
                if (localTime > dbTime) {
                    await this.db.put('formState', localState);
                    Logger.log('localStorage -> IndexedDB senkronize edildi');
                } else if (dbTime > localTime) {
                    this.safeLocalStorageSet(this.formStateKey, dbState);
                    Logger.log('IndexedDB -> localStorage senkronize edildi');
                }
            } else if (dbState && !localState) {
                this.safeLocalStorageSet(this.formStateKey, dbState);
                Logger.log('IndexedDB -> localStorage kopyalandı');
            } else if (!dbState && localState) {
                await this.db.put('formState', localState);
                Logger.log('localStorage -> IndexedDB kopyalandı');
            }
            
            Logger.log('Veri senkronizasyonu tamamlandı');
        } catch (error) {
            Logger.error('Veri senkronizasyon hatası:', error);
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        try {
            const sanitizedMessage = this.escapeHtml(message);
            
            let container = document.getElementById('notificationContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notificationContainer';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 500px;
                `;
                document.body.appendChild(container);
            }
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${sanitizedMessage}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `;
            
            container.appendChild(notification);
            
            const closeButton = notification.querySelector('.notification-close');
            closeButton.addEventListener('click', () => {
                notification.remove();
            });
            
            setTimeout(() => notification.classList.add('show'), 100);
            
            if (duration > 0) {
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, duration);
            }
        } catch (error) {
            Logger.error('Notification error:', error);
        }
    }

    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        const div = document.createElement('div');
        div.textContent = unsafe;
        return div.innerHTML;
    }

    setupEventListeners() {
        const quoteForm = document.getElementById('quoteForm');
        if (quoteForm) {
            quoteForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        document.addEventListener('input', (e) => {
            if (e.target.matches('.item-quantity, .item-price, .item-tax, .item-unit')) {
                this.updateItemTotal(e.target);
                this.updateTotals();
            }
            
            if (e.target.matches('#discountType, #discountValue')) {
                this.updateDiscount();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('#discountType')) {
                this.updateDiscountLabel();
                this.updateDiscount();
            }
        });

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.saveQuote();
                    } else {
                        this.saveDraft();
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    this.createNewQuote();
                    break;
                case 'p':
                    e.preventDefault();
                    this.previewPDF();
                    break;
                case 'd':
                    e.preventDefault();
                    this.quickDownloadPDF();
                    break;
            }
        }
    }

    loadTheme() {
        const theme = localStorage.getItem('appTheme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('appTheme', newTheme);
        
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.showNotification(`Tema ${newTheme === 'dark' ? 'koyu' : 'açık'} moda geçirildi`, 'success');
    }

    updateQuoteDate() {
        const element = document.getElementById('quoteDate');
        if (element) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            if (!element.value || element.value === '') {
                element.value = formattedDate;
            }
        }
    }

    updateValidUntilDate() {
        const element = document.getElementById('validUntil');
        const daysElement = document.getElementById('validUntilDays');
        
        if (element && daysElement) {
            const quoteDate = document.getElementById('quoteDate').value;
            let startDate;
            
            if (quoteDate) {
                startDate = new Date(quoteDate);
            } else {
                startDate = new Date();
                document.getElementById('quoteDate').value = startDate.toISOString().split('T')[0];
            }
            
            const days = parseInt(daysElement.value) || 10;
            const date = new Date(startDate);
            date.setDate(date.getDate() + days);
            const formattedDate = date.toISOString().split('T')[0];
            
            element.value = formattedDate;
        }
    }

    generateQuoteNumber() {
        const element = document.getElementById('quoteNumber');
        if (element && !element.value) {
            const now = new Date();
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            element.value = `TEK-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${random}`;
        }
    }

    updateDiscountLabel() {
        const type = document.getElementById('discountType');
        const label = document.getElementById('discountValueLabel');
        if (type && label) {
            label.textContent = type.value === 'percentage' ? 'İndirim Yüzdesi (%)' : 'İndirim Tutarı (₺)';
        }
    }

    addItem(itemData = {}) {
        try {
            const tableBody = document.getElementById('itemsTableBody');
            if (!tableBody) return;

            const newRow = document.createElement('tr');
            newRow.className = 'item-row fade-in';
            
            const itemId = this.itemCounter++;
            
            this.safeLocalStorageSet('itemCounter', this.itemCounter);
            
            const imageUrl = itemData.image || '';
            const hasImage = imageUrl && !['null', 'undefined', ''].includes(imageUrl);
            
            newRow.innerHTML = this.generateItemRowHTML(itemId, itemData, hasImage, imageUrl);
            tableBody.appendChild(newRow);
            this.bindRowEvents(newRow);
            
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            
            this.updateTotals();
            
            Logger.log(`Ürün eklendi (Toplam: ${this.itemCounter})`);
        } catch (error) {
            Logger.error('addItem error:', error);
            this.emergencyMinimalBackup();
        }
    }

    generateItemRowHTML(itemId, itemData, hasImage, imageUrl) {
        const description = itemData.description || '';
        const notes = itemData.notes || '';
        const quantity = itemData.quantity || 1;
        const price = itemData.price || 0;
        const taxRate = itemData.taxRate || 20;
        const unit = itemData.unit || 'Adet';
        const total = this.calculateItemTotal({ quantity, price, taxRate });
        
        return `
            <td>
                <div class="item-image-container">
                    <div class="item-image-placeholder" style="${hasImage ? 'display: none;' : ''}">
                        <i class="fas fa-image"></i>
                        <div>Görsel Ekle</div>
                    </div>
                    <img class="item-image" src="${hasImage ? imageUrl : ''}" 
                         style="${hasImage ? 'display: block;' : 'display: none;'}" 
                         alt="Ürün görseli"
                         onerror="this.style.display='none'; this.parentElement.querySelector('.item-image-placeholder').style.display='flex';">
                    <div class="item-image-actions">
                        <button type="button" class="btn btn-outline btn-sm" onclick="app.triggerImageUpload(${itemId})">
                            <i class="fas fa-upload"></i> ${hasImage ? 'Değiştir' : 'Ekle'}
                        </button>
                        ${hasImage ? `
                        <button type="button" class="btn btn-danger btn-sm" onclick="app.removeItemImage(${itemId})">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                    <input type="file" id="itemImage${itemId}" class="item-image-upload" 
                           accept="image/*" style="display: none;">
                </div>
            </td>
            <td>
                <input type="text" class="item-description form-control" 
                       placeholder="Ürün/Hizmet adı" value="${description}">
                <textarea class="item-notes form-control" 
                         placeholder="Detaylı açıklama" rows="2">${notes}</textarea>
            </td>
            <td>
                <input type="number" class="item-quantity form-control" 
                       value="${quantity}" min="1" step="1">
            </td>
            <td>
                <select class="item-unit form-control">
                    <option value="Adet" ${unit === 'Adet' ? 'selected' : ''}>Adet</option>
                    <option value="Metre" ${unit === 'Metre' ? 'selected' : ''}>Metre</option>
                    <option value="Kg" ${unit === 'Kg' ? 'selected' : ''}>Kg</option>
                    <option value="Litre" ${unit === 'Litre' ? 'selected' : ''}>Litre</option>
                    <option value="Saat" ${unit === 'Saat' ? 'selected' : ''}>Saat</option>
                    <option value="Gün" ${unit === 'Gün' ? 'selected' : ''}>Gün</option>
                    <option value="Ay" ${unit === 'Ay' ? 'selected' : ''}>Ay</option>
                    <option value="Paket" ${unit === 'Paket' ? 'selected' : ''}>Paket</option>
                    <option value="Koli" ${unit === 'Koli' ? 'selected' : ''}>Koli</option>
                    <option value="Takım" ${unit === 'Takım' ? 'selected' : ''}>Takım</option>
                    <option value="Set" ${unit === 'Set' ? 'selected' : ''}>Set</option>
                </select>
            </td>
            <td>
                <input type="number" class="item-price form-control" 
                       value="${price}" min="0" step="0.01">
            </td>
            <td>
                <select class="item-tax form-control">
                    ${[20, 18, 8, 1, 0].map(rate => 
                        `<option value="${rate}" ${taxRate == rate ? 'selected' : ''}>%${rate}</option>`
                    ).join('')}
                </select>
            </td>
            <td>
                <span class="item-total">${total}</span> ₺
            </td>
            <td class="item-actions">
                <button type="button" class="btn btn-danger btn-sm" title="Sil" onclick="app.removeItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
                <button type="button" class="btn btn-outline btn-sm" title="Çoğalt" onclick="app.duplicateItem(this)">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        `;
    }

    calculateItemTotal(itemData) {
        const quantity = itemData.quantity || 1;
        const price = itemData.price || 0;
        const taxRate = itemData.taxRate || 20;
        const subtotal = quantity * price;
        return (subtotal + (subtotal * (taxRate / 100))).toFixed(2);
    }

    bindRowEvents(row) {
        try {
            row.querySelectorAll('.item-quantity, .item-price, .item-tax, .item-unit').forEach(input => {
                input.addEventListener('input', () => {
                    this.updateItemTotal(input);
                    this.updateTotals();
                    if (!this.isRestoringState) {
                        this.saveDebouncer.debounce(() => this.optimizedSaveFormState())();
                    }
                });
            });

            const fileInput = row.querySelector('.item-image-upload');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const itemId = Array.from(row.parentNode.children).indexOf(row);
                    this.handleImageUpload(e.target, itemId);
                });
            }
        } catch (error) {
            Logger.error('bindRowEvents error:', error);
        }
    }

    updateItemTotal(inputElement) {
        try {
            const row = inputElement.closest('tr');
            if (!row) return;
            
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const taxRate = parseFloat(row.querySelector('.item-tax').value) || 0;
            
            const subtotal = quantity * price;
            const total = subtotal + (subtotal * (taxRate / 100));
            
            const totalElement = row.querySelector('.item-total');
            if (totalElement) totalElement.textContent = total.toFixed(2);
        } catch (error) {
            Logger.error('updateItemTotal error:', error);
        }
    }

    removeItem(button) {
        try {
            const row = button.closest('tr');
            if (row && confirm('Bu kalemi silmek istediğinizden emin misiniz?')) {
                const images = row.querySelectorAll('img[src^="blob:"]');
                images.forEach(img => {
                    URL.revokeObjectURL(img.src);
                });
                
                row.classList.add('fade-out');
                setTimeout(() => {
                    row.remove();
                    this.updateTotals();
                    if (!this.isRestoringState) {
                        this.optimizedSaveFormState();
                    }
                    this.showNotification('Kalem silindi', 'warning');
                }, 300);
            }
        } catch (error) {
            Logger.error('removeItem error:', error);
            this.emergencyMinimalBackup();
        }
    }

    duplicateItem(button) {
        try {
            const row = button.closest('tr');
            if (row) {
                const data = {
                    description: row.querySelector('.item-description').value,
                    quantity: row.querySelector('.item-quantity').value,
                    price: row.querySelector('.item-price').value,
                    taxRate: row.querySelector('.item-tax').value,
                    unit: row.querySelector('.item-unit').value,
                    notes: row.querySelector('.item-notes').value,
                    image: row.querySelector('.item-image').src
                };
                this.addItem(data);
                this.showNotification('Kalem çoğaltıldı', 'success');
            }
        } catch (error) {
            Logger.error('duplicateItem error:', error);
            this.showNotification('Kalem çoğaltılırken hata oluştu', 'error');
        }
    }

    triggerImageUpload(itemId) {
        try {
            const input = document.getElementById(`itemImage${itemId}`);
            if (input) {
                input.click();
            }
        } catch (error) {
            Logger.error('triggerImageUpload error:', error);
        }
    }

    async handleImageUpload(input, itemId) {
        let blobUrl = null;
        
        try {
            const file = input.files[0];
            if (!file) return;

            await this.imageOptimizer.validateImage(file);
            blobUrl = await this.imageOptimizer.optimizeImage(file);
            
            const row = input.closest('tr');
            if (!row) return;
            
            await this.cleanupOldImage(row, itemId);
            
            const placeholder = row.querySelector('.item-image-placeholder');
            const img = row.querySelector('.item-image');
            const actions = row.querySelector('.item-image-actions');
            
            placeholder.style.display = 'none';
            img.src = blobUrl;
            img.style.display = 'block';
            
            actions.innerHTML = `
                <button type="button" class="btn btn-outline btn-sm" onclick="app.triggerImageUpload(${itemId})">
                    <i class="fas fa-sync"></i> Değiştir
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="app.removeItemImage(${itemId})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            img.addEventListener('error', () => {
                this.removeItemImage(itemId);
                this.showNotification('Görsel yüklenirken hata oluştu', 'error');
            });
            
            this.showNotification('Ürün görseli optimize edilerek yüklendi', 'success');
            
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            
        } catch (error) {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
            Logger.error('Görsel yükleme hatası:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async cleanupOldImage(row, itemId) {
        try {
            const oldImg = row.querySelector('.item-image');
            if (oldImg && oldImg.src && oldImg.src.startsWith('blob:')) {
                URL.revokeObjectURL(oldImg.src);
            }
        } catch (error) {
            Logger.error('cleanupOldImage error:', error);
        }
    }

    removeItemImage(itemId) {
        try {
            const input = document.getElementById(`itemImage${itemId}`);
            if (!input) return;
            
            const row = input.closest('tr');
            if (row) {
                const placeholder = row.querySelector('.item-image-placeholder');
                const img = row.querySelector('.item-image');
                const actions = row.querySelector('.item-image-actions');
                
                if (img && img.src && img.src.startsWith('blob:')) {
                    URL.revokeObjectURL(img.src);
                }
                
                placeholder.style.display = 'flex';
                img.style.display = 'none';
                img.src = '';
                
                actions.innerHTML = `
                    <button type="button" class="btn btn-outline btn-sm" onclick="app.triggerImageUpload(${itemId})">
                        <i class="fas fa-upload"></i> Ekle
                    </button>
                `;
                
                this.showNotification('Ürün görseli kaldırıldı', 'warning');
                if (!this.isRestoringState) {
                    this.optimizedSaveFormState();
                }
            }
        } catch (error) {
            Logger.error('removeItemImage error:', error);
            this.showNotification('Görsel kaldırılırken hata oluştu', 'error');
        }
    }

    addItemGroup() {
        try {
            const sampleItems = [
                { description: 'Web Sitesi Tasarımı', quantity: 1, price: 5000, taxRate: 18, unit: 'Proje' },
                { description: 'SEO Optimizasyonu', quantity: 1, price: 3000, taxRate: 18, unit: 'Ay' },
                { description: 'Hosting Hizmeti (12 ay)', quantity: 1, price: 1200, taxRate: 8, unit: 'Yıl' }
            ];
            
            sampleItems.forEach(item => this.addItem(item));
            this.showNotification('Örnek kalem grubu eklendi', 'success');
        } catch (error) {
            Logger.error('addItemGroup error:', error);
            this.showNotification('Kalem grubu eklenirken hata oluştu', 'error');
        }
    }

    clearAllItems() {
        try {
            if (confirm('Tüm kalemleri silmek istediğinizden emin misiniz?')) {
                document.querySelectorAll('#itemsTableBody .item-image').forEach(img => {
                    if (img.src && img.src.startsWith('blob:')) {
                        URL.revokeObjectURL(img.src);
                    }
                });
                
                document.getElementById('itemsTableBody').innerHTML = '';
                this.itemCounter = 0;
                this.safeLocalStorageSet('itemCounter', this.itemCounter);
                this.updateTotals();
                if (!this.isRestoringState) {
                    this.optimizedSaveFormState();
                }
                this.showNotification('Tüm kalemler silindi', 'warning');
            }
        } catch (error) {
            Logger.error('clearAllItems error:', error);
            this.showNotification('Kalemler temizlenirken hata oluştu', 'error');
        }
    }

    updateTotals() {
        try {
            const rows = document.querySelectorAll('#itemsTableBody tr');
            let subtotal = 0;
            const taxSummary = {};
            let totalTax = 0;
            
            rows.forEach(row => {
                const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;
                const taxRate = parseFloat(row.querySelector('.item-tax').value) || 0;
                
                const rowSubtotal = quantity * price;
                const rowTax = rowSubtotal * (taxRate / 100);
                
                subtotal += rowSubtotal;
                taxSummary[taxRate] = (taxSummary[taxRate] || 0) + rowTax;
                totalTax += rowTax;
            });
            
            const discountType = document.getElementById('discountType').value;
            const discountValue = parseFloat(document.getElementById('discountValue').value) || 0;
            let discountAmount = 0;
            
            if (discountType === 'percentage') {
                discountAmount = subtotal * (discountValue / 100);
            } else if (discountType === 'fixed') {
                discountAmount = discountValue;
            }
            
            discountAmount = Math.min(discountAmount, subtotal);
            
            const grandTotal = (subtotal - discountAmount) + totalTax;
            this.updateSummaryUI(subtotal, discountAmount, grandTotal, taxSummary, totalTax);
        } catch (error) {
            Logger.error('updateTotals error:', error);
        }
    }

    updateSummaryUI(subtotal, discountAmount, grandTotal, taxSummary, totalTax) {
        try {
            const elements = {
                subtotal: document.getElementById('subtotal'),
                discountAmount: document.getElementById('discountAmount'),
                discountPreview: document.getElementById('discountPreview'),
                grandTotal: document.getElementById('grandTotal'),
                taxSummary: document.getElementById('taxSummary')
            };

            const formatForDisplay = (num) => {
                return new Intl.NumberFormat('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(num);
            };

            if (elements.subtotal) elements.subtotal.textContent = formatForDisplay(subtotal);
            if (elements.discountAmount) elements.discountAmount.textContent = formatForDisplay(discountAmount);
            if (elements.discountPreview) elements.discountPreview.textContent = formatForDisplay(discountAmount) + ' ₺';
            if (elements.grandTotal) elements.grandTotal.textContent = formatForDisplay(grandTotal);
            
            if (elements.taxSummary) {
                let taxHtml = '';
                Object.entries(taxSummary)
                    .filter(([_, amount]) => amount > 0)
                    .forEach(([rate, amount]) => {
                        taxHtml += `
                            <div class="tax-item">
                                <span class="tax-rate">KDV (%${rate}):</span>
                                <span class="tax-amount">${formatForDisplay(amount)} ₺</span>
                            </div>
                        `;
                    });
                
                if (totalTax > 0) {
                    taxHtml += `
                        <div class="tax-item total-tax">
                            <span class="tax-rate"><strong>Toplam KDV:</strong></span>
                            <span class="tax-amount"><strong>${formatForDisplay(totalTax)} ₺</strong></span>
                        </div>
                    `;
                } else if (!taxHtml) {
                    taxHtml = '<div class="tax-item"><span class="tax-rate">KDV:</span><span class="tax-amount">0,00 ₺</span></div>';
                }
                
                elements.taxSummary.innerHTML = taxHtml;
            }
        } catch (error) {
            Logger.error('updateSummaryUI error:', error);
        }
    }

    updateDiscount() {
        try {
            this.updateTotals();
            if (!this.isRestoringState) {
                this.saveDebouncer.debounce(() => this.optimizedSaveFormState())();
            }
        } catch (error) {
            Logger.error('updateDiscount error:', error);
        }
    }

    async handleLogoUpload(input) {
        let blobUrl = null;
        
        try {
            const file = input.files[0];
            if (!file) return;

            await this.imageOptimizer.validateImage(file);
            blobUrl = await this.imageOptimizer.optimizeImage(file);
            
            const logo = document.getElementById('companyLogo');
            const placeholder = document.querySelector('#logoPreview .logo-placeholder');
            
            if (placeholder) placeholder.style.display = 'none';
            logo.src = blobUrl;
            logo.style.display = 'block';
            
            this.showNotification('Logo optimize edilerek yüklendi', 'success');
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            
        } catch (error) {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
            Logger.error('Logo yükleme hatası:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async handleStampUpload(input) {
        let blobUrl = null;
        
        try {
            const file = input.files[0];
            if (!file) return;

            await this.imageOptimizer.validateImage(file);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let width = img.width;
                let height = img.height;
                const maxSize = 200;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                const stampUrl = canvas.toDataURL('image/png', 0.8);
                
                const stamp = document.getElementById('stampImage');
                const placeholder = document.querySelector('#stampPreview .signature-placeholder');
                
                if (placeholder) placeholder.style.display = 'none';
                stamp.src = stampUrl;
                stamp.style.display = 'block';
                
                this.showNotification('Kaşe şeffaf arkaplan ile yüklendi', 'success');
                if (!this.isRestoringState) {
                    this.optimizedSaveFormState();
                }
            };

            img.src = URL.createObjectURL(file);
            
        } catch (error) {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
            Logger.error('Kaşe yükleme hatası:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async handleAdvancedProductImageUpload(input) {
        let blobUrl = null;
        
        try {
            const file = input.files[0];
            if (!file) return;

            await this.imageOptimizer.validateImage(file);
            blobUrl = await this.imageOptimizer.optimizeImage(file);
            
            const display = document.getElementById('advancedProductImageDisplay');
            const placeholder = document.querySelector('#advancedProductImagePreview .image-placeholder');
            
            placeholder.style.display = 'none';
            display.src = blobUrl;
            display.style.display = 'block';
            
            this.showNotification('Ürün görseli yüklendi', 'success');
        } catch (error) {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
            Logger.error('Ürün görseli yükleme hatası:', error);
            this.showNotification(error.message, 'error');
        }
    }

    clearAdvancedProductImage() {
        const display = document.getElementById('advancedProductImageDisplay');
        const placeholder = document.querySelector('#advancedProductImagePreview .image-placeholder');
        const input = document.getElementById('advancedProductImage');
        
        if (display.src && display.src.startsWith('blob:')) {
            URL.revokeObjectURL(display.src);
        }
        
        display.style.display = 'none';
        display.src = '';
        placeholder.style.display = 'flex';
        input.value = '';
        
        this.showNotification('Ürün görseli temizlendi', 'warning');
    }

    toggleBankSelection() {
        const container = document.getElementById('bankSelectionContainer');
        if (container.style.display === 'none') {
            container.style.display = 'block';
            this.loadBankSelection();
        } else {
            container.style.display = 'none';
        }
    }

    async loadBankSelection() {
        try {
            const bankInfo = await this.db.getAll('bankInfo');
            const bankSelection = document.getElementById('bankSelection');
            
            if (!bankSelection) return;
            
            bankSelection.innerHTML = '<option value="">Banka seçin...</option>';
            
            bankInfo.forEach(bank => {
                const option = document.createElement('option');
                option.value = bank.id;
                option.textContent = `${bank.bankName} - ${bank.accountHolder}`;
                bankSelection.appendChild(option);
            });
            
            this.showNotification('Banka listesi yüklendi', 'success');
        } catch (error) {
            Logger.error('Banka seçimi yüklenirken hata:', error);
            this.showNotification('Banka listesi yüklenirken hata oluştu', 'error');
        }
    }

    async selectBankFromDropdown(bankId) {
        try {
            if (!bankId) return;
            
            const bankInfo = await this.db.getAll('bankInfo');
            const selectedBank = bankInfo.find(bank => bank.id == bankId);
            
            if (selectedBank) {
                document.getElementById('bankName').value = selectedBank.bankName || '';
                document.getElementById('bankBranch').value = selectedBank.bankBranch || '';
                document.getElementById('accountNumber').value = selectedBank.accountNumber || '';
                document.getElementById('iban').value = selectedBank.iban || '';
                document.getElementById('accountHolder').value = selectedBank.accountHolder || '';
                
                this.showNotification('Banka bilgileri yüklendi', 'success');
                
                document.getElementById('bankSelectionContainer').style.display = 'none';
                if (!this.isRestoringState) {
                    this.optimizedSaveFormState();
                }
            }
        } catch (error) {
            Logger.error('Banka seçilirken hata:', error);
            this.showNotification('Banka bilgileri yüklenirken hata oluştu', 'error');
        }
    }

    openSignatureModal() {
        try {
            const modal = document.getElementById('signatureModal');
            const canvas = document.getElementById('signatureCanvas');
            
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = 200;
            
            this.signaturePad = new SignaturePad(canvas, {
                backgroundColor: 'rgba(255, 255, 255, 0)',
                penColor: 'rgb(0, 0, 0)',
                minWidth: 1,
                maxWidth: 3,
                throttle: 16
            });
            
            modal.style.display = 'flex';
            
            window.addEventListener('resize', this.resizeSignatureCanvas.bind(this));
        } catch (error) {
            Logger.error('openSignatureModal error:', error);
            this.showNotification('İmza modalı açılırken hata oluştu', 'error');
        }
    }

    resizeSignatureCanvas() {
        if (!this.signaturePad) return;
        
        try {
            const canvas = document.getElementById('signatureCanvas');
            const rect = canvas.getBoundingClientRect();
            
            const data = this.signaturePad.toData();
            
            canvas.width = rect.width;
            canvas.height = 200;
            
            this.signaturePad.fromData(data);
        } catch (error) {
            Logger.error('resizeSignatureCanvas error:', error);
        }
    }

    clearSignatureCanvas() {
        if (this.signaturePad) {
            this.signaturePad.clear();
        }
    }

    async saveSignature() {
        try {
            if (this.signaturePad && !this.signaturePad.isEmpty()) {
                const signatureData = this.signaturePad.toDataURL();
                
                const signatureImg = document.getElementById('sellerSignature');
                const placeholder = document.querySelector('#sellerSignaturePreview .signature-placeholder');
                
                if (placeholder) placeholder.style.display = 'none';
                signatureImg.src = signatureData;
                signatureImg.style.display = 'block';
                signatureImg.addEventListener('error', () => {
                    signatureImg.style.display = 'none';
                    if (placeholder) placeholder.style.display = 'flex';
                    this.showNotification('İmza kaydedilirken hata oluştu', 'error');
                });
                
                this.showNotification('İmza kaydedildi', 'success');
                this.closeModal('signatureModal');
                if (!this.isRestoringState) {
                    this.optimizedSaveFormState();
                }
                
            } else {
                this.showNotification('Lütfen önce imza çizin', 'warning');
            }
        } catch (error) {
            Logger.error('İmza kaydetme hatası:', error);
            this.showNotification('İmza kaydedilirken hata oluştu', 'error');
        }
    }

    clearSignature() {
        try {
            const signatureImg = document.getElementById('sellerSignature');
            const placeholder = document.querySelector('#sellerSignaturePreview .signature-placeholder');
            
            if (signatureImg) signatureImg.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
            
            this.showNotification('İmza temizlendi', 'warning');
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
        } catch (error) {
            Logger.error('clearSignature error:', error);
            this.showNotification('İmza temizlenirken hata oluştu', 'error');
        }
    }

    clearStamp() {
        try {
            const stampImg = document.getElementById('stampImage');
            const placeholder = document.querySelector('#stampPreview .signature-placeholder');
            
            if (stampImg) stampImg.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
            
            this.showNotification('Kaşe temizlendi', 'warning');
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
        } catch (error) {
            Logger.error('clearStamp error:', error);
            this.showNotification('Kaşe temizlenirken hata oluştu', 'error');
        }
    }

    clearLogo() {
        try {
            const logo = document.getElementById('companyLogo');
            const placeholder = document.querySelector('#logoPreview .logo-placeholder');
            
            if (logo) logo.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
            
            this.showNotification('Logo temizlendi', 'warning');
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
        } catch (error) {
            Logger.error('clearLogo error:', error);
            this.showNotification('Logo temizlenirken hata oluştu', 'error');
        }
    }

    setupCoreSystems(isRestoring = false) {
        try {
            this.loadTheme();
            
            if (!document.getElementById('quoteDate').value || !isRestoring) {
                this.updateQuoteDate();
            }
            if (!document.getElementById('validUntil').value || !isRestoring) {
                this.updateValidUntilDate();
            }
            if (!document.getElementById('quoteNumber').value || !isRestoring) {
                this.generateQuoteNumber();
            }
            
            document.getElementById('quoteDate').addEventListener('change', () => {
                this.updateValidUntilDate();
            });
            
            const itemsTable = document.getElementById('itemsTableBody');
            if ((!itemsTable || itemsTable.children.length === 0) && !isRestoring) {
                this.addItem();
            }
            
            this.updateTotals();
            this.updateDiscountLabel();
        } catch (error) {
            Logger.error('setupCoreSystems error:', error);
        }
    }

    async loadCustomers() {
        try {
            return await this.db.getAll('customers', 'name');
        } catch (error) {
            Logger.error('Müşteriler yüklenirken hata:', error);
            return [];
        }
    }

    async saveCustomer(customerData) {
        try {
            customerData.lastUsed = new Date().toISOString();
            
            if (customerData.id) {
                return await this.db.update('customers', customerData.id, customerData);
            } else {
                return await this.db.add('customers', customerData);
            }
        } catch (error) {
            Logger.error('Müşteri kaydedilirken hata:', error);
            throw error;
        }
    }

    async deleteCustomer(customerId) {
        try {
            await this.db.delete('customers', customerId);
            return true;
        } catch (error) {
            Logger.error('Müşteri silinirken hata:', error);
            throw error;
        }
    }

    async loadProducts() {
        try {
            return await this.db.getAll('products', 'name');
        } catch (error) {
            Logger.error('Ürünler yüklenirken hata:', error);
            return [];
        }
    }

    async saveProduct(productData) {
        try {
            if (productData.id) {
                return await this.db.update('products', productData.id, productData);
            } else {
                return await this.db.add('products', productData);
            }
        } catch (error) {
            Logger.error('Ürün kaydedilirken hata:', error);
            throw error;
        }
    }

    async addAdvancedProduct() {
        try {
            const productData = {
                name: document.getElementById('advancedProductName').value,
                description: document.getElementById('advancedProductDescription').value,
                price: parseFloat(document.getElementById('advancedProductPrice').value) || 0,
                taxRate: parseInt(document.getElementById('advancedProductTaxRate').value) || 20,
                unit: document.getElementById('advancedProductUnit').value || 'Adet',
                image: document.getElementById('advancedProductImageDisplay').src || null
            };

            if (!productData.name) {
                this.showNotification('Ürün adı gereklidir', 'error');
                return;
            }

            await this.saveProduct(productData);
            this.showNotification('Ürün başarıyla eklendi', 'success');
            
            document.getElementById('advancedProductName').value = '';
            document.getElementById('advancedProductDescription').value = '';
            document.getElementById('advancedProductPrice').value = '';
            this.clearAdvancedProductImage();
            
            await this.loadAdvancedProducts();
            await this.updateProductCounts();

        } catch (error) {
            Logger.error('Ürün eklenirken hata:', error);
            this.showNotification('Ürün eklenirken hata oluştu', 'error');
        }
    }

    async loadAdvancedProducts() {
        try {
            const products = await this.loadProducts();
            const productList = document.getElementById('advancedProductList');
            if (!productList) return;

            if (products.length === 0) {
                productList.innerHTML = '<div class="empty-state"><i class="fas fa-boxes"></i><div>Henüz ürün kaydı bulunmamaktadır</div></div>';
                return;
            }

            productList.innerHTML = products.map(product => `
                <div class="product-item">
                    <div class="product-image">
                        ${product.image ? 
                            `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">` : 
                            '<i class="fas fa-box"></i>'
                        }
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-description">${product.description || 'Açıklama yok'}</div>
                        <div class="product-price">${this.formatCurrency(product.price)} (%${product.taxRate} KDV) - ${product.unit || 'Adet'}</div>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.selectProduct(${product.id})">
                            <i class="fas fa-check"></i> Seç
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            Logger.error('Ürün listesi yüklenirken hata:', error);
        }
    }

    async selectProduct(productId) {
        try {
            const products = await this.loadProducts();
            const product = products.find(p => p.id === productId);
            if (!product) return;

            this.addItem({
                description: product.name,
                price: product.price,
                taxRate: product.taxRate,
                unit: product.unit,
                notes: product.description
            });

            this.closeModal('advancedProductModal');
            this.showNotification('Ürün kalem olarak eklendi', 'success');
            
        } catch (error) {
            Logger.error('Ürün seçilirken hata:', error);
            this.showNotification('Ürün seçilirken hata oluştu', 'error');
        }
    }

    async deleteProduct(productId) {
        try {
            if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
                await this.db.delete('products', productId);
                this.showNotification('Ürün silindi', 'warning');
                await this.loadAdvancedProducts();
                await this.updateProductCounts();
            }
        } catch (error) {
            Logger.error('Ürün silinirken hata:', error);
            this.showNotification('Ürün silinirken hata oluştu', 'error');
        }
    }

    async saveQuote() {
        try {
            Logger.log('Teklif kaydetme başlatılıyor...');
            
            const formData = this.collectFormData();
            const items = this.collectItemsData();
            
            Logger.log('Toplanan veriler:', { formData, items });
            
            if (!formData.quote.number || !formData.customer.name) {
                throw new Error('Teklif numarası ve müşteri adı zorunludur');
            }
            
            if (items.length === 0) {
                throw new Error('En az bir kalem eklemelisiniz');
            }
            
            const quoteData = {
                id: this.currentQuoteId || `quote_${Date.now()}`,
                ...formData,
                items: items,
                status: 'completed',
                quoteNumber: formData.quote.number,
                customerName: formData.customer.name,
                customerCompany: formData.customer.company,
                totalAmount: parseFloat(document.getElementById('grandTotal').textContent.replace('.', '').replace(',', '.')) || 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            Logger.log('Kaydedilecek teklif verisi:', quoteData);

            let result;
            if (this.currentQuoteId) {
                Logger.log('Mevcut teklif güncelleniyor:', this.currentQuoteId);
                result = await this.db.update('quotes', this.currentQuoteId, quoteData);
            } else {
                Logger.log('Yeni teklif ekleniyor');
                result = await this.db.add('quotes', quoteData);
                this.currentQuoteId = result;
                this.safeLocalStorageSet('currentQuoteId', this.currentQuoteId);
            }

            Logger.log('Kayıt başarılı, sonuç:', result);

            this.setFormStatus('Gönderildi');
            this.showNotification('Teklif başarıyla kaydedildi!', 'success');
            
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            
            return result;
            
        } catch (error) {
            Logger.error('Teklif kaydetme hatası:', error);
            this.showNotification(`Teklif kaydedilemedi: ${error.message}`, 'error');
            throw error;
        }
    }

    async saveDraft() {
        try {
            const draftData = {
                id: this.currentQuoteId || Date.now(),
                ...this.collectFormData(),
                items: this.collectItemsData(),
                status: 'draft'
            };

            let result;
            if (draftData.id) {
                result = await this.db.update('drafts', draftData.id, draftData);
            } else {
                this.currentQuoteId = await this.db.add('drafts', draftData);
                this.safeLocalStorageSet('currentQuoteId', this.currentQuoteId);
                result = this.currentQuoteId;
            }

            this.setFormStatus('Taslak');
            this.showNotification('Taslak kaydedildi!', 'success');
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            return result;
            
        } catch (error) {
            Logger.error('Taslak kaydetme hatası:', error);
            this.showNotification('Taslak kaydedilirken hata oluştu', 'error');
            throw error;
        }
    }

    collectFormData() {
        const getValue = id => {
            const element = document.getElementById(id);
            return element ? element.value : '';
        };
        
        const getImage = id => {
            const img = document.getElementById(id);
            return img && img.style.display !== 'none' ? img.src : null;
        };

        return {
            quote: {
                title: getValue('quoteTitle'),
                number: getValue('quoteNumber'),
                date: getValue('quoteDate'),
                validUntil: getValue('validUntil'),
                description: getValue('quoteDescription')
            },
            customer: {
                name: getValue('customerName'),
                company: getValue('customerCompany'),
                email: getValue('customerEmail'),
                phone: getValue('customerPhone'),
                address: getValue('customerAddress')
            },
            company: {
                name: getValue('companyName'),
                address: getValue('companyAddress'),
                phone: getValue('companyPhone'),
                email: getValue('companyEmail'),
                website: getValue('companyWebsite'),
                authorized: getValue('companyAuthorized'),
                logo: getImage('companyLogo')
            },
            bank: {
                bankName: getValue('bankName'),
                bankBranch: getValue('bankBranch'),
                accountNumber: getValue('accountNumber'),
                iban: getValue('iban'),
                accountHolder: getValue('accountHolder')
            },
            terms: {
                payment: getValue('terms'),
                delivery: getValue('deliveryTerms'),
                warranty: getValue('warrantyTerms'),
                notes: getValue('notes')
            },
            signatures: {
                seller: getImage('sellerSignature'),
                stamp: getImage('stampImage')
            }
        };
    }

    collectItemsData() {
        try {
            const items = [];
            const rows = document.querySelectorAll('#itemsTableBody tr');
            
            Logger.log(`Toplam ${rows.length} kalem bulundu`);
            
            rows.forEach((row, index) => {
                try {
                    const description = row.querySelector('.item-description')?.value || '';
                    const notes = row.querySelector('.item-notes')?.value || '';
                    const quantity = parseFloat(row.querySelector('.item-quantity')?.value) || 0;
                    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
                    const taxRate = parseFloat(row.querySelector('.item-tax')?.value) || 0;
                    const unit = row.querySelector('.item-unit')?.value || 'Adet';
                    const totalElement = row.querySelector('.item-total');
                    const total = totalElement ? parseFloat(totalElement.textContent.replace('.', '').replace(',', '.')) || 0 : 0;
                    
                    const imgElement = row.querySelector('.item-image');
                    let image = null;
                    if (imgElement && imgElement.style.display !== 'none' && imgElement.src) {
                        image = imgElement.src;
                    }

                    if (description.trim() !== '') {
                        items.push({
                            description: description.trim(),
                            notes: notes.trim(),
                            quantity,
                            unit,
                            price,
                            taxRate,
                            total,
                            image,
                            rowIndex: index
                        });
                    }
                } catch (rowError) {
                    Logger.error(`Kalem ${index} toplanırken hata:`, rowError);
                }
            });
            
            Logger.log('Toplanan kalemler:', items);
            return items;
            
        } catch (error) {
            Logger.error('Kalem verisi toplama hatası:', error);
            return [];
        }
    }

    populateForm(formData) {
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        };

        if (formData.quote) {
            setValue('quoteTitle', formData.quote.title);
            setValue('quoteNumber', formData.quote.number);
            setValue('quoteDate', formData.quote.date);
            setValue('validUntil', formData.quote.validUntil);
            setValue('quoteDescription', formData.quote.description);
        }

        if (formData.customer) {
            setValue('customerName', formData.customer.name);
            setValue('customerCompany', formData.customer.company);
            setValue('customerEmail', formData.customer.email);
            setValue('customerPhone', formData.customer.phone);
            setValue('customerAddress', formData.customer.address);
        }

        if (formData.company) {
            setValue('companyName', formData.company.name);
            setValue('companyAddress', formData.company.address);
            setValue('companyPhone', formData.company.phone);
            setValue('companyEmail', formData.company.email);
            setValue('companyWebsite', formData.company.website);
            setValue('companyAuthorized', formData.company.authorized);
            
            if (formData.company.logo) {
                const logo = document.getElementById('companyLogo');
                const placeholder = document.querySelector('#logoPreview .logo-placeholder');
                if (logo && placeholder) {
                    placeholder.style.display = 'none';
                    logo.src = formData.company.logo;
                    logo.style.display = 'block';
                    logo.addEventListener('error', () => {
                        logo.style.display = 'none';
                        placeholder.style.display = 'flex';
                    });
                }
            }
        }

        if (formData.bank) {
            setValue('bankName', formData.bank.bankName);
            setValue('bankBranch', formData.bank.bankBranch);
            setValue('accountNumber', formData.bank.accountNumber);
            setValue('iban', formData.bank.iban);
            setValue('accountHolder', formData.bank.accountHolder);
        }

        if (formData.terms) {
            setValue('terms', formData.terms.payment);
            setValue('deliveryTerms', formData.terms.delivery);
            setValue('warrantyTerms', formData.terms.warranty);
            setValue('notes', formData.terms.notes);
        }

        if (formData.signatures) {
            if (formData.signatures.seller) {
                const signatureImg = document.getElementById('sellerSignature');
                const placeholder = document.querySelector('#sellerSignaturePreview .signature-placeholder');
                if (signatureImg && placeholder) {
                    placeholder.style.display = 'none';
                    signatureImg.src = formData.signatures.seller;
                    signatureImg.style.display = 'block';
                    signatureImg.addEventListener('error', () => {
                        signatureImg.style.display = 'none';
                        placeholder.style.display = 'flex';
                    });
                }
            }

            if (formData.signatures.stamp) {
                const stampImg = document.getElementById('stampImage');
                const placeholder = document.querySelector('#stampPreview .signature-placeholder');
                if (stampImg && placeholder) {
                    placeholder.style.display = 'none';
                    stampImg.src = formData.signatures.stamp;
                    stampImg.style.display = 'block';
                    stampImg.addEventListener('error', () => {
                        stampImg.style.display = 'none';
                        placeholder.style.display = 'flex';
                    });
                }
            }
        }
    }

    async updateSystemStatus() {
        try {
            await this.updateCustomerCounts();
            await this.updateProductCounts();
            await this.updateTemplateCounts();
            await this.updateBankInfoCounts();
        } catch (error) {
            Logger.error('Sistem durumu güncelleme hatası:', error);
        }
    }

    async updateCustomerCounts() {
        try {
            const customers = await this.loadCustomers();
            const count = customers.length;
            const element = document.getElementById('customerCount');
            if (element) element.textContent = count;
        } catch (error) {
            Logger.error('Müşteri sayacı güncelleme hatası:', error);
        }
    }

    async updateProductCounts() {
        try {
            const products = await this.loadProducts();
            const count = products.length;
            const element = document.getElementById('productCount');
            if (element) element.textContent = count;
        } catch (error) {
            Logger.error('Ürün sayacı güncelleme hatası:', error);
        }
    }

    async updateTemplateCounts() {
        try {
            const templates = await this.db.getAll('templates');
            const count = templates.length;
            const element = document.getElementById('templateCount');
            if (element) element.textContent = count;
        } catch (error) {
            Logger.error('Şablon sayacı güncelleme hatası:', error);
        }
    }

    async updateBankInfoCounts() {
        try {
            const bankInfo = await this.db.getAll('bankInfo');
            const count = bankInfo.length;
            const element = document.getElementById('dbBankInfoCount');
            if (element) element.textContent = count;
        } catch (error) {
            Logger.error('Banka bilgisi sayacı güncelleme hatası:', error);
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        Logger.log('Form submit event tetiklendi');
        
        try {
            const quoteNumber = document.getElementById('quoteNumber').value;
            const customerName = document.getElementById('customerName').value;
            
            if (!quoteNumber || !customerName) {
                this.showNotification('Teklif numarası ve müşteri adı zorunludur!', 'error');
                return;
            }
            
            this.saveQuote();
        } catch (error) {
            Logger.error('Form submit hatası:', error);
            this.showNotification('Form gönderilirken hata oluştu: ' + error.message, 'error');
        }
    }

    createNewQuote() {
        try {
            if (confirm('Yeni teklif oluşturmak istediğinizden emin misiniz? Kaydedilmemiş değişiklikler kaybolabilir.')) {
                document.getElementById('quoteForm').reset();
                
                this.clearImages();
                
                document.getElementById('itemsTableBody').innerHTML = '';
                this.clearFormState();
                this.setupCoreSystems();
                this.currentQuoteId = null;
                this.itemCounter = 0;
                
                this.safeLocalStorageSet('currentQuoteId', null);
                this.safeLocalStorageSet('itemCounter', 0);
                
                if (!this.isRestoringState) {
                    this.optimizedSaveFormState();
                }
                this.showNotification('Yeni teklif başlatıldı', 'success');
            }
        } catch (error) {
            Logger.error('createNewQuote error:', error);
            this.showNotification('Yeni teklif oluşturulurken hata oluştu', 'error');
        }
    }

    clearImages() {
        try {
            ['companyLogo', 'sellerSignature', 'stampImage'].forEach(id => {
                const img = document.getElementById(id);
                if (img) {
                    if (img.src && img.src.startsWith('blob:')) {
                        URL.revokeObjectURL(img.src);
                    }
                    img.style.display = 'none';
                    img.src = '';
                }
            });
            
            document.querySelectorAll('.logo-placeholder, .signature-placeholder').forEach(el => {
                el.style.display = 'flex';
            });
            
            document.querySelectorAll('.item-image').forEach(img => {
                if (img.src && img.src.startsWith('blob:')) {
                    URL.revokeObjectURL(img.src);
                }
                img.style.display = 'none';
                img.src = '';
            });
            document.querySelectorAll('.item-image-placeholder').forEach(el => {
                el.style.display = 'flex';
            });
        } catch (error) {
            Logger.error('clearImages error:', error);
        }
    }

    clearFormState() {
        try {
            localStorage.removeItem(this.formStateKey);
            Logger.log('Form state temizlendi');
        } catch (error) {
            Logger.error('clearFormState error:', error);
        }
    }

    clearLocalStorageData() {
        try {
            const appKeys = [
                'currentQuoteData', 'appTheme', 'pendingSync', 'formStateBackup', 
                this.formStateKey, 'demoDataLoaded'
            ];
            
            let clearedCount = 0;
            
            appKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    clearedCount++;
                }
            });
            
            if (clearedCount > 0) {
                this.showNotification(`Depolama temizlendi: ${clearedCount} öğe silindi`, 'warning');
            } else {
                this.showNotification('Temizlenecek veri bulunamadı', 'info');
            }
        } catch (error) {
            Logger.error('LocalStorage temizleme hatası:', error);
            this.showNotification('Depolama temizlenirken hata oluştu', 'error');
        }
    }

    async prepareQuoteDataForPreview() {
        try {
            const formData = this.collectFormData();
            const items = this.collectItemsData();
            
            const itemCount = items.length;
            let compactMode = '';
            if (itemCount >= 15) {
                compactMode = 'pdf-ultra-compact';
            } else if (itemCount >= 10) {
                compactMode = 'pdf-compact-mode';
            }

            const optimizedData = await this.optimizeQuoteDataForTransfer({
                quote: {
                    title: document.getElementById('quoteTitle').value || 'FİYAT TEKLİFİ',
                    number: document.getElementById('quoteNumber').value || 'TEKLIF-001',
                    date: document.getElementById('quoteDate').value || new Date().toISOString().split('T')[0],
                    validUntil: document.getElementById('validUntil').value || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    paymentTerms: document.getElementById('terms').value || 'Ödeme koşulları belirtilmemiş'
                },
                company: formData.company,
                customer: formData.customer,
                bank: formData.bank,
                items: items,
                summary: this.calculateSummary(items),
                terms: formData.terms,
                signatures: formData.signatures,
                timestamp: new Date().toISOString(),
                version: this.version,
                compactMode: compactMode
            });

            return optimizedData;
        } catch (error) {
            Logger.error('Quote data hazırlama hatası:', error);
            return this.getDefaultQuoteData();
        }
    }

    async optimizeQuoteDataForTransfer(quoteData) {
        const optimized = JSON.parse(JSON.stringify(quoteData));
        
        const optimizeImageData = async (imageData) => {
            if (!imageData || !this.isValidImageData(imageData)) return null;
            
            const size = this.getBase64Size(imageData);
            if (size > 200 * 1024) {
                Logger.warn(`Büyük resim tespit edildi: ${(size / 1024).toFixed(2)}KB`);
            }
            
            return imageData;
        };
        
        if (optimized.company && optimized.company.logo) {
            optimized.company.logo = await optimizeImageData(optimized.company.logo);
        }
        
        if (optimized.signatures && optimized.signatures.seller) {
            optimized.signatures.seller = await optimizeImageData(optimized.signatures.seller);
        }
        
        if (optimized.signatures && optimized.signatures.stamp) {
            optimized.signatures.stamp = await optimizeImageData(optimized.signatures.stamp);
        }
        
        if (optimized.items) {
            for (let i = 0; i < optimized.items.length; i++) {
                if (optimized.items[i].image) {
                    optimized.items[i].image = await optimizeImageData(optimized.items[i].image);
                }
            }
        }
        
        return optimized;
    }

    isValidImageData(imageData) {
        return imageData && 
               imageData !== 'null' && 
               imageData !== 'undefined' && 
               imageData !== '' &&
               (typeof imageData === 'string') &&
               (imageData.startsWith('data:image') || imageData.startsWith('blob:'));
    }

    getBase64Size(base64String) {
        if (!base64String) return 0;
        const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
        return (base64String.length * 3) / 4 - padding;
    }

    calculateSummary(items) {
        let subtotal = 0;
        const taxSummary = {};
        let totalTax = 0;

        items.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            const taxAmount = itemSubtotal * (item.taxRate / 100);

            subtotal += itemSubtotal;
            if (!taxSummary[item.taxRate]) {
                taxSummary[item.taxRate] = 0;
            }
            taxSummary[item.taxRate] += taxAmount;
            totalTax += taxAmount;
        });
        
        const discountType = document.getElementById('discountType').value;
        const discountValue = parseFloat(document.getElementById('discountValue').value) || 0;
        let discountAmount = 0;
        
        if (discountType === 'percentage') {
            discountAmount = subtotal * (discountValue / 100);
        } else if (discountType === 'fixed') {
            discountAmount = discountValue;
        }
        
        discountAmount = Math.min(discountAmount, subtotal);
        const grandTotal = (subtotal - discountAmount) + totalTax;

        return {
            subtotal: subtotal,
            discount: discountAmount,
            grandTotal: grandTotal,
            taxSummary: taxSummary,
            totalTax: totalTax
        };
    }

    getDefaultQuoteData() {
        return {
            quote: { 
                title: "FİYAT TEKLİFİ",
                number: "TEKLIF-001",
                date: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                paymentTerms: "Ödeme koşulları belirtilmemiş"
            },
            company: { 
                name: "Firma Adı",
                address: "Adres belirtilmemiş",
                phone: "Belirtilmemiş",
                email: "Belirtilmemiş",
                authorized: "Yetkili Satıcı",
                logo: null
            },
            customer: {
                company: "Müşteri Firma Adı",
                name: "",
                address: "",
                phone: "",
                email: ""
            },
            bank: {
                bankName: "",
                bankBranch: "",
                accountNumber: "",
                iban: "",
                accountHolder: ""
            },
            items: [],
            summary: {
                subtotal: 0,
                discount: 0,
                grandTotal: 0,
                totalTax: 0
            },
            terms: {
                delivery: "Teslimat koşulları belirtilmemiş.",
                warranty: "Garanti koşulları belirtilmemiş.",
                payment: "Ödeme koşulları belirtilmemiş.",
                notes: ""
            },
            signatures: {
                seller: null,
                stamp: null
            }
        };
    }

    async previewPDF() {
        try {
            Logger.log('PDF önizleme hazırlanıyor...');
            
            const quoteData = await this.prepareQuoteDataForPreview();
            Logger.log('Hazırlanan veri:', quoteData);
            
            const minimalData = this.removeImagesFromQuoteData(quoteData);
            
            localStorage.removeItem('currentQuoteData');
            this.safeLocalStorageSet('currentQuoteData', minimalData);
            Logger.log('Minimal localStorage kaydedildi');
            
            try {
                await this.db.savePreviewData(quoteData);
                Logger.log('IndexedDB kaydedildi');
            } catch (dbError) {
                Logger.warn('IndexedDB kaydedilemedi, sadece localStorage kullanılacak:', dbError);
            }
            
            const previewUrl = `preview.html`;
            Logger.log('Preview URL:', previewUrl);
            
            const previewWindow = window.open(previewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            
            if (previewWindow) {
                this.showNotification('PDF önizleme açılıyor...', 'success');
            } else {
                this.showNotification('Popup engellendi! Lütfen tarayıcınızda popup\'lara izin verin.', 'error');
                
                if (confirm('Popup engellendi. Preview aynı sekmede açılsın mı?')) {
                    window.location.href = previewUrl;
                }
            }
        } catch (error) {
            Logger.error('PDF önizleme hatası:', error);
            this.showNotification('PDF oluşturulurken hata oluştu: ' + error.message, 'error');
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
            const quoteData = await this.prepareQuoteDataForPreview();
            
            const minimalData = this.removeImagesFromQuoteData(quoteData);
            
            localStorage.removeItem('currentQuoteData');
            this.safeLocalStorageSet('currentQuoteData', minimalData);
            
            this.db.savePreviewData(quoteData).catch(error => {
                Logger.warn('IndexedDB kaydedilemedi:', error);
            });
            
            const previewWindow = window.open(`preview.html?autoDownload=true`, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            
            if (previewWindow) {
                this.showNotification('PDF indirme hazırlanıyor...', 'success');
            } else {
                this.showNotification('Popup engellendi! Lütfen tarayıcınızda popup\'lara izin verin.', 'error');
            }
        } catch (error) {
            Logger.error('PDF indirme hatası:', error);
            this.showNotification('PDF indirilirken hata oluştu', 'error');
        }
    }

    quickPreviewAndDownload() {
        this.quickDownloadPDF();
    }

    openModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        } catch (error) {
            Logger.error('openModal error:', error);
            this.showNotification('Modal açılırken hata oluştu', 'error');
        }
    }

    closeModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            
            if (modalId === 'signatureModal' && this.signaturePad) {
                this.signaturePad.clear();
                window.removeEventListener('resize', this.resizeSignatureCanvas.bind(this));
            }
        } catch (error) {
            Logger.error('closeModal error:', error);
        }
    }

    setFormStatus(status) {
        try {
            const element = document.getElementById('formStatus');
            if (element) {
                element.textContent = status;
                const colors = {
                    'Taslak': 'warning',
                    'Gönderildi': 'success', 
                    'Yeni': 'info',
                    'Şablon': 'primary'
                };
                element.className = `status-badge status-${colors[status] || 'info'}`;
            }
        } catch (error) {
            Logger.error('setFormStatus error:', error);
        }
    }

    updateLastSaved() {
        try {
            const element = document.getElementById('lastSaved');
            if (element) {
                element.textContent = `Son kayıt: ${new Date().toLocaleTimeString('tr-TR')}`;
            }
        } catch (error) {
            Logger.error('updateLastSaved error:', error);
        }
    }

    async showStorageManager() {
        try {
            const usage = await this.db.getStorageUsage();
            const optimizationResult = await this.db.optimizeStorage();
            
            let message = `
                <h3>Depolama Kullanımı</h3>
                <div style="max-height: 300px; overflow-y: auto;">
            `;
            
            let totalSize = 0;
            for (const [store, info] of Object.entries(usage)) {
                totalSize += info.size;
                message += `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 4px; border-bottom: 1px solid #e2e8f0;">
                        <span>${store}:</span>
                        <span>${info.count} kayıt - ${this.db.formatBytes(info.size)}</span>
                    </div>
                `;
            }
            
            message += `
                </div>
                <div style="margin-top: 16px; padding: 12px; background: #f0f9ff; border-radius: 6px;">
                    <strong>Toplam:</strong> ${this.db.formatBytes(totalSize)}<br>
                    <strong>Temizlenen:</strong> ${optimizationResult.readableFreed}
                </div>
            `;
            
            this.showNotification(message, 'info', 10000);
        } catch (error) {
            Logger.error('Depolama yöneticisi hatası:', error);
            this.showNotification('Depolama bilgileri yüklenirken hata oluştu', 'error');
        }
    }

    async optimizeAllImages() {
        try {
            this.showNotification('Tüm resimler optimize ediliyor...', 'info');
            
            const logo = document.getElementById('companyLogo');
            if (logo && logo.style.display !== 'none' && logo.src) {
                try {
                    const response = await fetch(logo.src);
                    const blob = await response.blob();
                    const file = new File([blob], 'logo', { type: blob.type });
                    const optimizedLogo = await this.imageOptimizer.optimizeImage(file);
                    logo.src = optimizedLogo;
                } catch (error) {
                    Logger.error('Logo optimize hatası:', error);
                }
            }
            
            const signature = document.getElementById('sellerSignature');
            if (signature && signature.style.display !== 'none' && signature.src) {
                try {
                    const response = await fetch(signature.src);
                    const blob = await response.blob();
                    const file = new File([blob], 'signature', { type: blob.type });
                    const optimizedSignature = await this.imageOptimizer.optimizeImage(file);
                    signature.src = optimizedSignature;
                } catch (error) {
                    Logger.error('İmza optimize hatası:', error);
                }
            }
            
            const stamp = document.getElementById('stampImage');
            if (stamp && stamp.style.display !== 'none' && stamp.src) {
                try {
                    const response = await fetch(stamp.src);
                    const blob = await response.blob();
                    const file = new File([blob], 'stamp', { type: blob.type });
                    const optimizedStamp = await this.imageOptimizer.optimizeImage(file, true);
                    stamp.src = optimizedStamp;
                } catch (error) {
                    Logger.error('Kaşe optimize hatası:', error);
                }
            }
            
            const productImages = document.querySelectorAll('.item-image');
            let optimizedCount = 0;
            
            for (const img of productImages) {
                if (img.style.display !== 'none' && img.src) {
                    try {
                        const response = await fetch(img.src);
                        const blob = await response.blob();
                        const file = new File([blob], 'product', { type: blob.type });
                        const optimizedImage = await this.imageOptimizer.optimizeImage(file);
                        img.src = optimizedImage;
                        optimizedCount++;
                    } catch (error) {
                        Logger.error('Ürün resmi optimize hatası:', error);
                    }
                }
            }
            
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            this.showNotification(`${optimizedCount} ürün resmi ve diğer görseller optimize edildi`, 'success');
            
        } catch (error) {
            Logger.error('Resim optimizasyon hatası:', error);
            this.showNotification('Resimler optimize edilirken hata oluştu', 'error');
        }
    }

    showAdvancedCustomerManager() {
        this.openModal('advancedCustomerModal');
        this.loadAdvancedCustomers();
    }

    showAdvancedProductCatalog() {
        this.openModal('advancedProductModal');
        this.loadAdvancedProducts();
    }

    showTemplates() {
        this.openModal('templateModal');
        this.loadTemplates();
    }

    showSavedQuotes() {
        this.openModal('savedQuotesModal');
        this.loadSavedQuotes();
    }

    showBankInfoManager() {
        this.openModal('bankInfoModal');
        this.loadBankInfo();
    }

    showDatabaseManager() {
        this.openModal('databaseModal');
        this.refreshDatabaseStats();
    }

    showAnalytics() {
        this.openModal('analyticsModal');
        this.updateAnalytics();
    }

    async updateAnalytics() {
        try {
            const quotes = await this.db.getAll('quotes');
            const customers = await this.db.getAll('customers');
            const products = await this.db.getAll('products');
            
            const totalQuotes = quotes.length;
            const totalCustomers = customers.length;
            const totalProducts = products.length;
            
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentQuotes = quotes.filter(quote => 
                new Date(quote.createdAt) > thirtyDaysAgo
            ).length;
            
            const totalRevenue = quotes.reduce((sum, quote) => 
                sum + (quote.totalAmount || 0), 0
            );
            
            document.getElementById('totalQuotes').textContent = totalQuotes;
            document.getElementById('totalCustomers').textContent = totalCustomers;
            document.getElementById('totalProducts').textContent = totalProducts;
            document.getElementById('totalRevenue').textContent = this.formatCurrency(totalRevenue);
            document.getElementById('recentQuotes').textContent = `${recentQuotes} teklif`;
            
        } catch (error) {
            Logger.error('Analitik güncelleme hatası:', error);
        }
    }

    async refreshDatabaseStats() {
        try {
            const stats = await this.db.getDatabaseStats();
            
            document.getElementById('dbCustomerCount').textContent = stats.customers || 0;
            document.getElementById('dbProductCount').textContent = stats.products || 0;
            document.getElementById('dbQuoteCount').textContent = stats.quotes || 0;
            document.getElementById('dbDraftCount').textContent = stats.drafts || 0;
            document.getElementById('dbTemplateCount').textContent = stats.templates || 0;
            document.getElementById('dbBankInfoCount').textContent = stats.bankInfo || 0;
            document.getElementById('dbTotalSize').textContent = this.db.formatBytes(stats.totalSize || 0);
            
        } catch (error) {
            Logger.error('Database istatistikleri yüklenirken hata:', error);
        }
    }

    showQuickHelp() {
        this.showNotification(`
            <h3>Hızlı Başlangıç</h3>
            <ul>
                <li><strong>Ctrl+S:</strong> Taslak Kaydet</li>
                <li><strong>Ctrl+Shift+S:</strong> Teklifi Tamamla</li>
                <li><strong>Ctrl+P:</strong> PDF Önizleme</li>
                <li><strong>Ctrl+D:</strong> Hızlı PDF İndirme</li>
                <li><strong>Ctrl+N:</strong> Yeni Teklif</li>
                <li><strong>Özellik:</strong> Veriler asla kaybolmaz!</li>
            </ul>
        `, 'info', 10000);
    }

    async loadAdvancedCustomers() {
        try {
            const customers = await this.loadCustomers();
            const customerList = document.getElementById('advancedCustomerList');
            if (!customerList) return;

            if (customers.length === 0) {
                customerList.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><div>Henüz müşteri kaydı bulunmamaktadır</div></div>';
                return;
            }

            customerList.innerHTML = customers.map(customer => `
                <div class="customer-item">
                    <div class="customer-info">
                        <div class="customer-name">${customer.name || 'İsimsiz'}</div>
                        <div class="customer-details">
                            ${customer.company ? `<div><strong>Firma:</strong> ${customer.company}</div>` : ''}
                            ${customer.email ? `<div><strong>E-posta:</strong> ${customer.email}</div>` : ''}
                            ${customer.phone ? `<div><strong>Telefon:</strong> ${customer.phone}</div>` : ''}
                        </div>
                        ${customer.address ? `<div class="customer-address">${customer.address}</div>` : ''}
                    </div>
                    <div class="customer-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.selectCustomer(${customer.id})">
                            <i class="fas fa-check"></i> Seç
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteCustomer(${customer.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            Logger.error('Müşteri listesi yüklenirken hata:', error);
        }
    }

    async addAdvancedCustomer() {
        try {
            const customerData = {
                name: document.getElementById('advancedCustomerName').value,
                company: document.getElementById('advancedCustomerCompany').value,
                email: document.getElementById('advancedCustomerEmail').value,
                phone: document.getElementById('advancedCustomerPhone').value,
                address: document.getElementById('advancedCustomerAddress').value
            };

            if (!customerData.name && !customerData.company) {
                this.showNotification('Müşteri adı veya firma bilgisi gereklidir', 'error');
                return;
            }

            await this.saveCustomer(customerData);
            this.showNotification('Müşteri başarıyla eklendi', 'success');
            
            document.getElementById('advancedCustomerName').value = '';
            document.getElementById('advancedCustomerCompany').value = '';
            document.getElementById('advancedCustomerEmail').value = '';
            document.getElementById('advancedCustomerPhone').value = '';
            document.getElementById('advancedCustomerAddress').value = '';
            
            await this.loadAdvancedCustomers();
            await this.updateCustomerCounts();

        } catch (error) {
            Logger.error('Müşteri eklenirken hata:', error);
            this.showNotification('Müşteri eklenirken hata oluştu', 'error');
        }
    }

    async selectCustomer(customerId) {
        try {
            const customers = await this.loadCustomers();
            const customer = customers.find(c => c.id === customerId);
            if (!customer) return;

            document.getElementById('customerName').value = customer.name || '';
            document.getElementById('customerCompany').value = customer.company || '';
            document.getElementById('customerEmail').value = customer.email || '';
            document.getElementById('customerPhone').value = customer.phone || '';
            document.getElementById('customerAddress').value = customer.address || '';

            this.closeModal('advancedCustomerModal');
            this.showNotification('Müşteri bilgileri forma yüklendi', 'success');
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            
        } catch (error) {
            Logger.error('Müşteri seçilirken hata:', error);
            this.showNotification('Müşteri seçilirken hata oluştu', 'error');
        }
    }

    async loadTemplates() {
        try {
            const templates = await this.db.getAll('templates');
            const templateList = document.getElementById('templateList');
            if (!templateList) return;

            if (templates.length === 0) {
                templateList.innerHTML = '<div class="empty-state"><i class="fas fa-layer-group"></i><div>Henüz şablon kaydı bulunmamaktadır</div></div>';
                return;
            }

            templateList.innerHTML = templates.map(template => `
                <div class="template-item">
                    <div class="template-info">
                        <div class="template-name">${template.name}</div>
                        <div class="template-description">${template.description || 'Açıklama yok'}</div>
                        <div class="template-meta">Oluşturulma: ${new Date(template.createdAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div class="template-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.loadTemplate(${template.id})">
                            <i class="fas fa-check"></i> Yükle
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteTemplate(${template.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            Logger.error('Şablon listesi yüklenirken hata:', error);
        }
    }

    async saveTemplate() {
        try {
            const templateData = {
                name: document.getElementById('templateName').value,
                description: document.getElementById('templateDescription').value,
                formData: this.collectFormData(),
                items: this.collectItemsData()
            };

            if (!templateData.name) {
                this.showNotification('Şablon adı gereklidir', 'error');
                return;
            }

            await this.db.add('templates', templateData);
            this.showNotification('Şablon başarıyla kaydedildi', 'success');
            
            document.getElementById('templateName').value = '';
            document.getElementById('templateDescription').value = '';
            
            await this.loadTemplates();
            await this.updateTemplateCounts();

        } catch (error) {
            Logger.error('Şablon kaydedilirken hata:', error);
            this.showNotification('Şablon kaydedilirken hata oluştu', 'error');
        }
    }

    async loadTemplate(templateId) {
        try {
            const templates = await this.db.getAll('templates');
            const template = templates.find(t => t.id === templateId);
            if (!template) return;

            this.populateForm(template.formData);
            
            document.getElementById('itemsTableBody').innerHTML = '';
            this.itemCounter = 0;
            this.safeLocalStorageSet('itemCounter', this.itemCounter);
            template.items.forEach(item => {
                this.addItem(item);
            });

            this.closeModal('templateModal');
            this.showNotification('Şablon yüklendi', 'success');
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            
        } catch (error) {
            Logger.error('Şablon yüklenirken hata:', error);
            this.showNotification('Şablon yüklenirken hata oluştu', 'error');
        }
    }

    async deleteTemplate(templateId) {
        try {
            if (confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
                await this.db.delete('templates', templateId);
                this.showNotification('Şablon silindi', 'warning');
                await this.loadTemplates();
                await this.updateTemplateCounts();
            }
        } catch (error) {
            Logger.error('Şablon silinirken hata:', error);
            this.showNotification('Şablon silinirken hata oluştu', 'error');
        }
    }

    async loadSavedQuotes() {
        try {
            const quotes = await this.db.getAll('quotes');
            const drafts = await this.db.getAll('drafts');
            const allQuotes = [...quotes, ...drafts];
            
            const quotesList = document.getElementById('savedQuotesList');
            if (!quotesList) return;

            if (allQuotes.length === 0) {
                quotesList.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><div>Henüz kayıtlı teklif bulunmamaktadır</div></div>';
                return;
            }

            allQuotes.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

            quotesList.innerHTML = allQuotes.map(quote => `
                <div class="quote-item">
                    <div class="quote-info">
                        <div class="quote-header">
                            <div class="quote-number">${quote.quoteNumber || 'Numara Yok'}</div>
                            <div class="quote-status status-${quote.status}">${quote.status === 'draft' ? 'Taslak' : 'Tamamlandı'}</div>
                        </div>
                        <div class="quote-customer">${quote.customerName || 'Müşteri Yok'} - ${quote.customerCompany || 'Firma Yok'}</div>
                        <div class="quote-meta">
                            <span>Toplam: ${this.formatCurrency(quote.totalAmount || 0)}</span>
                            <span>Tarih: ${new Date(quote.updatedAt || quote.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                    </div>
                    <div class="quote-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.loadSavedQuote(${quote.id}, '${quote.status}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteSavedQuote(${quote.id}, '${quote.status}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            Logger.error('Kayıtlı teklifler yüklenirken hata:', error);
        }
    }

    async loadSavedQuote(quoteId, status) {
        try {
            const store = status === 'draft' ? 'drafts' : 'quotes';
            const quotes = await this.db.getAll(store);
            const quote = quotes.find(q => q.id === quoteId);
            if (!quote) return;

            this.populateForm(quote);
            
            document.getElementById('itemsTableBody').innerHTML = '';
            this.itemCounter = 0;
            this.safeLocalStorageSet('itemCounter', this.itemCounter);
            quote.items.forEach(item => {
                this.addItem(item);
            });

            this.currentQuoteId = quoteId;
            this.safeLocalStorageSet('currentQuoteId', this.currentQuoteId);
            this.setFormStatus(status === 'draft' ? 'Taslak' : 'Gönderildi');
            
            this.closeModal('savedQuotesModal');
            this.showNotification('Teklif yüklendi', 'success');
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            
        } catch (error) {
            Logger.error('Teklif yüklenirken hata:', error);
            this.showNotification('Teklif yüklenirken hata oluştu', 'error');
        }
    }

    async deleteSavedQuote(quoteId, status) {
        try {
            if (confirm('Bu teklifi silmek istediğinizden emin misiniz?')) {
                const store = status === 'draft' ? 'drafts' : 'quotes';
                await this.db.delete(store, quoteId);
                this.showNotification('Teklif silindi', 'warning');
                await this.loadSavedQuotes();
            }
        } catch (error) {
            Logger.error('Teklif silinirken hata:', error);
            this.showNotification('Teklif silinirken hata oluştu', 'error');
        }
    }

    async loadBankInfo() {
        try {
            const bankInfo = await this.db.getAll('bankInfo');
            const bankList = document.getElementById('bankInfoList');
            if (!bankList) return;

            if (bankInfo.length === 0) {
                bankList.innerHTML = '<div class="empty-state"><i class="fas fa-university"></i><div>Henüz banka bilgisi kaydı bulunmamaktadır</div></div>';
                return;
            }

            bankList.innerHTML = bankInfo.map(bank => `
                <div class="bank-item">
                    <div class="bank-info">
                        <div class="bank-name">${bank.bankName || 'Banka Adı Yok'}</div>
                        <div class="bank-details">
                            ${bank.bankBranch ? `<div><strong>Şube:</strong> ${bank.bankBranch}</div>` : ''}
                            ${bank.accountNumber ? `<div><strong>Hesap No:</strong> ${bank.accountNumber}</div>` : ''}
                            ${bank.iban ? `<div><strong>IBAN:</strong> ${bank.iban}</div>` : ''}
                            ${bank.accountHolder ? `<div><strong>Hesap Sahibi:</strong> ${bank.accountHolder}</div>` : ''}
                        </div>
                    </div>
                    <div class="bank-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.selectBankInfo(${bank.id})">
                            <i class="fas fa-check"></i> Seç
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteBankInfo(${bank.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            Logger.error('Banka bilgileri yüklenirken hata:', error);
        }
    }

    async saveBankInfo() {
        try {
            const bankData = {
                bankName: document.getElementById('bankName').value,
                bankBranch: document.getElementById('bankBranch').value,
                accountNumber: document.getElementById('accountNumber').value,
                iban: document.getElementById('iban').value,
                accountHolder: document.getElementById('accountHolder').value
            };

            if (!bankData.bankName) {
                this.showNotification('Banka adı gereklidir', 'error');
                return;
            }

            await this.db.add('bankInfo', bankData);
            this.showNotification('Banka bilgileri başarıyla kaydedildi', 'success');
            
            document.getElementById('bankName').value = '';
            document.getElementById('bankBranch').value = '';
            document.getElementById('accountNumber').value = '';
            document.getElementById('iban').value = '';
            document.getElementById('accountHolder').value = '';
            
            await this.loadBankInfo();

        } catch (error) {
            Logger.error('Banka bilgileri kaydedilirken hata:', error);
            this.showNotification('Banka bilgileri kaydedilirken hata oluştu', 'error');
        }
    }

    async selectBankInfo(bankId) {
        try {
            const bankInfo = await this.db.getAll('bankInfo');
            const bank = bankInfo.find(b => b.id === bankId);
            if (!bank) return;

            document.getElementById('bankName').value = bank.bankName || '';
            document.getElementById('bankBranch').value = bank.bankBranch || '';
            document.getElementById('accountNumber').value = bank.accountNumber || '';
            document.getElementById('iban').value = bank.iban || '';
            document.getElementById('accountHolder').value = bank.accountHolder || '';

            this.closeModal('bankInfoModal');
            this.showNotification('Banka bilgileri forma yüklendi', 'success');
            if (!this.isRestoringState) {
                this.optimizedSaveFormState();
            }
            
        } catch (error) {
            Logger.error('Banka bilgileri seçilirken hata:', error);
            this.showNotification('Banka bilgileri seçilirken hata oluştu', 'error');
        }
    }

    async deleteBankInfo(bankId) {
        try {
            if (confirm('Bu banka bilgisini silmek istediğinizden emin misiniz?')) {
                await this.db.delete('bankInfo', bankId);
                this.showNotification('Banka bilgisi silindi', 'warning');
                await this.loadBankInfo();
            }
        } catch (error) {
            Logger.error('Banka bilgisi silinirken hata:', error);
            this.showNotification('Banka bilgisi silinirken hata oluştu', 'error');
        }
    }

    async exportAllData() {
        try {
            const backup = await this.db.createBackup();
            const dataStr = JSON.stringify(backup, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `teklifmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification('Tüm veri başarıyla dışa aktarıldı', 'success');
        } catch (error) {
            Logger.error('Veri dışa aktarılırken hata:', error);
            this.showNotification('Veri dışa aktarılırken hata oluştu', 'error');
        }
    }

    async importData() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const backupData = JSON.parse(event.target.result);
                        await this.db.restoreBackup(backupData);
                        this.showNotification('Veri başarıyla içe aktarıldı', 'success');
                        await this.refreshDatabaseStats();
                        await this.updateSystemStatus();
                    } catch (error) {
                        Logger.error('Veri içe aktarılırken hata:', error);
                        this.showNotification('Geçersiz yedek dosyası', 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        } catch (error) {
            Logger.error('Veri içe aktarılırken hata:', error);
            this.showNotification('Veri içe aktarılırken hata oluştu', 'error');
        }
    }

    async createBackup() {
        await this.exportAllData();
    }

    async restoreBackup() {
        await this.importData();
    }

    async migrateFromLocalStorage() {
        try {
            const migratedCount = await this.db.migrateFromLocalStorage();
            if (migratedCount > 0) {
                this.showNotification(`${migratedCount} kayıt localStorage'tan taşındı`, 'success');
            } else {
                this.showNotification('Taşınacak veri bulunamadı', 'info');
            }
            await this.refreshDatabaseStats();
            await this.updateSystemStatus();
        } catch (error) {
            Logger.error('Veri taşıma hatası:', error);
            this.showNotification('Veri taşınırken hata oluştu', 'error');
        }
    }

    async clearAllData() {
        try {
            if (confirm('TÜM verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                await this.db.clearAllData();
                localStorage.clear();
                this.showNotification('Tüm veriler temizlendi', 'warning');
                await this.refreshDatabaseStats();
                await this.updateSystemStatus();
                location.reload();
            }
        } catch (error) {
            Logger.error('Veri temizleme hatası:', error);
            this.showNotification('Veri temizlenirken hata oluştu', 'error');
        }
    }

    searchCustomers() {
        const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
        const customerItems = document.querySelectorAll('.customer-item');
        
        customerItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    searchProducts() {
        const searchTerm = document.getElementById('productSearch').value.toLowerCase();
        const productItems = document.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    searchBankInfo() {
        const searchTerm = document.getElementById('bankSearch').value.toLowerCase();
        const bankItems = document.querySelectorAll('.bank-item');
        
        bankItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    formatCurrency(amount) {
        try {
            return new Intl.NumberFormat('tr-TR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (error) {
            Logger.error('formatCurrency error:', error);
            return amount.toFixed(2);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async testSaveFunction() {
        try {
            Logger.log('=== TEST MODU BAŞLATILIYOR ===');
            
            document.getElementById('quoteTitle').value = 'Test Teklifi';
            document.getElementById('quoteNumber').value = 'TEST-' + Date.now();
            document.getElementById('customerName').value = 'Test Müşteri';
            document.getElementById('customerCompany').value = 'Test Firma';
            
            this.addItem({
                description: 'Test Ürün',
                quantity: 1,
                price: 1000,
                taxRate: 18,
                unit: 'Adet'
            });
            
            this.updateTotals();
            
            Logger.log('Test verileri hazır, kayıt deneniyor...');
            
            const result = await this.saveQuote();
            Logger.log('Test kaydı sonucu:', result);
            
        } catch (error) {
            Logger.error('Test kaydı başarısız:', error);
            this.showNotification('Test başarısız: ' + error.message, 'error');
        }
    }

    async checkStorageQuota() {
        try {
            const testKey = 'quota_test';
            const testData = 'a'.repeat(1024 * 1024);
            
            try {
                localStorage.setItem(testKey, testData);
                localStorage.removeItem(testKey);
                Logger.log('localStorage kotası yeterli');
            } catch (error) {
                Logger.warn('localStorage kotası dolu, temizleme yapılacak');
                await this.cleanupLocalStorage();
            }
            
        } catch (error) {
            Logger.error('Storage kota kontrol hatası:', error);
        }
    }

    async cleanupLocalStorage() {
        try {
            const keysToKeep = [
                'appTheme', 'teklifmaster_minimal_v2', 
                'currentQuoteId', 'itemCounter'
            ];
            const allKeys = Object.keys(localStorage);
            let cleanedCount = 0;
            
            for (const key of allKeys) {
                if (!keysToKeep.includes(key) && key !== this.formStateKey) {
                    localStorage.removeItem(key);
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                Logger.log(`${cleanedCount} localStorage öğesi temizlendi`);
            }
            
            if (localStorage.getItem(this.formStateKey)) {
                const stateSize = new Blob([localStorage.getItem(this.formStateKey)]).size;
                if (stateSize > 1 * 1024 * 1024) {
                    localStorage.removeItem(this.formStateKey);
                    Logger.log('Büyük form state temizlendi');
                }
            }
            
        } catch (error) {
            Logger.error('LocalStorage temizleme hatası:', error);
        }
    }
}