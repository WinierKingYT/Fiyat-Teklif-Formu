import { Download, History, RefreshCw, Search, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Skeleton from '@/components/Skeleton';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import Logger from '@/utils/logger';
import type { AuditLogEntry } from '@/context/quote/types';

const MAX_VISIBLE_ENTRIES = 100;
const AUDIT_RETENTION_DAYS = 90;

const ENTITY_LABEL_KEYS: Record<string, string> = {
  quotes: 'quotes',
  customers: 'customers',
  products: 'products',
  bankInfo: 'banks',
  recycle_bin: 'recycleBin',
  quoteVersions: 'quoteVersions',
  backup: 'backup',
};

const ACTION_LABEL_KEYS: Record<AuditLogEntry['action'], string> = {
  delete: 'auditDeleted',
  moved_to_recycle_bin: 'auditMovedToRecycleBin',
  restore: 'auditRestored',
  permanent_delete: 'auditPermanentlyDeleted',
  empty_recycle_bin: 'auditBinEmptied',
  restore_backup: 'auditBackupRestored',
};

const ActivityLogSettings: React.FC = () => {
  const { db, isReady } = useIndexedDB();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionFilter, setActionFilter] = useState<'all' | AuditLogEntry['action']>('all');
  const [entityFilter, setEntityFilter] = useState<'all' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadEntries = useCallback(async () => {
    if (!db || !isReady) return;

    try {
      setLoading(true);
      const allEntries = await db.getAll<AuditLogEntry>('auditLog');
      const cutoffTime = Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
      const staleEntries = allEntries.filter(entry => entry.id !== undefined && new Date(entry.createdAt).getTime() < cutoffTime);
      if (staleEntries.length > 0) {
        await Promise.all(staleEntries.map(entry => db.delete('auditLog', entry.id as IDBValidKey)));
      }
      const recentEntries = allEntries.filter(entry => !staleEntries.includes(entry));
      recentEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(recentEntries.slice(0, MAX_VISIBLE_ENTRIES));
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

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('tr-TR');

    return entries.filter(entry => {
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
      if (entityFilter !== 'all' && entry.entityType !== entityFilter) return false;
      if (!normalizedSearch) return true;

      const actionText = t(ACTION_LABEL_KEYS[entry.action] || 'auditAction');
      const entityText = t(ENTITY_LABEL_KEYS[entry.entityType] || entry.entityType);
      const searchableText = [
        actionText,
        entityText,
        entry.entityName,
        entry.entityId === undefined ? '' : String(entry.entityId),
      ].join(' ').toLocaleLowerCase('tr-TR');

      return searchableText.includes(normalizedSearch);
    });
  }, [actionFilter, entityFilter, entries, searchTerm, t]);

  const hasFilters = actionFilter !== 'all' || entityFilter !== 'all' || searchTerm.trim().length > 0;

  const handleExport = () => {
    if (filteredEntries.length === 0) return;

    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      [t('date'), t('action'), t('dataType'), t('record')],
      ...filteredEntries.map(entry => [
        new Date(entry.createdAt).toLocaleString('tr-TR'),
        actionLabel(entry.action),
        entityLabel(entry.entityType),
        entry.entityName || `${entityLabel(entry.entityType)} #${String(entry.entityId ?? '-')}`,
      ]),
    ];
    const csv = `\uFEFF${rows.map(row => row.map(escapeCsv).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `islem-gecmisi-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(t('auditLogExported'));
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
          <button type="button" className="btn btn-outline btn-xs" onClick={handleExport} disabled={filteredEntries.length === 0} aria-label={t('exportActivityLog')}>
            <Download size={13} /> <span className="hidden sm:inline">{t('exportActivityLog')}</span>
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
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="search"
                  className="form-control pl-8 text-xs"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder={t('activitySearchPlaceholder')}
                  aria-label={t('activitySearch')}
                />
              </div>
              <select
                className="form-control form-select text-xs sm:w-44"
                value={actionFilter}
                onChange={event => setActionFilter(event.target.value as 'all' | AuditLogEntry['action'])}
                aria-label={t('activityActionFilter')}
              >
                <option value="all">{t('all')} {t('action')}</option>
                {(Object.keys(ACTION_LABEL_KEYS) as AuditLogEntry['action'][]).map(action => (
                  <option key={action} value={action}>{actionLabel(action)}</option>
                ))}
              </select>
              <select
                className="form-control form-select text-xs sm:w-40"
                value={entityFilter}
                onChange={event => setEntityFilter(event.target.value)}
                aria-label={t('activityEntityFilter')}
              >
                <option value="all">{t('all')} {t('dataType')}</option>
                {Object.keys(ENTITY_LABEL_KEYS).map(entityType => (
                  <option key={entityType} value={entityType}>{entityLabel(entityType)}</option>
                ))}
              </select>
              {hasFilters && (
                <button
                  type="button"
                  className="btn btn-outline btn-xs shrink-0"
                  onClick={() => { setSearchTerm(''); setActionFilter('all'); setEntityFilter('all'); }}
                  aria-label={t('clearActivityFilters')}
                  title={t('clearActivityFilters')}
                >
                  <X size={13} />
                  <span className="hidden sm:inline">{t('clearActivityFilters')}</span>
                </button>
              )}
            </div>
            <div className="mb-2 text-[10px] text-[var(--color-text-muted)]">
              {filteredEntries.length}/{entries.length} {t('record')}
            </div>
            {filteredEntries.length === 0 ? (
              <EmptyState icon={<Search size={24} />} title={t('activityNoMatches')} text={t('activityNoMatchesDesc')} />
            ) : (
              <div className="space-y-1.5" role="list" aria-label={t('activityLog')}>
                {filteredEntries.map((entry, index) => (
                  <div key={`${String(entry.id ?? 'entry')}-${entry.createdAt}-${index}`} className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--color-border)]/60 bg-[var(--color-bg-card)] px-3 py-2" role="listitem">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center text-[var(--color-text-muted)]">
                        {entry.action === 'restore' || entry.action === 'restore_backup' ? <RefreshCw size={12} /> : <Trash2 size={12} />}
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
          </>
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
