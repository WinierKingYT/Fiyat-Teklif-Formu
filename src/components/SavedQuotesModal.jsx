import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Search, FileText, Trash, Eye, Clock, Save, PlusCircle, Trash2 } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { useQuote } from '../context/QuoteContext';
import Logger from '../utils/logger';
import { calculateQuoteTotals } from '../utils/calculations';
import { toast } from 'react-hot-toast';

const SavedQuotesModal = ({
    isOpen,
    onClose,
    onLoadQuote,
    onNewQuote
}) => {
    const { db, isReady } = useIndexedDB();
    const { saveQuote, currentQuoteId, setCurrentQuoteId } = useQuote();
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
        if (e) e.stopPropagation();
        const quoteToDelete = quotes.find(q => q.id === id);
        if (window.confirm('Bu teklifi silmek istediğinize emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)')) {
            try {
                if (quoteToDelete) {
                    await db.add('recycle_bin', {
                        originalStore: 'quotes',
                        originalId: id,
                        deletedAt: new Date().toISOString(),
                        deletedBy: 'user',
                        data: quoteToDelete
                    });
                }
                await db.delete('quotes', id);
                toast.success('Teklif geri dönüşüm kutusuna taşındı');
                loadQuotes(); // Reload list

                // If we deleted the currently active quote, reset the ID
                if (currentQuoteId === id) {
                    setCurrentQuoteId(null);
                }
            } catch (error) {
                Logger.error('Error deleting quote:', error);
                toast.error('Silme işlemi başarısız');
            }
        }
    };

    const handleSaveCurrent = async () => {
        await saveQuote();
        loadQuotes(); // Reload list to show updated/new quote
    };

    const handleNew = () => {
        onNewQuote();
        onClose();
    };

    const handleDeleteCurrent = () => {
        if (!currentQuoteId) return;
        const currentQuote = quotes.find(q => q.id === currentQuoteId);
        if (currentQuote && (currentQuote.status === 'sent' || currentQuote.status === 'accepted')) {
            if (!window.confirm('Bu teklif müşteriye gönderilmiş veya kabul edilmiş. Yine de silmek istiyor musunuz?')) {
                return;
            }
        }
        handleDelete(currentQuoteId);
        onClose();
        onNewQuote();
    };

    const filteredQuotes = quotes.filter(q =>
        q.quoteData?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quoteData?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerData?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount, currency = 'TRY') => {
        const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Teklif İşlemleri" size="xl">
            <div className="space-y-4 h-[70vh] flex flex-col">
                {/* Quote Actions Toolbar */}
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                        className="btn btn-primary flex-1 py-3"
                        onClick={handleSaveCurrent}
                        title="Mevcut Teklifi Kaydet"
                    >
                        <Save size={20} className="mb-1 mx-auto block" />
                        <span className="text-sm font-medium">Kaydet</span>
                    </button>

                    <button
                        className="btn btn-outline flex-1 py-3"
                        onClick={handleNew}
                        title="Yeni Teklif Oluştur"
                    >
                        <PlusCircle size={20} className="mb-1 mx-auto block" />
                        <span className="text-sm font-medium">Yeni</span>
                    </button>

                    {currentQuoteId && (
                        <button
                            className="btn btn-danger flex-1 py-3"
                            onClick={handleDeleteCurrent}
                            title="Mevcut Teklifi Sil"
                        >
                            <Trash2 size={20} className="mb-1 mx-auto block" />
                            <span className="text-sm font-medium">Sil</span>
                        </button>
                    )}
                </div>

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
                                    {filteredQuotes.map((quote) => {
                                        const quoteCurrency = quote.quoteData?.currency || 'TRY';
                                        const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quoteCurrency });
                                        return (
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
                                                {formatCurrency(calc.grandTotal, quoteCurrency)}
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
                                        );
                                    })}
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
