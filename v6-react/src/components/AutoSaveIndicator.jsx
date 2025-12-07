import React from 'react';
import { Check, AlertCircle, Loader } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';

const AutoSaveIndicator = () => {
    const { saveStatus } = useQuote();

    if (!saveStatus || saveStatus.status === 'idle') {
        return null;
    }

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 5) return 'şimdi';
        if (seconds < 60) return `${seconds} saniye önce`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} dakika önce`;
        const hours = Math.floor(minutes / 60);
        return `${hours} saat önce`;
    };

    const renderContent = () => {
        switch (saveStatus.status) {
            case 'saving':
                return (
                    <>
                        <Loader size={14} className="animate-spin text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Kaydediliyor...</span>
                    </>
                );
            case 'saved':
                return (
                    <>
                        <Check size={14} className="text-green-600 dark:text-green-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Kaydedildi {saveStatus.lastSaved && `• ${getTimeAgo(saveStatus.lastSaved)}`}
                        </span>
                    </>
                );
            case 'error':
                return (
                    <>
                        <AlertCircle size={14} className="text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">Kayıt başarısız</span>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            {renderContent()}
        </div>
    );
};

export default AutoSaveIndicator;
