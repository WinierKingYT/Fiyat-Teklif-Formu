import React from 'react';
import { useState, useEffect } from 'react';
import { useQuote } from '../context/QuoteContext';
import { Activity, Trash2, Database, RefreshCw, AlertTriangle, CheckCircle, Download, Upload } from 'lucide-react';
import CleanupConfirmModal from './CleanupConfirmModal';
import toast from 'react-hot-toast';

/**
 * Performance & Maintenance Tab Component for Settings
 */
const PerformanceMaintenanceTab = () => {
    const { db, tabs, setTabs, cleanupService, performanceMonitor, createBackup, restoreBackup } = useQuote();
    const fileInputRef = React.useRef(null);

    const [metrics, setMetrics] = useState(null);
    const [cleanupStats, setCleanupStats] = useState(null);
    const [cleanupSettings, setCleanupSettings] = useState({
        autoCleanupEnabled: false,
        quoteRetentionDays: 90,
        recycleBinRetentionDays: 30,
        cleanupOnStartup: false,
        maxHistorySteps: 50
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [cleanupAction, setCleanupAction] = useState(null);

    // Load metrics and cleanup settings
    useEffect(() => {
        loadData();
    }, [db]);

    const loadData = async () => {
        if (!db) return;

        setLoading(true);
        try {
            // Load performance metrics
            const perfMetrics = await performanceMonitor.getPerformanceMetrics(db, tabs);
            setMetrics(perfMetrics);

            // Load cleanup settings
            const settings = await cleanupService.loadSettings();
            setCleanupSettings(settings);

            // Load cleanup stats
            const stats = await cleanupService.getCleanupStats();
            setCleanupStats(stats);
        } catch (error) {
            console.error('Error loading performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setTimeout(() => setRefreshing(false), 500);
        toast.success('Veriler yenilendi');
    };

    const handleCleanupSettingsChange = (key, value) => {
        setCleanupSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveSettings = async () => {
        try {
            await cleanupService.saveSettings(cleanupSettings);
            toast.success('Ayarlar kaydedildi');
        } catch (error) {
            toast.error('Ayarlar kaydedilemedi');
            console.error(error);
        }
    };

    const handleCleanupClick = (action) => {
        setCleanupAction(action);
        setShowCleanupModal(true);
    };

    const handleConfirmCleanup = async () => {
        try {
            let result;
            switch (cleanupAction.type) {
                case 'old_quotes':
                    result = await cleanupService.cleanOldQuotes();
                    toast.success(`${result.deletedCount} eski teklif temizlendi`);
                    break;
                case 'recycle_bin':
                    result = await cleanupService.cleanRecycleBin();
                    toast.success(`${result.deletedCount} öğe geri dönüşüm kutusundan silindi`);
                    break;
                case 'orphaned':
                    result = await cleanupService.cleanOrphanedData();
                    toast.success(`${result.cleanedCount} bağlantısız veri temizlendi`);
                    break;
                case 'trim_history':
                    const trimmedTabs = cleanupService.trimTabHistory(tabs);
                    setTabs(trimmedTabs);
                    toast.success('Geçmiş temizlendi');
                    break;
                case 'full':
                    result = await cleanupService.performFullCleanup();
                    toast.success('Tam temizlik tamamlandı');
                    break;
                default:
                    break;
            }
            // Refresh stats
            await loadData();
        } catch (error) {
            toast.error('Temizlik sırasında hata oluştu');
            console.error(error);
        }
    };

    const getCleanupModalInfo = () => {
        if (!cleanupAction) return {};

        switch (cleanupAction.type) {
            case 'old_quotes':
                return {
                    title: 'Eski Teklifleri Temizle',
                    message: `${cleanupSettings.quoteRetentionDays} günden eski teklifler silinecek.`,
                    itemCount: cleanupStats?.oldQuotes || 0,
                    itemType: 'teklif',
                    severity: 'warning'
                };
            case 'recycle_bin':
                return {
                    title: 'Geri Dönüşüm Kutusunu Boşalt',
                    message: `${cleanupSettings.recycleBinRetentionDays} günden eski geri dönüşüm kutusu öğeleri kalıcı olarak silinecek.`,
                    itemCount: cleanupStats?.recycleBinItems || 0,
                    itemType: 'öğe',
                    severity: 'warning'
                };
            case 'orphaned':
                return {
                    title: 'Bağlantısız Verileri Temizle',
                    message: 'Kullanılmayan ve bağlantısı kopmuş veriler silinecek.',
                    itemCount: cleanupStats?.orphanedData || 0,
                    itemType: 'veri',
                    severity: 'warning'
                };
            case 'trim_history':
                return {
                    title: 'Geçmiş Temizliği',
                    message: 'Eski geçmiş adımları temizlenecek ve performans artacak.',
                    severity: 'warning'
                };
            case 'full':
                return {
                    title: 'TAM TEMİZLİK',
                    message: 'Tüm temizlik işlemleri tek seferde yapılacak. Bu işlem birkaç saniye sürebilir.',
                    severity: 'danger',
                    confirmText: 'TAM TEMİZLİK YAP'
                };
            default:
                return {};
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Yükleniyor...</div>;
    }

    const recommendations = metrics ? performanceMonitor.getRecommendations(metrics) : null;

    return (
        <div className="space-y-6">
            {/* Header with Refresh Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Performans & Bakım</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">Uygulama performansını izleyin ve bakım işlemlerini yönetin</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className={`btn btn-secondary btn-sm flex items-center gap-2 ${refreshing ? 'opacity-50' : ''}`}
                    disabled={refreshing}
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    Yenile
                </button>
            </div>

            {/* Backup & Restore */}
            <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Database size={18} className="text-[var(--color-info)]" />
                    Yedekleme & Geri Yükleme
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={createBackup}
                        className="p-4 border rounded-lg text-left hover:bg-[var(--color-bg-hover)] border-[var(--color-border)] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Download size={20} className="text-[var(--color-success)]" />
                            <div>
                                <div className="font-medium">Yedek Oluştur</div>
                                <div className="text-xs text-[var(--color-text-muted)]">Tüm verileri JSON dosyası olarak dışa aktar</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 border rounded-lg text-left hover:bg-[var(--color-bg-hover)] border-[var(--color-border)] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Upload size={20} className="text-[var(--color-warning)]" />
                            <div>
                                <div className="font-medium">Yedek Yükle</div>
                                <div className="text-xs text-[var(--color-text-muted)]">JSON yedek dosyasını içe aktar</div>
                            </div>
                        </div>
                    </button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            restoreBackup(e.target.files[0]);
                            e.target.value = '';
                        }
                    }}
                />
            </div>

            <div className="border-t border-[var(--color-border)] my-6" />

            {/* Recommendations Alerts */}
            {recommendations && recommendations.warnings.length > 0 && (
                <div className="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-border)] rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-[var(--color-warning)] mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-[var(--color-warning)] mb-2">Performans Uyarıları</h4>
                            <ul className="space-y-1 text-sm text-[var(--color-warning)]">
                                {recommendations.warnings.map((warning, idx) => (
                                    <li key={idx}>• {warning.message}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Metrics */}
            <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity size={18} className="text-[var(--color-info)]" />
                    Performans İstatistikleri
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Memory Usage */}
                    {metrics?.memory && (
                        <div className="p-4 border rounded-lg border-[var(--color-border)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Bellek Kullanımı</span>
                                <span className="text-xs text-[var(--color-text-muted)]">{metrics.memory.usedMB} / {metrics.memory.limitMB} MB</span>
                            </div>
                            <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${parseFloat(metrics.memory.usedPercentage) > 80 ? 'bg-[var(--color-error)]' : parseFloat(metrics.memory.usedPercentage) > 60 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'}`}
                                    style={{ width: `${metrics.memory.usedPercentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">%{metrics.memory.usedPercentage} kullanımda</p>
                        </div>
                    )}

                    {/* Storage Usage */}
                    {metrics?.storage && (
                        <div className="p-4 border rounded-lg border-[var(--color-border)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Depolama Alanı</span>
                                <span className="text-xs text-[var(--color-text-muted)]">{metrics.storage.usageMB} / {metrics.storage.quotaMB} MB</span>
                            </div>
                            <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${parseFloat(metrics.storage.usagePercentage) > 85 ? 'bg-[var(--color-error)]' : parseFloat(metrics.storage.usagePercentage) > 70 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-info)]'}`}
                                    style={{ width: `${metrics.storage.usagePercentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">%{metrics.storage.usagePercentage} kullanımda</p>
                        </div>
                    )}

                    {/* IndexedDB Size */}
                    {metrics?.indexedDB && (
                        <div className="p-4 border rounded-lg border-[var(--color-border)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">IndexedDB Boyutu</span>
                                <span className="text-xs text-[var(--color-text-muted)]">{metrics.indexedDB.totalMB} MB</span>
                            </div>
                            <div className="space-y-1 mt-2 text-xs">
                                {Object.entries(metrics.indexedDB.stores).map(([name, info]) => (
                                    <div key={name} className="flex justify-between text-[var(--color-text-secondary)]">
                                        <span>{name}</span>
                                        <span className="font-mono">{info.sizeMB} MB ({info.count})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Session Info */}
                    {metrics?.sessionInfo && (
                        <div className="p-4 border rounded-lg border-[var(--color-border)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Oturum Bilgileri</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Açık Sekmeler:</span>
                                    <span className="font-semibold">{metrics.sessionInfo.openTabs}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Toplam Geçmiş:</span>
                                    <span className="font-semibold">{metrics.sessionInfo.totalHistorySteps}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Toplam Ürün:</span>
                                    <span className="font-semibold">{metrics.sessionInfo.totalItems}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cleanup Settings */}
            <div>
                <h4 className="font-semibold mb-3">Otomatik Temizleme Ayarları</h4>

                <div className="space-y-4">
                    {/* Enable Auto Cleanup */}
                    <label className="flex items-center gap-3 p-3 border rounded-lg border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg-hover)]">
                        <input
                            type="checkbox"
                            checked={cleanupSettings.autoCleanupEnabled}
                            onChange={(e) => handleCleanupSettingsChange('autoCleanupEnabled', e.target.checked)}
                            className="form-checkbox text-[var(--color-info)]"
                        />
                        <div className="flex-1">
                            <span className="font-medium">Otomatik Temizlemeyi Etkinleştir</span>
                            <p className="text-xs text-[var(--color-text-muted)]">Belirlenen sürelere göre eski verileri otomatik temizle</p>
                        </div>
                    </label>

                    {/* Cleanup on Startup */}
                    {cleanupSettings.autoCleanupEnabled && (
                        <label className="flex items-center gap-3 p-3 border rounded-lg border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg-hover)]">
                            <input
                                type="checkbox"
                                checked={cleanupSettings.cleanupOnStartup}
                                onChange={(e) => handleCleanupSettingsChange('cleanupOnStartup', e.target.checked)}
                                className="form-checkbox text-[var(--color-info)]"
                            />
                            <div className="flex-1">
                                <span className="font-medium">Başlangıçta Temizle</span>
                                <p className="text-xs text-[var(--color-text-muted)]">Uygulama her açıldığında otomatik temizlik yap</p>
                            </div>
                        </label>
                    )}

                    {/* Retention Periods */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg border-[var(--color-border)]">
                            <label className="block text-sm font-medium mb-2">
                                Teklif Saklama Süresi (gün)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={cleanupSettings.quoteRetentionDays}
                                onChange={(e) => handleCleanupSettingsChange('quoteRetentionDays', parseInt(e.target.value))}
                                className="form-control"
                            />
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">Bu süreden eski teklifler temizlenebilir</p>
                        </div>

                        <div className="p-3 border rounded-lg border-[var(--color-border)]">
                            <label className="block text-sm font-medium mb-2">
                                Geri Dönüşüm Kutusu (gün)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="90"
                                value={cleanupSettings.recycleBinRetentionDays}
                                onChange={(e) => handleCleanupSettingsChange('recycleBinRetentionDays', parseInt(e.target.value))}
                                className="form-control"
                            />
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">Bu süreden eski silinmiş öğeler temizlenebilir</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        className="btn btn-primary btn-sm"
                    >
                        <CheckCircle size={16} />
                        Ayarları Kaydet
                    </button>
                </div>
            </div>

            {/* Manual Cleanup Actions */}
            <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Database size={18} className="text-[var(--color-info)]" />
                    Manuel Temizleme İşlemleri
                </h4>

                {cleanupStats && (
                    <div className="mb-4 p-3 bg-[var(--color-primary-muted)] border border-[var(--color-border)] rounded-lg">
                        <p className="text-sm text-[var(--color-info)]">
                            <strong>{cleanupStats.oldQuotes + cleanupStats.recycleBinItems + cleanupStats.orphanedData}</strong> öğe temizlenebilir durumda
                            {cleanupStats.totalSavings > 0 && ` (~${(cleanupStats.totalSavings / 1024).toFixed(1)} KB tasarruf)`}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={() => handleCleanupClick({ type: 'old_quotes' })}
                        className="p-4 border rounded-lg text-left hover:bg-[var(--color-bg-hover)] border-[var(--color-border)] transition-colors"
                        disabled={!cleanupStats || cleanupStats.oldQuotes === 0}
                    >
                        <div className="flex items-center gap-3">
                            <Trash2 size={20} className="text-[var(--color-warning)]" />
                            <div>
                                <div className="font-medium">Eski Teklifleri Temizle</div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                    {cleanupStats?.oldQuotes || 0} teklif temizlenebilir
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleCleanupClick({ type: 'recycle_bin' })}
                        className="p-4 border rounded-lg text-left hover:bg-[var(--color-bg-hover)] border-[var(--color-border)] transition-colors"
                        disabled={!cleanupStats || cleanupStats.recycleBinItems === 0}
                    >
                        <div className="flex items-center gap-3">
                            <Trash2 size={20} className="text-[var(--color-text)]" />
                            <div>
                                <div className="font-medium">Geri Dönüşüm Kutusunu Boşalt</div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                    {cleanupStats?.recycleBinItems || 0} öğe silinebilir
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleCleanupClick({ type: 'orphaned' })}
                        className="p-4 border rounded-lg text-left hover:bg-[var(--color-bg-hover)] border-[var(--color-border)] transition-colors"
                        disabled={!cleanupStats || cleanupStats.orphanedData === 0}
                    >
                        <div className="flex items-center gap-3">
                            <Database size={20} className="text-[var(--color-info)]" />
                            <div>
                                <div className="font-medium">Bağlantısız Verileri Temizle</div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                    {cleanupStats?.orphanedData || 0} veri temizlenebilir
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleCleanupClick({ type: 'trim_history' })}
                        className="p-4 border rounded-lg text-left hover:bg-[var(--color-bg-hover)] border-[var(--color-border)] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <RefreshCw size={20} className="text-[var(--color-success)]" />
                            <div>
                                <div className="font-medium">Geçmişi Sınırla</div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                    En son {cleanupSettings.maxHistorySteps} adımı sakla
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Full Cleanup - Dangerous */}
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <button
                        onClick={() => handleCleanupClick({ type: 'full' })}
                        className="w-full p-4 border-2 border-[var(--color-border)] bg-[var(--color-error)]/10 rounded-lg text-left hover:bg-[var(--color-error)]/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={24} className="text-[var(--color-error)]" />
                            <div className="flex-1">
                                <div className="font-bold text-[var(--color-error)]">TAM TEMİZLİK YAP</div>
                                <div className="text-sm text-[var(--color-error)]">
                                    Tüm temizleme işlemlerini tek seferde gerçekleştir (Geri alınamaz!)
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Cleanup Confirmation Modal */}
            <CleanupConfirmModal
                isOpen={showCleanupModal}
                onClose={() => setShowCleanupModal(false)}
                onConfirm={handleConfirmCleanup}
                cleanupInfo={getCleanupModalInfo()}
            />
        </div>
    );
};

export default PerformanceMaintenanceTab;
