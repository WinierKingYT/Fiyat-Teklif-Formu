import React from 'react';
import { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { Search, Clock, Trash, Eye, PlusCircle, ArrowLeft } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { useQuote } from '../context/QuoteContext';
import Logger from '../utils/logger';
import { calculateQuoteTotals } from '../utils/calculations';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

const HistoryList = ({ onNavigate }) => {
    const { db, isReady } = useIndexedDB();
    const { currentQuoteId, setCurrentQuoteId, loadQuote } = useQuote();
    const { t } = useTranslation();
    const [quotes, setQuotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

    useEffect(() => {
        if (isReady) loadQuotes();
    }, [isReady]);

    const loadQuotes = async () => {
        setLoading(true);
        try {
            const result = await db.getAll('quotes');
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
        setConfirmDialog({ isOpen: true, title: 'Teklifi Sil', message: 'Bu teklifi silmek istediğinize emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)', onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); const quoteToDelete = quotes.find(q => q.id === id); try { if (quoteToDelete) { await db.add('recycle_bin', { originalStore: 'quotes', originalId: id, deletedAt: new Date().toISOString(), deletedBy: 'user', data: quoteToDelete }); } await db.delete('quotes', id); toast.success('Teklif geri dönüşüm kutusuna taşındı'); loadQuotes(); if (currentQuoteId === id) setCurrentQuoteId(null); } catch (error) { Logger.error('Error deleting quote:', error); toast.error('Silme işlemi başarısız'); } }, variant: 'danger' });
    };

    const handleLoad = (quote) => {
        try {
            loadQuote(quote);
            onNavigate('builder');
        } catch (error) {
            Logger.error('Error loading quote:', error);
            toast.error('Teklif yüklenirken hata oluştu');
        }
    };

    const handleNewQuote = () => {
        onNavigate('builder');
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
        <div className="flex flex-col h-full bg-[var(--color-bg-page)]">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <button
                    onClick={() => onNavigate('dashboard')}
                    className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                    title="Geri Dön"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Tekliflerim</h2>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <button className="btn btn-primary flex items-center gap-2 px-4 py-2" onClick={handleNewQuote}>
                    <PlusCircle size={18} />
                    <span>Yeni Teklif</span>
                </button>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                    <input
                        type="text"
                        className="form-control pl-9 w-full"
                        placeholder="Teklif no, başlık veya müşteri ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">{quotes.length} teklif</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-[var(--color-text-muted)]">Yükleniyor...</div>
                    </div>
                ) : filteredQuotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-muted)]">
                        {searchTerm ? 'Sonuç bulunamadı.' : 'Henüz kayıtlı teklif yok.'}
                    </div>
                ) : (
                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
                                <tr>
                                    <th className="p-3 font-medium">Tarih</th>
                                    <th className="p-3 font-medium">Teklif No</th>
                                    <th className="p-3 font-medium">Müşteri</th>
                                    <th className="p-3 font-medium">Tutar</th>
                                    <th className="p-3 font-medium w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {filteredQuotes.map((quote) => {
                                    const quoteCurrency = quote.quoteData?.currency || 'TRY';
                                    const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quoteCurrency });
                                    return (
                                        <tr key={quote.id} className="hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer" onClick={() => handleLoad(quote)}>
                                            <td className="p-3 text-[var(--color-text-muted)] whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
                                                </div>
                                            </td>
                                            <td className="p-3 font-medium text-[var(--color-text)]">{quote.quoteData?.number || '-'}</td>
                                            <td className="p-3">
                                                <div className="font-medium text-[var(--color-text)]">{quote.customerData?.company}</div>
                                                <div className="text-xs text-[var(--color-text-muted)]">{quote.customerData?.name}</div>
                                            </td>
                                            <td className="p-3 font-mono text-[var(--color-text)]">{formatCurrency(calc.grandTotal, quoteCurrency)}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button className="btn btn-sm btn-outline p-1" title="Görüntüle/Yükle" onClick={(e) => { e.stopPropagation(); handleLoad(quote); }}>
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="btn btn-sm btn-danger p-1" title="Sil" onClick={(e) => handleDelete(quote.id, e)}>
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

            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} variant={confirmDialog.variant} />
        </div>
    );
};

export default HistoryList;
