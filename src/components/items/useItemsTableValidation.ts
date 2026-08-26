import { useCallback, useMemo, useState } from 'react';
import type { QuoteItem } from '@/context/quote/types';

export const useItemsTableValidation = (items: QuoteItem[], t: (key: string) => string) => {
  const [touchedRows, setTouchedRows] = useState<Record<string, Record<string, boolean>>>({});

  const getRowErrors = useCallback((item: QuoteItem) => {
    const errors: Record<string, string> = {};
    const quantity = Number(item.quantity);
    const price = Number(item.price);
    const tax = Number(item.taxRate);
    if (!item.name) errors.name = t('productNameRequired');
    if (!Number.isFinite(quantity) || quantity <= 0) errors.quantity = t('quantityMustBePositive') || 'Miktar > 0 olmalı';
    if (!Number.isFinite(price) || price < 0) errors.price = t('invalidPrice') || 'Geçersiz fiyat';
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) errors.taxRate = t('vatRateRange') || 'KDV 0-100 arası';
    return errors;
  }, [t]);

  const handleRowBlur = useCallback((itemId: string, field: string) => {
    setTouchedRows(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: true } }));
  }, []);

  const getFieldClass = useCallback((itemId: string, field: string, item: QuoteItem) => {
    const rowErrors = getRowErrors(item);
    return touchedRows[itemId]?.[field] && rowErrors[field]
      ? 'form-control field-error text-sm'
      : 'form-control text-sm';
  }, [getRowErrors, touchedRows]);

  const allRowErrors = useMemo(() => {
    const errors = new Map<string, Record<string, string>>();
    items.forEach(item => errors.set(item.id, getRowErrors(item)));
    return errors;
  }, [getRowErrors, items]);

  const hasErrors = useMemo(() => items.some(item => Object.keys(getRowErrors(item)).length > 0), [getRowErrors, items]);

  return { getRowErrors, handleRowBlur, getFieldClass, allRowErrors, hasErrors };
};
