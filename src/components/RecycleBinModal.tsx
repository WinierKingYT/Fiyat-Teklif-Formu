import { Trash2, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import React from 'react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import Logger from '@/utils/logger';

interface DeletedItem {
    id: string | number;
    originalStore: string;
    originalId?: string;
    deletedAt: string;
    deletedBy?: string;
    data?: unknown;
    name?: string;
    company?: string;
    price?: number;
    [key: string]: unknown;
}

interface RecycleBinModalProps {
    isOpen: boolean;
    onClose: () => void;
    language?: string;
}

const RecycleBinModal: React.FC<RecycleBinModalProps> = ({ isOpen, onClose, language = 'tr' }) => {
    const { t } = useTranslation(language);
    const { db } = useIndexedDB();
    const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'info' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

    useEffect(() => {
        if (isOpen && db) loadDeletedItems();
    }, [isOpen, db]);

    const loadDeletedItems = async () => {
        try {
            const items = await db.getAll<DeletedItem>('recycle_bin');
            items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
            setDeletedItems(items);
        } catch (error) {
            Logger.error('Error loading recycle bin:', error);
            toast.error(t('binLoadError'));
        }
    };

    const handleRestore = async (item: DeletedItem) => {
        try {
            await db.delete('recycle_bin', item.id);
            if (item.originalStore === 'quotes' && item.data && typeof item.data === 'object') {
                const quoteObj = item.data as Record<string, unknown>;
                await db.put('quotes', { ...quoteObj, id: item.originalId || quoteObj.id });
            } else {
                const { id: _ignoredId, originalStore, deletedAt: _ignoredDeletedAt, originalId, data: _ignoredData, ...originalData } = item;
                await db.put(originalStore, { ...originalData, id: originalId });
            }
            toast.success(t('itemRestored'));
            loadDeletedItems();
        } catch (error) {
            Logger.error('Restore error:', error);
            toast.error(t('restoreError'));
        }
    };

    const handlePermanentDelete = async (id: number | string) => {
        setConfirmDialog({ isOpen: true, title: t('permanentDeleteTitle'), message: t('permanentDeleteConfirm'), onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { await db.delete('recycle_bin', id as IDBValidKey); toast.success(t('itemPermanentlyDeleted')); loadDeletedItems(); } catch (error) { Logger.error('Delete error:', error); toast.error(t('deleteFailedQuote')); } }, variant: 'danger' });
    };

    const handleEmptyBin = async () => {
        setConfirmDialog({ isOpen: true, title: t('emptyBin'), message: t('emptyBinConfirm'), onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { await db.clear('recycle_bin'); toast.success(t('binEmptied')); loadDeletedItems(); } catch (error) { Logger.error('Empty bin error:', error); toast.error(t('emptyBinFailed')); } }, variant: 'danger' });
    };

    const getItemTitle = (item: DeletedItem) => {
        if (item.name) return item.name;
        if (item.company) return item.company;
        if (item.originalStore === 'quotes' && item.data && typeof item.data === 'object') {
            const q = item.data as { quoteData?: { title?: string }; quoteNumber?: string; customerData?: { name?: string; company?: string } };
            return q.quoteData?.title || q.quoteNumber || q.customerData?.name || q.customerData?.company || `Teklif #${item.originalId || ''}`;
        }
        return t('unnamedItem') || 'İsimsiz Öğe';
    };

    const getItemStoreBadge = (storeName: string) => {
        if (storeName === 'customers') return t('customers') || 'Müşteri';
        if (storeName === 'products') return t('products') || 'Ürün';
        if (storeName === 'quotes') return t('quotes') || 'Teklif';
        return storeName;
    };

    const filteredItems = deletedItems.filter(item => {
        const title = getItemTitle(item).toLowerCase();
        const matchesSearch = title.includes(searchTerm.toLowerCase()) ||
            (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase()));
        if (activeTab === 'all') return matchesSearch;
        if (activeTab === 'quotes') return matchesSearch && item.originalStore === 'quotes';
        if (activeTab === 'customers') return matchesSearch && item.originalStore === 'customers';
        if (activeTab === 'products') return matchesSearch && item.originalStore === 'products';
        return matchesSearch;
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('tr-TR');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('recycleBinTitle')} size="lg">
            <div className="flex flex-col h-[65vh] space-y-2.5">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                    <div className="flex gap-1 p-0.5 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded">
                        <button type="button" className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${activeTab === 'all' ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-2xs' : 'text-[var(--color-text-muted)]'}`} onClick={() => setActiveTab('all')}>{t('all')}</button>
                        <button type="button" className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${activeTab === 'quotes' ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-2xs' : 'text-[var(--color-text-muted)]'}`} onClick={() => setActiveTab('quotes')}>{t('quotes')}</button>
                        <button type="button" className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${activeTab === 'customers' ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-2xs' : 'text-[var(--color-text-muted)]'}`} onClick={() => setActiveTab('customers')}>{t('customers')}</button>
                        <button type="button" className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${activeTab === 'products' ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-2xs' : 'text-[var(--color-text-muted)]'}`} onClick={() => setActiveTab('products')}>{t('products')}</button>
                    </div>
                    <div className="flex gap-1.5 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-48">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
                            <input type="text" className="form-control pl-8 text-xs" placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        {deletedItems.length > 0 && (
                            <button type="button" className="btn btn-danger btn-xs whitespace-nowrap" onClick={handleEmptyBin}>
                                <Trash2 size={13} /> Boşalt
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto rounded-[var(--radius)] border border-[var(--color-border)] p-1.5 space-y-1.5">
                    {filteredItems.length === 0 ? (
                        <EmptyState
                            icon={<Trash2 size={24} />}
                            title={t('recycleBinEmpty')}
                        />
                    ) : (
                        <div className="space-y-1.5">
                            {filteredItems.map(item => (
                                <div key={item.id} className="bg-[var(--color-bg-card)] p-2.5 rounded-[var(--radius)] border border-[var(--color-border)]/60 flex justify-between items-center hover:border-[var(--color-primary)]/40 transition-colors">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-primary-muted)] text-[var(--color-primary)] uppercase">
                                                {getItemStoreBadge(item.originalStore)}
                                            </span>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">{formatDate(item.deletedAt)}</span>
                                        </div>
                                        <div className="text-xs font-semibold text-[var(--color-text)] truncate">{getItemTitle(item)}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button type="button" className="btn btn-xs btn-outline p-1.5 text-[var(--color-success)]" onClick={() => handleRestore(item)} title={t('restoreItem')}>
                                            <RefreshCw size={13} />
                                        </button>
                                        <button type="button" className="btn btn-xs btn-danger p-1.5" onClick={() => handlePermanentDelete(item.id)} title={t('permanentDelete')}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} variant={confirmDialog.variant} />
        </Modal>
    );
};

export default RecycleBinModal;
