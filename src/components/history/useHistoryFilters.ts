import { useEffect, useMemo, useState } from 'react';
import useDebounce from '@/hooks/useDebounce';
import type { DbQuote, QuoteVersion } from '@/context/quote/types';

export const HISTORY_PAGE_SIZE = 20;

interface UseHistoryFiltersParams {
  quotes: DbQuote[];
  versions: QuoteVersion[];
  activeTab: 'quotes' | 'versions';
}

const includesSearch = (value: string | undefined, query: string) => value?.toLowerCase().includes(query) || false;

export const useHistoryFilters = ({ quotes, versions, activeTab }: UseHistoryFiltersParams) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 250);

  const filteredQuotes = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    return quotes.filter(quote =>
      includesSearch(quote.quoteData?.title, query) ||
      includesSearch(quote.quoteData?.number, query) ||
      includesSearch(quote.customerData?.name, query) ||
      includesSearch(quote.customerData?.company, query),
    );
  }, [debouncedSearch, quotes]);

  const filteredVersions = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    return versions.filter(version =>
      includesSearch(version.versionName, query) ||
      includesSearch(version.snapshot?.quoteData?.number, query) ||
      includesSearch(version.snapshot?.customerData?.name, query) ||
      includesSearch(version.snapshot?.customerData?.company, query),
    );
  }, [debouncedSearch, versions]);

  const activeItems = activeTab === 'quotes' ? filteredQuotes : filteredVersions;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / HISTORY_PAGE_SIZE));
  const paginatedQuotes = useMemo(() => filteredQuotes.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE), [filteredQuotes, page]);
  const paginatedVersions = useMemo(() => filteredVersions.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE), [filteredVersions, page]);

  useEffect(() => setPage(1), [activeTab, debouncedSearch]);

  return {
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    filteredQuotes,
    filteredVersions,
    paginatedQuotes,
    paginatedVersions,
    totalPages,
    debouncedSearch,
  };
};
