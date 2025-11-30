import React, { useEffect, useState } from 'react';
import { useQuote } from '../context/QuoteContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, FileText, DollarSign, Clock } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { calculateQuoteTotals } from '../utils/calculations';

const Dashboard = ({ onNavigate }) => {
    const { db } = useIndexedDB();
    const [stats, setStats] = useState({
        totalQuotes: 0,
        totalRevenue: 0,
        pendingQuotes: 0,
        thisMonthRevenue: 0
    });
    const [recentQuotes, setRecentQuotes] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!db) return;

            try {
                const quotes = await db.getAll('quotes');

                // Calculate Stats
                const totalQuotes = quotes.length;
                let totalRevenue = 0;
                let pendingQuotes = 0;
                let thisMonthRevenue = 0;
                const currentMonth = new Date().getMonth();

                const monthlyData = {};

                quotes.forEach(quote => {
                    // Calculate Grand Total for each quote
                    // Assuming quote structure has items and discount
                    let quoteTotal = 0;
                    if (quote.items) {
                        const { total } = calculateQuoteTotals(quote.items, quote.discount);
                        quoteTotal = total;
                    }

                    totalRevenue += quoteTotal;

                    // Check if pending (validUntil > today)
                    if (quote.quoteData?.validUntil) {
                        const validDate = new Date(quote.quoteData.validUntil);
                        if (validDate >= new Date()) {
                            pendingQuotes++;
                        }
                    }

                    // This Month Revenue
                    const quoteDate = new Date(quote.createdAt || quote.quoteData?.date);
                    if (quoteDate.getMonth() === currentMonth) {
                        thisMonthRevenue += quoteTotal;
                    }

                    // Prepare Chart Data (Group by Month)
                    const monthKey = quoteDate.toLocaleString('default', { month: 'short' });
                    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + quoteTotal;
                });

                // Format Chart Data
                const chartDataArray = Object.entries(monthlyData).map(([name, amount]) => ({
                    name,
                    amount
                }));

                setStats({
                    totalQuotes,
                    totalRevenue,
                    pendingQuotes,
                    thisMonthRevenue
                });
                setRecentQuotes(quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
                setChartData(chartDataArray);
                setLoading(false);

            } catch (error) {
                console.error("Error loading dashboard data:", error);
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [db]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    if (loading) {
        return <div className="p-8 text-center">Yükleniyor...</div>;
    }

    return (
        <div className="dashboard-container p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold dark:text-white">Genel Bakış</h1>
                <button className="btn btn-primary" onClick={() => onNavigate('builder')}>
                    Yeni Teklif Oluştur
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Teklif</p>
                            <h3 className="text-2xl font-bold mt-1 dark:text-white">{stats.totalQuotes}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <FileText size={20} />
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Gelir</p>
                            <h3 className="text-2xl font-bold mt-1 dark:text-white">{formatCurrency(stats.totalRevenue)}</h3>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Teklifler</p>
                            <h3 className="text-2xl font-bold mt-1 dark:text-white">{stats.pendingQuotes}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                            <Clock size={20} />
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Bu Ay</p>
                            <h3 className="text-2xl font-bold mt-1 dark:text-white">{formatCurrency(stats.thisMonthRevenue)}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Aylık Gelir Grafiği</h3>
                    <div className="w-full" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Quotes */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Son Teklifler</h3>
                    <div className="space-y-4">
                        {recentQuotes.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Henüz teklif oluşturulmadı.</p>
                        ) : (
                            recentQuotes.map((quote) => (
                                <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                                    <div>
                                        <p className="font-medium text-sm dark:text-gray-200">{quote.customerData?.company || quote.customerData?.name || 'İsimsiz Müşteri'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(quote.createdAt).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold block dark:text-white">
                                            {/* We need to store total in quote object to avoid recalc, but for now recalc is fine for small lists */}
                                            {/* Re-calculating for display */}
                                            {(() => {
                                                {
                                                    (() => {
                                                        const { total } = calculateQuoteTotals(quote.items, quote.discount);
                                                        return formatCurrency(total);
                                                    })()
                                                }
                                            })()}
                                        </span>
                                        <span className="text-xs text-blue-600 dark:text-blue-400">#{quote.quoteData?.number}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="btn btn-outline btn-sm w-full mt-4" onClick={() => onNavigate('history')}>
                        Tümünü Gör
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
