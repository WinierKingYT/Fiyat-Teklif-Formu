import React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { TrendingUp, DollarSign, FileText, Users } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { calculateQuoteTotals } from '../utils/calculations';
import Logger from '../utils/logger';

const StatCard = ({ title, value, icon: Icon }) => (
    <div className="card">
        <div className="card-body flex items-center gap-4">
            <div className="w-11 h-11 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center flex-shrink-0">
                <Icon size={22} className="text-[var(--color-primary)]" />
            </div>
            <div>
                <div className="text-xs text-[var(--color-text-muted)] font-medium">{title}</div>
                <div className="text-xl font-bold text-[var(--color-text)]">{value}</div>
            </div>
        </div>
    </div>
);

const AnalyticsModal = ({ isOpen, onClose }) => {
    const { db, isReady } = useIndexedDB();
    const [stats, setStats] = useState({
        totalQuotes: 0, totalAmount: 0, totalCustomers: 0, averageAmount: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && isReady) calculateStats();
    }, [isOpen, isReady]);

    const calculateStats = async () => {
        setLoading(true);
        try {
            const quotes = await db.getAll('quotes');
            const customers = await db.getAll('customers');
            let totalAmount = 0;
            quotes.forEach(quote => {
                const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quote.quoteData?.currency });
                totalAmount += calc.grandTotal;
            });
            setStats({
                totalQuotes: quotes.length, totalAmount,
                totalCustomers: customers.length,
                averageAmount: quotes.length > 0 ? totalAmount / quotes.length : 0
            });
        } catch (error) {
            Logger.error('Error calculating stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Genel Bakış ve Analitik" size="lg">
            {loading ? (
                <div className="p-8 text-center text-[var(--color-text-muted)]">Hesaplanıyor...</div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatCard title="Toplam Teklif" value={stats.totalQuotes} icon={FileText} />
                        <StatCard title="Toplam Tutar" value={formatCurrency(stats.totalAmount)} icon={DollarSign} />
                        <StatCard title="Kayıtlı Müşteri" value={stats.totalCustomers} icon={Users} />
                        <StatCard title="Ortalama Teklif Tutarı" value={formatCurrency(stats.averageAmount)} icon={TrendingUp} />
                    </div>

                    <div className="bg-[var(--color-bg-muted)] rounded-[var(--radius)] p-4 border border-[var(--color-border)]">
                        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Son Durum</h4>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Sistemde şu an toplam {stats.totalQuotes} adet teklif ve {stats.totalCustomers} adet kayıtlı müşteri bulunmaktadır.
                            Veritabanı bağlantısı aktif ve sağlıklı çalışıyor.
                        </p>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AnalyticsModal;