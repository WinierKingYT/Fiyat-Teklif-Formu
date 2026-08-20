import React from 'react';
import { useSaveStatus } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';

const AutoSaveIndicator = () => {
    const saveStatus = useSaveStatus();
    const { t } = useTranslation();

    if (!saveStatus || saveStatus.status === 'idle') return null;

    const getTimeAgo = (timestamp?: number | null) => {
        if (!timestamp) return '';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 5) return t('nowLabel') || 'şimdi';
        if (seconds < 60) return `${seconds}sn önce`;
        return `${Math.floor(seconds / 60)}dk önce`;
    };

    const statusConfig = {
        saving: {
            dotClass: 'bg-[var(--color-info)] animate-pulse',
            title: t('savingStatus') || 'Kaydediliyor...',
            label: 'Kaydediliyor',
        },
        saved: {
            dotClass: 'bg-[var(--color-success)]',
            title: `${t('savedStatus') || 'Kaydedildi'} (${getTimeAgo(saveStatus.lastSaved)})`,
            label: 'Kaydedildi',
        },
        error: {
            dotClass: 'bg-[var(--color-error)] animate-bounce',
            title: t('saveErrorStatus') || 'Kayıt hatası!',
            label: 'Hata',
        },
    };

    const c = statusConfig[saveStatus.status];
    if (!c) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            title={c.title}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-xs cursor-default select-none transition-colors"
        >
            <span className={`w-2 h-2 rounded-full shrink-0 ${c.dotClass}`} />
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium hidden sm:inline">
                {c.label}
            </span>
        </div>
    );
};

export default React.memo(AutoSaveIndicator);
