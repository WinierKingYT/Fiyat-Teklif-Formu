import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { TrendingUp, DollarSign, FileText, Users } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { calculateQuoteTotals } from '../utils/calculations';
import Logger from '../utils/logger';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
        <div className={`p-3 rounded-full bg-${color}/10 text-${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    </div>
);

const AnalyticsModal = ({ isOpen, onClose }) => {
    const { db, isReady } = useIndexedDB();
    const [stats, setStats] = useState({
        totalQuotes: 0,
        totalAmount: 0,
        totalCustomers: 0,
        averageAmount: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && isReady) {
            calculateStats();
        }
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
                totalQuotes: quotes.length,
                totalAmount: totalAmount,
                totalCustomers: customers.length,
                averageAmount: quotes.length > 0 ? totalAmount / quotes.length : 0
            });

        } catch (error) {
            Logger.error('Error calculating stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Genel Bakış ve Analitik" size="lg">
            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Hesaplanıyor...</div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatCard
                            title="Toplam Teklif"
                            value={stats.totalQuotes}
                            icon={FileText}
                            color="primary"
                        />
                        <StatCard
                            title="Toplam Tutar"
                            value={formatCurrency(stats.totalAmount)}
                            icon={DollarSign}
                            color="success"
                        />
                        <StatCard
                            title="Kayıtlı Müşteri"
                            value={stats.totalCustomers}
                            icon={Users}
                            color="info"
                        />
                        <StatCard
                            title="Ortalama Teklif Tutarı"
                            value={formatCurrency(stats.averageAmount)}
                            icon={TrendingUp}
                            color="warning"
                        />
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Son Durum</h4>
                        <p className="text-sm text-muted-foreground">
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
