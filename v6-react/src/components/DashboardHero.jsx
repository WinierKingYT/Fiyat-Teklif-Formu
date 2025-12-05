import React from 'react';
import { TrendingUp, Package, Menu } from 'lucide-react';

const DashboardHero = ({ quoteData, items, totalAmount, onToggleMobileMenu }) => {
    const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Calculate stats
    const itemCount = items.length;
    const hasItems = itemCount > 0;

    return (
        <div className="dashboard-hero mb-8 fade-in-up">
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {/* Welcome Text */}
                    <div className="col-span-1 md:col-span-2 flex items-start gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/20 text-gray-700 dark:text-white transition-colors"
                            onClick={onToggleMobileMenu}
                        >
                            <Menu size={24} />
                        </button>

                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                                {quoteData.title || 'Yeni Teklif'}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-300">
                                {today} • <span className="text-blue-600 dark:text-blue-400 font-medium">Hoş geldiniz</span>
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Item Count Card */}
                        <div className="glass-card bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/20 shadow-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/50 dark:text-blue-400">
                                    <Package size={18} />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kalem</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-800 dark:text-white pl-1">
                                {itemCount}
                            </div>
                        </div>

                        {/* Total Amount Card */}
                        <div className="glass-card bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/20 shadow-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg dark:bg-green-900/50 dark:text-green-400">
                                    <TrendingUp size={18} />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Toplam</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-800 dark:text-white pl-1 truncate" title={totalAmount}>
                                {totalAmount}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DashboardHero;
