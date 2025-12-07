import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Cleanup Confirmation Modal
 * Shows warning and confirmation before performing cleanup operations
 */
const CleanupConfirmModal = ({ isOpen, onClose, onConfirm, cleanupInfo }) => {
    if (!isOpen) return null;

    const {
        title = 'Temizlik Onayı',
        message = 'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
        itemCount = 0,
        itemType = 'kayıt',
        severity = 'warning', // 'warning' | 'danger'
        confirmText = 'Temizle',
        cancelText = 'İptal'
    } = cleanupInfo || {};

    const getSeverityColor = () => {
        switch (severity) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700';
            case 'warning':
            default:
                return 'bg-orange-600 hover:bg-orange-700';
        }
    };

    const getIconColor = () => {
        switch (severity) {
            case 'danger':
                return 'text-red-600';
            case 'warning':
            default:
                return 'text-orange-600';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="glass-card bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${getIconColor()}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Kapat"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Warning Message */}
                    <div className={`p-4 rounded-lg ${severity === 'danger' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                        <p className={`text-sm font-medium ${severity === 'danger' ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'}`}>
                            ⚠️ Bu işlem geri alınamaz!
                        </p>
                    </div>

                    {/* Main Message */}
                    <p className="text-gray-700 dark:text-gray-300">
                        {message}
                    </p>

                    {/* Item Count */}
                    {itemCount > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Trash2 size={18} className="text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                <strong>{itemCount}</strong> {itemType} silinecek
                            </span>
                        </div>
                    )}

                    {/* Additional Info */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>• Silinen veriler geri dönüşüm kutusuna taşınmaz</p>
                        <p>• İşlem birkaç saniye sürebilir</p>
                        <p>• Bu pencereyi kapatmayın</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors ${getSeverityColor()}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CleanupConfirmModal;
