import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import type { QuoteItem } from '@/context/quote/types';

interface UseItemsTableSelectionParams {
  items: QuoteItem[];
  onItemsChange: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
}

export const useItemsTableSelection = ({ items, onItemsChange }: UseItemsTableSelectionParams) => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const toggleSelectItem = useCallback((index: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(selectedItems.size === items.length ? new Set() : new Set(items.map((_, index) => index)));
  }, [items, selectedItems.size]);

  const deleteSelected = useCallback(() => {
    onItemsChange(prev => prev.filter((_, index) => !selectedItems.has(index)));
    setSelectedItems(new Set());
  }, [onItemsChange, selectedItems]);

  const duplicateSelected = useCallback(() => {
    onItemsChange(prev => [...prev, ...Array.from(selectedItems).sort((a, b) => b - a).map(index => ({
      ...prev[index],
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    }))]);
    setSelectedItems(new Set());
  }, [onItemsChange, selectedItems]);

  const moveSelectedUp = useCallback(() => {
    if (selectedItems.size === 0) return;
    const indices = Array.from(selectedItems).sort((a, b) => a - b);
    if (indices[0] <= 0) return;
    onItemsChange(prev => {
      const next = [...prev];
      indices.forEach(index => {
        if (index > 0 && !selectedItems.has(index - 1)) [next[index - 1], next[index]] = [next[index], next[index - 1]];
      });
      return next;
    });
    setSelectedItems(new Set(indices.map(index => selectedItems.has(index - 1) ? index : index - 1)));
  }, [onItemsChange, selectedItems]);

  const moveSelectedDown = useCallback(() => {
    if (selectedItems.size === 0) return;
    const indices = Array.from(selectedItems).sort((a, b) => b - a);
    if (indices[0] >= items.length - 1) return;
    onItemsChange(prev => {
      const next = [...prev];
      indices.forEach(index => {
        if (index < next.length - 1 && !selectedItems.has(index + 1)) [next[index], next[index + 1]] = [next[index + 1], next[index]];
      });
      return next;
    });
    setSelectedItems(new Set(indices.map(index => selectedItems.has(index + 1) ? index : index + 1)));
  }, [items.length, onItemsChange, selectedItems]);

  const applyBulkDiscount = useCallback((rate: number) => {
    onItemsChange(prev => prev.map((item, index) => selectedItems.has(index) ? { ...item, discountRate: rate } : item));
    toast.success(`Seçili kalemlere %${rate} iskonto uygulandı`);
  }, [onItemsChange, selectedItems]);

  const applyBulkVAT = useCallback((vat: number) => {
    onItemsChange(prev => prev.map((item, index) => selectedItems.has(index) ? { ...item, taxRate: vat } : item));
    toast.success(`Seçili kalemlerin KDV oranı %${vat} yapıldı`);
  }, [onItemsChange, selectedItems]);

  return { selectedItems, toggleSelectItem, selectAll, deleteSelected, duplicateSelected, moveSelectedUp, moveSelectedDown, applyBulkDiscount, applyBulkVAT, clearSelection: () => setSelectedItems(new Set()) };
};
