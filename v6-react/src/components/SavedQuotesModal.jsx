import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Search, FileText, Trash, Eye, Clock } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import Logger from '../utils/logger';

const SavedQuotesModal = ({ isOpen, onClose, onLoadQuote }) => {
    const { db, isReady } = useIndexedDB();
    const [quotes, setQuotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && isReady) {
            loadQuotes();
        }
    }, [isOpen, isReady]);

    const loadQuotes = async () => {
        setLoading(true);
        try {
            const result = await db.getAll('quotes');
            // Sort by date desc
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setQuotes(result);
        } catch (error) {
            Logger.error('Error loading quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Bu teklifi silmek istediğinize emin misiniz?')) {
            try {
                await db.delete('quotes', id);
                loadQuotes(); // Reload list
            } catch (error) {
                Logger.error('Error deleting quote:', error);
            }
        }
    };

    const filteredQuotes = quotes.filter(q =>
        q.quoteData?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quoteData?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerData?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const calculateTotal = (items, discountRate) => {
        let subtotal = 0;
        let totalTax = 0;
        items.forEach(item => {
            const total = (item.quantity || 0) * (item.price || 0);
            subtotal += total;
            totalTax += total * ((item.taxRate || 0) / 100);
        });
        const discountAmount = subtotal * (discountRate / 100);
        return subtotal - discountAmount + totalTax;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Kayıtlı Teklifler" size="xl">
            <div className="space-y-4 h-[60vh] flex flex-col">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        className="form-control pl-9"
                        placeholder="Teklif no, başlık veya müşteri ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-1 flex flex-col">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
                    ) : filteredQuotes.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                            {searchTerm ? 'Sonuç bulunamadı.' : 'Henüz kayıtlı teklif yok.'}
                        </div>
                    ) : (
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 font-medium">Tarih</th>
                                        <th className="p-3 font-medium">Teklif No</th>
                                        <th className="p-3 font-medium">Müşteri</th>
                                        <th className="p-3 font-medium">Tutar</th>
                                        <th className="p-3 font-medium w-24"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredQuotes.map((quote) => (
                                        <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
                                                </div>
                                            </td>
                                            <td className="p-3 font-medium text-slate-900 dark:text-slate-100">{quote.quoteData?.number || '-'}</td>
                                            <td className="p-3">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">{quote.customerData?.company}</div>
                                                <div className="text-xs text-slate-500">{quote.customerData?.name}</div>
                                            </td>
                                            <td className="p-3 font-mono text-slate-900 dark:text-slate-100">
                                                {formatCurrency(calculateTotal(quote.items || [], quote.discountRate || 0))}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        className="btn btn-sm btn-outline p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-900"
                                                        title="Görüntüle/Yükle"
                                                        onClick={() => {
                                                            onLoadQuote(quote);
                                                            onClose();
                                                        }}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900"
                                                        title="Sil"
                                                        onClick={(e) => handleDelete(quote.id, e)}
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default SavedQuotesModal;
