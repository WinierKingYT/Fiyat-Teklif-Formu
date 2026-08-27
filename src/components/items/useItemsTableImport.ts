import { useCallback, type ClipboardEvent, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { parseLocaleNumber } from '@/utils/parseLocaleNumber';
import { sanitizeInput } from '@/utils/sanitize';
import type { QuoteItem } from '@/context/quote/types';

interface UseItemsTableImportParams {
  onItemsChange: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
  t: (key: string) => string;
}

const createItemId = () => `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

export const useItemsTableImport = ({ onItemsChange, t }: UseItemsTableImportParams) => {
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const text = event.clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && !text.includes('\t'))) return;
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim()).slice(0, 100);
    const allowedTax = new Set([0, 1, 10, 20]);
    const parsedItems: QuoteItem[] = [];
    lines.forEach(line => {
      const columns = line.split('\t');
      if (!columns[0]?.trim()) return;
      const quantity = parseLocaleNumber(columns[2]);
      const price = parseLocaleNumber(columns[4]);
      const tax = parseLocaleNumber(columns[5]);
      parsedItems.push({
        id: createItemId(),
        name: String(sanitizeInput(columns[0].trim().slice(0, 200)) || ''),
        description: String(sanitizeInput((columns[1] || '').trim().slice(0, 500)) || ''),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        unit: (columns[3] || '').trim().slice(0, 20) || 'Adet',
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        taxRate: Number.isFinite(tax) && allowedTax.has(tax) ? tax : Number.isFinite(tax) && tax >= 0 && tax <= 100 ? tax : 20,
        discountRate: 0,
        total: 0,
      });
    });
    if (parsedItems.length === 0) return;
    event.preventDefault();
    onItemsChange(prev => [...prev, ...parsedItems]);
    toast.success(t('pastedItemsCount').replace('{count}', String(parsedItems.length)) || `${parsedItems.length} kalem panodan yapıştırıldı`);
  }, [onItemsChange, t]);

  const handleExcelUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const XLSX = await import('xlsx').then(module => module.default || module);
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const data = new Uint8Array((loadEvent.currentTarget as FileReader).result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        const allowedTax = new Set([0, 1, 10, 20]);
        const newItems: QuoteItem[] = [];
        for (let index = 1; index < rows.length; index += 1) {
          const row = rows[index] || [];
          if (row.length === 0) continue;
          const quantity = parseLocaleNumber(row[2]);
          const price = parseLocaleNumber(row[4]);
          const tax = parseLocaleNumber(row[5]);
          const discount = parseLocaleNumber(row[6]);
          newItems.push({
            id: createItemId(),
            name: String(sanitizeInput(String(row[0] ?? '').slice(0, 200)) || ''),
            description: String(sanitizeInput(String(row[1] ?? '').slice(0, 500)) || ''),
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
            unit: String(row[3] ?? 'Adet').slice(0, 20),
            price: Number.isFinite(price) && price >= 0 ? price : 0,
            taxRate: Number.isFinite(tax) && allowedTax.has(tax) ? tax : Number.isFinite(tax) && tax >= 0 && tax <= 100 ? tax : 20,
            discountRate: Number.isFinite(discount) && discount >= 0 ? Math.min(discount, 1000000) : 0,
            total: 0,
            image: undefined,
          });
        }
        if (newItems.length > 0) {
          onItemsChange(prev => [...prev, ...newItems]);
          toast.success(t('excelItemsAdded').replace('{count}', String(newItems.length)));
        }
      } catch {
        toast.error(t('excelReadErrorItems'));
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }, [onItemsChange, t]);

  return { handlePaste, handleExcelUpload };
};
