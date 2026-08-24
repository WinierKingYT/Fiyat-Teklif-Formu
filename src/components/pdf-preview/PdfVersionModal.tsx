import { BookmarkPlus } from 'lucide-react';
import React from 'react';

interface PdfVersionModalProps {
    showVersionModal: boolean;
    setShowVersionModal: (show: boolean) => void;
    versionNameInput: string;
    setVersionNameInput: (name: string) => void;
    handleSaveVersion: () => void;
    t: (key: string) => string;
}

const PdfVersionModal: React.FC<PdfVersionModalProps> = ({
    showVersionModal,
    setShowVersionModal,
    versionNameInput,
    setVersionNameInput,
    handleSaveVersion,
    t
}) => {
    if (!showVersionModal) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-version-modal-title"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowVersionModal(false); }}
        >
            <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] shadow-xl max-w-sm w-full p-5 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <BookmarkPlus size={20} />
                    <h3 id="pdf-version-modal-title" className="font-semibold text-sm text-[var(--color-text)]">{t('saveQuoteVersion') || 'Teklif Sürümü Kaydet'}</h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                    {t('saveVersionDesc') || 'Mevcut teklif verilerini gelecekte geri dönebileceğiniz kalıcı bir snapshot (sürüm) olarak saklayın.'}
                </p>
                <input
                    type="text"
                    value={versionNameInput}
                    onChange={(e) => setVersionNameInput(e.target.value)}
                    placeholder={t('versionNamePlaceholder') || 'Sürüm adı (örn: Müşteri Revizesi 1)'}
                    className="w-full px-3 py-2 text-xs border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--color-bg-card)] text-[var(--color-text)]"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveVersion();
                        if (e.key === 'Escape') setShowVersionModal(false);
                    }}
                />
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setShowVersionModal(false)}
                        className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveVersion}
                        className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PdfVersionModal;
