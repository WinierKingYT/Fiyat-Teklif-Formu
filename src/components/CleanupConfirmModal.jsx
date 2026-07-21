import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const CleanupConfirmModal = ({ isOpen, onClose, onConfirm, cleanupInfo }) => {
    if (!isOpen) return null;

    const {
        title = 'Temizlik Onayı',
        message = 'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
        itemCount = 0,
        itemType = 'kayıt',
        severity = 'warning',
        confirmText = 'Temizle',
        cancelText = 'İptal'
    } = cleanupInfo || {};

    const isDanger = severity === 'danger';
    const iconColor = isDanger ? 'var(--color-error)' : 'var(--color-warning)';
    const bgColor = isDanger ? 'var(--color-error)' : 'var(--color-warning)';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] shadow-lg max-w-md w-full animate-scaleIn">
                <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-[var(--radius)] bg-[var(--color-bg-muted)]" style={{ color: iconColor }}>
                            <AlertTriangle size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-text)]">{title}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className={`p-3 rounded-[var(--radius)]`} style={{ background: `color-mix(in srgb, ${iconColor} 10%, transparent)` }}>
                        <p className="text-sm font-medium" style={{ color: iconColor }}>
                            Bu işlem geri alınamaz!
                        </p>
                    </div>

                    <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>

                    {itemCount > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-[var(--color-bg-muted)] rounded-[var(--radius)]">
                            <Trash2 size={16} className="text-[var(--color-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--color-text)]">
                                <strong>{itemCount}</strong> {itemType} silinecek
                            </span>
                        </div>
                    )}

                    <div className="text-xs text-[var(--color-text-muted)] space-y-1">
                        <p>Silinen veriler geri dönüşüm kutusuna taşınmaz</p>
                        <p>İşlem birkaç saniye sürebilir</p>
                        <p>Bu pencereyi kapatmayın</p>
                    </div>
                </div>

                <div className="flex gap-3 p-5 border-t border-[var(--color-border)]">
                    <button onClick={onClose} className="btn btn-outline flex-1">{cancelText}</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="btn flex-1 text-white" style={{ background: bgColor }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CleanupConfirmModal;
