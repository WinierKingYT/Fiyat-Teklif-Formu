// Global app instance için
let app;

// Global fonksiyonlar - HTML'deki onclick event'leri için
window.showCustomerManager = () => app?.showAdvancedCustomerManager();
window.showProductCatalog = () => app?.showAdvancedProductCatalog();
window.showTemplates = () => app?.showTemplates();
window.showDatabaseManager = () => app?.showDatabaseManager();
window.showBankInfoManager = () => app?.showBankInfoManager();
window.showAnalytics = () => app?.showAnalytics();
window.showSavedQuotes = () => app?.showSavedQuotes();
window.toggleTheme = () => app?.toggleTheme();
window.quickPreviewAndDownload = () => app?.quickPreviewAndDownload();

// Form işlemleri
window.addItem = () => app?.addItem();
window.removeItem = (button) => app?.removeItem(button);
window.duplicateItem = (button) => app?.duplicateItem(button);
window.addItemGroup = () => app?.addItemGroup();
window.clearAllItems = () => app?.clearAllItems();
window.updateDiscount = () => app?.updateDiscount();
window.updateValidUntilDate = () => app?.updateValidUntilDate();

// Görsel işlemleri
window.triggerImageUpload = (itemId) => app?.triggerImageUpload(itemId);
window.removeItemImage = (itemId) => app?.removeItemImage(itemId);
window.clearLogo = () => app?.clearLogo();
window.clearSignature = () => app?.clearSignature();
window.clearStamp = () => app?.clearStamp();

// Modal işlemleri
window.openSignatureModal = () => app?.openSignatureModal();
window.clearSignatureCanvas = () => app?.clearSignatureCanvas();
window.saveSignature = () => app?.saveSignature();
window.toggleBankSelection = () => app?.toggleBankSelection();
window.selectBankFromDropdown = (bankId) => app?.selectBankFromDropdown(bankId);

// Test ve yardım
window.testSaveFunction = () => app?.testSaveFunction();
window.showQuickHelp = () => app?.showQuickHelp();

// Logo ve kaşe yükleme
window.handleLogoUpload = (input) => app?.handleLogoUpload(input);
window.handleStampUpload = (input) => app?.handleStampUpload(input);

// Müşteri, ürün, şablon yönetimi
window.addAdvancedCustomer = () => app?.addAdvancedCustomer();
window.selectCustomer = (customerId) => app?.selectCustomer(customerId);
window.searchCustomers = () => app?.searchCustomers();
window.addAdvancedProduct = () => app?.addAdvancedProduct();
window.selectProduct = (productId) => app?.selectProduct(productId);
window.searchProducts = () => app?.searchProducts();
window.handleAdvancedProductImageUpload = (input) => app?.handleAdvancedProductImageUpload(input);
window.clearAdvancedProductImage = () => app?.clearAdvancedProductImage();
window.saveTemplate = () => app?.saveTemplate();
window.loadTemplate = (templateId) => app?.loadTemplate(templateId);
window.deleteTemplate = (templateId) => app?.deleteTemplate(templateId);
window.saveBankInfo = () => app?.saveBankInfo();
window.selectBankInfo = (bankId) => app?.selectBankInfo(bankId);
window.searchBankInfo = () => app?.searchBankInfo();
window.deleteBankInfo = (bankId) => app?.deleteBankInfo(bankId);
window.loadSavedQuote = (quoteId, status) => app?.loadSavedQuote(quoteId, status);
window.deleteSavedQuote = (quoteId, status) => app?.deleteSavedQuote(quoteId, status);

// Veritabanı işlemleri
window.clearLocalStorageData = () => app?.clearLocalStorageData();
window.createBackup = () => app?.createBackup();
window.restoreBackup = () => app?.restoreBackup();
window.exportAllData = () => app?.exportAllData();
window.importData = () => app?.importData();
window.migrateFromLocalStorage = () => app?.migrateFromLocalStorage();
window.clearAllData = () => app?.clearAllData();
window.refreshDatabaseStats = () => app?.refreshDatabaseStats();
window.updateAnalytics = () => app?.updateAnalytics();