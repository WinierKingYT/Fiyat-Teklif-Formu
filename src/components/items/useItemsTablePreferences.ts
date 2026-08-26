import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/calculations';
import type { VisibleColumns } from '@/components/items/itemsTableTypes';
import type { QuoteData, QuoteItem } from '@/context/quote/types';

interface UseItemsTablePreferencesParams {
  items: QuoteItem[];
  onItemsChange: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
  quoteData: QuoteData;
  updateQuoteData: (field: string, value: unknown) => void;
  currency: string;
  t: (key: string) => string;
}

export const useItemsTablePreferences = ({
  items,
  onItemsChange,
  quoteData,
  updateQuoteData,
  currency,
  t,
}: UseItemsTablePreferencesParams) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table',
  );

  useEffect(() => {
    let throttleTimer: number | null = null;
    const handleResize = () => {
      if (throttleTimer !== null) return;
      throttleTimer = window.setTimeout(() => {
        setViewMode(window.innerWidth < 768 ? 'card' : 'table');
        throttleTimer = null;
      }, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (throttleTimer !== null) window.clearTimeout(throttleTimer);
    };
  }, []);

  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(() => {
    try {
      const saved = localStorage.getItem('quote_visible_cols');
      return saved ? JSON.parse(saved) as VisibleColumns : { image: true, description: true, unit: true, discount: true };
    } catch {
      return { image: true, description: true, unit: true, discount: true };
    }
  });

  const toggleColumn = useCallback((key: keyof VisibleColumns) => {
    setVisibleColumns(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('quote_visible_cols', JSON.stringify(next));
      return next;
    });
  }, []);

  const taxMode: 'exclusive' | 'inclusive' = (quoteData as Record<string, unknown>).taxMode === 'inclusive' ? 'inclusive' : 'exclusive';
  const toggleTaxMode = useCallback(() => {
    const next = taxMode === 'exclusive' ? 'inclusive' : 'exclusive';
    updateQuoteData('taxMode', next);
    toast.success(next === 'inclusive' ? (t('taxModeToastInclusive') || 'Fiyatlandırma: KDV Dahil Modu') : (t('taxModeToastExclusive') || 'Fiyatlandırma: KDV Hariç Modu'));
  }, [taxMode, updateQuoteData, t]);

  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [items]);

  const sortItems = useCallback((mode: 'price-desc' | 'price-asc' | 'name-asc') => {
    const sorters = {
      'price-desc': (a: QuoteItem, b: QuoteItem) => (Number(b.price) || 0) - (Number(a.price) || 0),
      'price-asc': (a: QuoteItem, b: QuoteItem) => (Number(a.price) || 0) - (Number(b.price) || 0),
      'name-asc': (a: QuoteItem, b: QuoteItem) => (a.name || '').localeCompare(b.name || '', 'tr'),
    };
    onItemsChange(prev => [...prev].sort(sorters[mode]));
    toast.success(t('itemsSorted') || 'Kalemler sıralandı');
  }, [items, onItemsChange, t]);

  const formatItemCurrency = useCallback((amount: number) => formatCurrency(amount, currency), [currency]);

  return { viewMode, visibleColumns, toggleColumn, taxMode, toggleTaxMode, totalQuantity, sortItems, formatItemCurrency };
};
