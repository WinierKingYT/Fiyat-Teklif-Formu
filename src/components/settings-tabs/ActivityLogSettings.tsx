import { History, RefreshCw, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Skeleton from '@/components/Skeleton';
import { useQuoteData } from '@/context/QuoteContext';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import Logger from '@/utils/logger';
import type { AuditLogEntry } from '@/context/quote/types';

const MAX_VISIBLE_ENTRIES = 100;

const ENTITY_LABEL_KEYS: Record<string, string> = {
  quotes: 'quotes',
  customers: 'customers',
  products: 'products',
  bankInfo: 'banks',
  recycle_bin: 'recycleBin',
  quoteVersions: 'quoteVersions',
};

const ACTION_LABEL_KEYS: Record<AuditLogEntry['action'], string> = {
  delete: 'auditDeleted',
  moved_to_recycle_bin: 'auditMovedToRecycleBin',
  restore: 'auditRestored',
  permanent_delete: 'auditPermanentlyDeleted',
  empty_recycle_bin: 'auditBinEmptied',
};

const ActivityLogSettings: React.FC = () => {
  const { quoteData } = useQuoteData();
  const { db, isReady } = useIndexedDB();
  const { t } = useTranslation(quoteData?.language);
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!db || !isReady) return;

    try {
      setLoading(true);
      const allEntries = await db.getAll<AuditLogEntry>('auditLog');
      allEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(allEntries.slice(0, MAX_VISIBLE_ENTRIES));
    } catch (error) {
      Logger.error('Error loading audit log:', error);
      setEntries([]);
      toast.error(t('auditLogLoadError'));
    } finally {
      setLoading(false);
    }
  }, [db, isReady, t]);

  useEffect(() => {
    void loadEntries();
    const handleAuditUpdate = () => { void loadEntries(); };
    window.addEventListener('audit-log-updated', handleAuditUpdate);
    return () => window.removeEventListener('audit-log-updated', handleAuditUpdate);
  }, [loadEntries]);

  const handleClear = async () => {
    if (!db || isClearing) return;

    setConfirmOpen(false);
    setIsClearing(true);
    try {
      await db.clear('auditLog');
      setEntries([]);
      toast.success(t('auditLogCleared'));
    } catch (error) {
      Logger.error('Error clearing audit log:', error);
      toast.error(t('auditLogClearError'));
    } finally {
      setIsClearing(false);
    }
  };

  const entityLabel = (entityType: string) => {
    const key = ENTITY_LABEL_KEYS[entityType];
    return key ? t(key) : entityType;
  };

  const actionLabel = (action: AuditLogEntry['action']) => t(ACTION_LABEL_KEYS[action] || 'auditAction');

  const formatEntry = (entry: AuditLogEntry) => {
    if (entry.action === 'empty_recycle_bin') return actionLabel(entry.action);
    const target = entry.entityName || `${entityLabel(entry.entityType)} #${String(entry.entityId ?? '-')}`;
    return `${actionLabel(entry.action)}: ${target}`;
  };

  return (
    <div className="card space-y-4">
      <div className="card-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            <History size={13} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <div className="card-title">{t('activityLog')}</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">{t('activityLogDesc')}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" className="btn btn-outline btn-xs" onClick={() => void loadEntries()} disabled={loading} title={t('refresh')}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{t('refresh')}</span>
          </button>
          <button type="button" className="btn btn-danger btn-xs" onClick={() => setConfirmOpen(true)} disabled={entries.length === 0 || isClearing}>
            <Trash2 size={13} /> {t('clearActivityLog')}
          </button>
        </div>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="space-y-2"><Skeleton variant="row" count={4} /></div>
        ) : entries.length === 0 ? (
          <EmptyState icon={<History size={24} />} title={t('activityLogEmpty')} text={t('activityLogEmptyDesc')} />
        ) : (
          <div className="space-y-1.5" role="list" aria-label={t('activityLog')}>
            {entries.map((entry, index) => (
              <div key={`${String(entry.id ?? 'entry')}-${entry.createdAt}-${index}`} className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--color-border)]/60 bg-[var(--color-bg-card)] px-3 py-2" role="listitem">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 shrink-0 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center text-[var(--color-text-muted)]">
                    {entry.action === 'restore' ? <RefreshCw size={12} /> : <Trash2 size={12} />}
                  </div>
                  <span className="text-xs text-[var(--color-text)] truncate">{formatEntry(entry)}</span>
                </div>
                <time className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap" dateTime={entry.createdAt}>
                  {new Date(entry.createdAt).toLocaleString('tr-TR')}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title={t('clearActivityLog')}
        message={t('clearActivityLogConfirm')}
        onConfirm={() => void handleClear()}
        onCancel={() => setConfirmOpen(false)}
        variant="danger"
      />
    </div>
  );
};

export default ActivityLogSettings;
