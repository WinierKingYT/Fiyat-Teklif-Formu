import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Logger from '@/utils/logger';
import type { DbQuote, IndexedDBManager, QuoteVersion } from '@/context/quote/types';

interface UseHistoryDataParams {
  db: IndexedDBManager;
  isReady: boolean;
  t: (key: string) => string;
}

export const useHistoryData = ({ db, isReady, t }: UseHistoryDataParams) => {
  const [quotes, setQuotes] = useState<DbQuote[]>([]);
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedQuotes, fetchedVersions] = await Promise.all([
        db.getAll<DbQuote>('quotes'),
        db.getAll<QuoteVersion>('quoteVersions'),
      ]);
      fetchedQuotes.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
      fetchedVersions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setQuotes(fetchedQuotes);
      setVersions(fetchedVersions);
    } catch (error) {
      Logger.error('Error loading history data:', error);
      toast.error(t('errorLoadingQuotes'));
    } finally {
      setLoading(false);
    }
  }, [db, t]);

  useEffect(() => {
    if (isReady) loadData();
  }, [isReady, loadData]);

  return { quotes, setQuotes, versions, setVersions, loading, loadData };
};
