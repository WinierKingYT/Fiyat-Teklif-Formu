import { Search, User, Plus, Users } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Skeleton from '@/components/Skeleton';
import useDebounce from '@/hooks/useDebounce';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import Logger from '@/utils/logger';
import type { CustomerData } from '@/context/quote/types';

interface CustomerSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: CustomerData) => void;
    onCreateNew?: () => void;
    language?: string;
}

const CustomerSelectModal = ({ isOpen, onClose, onSelect, onCreateNew, language = 'tr' }: CustomerSelectModalProps) => {
    const { t } = useTranslation(language);
    const { db, isReady } = useIndexedDB();
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    useEffect(() => {
        if (isOpen && isReady) loadCustomers();
    }, [isOpen, isReady]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const result = await (db).getAll<CustomerData>('customers');
            setCustomers(result);
        } catch (error) {
            Logger.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useDebounce(searchTerm, 250);
    const filteredCustomers = useMemo(() => {
        const q = debouncedSearch.toLocaleLowerCase('tr-TR').trim();
        if (!q) return customers;
        return customers.filter(c =>
            (c.name || '').toLocaleLowerCase('tr-TR').includes(q) ||
            (c.company || '').toLocaleLowerCase('tr-TR').includes(q) ||
            (c.email || '').toLocaleLowerCase('tr-TR').includes(q) ||
            (c.phone || '').toLocaleLowerCase('tr-TR').includes(q) ||
            (c.taxNumber || '').toLocaleLowerCase('tr-TR').includes(q)
        );
    }, [customers, debouncedSearch]);

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
    const paginatedCustomers = useMemo(() =>
        filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredCustomers, page]
    );

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('selectCustomer') || 'Müşteri Seç'} size="md">
            <div className="space-y-2.5 flex flex-col h-[60vh]">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
                        <input
                            type="text"
                            className="form-control pl-8 text-xs"
                            placeholder={t('searchCustomers') || 'Müşteri veya firma ara...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {onCreateNew && (
                        <button type="button" className="btn btn-primary btn-xs whitespace-nowrap" onClick={() => { onClose(); onCreateNew(); }}>
                            <Plus size={13} /> {t('new') || 'Yeni'}
                        </button>
                    )}
                </div>

                <div className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 space-y-2">
                            <Skeleton variant="row" count={4} />
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <EmptyState
                            icon={<Users size={24} />}
                            title={searchTerm ? (t('noResultsFound') || 'Sonuç bulunamadı') : (t('noCustomersYet') || 'Henüz kayıtlı müşteri yok')}
                            text={searchTerm ? (t('tryDifferentSearch') || 'Farklı bir arama terimi deneyin.') : (t('startByAddingCustomer') || 'Yeni müşteri ekleyerek başlayın.')}
                        />
                    ) : (
                        <div className="divide-y divide-[var(--color-border)]/50">
                            {paginatedCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    onClick={() => { onSelect(customer); onClose(); }}
                                    className="p-2.5 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                                            {customer.name}
                                        </div>
                                        <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                                            {customer.company || customer.email || customer.phone || '-'}
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-medium text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t('select') || 'Seç'} →
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {!loading && filteredCustomers.length > PAGE_SIZE && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={filteredCustomers.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </Modal>
    );
};

export default CustomerSelectModal;
