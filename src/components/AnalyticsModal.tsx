import React from 'react'; import { useState, useEffect } from 'react'; import Modal from './Modal'; import { TrendingUp, DollarSign, FileText, Users, Clock, HardDrive } from 'lucide-react'; import { useIndexedDB } from '../hooks/useIndexedDB'; import { calculateQuoteTotals } from '../utils/calculations'; import Logger from '../utils/logger';

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
        totalQuotes: 0, totalAmount: 0, totalCustomers: 0, averageAmount: 0, dbSize: '0 KB'
    });
    const [perfMetrics, setPerfMetrics] = useState({ pageLoad: 0, domReady: 0 });

    useEffect(() => {
        if (isOpen && isReady) { calculateStats(); loadPerfMetrics(); }
        if (isOpen && window.performance) {
            const nav = performance.getEntriesByType('navigation')[0] as any;
            if (nav) {
                setPerfMetrics({
                    pageLoad: Math.round(nav.loadEventEnd - nav.startTime),
                    domReady: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
                });
            }
        }
    }, [isOpen, isReady]);

    const loadPerfMetrics = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const est = await navigator.storage.estimate();
                const sizeKB = Math.round((est.usage || 0) / 1024);
                setStats(prev => ({ ...prev, dbSize: sizeKB < 1024 ? `${sizeKB} KB` : `${(sizeKB / 1024).toFixed(1)} MB` }));
            } catch (e) { /* ignore */ }
        }
    };

    const calculateStats = async () => {
        setLoading(true);
        try {
            const quotes = await (db).getAll('quotes');
            const customers = await (db).getAll('customers');
            let totalAmount = 0;
            quotes.forEach(quote => {
                const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quote.quoteData?.currency });
                totalAmount += calc.grandTotal;
            });
            setStats(prev => ({
                ...prev,
                totalQuotes: quotes.length, totalAmount,
                totalCustomers: customers.length,
                averageAmount: quotes.length > 0 ? totalAmount / quotes.length : 0,
            }));
        } catch (error) {
            Logger.error('Error calculating stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const [loading, setLoading] = useState(false);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Analytics" size="lg">
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        <StatCard title="Toplam Teklif" value={stats.totalQuotes} icon={FileText} />
                        <StatCard title="Toplam Ciro" value={stats.totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} icon={DollarSign} />
                        <StatCard title="Toplam Müşteri" value={stats.totalCustomers} icon={Users} />
                        <StatCard title="Ortalama Teklif" value={stats.averageAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} icon={TrendingUp} />
                        <StatCard title="Veri Depolama" value={stats.dbSize} icon={HardDrive} />
                        <StatCard title="Sayfa Yüklenme" value={`${perfMetrics.pageLoad}ms`} icon={Clock} />
                    </div>
                    <div className="bg-[var(--color-bg-muted)] rounded-[var(--radius)] p-4 text-xs text-[var(--color-text-muted)]">
                        <p>DOM Hazır: {perfMetrics.domReady}ms • Tam Yüklenme: {perfMetrics.pageLoad}ms</p>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AnalyticsModal;