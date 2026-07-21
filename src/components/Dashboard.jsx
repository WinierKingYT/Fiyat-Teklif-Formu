import React, { useEffect, useState } from 'react';
import { useQuote } from '../context/QuoteContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, FileText, DollarSign, Clock } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { useTranslation } from '../hooks/useTranslation';
import { calculateQuoteTotals } from '../utils/calculations';

const Dashboard = ({ onNavigate }) => {
    const { db } = useIndexedDB();
    const { quoteData } = useQuote();
    const { t } = useTranslation(quoteData?.language);
    const [stats, setStats] = useState({
        totalQuotes: 0, totalRevenue: 0, pendingQuotes: 0, thisMonthRevenue: 0
    });
    const [recentQuotes, setRecentQuotes] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!db) return;
            try {
                const quotes = await db.getAll('quotes');
                const totalQuotes = quotes.length;
                let totalRevenue = 0, pendingQuotes = 0, thisMonthRevenue = 0;
                const currentMonth = new Date().getMonth();
                const monthlyData = {};

                quotes.forEach(quote => {
                    let quoteTotal = 0;
                    if (quote.items) {
                        const { total } = calculateQuoteTotals(quote.items, quote.discount);
                        quoteTotal = total;
                    }
                    totalRevenue += quoteTotal;
                    if (quote.quoteData?.validUntil) {
                        if (new Date(quote.quoteData.validUntil) >= new Date()) pendingQuotes++;
                    }
                    const quoteDate = new Date(quote.createdAt || quote.quoteData?.date);
                    if (quoteDate.getMonth() === currentMonth) thisMonthRevenue += quoteTotal;
                    const monthKey = quoteDate.toLocaleString('default', { month: 'short' });
                    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + quoteTotal;
                });

                setStats({ totalQuotes, totalRevenue, pendingQuotes, thisMonthRevenue });
                setRecentQuotes(quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
                setChartData(Object.entries(monthlyData).map(([name, amount]) => ({ name, amount })));
                setLoading(false);
            } catch (error) {
                console.error("Dashboard error:", error);
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [db]);

    const fmt = (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

    const formatTotal = (items, discount) => {
        try {
            const { total } = calculateQuoteTotals(items, discount);
            return fmt(total);
        } catch { return fmt(0); }
    };

    if (loading) {
        return <div className="flex items-center justify-center p-12 text-[var(--color-text-muted)] text-sm">{t('loading')}</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-[var(--color-text)]">{t('overview')}</h1>
                <button className="btn btn-primary" onClick={() => onNavigate('builder')}>
                    {t('newQuote')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: t('totalQuotes'), value: stats.totalQuotes, icon: FileText },
                    { label: t('totalRevenue'), value: fmt(stats.totalRevenue), icon: DollarSign },
                    { label: t('activeQuotes'), value: stats.pendingQuotes, icon: Clock },
                    { label: t('thisMonth'), value: fmt(stats.thisMonthRevenue), icon: TrendingUp },
                ].map((item, i) => (
                    <div key={i} className="card p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
                                <h3 className="text-xl font-bold text-[var(--color-text)] mt-1">{item.value}</h3>
                            </div>
                            <div className="p-2 rounded-[var(--radius)] bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]">
                                <item.icon size={18} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card p-5">
                    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('monthlyRevenueChart')}</h3>
                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
                                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                                <Tooltip
                                    formatter={(value) => fmt(value)}
                                    contentStyle={{
                                        background: 'var(--color-bg-card)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text)',
                                        borderRadius: 'var(--radius)'
                                    }}
                                />
                                <Bar dataKey="amount" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('recentQuotes')}</h3>
                    <div className="space-y-2">
                        {recentQuotes.length === 0 ? (
                            <p className="text-xs text-[var(--color-text-muted)]">{t('noQuotesYet')}</p>
                        ) : (
                            recentQuotes.map((q) => (
                                <div key={q.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-muted)] rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--color-text)]">{q.customerData?.company || q.customerData?.name || t('unnamedCustomer')}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">{new Date(q.createdAt).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-[var(--color-text)]">{formatTotal(q.items, q.discount)}</span>
                                        <span className="text-xs text-[var(--color-text-muted)] ml-2">#{q.quoteData?.number}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="btn btn-outline btn-sm w-full mt-4" onClick={() => onNavigate('history')}>
                        {t('viewAll')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
