import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Logger from '@/utils/logger';
import type { ProductRow } from '@/components/items/itemsTableTypes';
import type { IndexedDBManager, QuoteItem } from '@/context/quote/types';

interface UseItemsTableCatalogParams {
  db: IndexedDBManager;
  items: QuoteItem[];
  onItemsChange: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
}

export const useItemsTableCatalog = ({ db, items, onItemsChange }: UseItemsTableCatalogParams) => {
  const [allCatalogProducts, setAllCatalogProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    db.getAll<ProductRow>('products')
      .then(products => { if (!cancelled) setAllCatalogProducts(products || []); })
      .catch(() => { if (!cancelled) setAllCatalogProducts([]); });
    return () => { cancelled = true; };
  }, [db]);

  const handleProductSelect = useCallback((index: number, product: ProductRow) => {
    onItemsChange(prev => {
      const next = [...prev];
      if (!next[index]) return prev;
      const quantity = next[index].quantity || 1;
      const price = product.price !== undefined ? product.price : next[index].price;
      const discountRate = next[index].discountRate || 0;
      next[index] = {
        ...next[index],
        name: product.name,
        description: product.description !== undefined ? product.description : (next[index].description || ''),
        unit: product.unit || next[index].unit || 'Adet',
        price,
        taxRate: product.taxRate !== undefined ? product.taxRate : (next[index].taxRate || 20),
        total: quantity * price * (1 - discountRate / 100),
        image: product.image ?? next[index].image,
      };
      return next;
    });
  }, [onItemsChange]);

  const handleCreateProduct = useCallback(async (index: number, name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    const currentRow = items[index];
    const product: ProductRow = {
      id: `prod-${Date.now()}`,
      name: trimmed,
      description: currentRow?.description || '',
      price: currentRow?.price || 0,
      unit: currentRow?.unit || 'Adet',
      taxRate: currentRow?.taxRate || 20,
      image: currentRow?.image || null,
      createdAt: new Date().toISOString(),
    };
    try {
      await db.add('products', product);
      setAllCatalogProducts(prev => [...prev, product]);
      handleProductSelect(index, product);
      toast.success(`"${trimmed}" ürünü kataloğa kaydedildi`);
    } catch (error) {
      Logger.error('Ürün kaydedilemedi:', error);
      toast.error('Ürün kataloğa kaydedilemedi');
    }
  }, [db, handleProductSelect, items]);

  return { allCatalogProducts, handleProductSelect, handleCreateProduct };
};
