import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Trash2, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const RecycleBinModal = ({ isOpen, onClose }) => {
    const { db } = useIndexedDB();
    const [deletedItems, setDeletedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (isOpen && db) loadDeletedItems();
    }, [isOpen, db]);

    const loadDeletedItems = async () => {
        try {
            const items = await db.getAll('recycle_bin');
            items.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
            setDeletedItems(items);
        } catch (error) {
            console.error('Error loading recycle bin:', error);
            toast.error('Geri dönüşüm kutusu yüklenemedi');
        }
    };

    const handleRestore = async (item) => {
        try {
            await db.delete('recycle_bin', item.id);
            const { id, originalStore, deletedAt, originalId, ...originalData } = item;
            await db.put(originalStore, { ...originalData, id: originalId });
            toast.success('Öğe geri yüklendi');
            loadDeletedItems();
        } catch (error) {
            console.error('Restore error:', error);
            toast.error('Geri yükleme başarısız');
        }
    };

    const handlePermanentDelete = async (id) => {
        if (window.confirm('Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                await db.delete('recycle_bin', id);
                toast.success('Öğe kalıcı olarak silindi');
                loadDeletedItems();
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('Silme işlemi başarısız');
            }
        }
    };

    const handleEmptyBin = async () => {
        if (window.confirm('Geri dönüşüm kutusunu boşaltmak istediğinize emin misiniz? Tüm öğeler kalıcı olarak silinecek.')) {
            try {
                await db.clear('recycle_bin');
                toast.success('Geri dönüşüm kutusu boşaltıldı');
                loadDeletedItems();
            } catch (error) {
                console.error('Empty bin error:', error);
                toast.error('İşlem başarısız');
            }
        }
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
        <Modal isOpen={isOpen} onClose={onClose} title="Geri Dönüşüm Kutusu" size="lg">
            <div className="flex flex-col h-[70vh]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex gap-2">
                        <button className={`px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-muted)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'}`} onClick={() => setActiveTab('all')}>Tümü</button>
                        <button className={`px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors ${activeTab === 'customers' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-muted)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'}`} onClick={() => setActiveTab('customers')}>Müşteriler</button>
                        <button className={`px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-muted)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'}`} onClick={() => setActiveTab('products')}>Ürünler</button>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" size={18} />
                            <input type="text" className="form-control pl-10" placeholder="Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        {deletedItems.length > 0 && (
                            <button className="btn btn-danger whitespace-nowrap" onClick={handleEmptyBin}>
                                <Trash2 size={18} /> Boşalt
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[var(--color-bg-muted)] rounded-[var(--radius)] border border-[var(--color-border)] p-2">
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                            <Trash2 size={48} className="mb-2 opacity-20" />
                            <p>Geri dönüşüm kutusu boş</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredItems.map(item => (
                                <div key={item.id} className="bg-[var(--color-bg-card)] p-3 rounded-[var(--radius)] border border-[var(--color-border)] flex justify-between items-center hover:shadow-sm transition-shadow">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.originalStore === 'customers' ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]' : 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'}`}>
                                                {item.originalStore === 'customers' ? 'Müşteri' : 'Ürün'}
                                            </span>
                                            <span className="text-xs text-[var(--color-text-muted)]">Silinme: {formatDate(item.deletedAt)}</span>
                                        </div>
                                        <div className="font-medium text-[var(--color-text)]">{item.name || item.company || 'İsimsiz Öğe'}</div>
                                        {item.originalStore === 'products' && <div className="text-sm text-[var(--color-text-muted)]">{item.price} ₺</div>}
                                        {item.originalStore === 'customers' && <div className="text-sm text-[var(--color-text-muted)]">{item.company}</div>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-[var(--color-success)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors" onClick={() => handleRestore(item)} title="Geri Yükle">
                                            <RefreshCw size={18} />
                                        </button>
                                        <button className="p-2 text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors" onClick={() => handlePermanentDelete(item.id)} title="Kalıcı Olarak Sil">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default RecycleBinModal;