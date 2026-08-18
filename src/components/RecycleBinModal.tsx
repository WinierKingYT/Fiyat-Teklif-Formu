import React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Trash2, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Logger from '../utils/logger';
import { useTranslation } from '../hooks/useTranslation';

const RecycleBinModal = ({ isOpen, onClose, language = 'tr' }) => {
    const { t } = useTranslation(language);
    const { db } = useIndexedDB();
    const [deletedItems, setDeletedItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

    useEffect(() => {
        if (isOpen && db) loadDeletedItems();
    }, [isOpen, db]);

    const loadDeletedItems = async () => {
        try {
            const items = await db.getAll('recycle_bin');
            (items as any[]).sort((a: any, b: any) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
            setDeletedItems(items as any);
        } catch (error) {
            Logger.error('Error loading recycle bin:', error);
            toast.error(t('binLoadError'));
        }
    };

    const handleRestore = async (item) => {
        try {
            await db.delete('recycle_bin', item.id);
            const { id, originalStore, deletedAt, originalId, ...originalData } = item;
            await db.put(originalStore, { ...originalData, id: originalId });
            toast.success(t('itemRestored'));
            loadDeletedItems();
        } catch (error) {
            Logger.error('Restore error:', error);
            toast.error(t('restoreError'));
        }
    };

    const handlePermanentDelete = async (id) => {
        setConfirmDialog({ isOpen: true, title: t('permanentDeleteTitle'), message: t('permanentDeleteConfirm'), onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { await db.delete('recycle_bin', id); toast.success(t('itemPermanentlyDeleted')); loadDeletedItems(); } catch (error) { Logger.error('Delete error:', error); toast.error(t('deleteFailedQuote')); } }, variant: 'danger' });
    };

    const handleEmptyBin = async () => {
        setConfirmDialog({ isOpen: true, title: t('emptyBin'), message: t('emptyBinConfirm'), onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { await db.clear('recycle_bin'); toast.success(t('binEmptied')); loadDeletedItems(); } catch (error) { Logger.error('Empty bin error:', error); toast.error(t('emptyBinFailed')); } }, variant: 'danger' });
    };

    const filteredItems = deletedItems.filter(item => {
        const matchesSearch = (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase()));
        if (activeTab === 'all') return matchesSearch;
        if (activeTab === 'customers') return matchesSearch && item.originalStore === 'customers';
        if (activeTab === 'products') return matchesSearch && item.originalStore === 'products';
        return matchesSearch;
    });

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('tr-TR');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('recycleBinTitle')} size="lg">
            <div className="flex flex-col h-[70vh]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex gap-2">
                        <button type="button" className={`px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-muted)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'}`} onClick={() => setActiveTab('all')}>{t('all')}</button>
                        <button type="button" className={`px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors ${activeTab === 'customers' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-muted)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'}`} onClick={() => setActiveTab('customers')}>{t('customers')}</button>
                        <button type="button" className={`px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-muted)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'}`} onClick={() => setActiveTab('products')}>{t('products')}</button>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" size={18} />
                            <input type="text" className="form-control pl-10" placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        {deletedItems.length > 0 && (
                            <button type="button" className="btn btn-danger whitespace-nowrap" onClick={handleEmptyBin}>
                                <Trash2 size={18} /> Boşalt
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[var(--color-bg-muted)] rounded-[var(--radius)] border border-[var(--color-border)] p-2">
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                            <Trash2 size={48} className="mb-2 opacity-20" />
                            <p>{t('recycleBinEmpty')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredItems.map(item => (
                                <div key={item.id} className="bg-[var(--color-bg-card)] p-3 rounded-[var(--radius)] border border-[var(--color-border)] flex justify-between items-center hover:shadow-sm transition-shadow">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.originalStore === 'customers' ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]' : 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'}`}>
                                                {item.originalStore === 'customers' ? t('customers') : t('products')}
                                            </span>
                                            <span className="text-xs text-[var(--color-text-muted)]">{t('deletedAt').replace('{date}', formatDate(item.deletedAt))}</span>
                                        </div>
                                        <div className="font-medium text-[var(--color-text)]">{item.name || item.company || t('unnamedItem')}</div>
                                        {item.originalStore === 'products' && <div className="text-sm text-[var(--color-text-muted)]">{item.price} ₺</div>}
                                        {item.originalStore === 'customers' && <div className="text-sm text-[var(--color-text-muted)]">{item.company}</div>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" className="p-2 text-[var(--color-success)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors" onClick={() => handleRestore(item)} title={t('restoreItem')}>
                                            <RefreshCw size={18} />
                                        </button>
                                        <button type="button" className="p-2 text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors" onClick={() => handlePermanentDelete(item.id)} title={t('permanentDelete')}>
                                            <Trash2 size={18} />
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
