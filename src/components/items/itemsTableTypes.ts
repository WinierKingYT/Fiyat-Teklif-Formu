import type { QuoteItem } from '@/context/quote/types';

export interface ItemsTableProps {
  items: QuoteItem[];
  onItemsChange: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
  currency?: string;
  onAddProduct?: () => void;
}

export interface ProductRow {
  id?: string | number;
  name: string;
  description?: string;
  unit?: string;
  price?: number;
  taxRate?: number;
  category?: string;
  image?: string | null;
  createdAt?: string;
}

export interface VisibleColumns {
  image: boolean;
  description: boolean;
  unit: boolean;
  discount: boolean;
}
