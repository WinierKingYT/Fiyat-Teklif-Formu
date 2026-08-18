import React from 'react';
import { Check, AlertCircle, Loader } from 'lucide-react';
import { useSaveStatus } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';

const AutoSaveIndicator = () => {
    const saveStatus = useSaveStatus();
    const { t } = useTranslation();

    if (!saveStatus || saveStatus.status === 'idle') return null;

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 5) return t('nowLabel');
        if (seconds < 60) return `${seconds}sn`;
        return `${Math.floor(seconds / 60)}dk`;
    };

    const config = {
        saving: { icon: Loader, cls: 'text-[var(--color-info)]', spin: true, text: t('savingStatus') },
        saved: { icon: Check, cls: 'text-[var(--color-success)]', spin: false, text: t('savedStatus') },
        error: { icon: AlertCircle, cls: 'text-[var(--color-error)]', spin: false, text: t('saveErrorStatus') },
    };

    const c = config[saveStatus.status] || null;
    if (!c) return null;

    const Icon = c.icon;

    return (
        <div role="status" aria-live="polite" className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius)] bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-xs">
            <Icon size={12} className={`${c.cls} ${c.spin ? 'animate-spin' : ''}`} />
            <span className="text-[var(--color-text-muted)]">
                {c.text}{saveStatus.lastSaved && c === config.saved ? ` ${getTimeAgo(saveStatus.lastSaved)}` : ''}
            </span>
        </div>
    );
};

export default AutoSaveIndicator;
