import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Database, Download, Upload, Trash, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const DatabaseManagerModal = ({ isOpen, onClose }) => {
    const { db } = useIndexedDB();
    const [stats, setStats] = useState({
        customers: 0,
        products: 0,
        quotes: 0,
        templates: 0,
        banks: 0
    });

    useEffect(() => {
        if (isOpen && db) {
            loadStats();
        }
    }, [isOpen, db]);

    const loadStats = async () => {
        try {
            const [customers, products, quotes, templates, banks] = await Promise.all([
                db.getAll('customers'),
                db.getAll('products'),
                db.getAll('quotes'),
                db.getAll('templates'),
                db.getAll('bankInfo')
            ]);

            setStats({
                customers: customers.length,
                products: products.length,
                quotes: quotes.length,
                templates: templates.length,
                banks: banks.length
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleClearData = async () => {
        if (window.confirm('TÜM veriler silinecek! Bu işlem geri alınamaz. Emin misiniz?')) {
            try {
                await Promise.all([
                    db.clear('customers'),
                    db.clear('products'),
                    db.clear('quotes'),
                    db.clear('templates'),
                    db.clear('bankInfo')
                ]);
                toast.success('Tüm veriler temizlendi');
                loadStats();
            } catch (error) {
                console.error('Error clearing data:', error);
                toast.error('Veriler temizlenirken hata oluştu');
            }
        }
    };

    const handleExport = async () => {
        try {
            const [customers, products, quotes, templates, banks] = await Promise.all([
                db.getAll('customers'),
                db.getAll('products'),
                db.getAll('quotes'),
                db.getAll('templates'),
                db.getAll('bankInfo')
            ]);

            const data = {
                customers,
                products,
                quotes,
                templates,
                banks,
                exportDate: new Date().toISOString(),
                version: '2.3'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `teklifmaster_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Yedek dosyası indirildi');
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error('Dışa aktarma hatası');
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (data.customers) await Promise.all(data.customers.map(item => db.put('customers', item)));
                if (data.products) await Promise.all(data.products.map(item => db.put('products', item)));
                if (data.quotes) await Promise.all(data.quotes.map(item => db.put('quotes', item)));
                if (data.templates) await Promise.all(data.templates.map(item => db.put('templates', item)));
                if (data.banks) await Promise.all(data.banks.map(item => db.put('bankInfo', item)));

                toast.success('Veriler başarıyla içe aktarıldı');
                loadStats();
            } catch (error) {
                console.error('Error importing data:', error);
                toast.error('İçe aktarma hatası: Geçersiz dosya formatı');
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Veritabanı Yönetimi" size="lg">
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border border-blue-100 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.customers}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Müşteriler</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-100 dark:border-green-800">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.products}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Ürünler</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center border border-purple-100 dark:border-purple-800">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.quotes}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Teklifler</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center border border-orange-100 dark:border-orange-800">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.templates}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Şablonlar</div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-center border border-indigo-100 dark:border-indigo-800">
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.banks}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Bankalar</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h4 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Veri İşlemleri</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="btn btn-outline flex items-center justify-center gap-2" onClick={handleExport}>
                            <Download size={18} /> Tüm Veriyi Dışa Aktar
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                id="dbImport"
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />
                            <button
                                className="btn btn-outline w-full flex items-center justify-center gap-2"
                                onClick={() => document.getElementById('dbImport').click()}
                            >
                                <Upload size={18} /> Veri İçe Aktar
                            </button>
                        </div>
                        <button className="btn btn-outline flex items-center justify-center gap-2" onClick={loadStats}>
                            <RefreshCw size={18} /> İstatistikleri Yenile
                        </button>
                        <button className="btn btn-danger flex items-center justify-center gap-2" onClick={handleClearData}>
                            <Trash size={18} /> Tüm Veriyi Temizle
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseManagerModal;
