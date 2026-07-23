import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { Search, User, Plus, Users } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import useDebounce from '../hooks/useDebounce';
import Logger from '../utils/logger';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

const CustomerSelectModal = ({ isOpen, onClose, onSelect }) => {
    const { db, isReady } = useIndexedDB();
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && isReady) loadCustomers();
    }, [isOpen, isReady]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const result = await (db as any).getAll('customers');
            setCustomers(result);
        } catch (error) {
            Logger.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useDebounce(searchTerm, 250);
    const filteredCustomers = useMemo(() =>
        customers.filter(c =>
            c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            c.company?.toLowerCase().includes(debouncedSearch.toLowerCase())
        ),
        [customers, debouncedSearch]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Müşteri Seç" size="lg">
            <div className="space-y-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                        <input type="text" className="form-control pl-9" placeholder="Müşteri veya firma ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button className="btn btn-primary whitespace-nowrap">
                        <Plus size={16} /> Yeni Müşteri
                    </button>
                </div>

                <div className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            <Skeleton variant="row" count={4} />
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <EmptyState
                            icon={<Users size={32} />}
                            title={searchTerm ? 'Sonuç bulunamadı' : 'Henüz kayıtlı müşteri yok'}
                            text={searchTerm ? 'Farklı bir arama terimi deneyin.' : 'Yeni müşteri ekleyerek başlayın.'}
                        />
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
                                <tr>
                                    <th className="p-3 font-medium">Müşteri Adı</th>
                                    <th className="p-3 font-medium">Firma</th>
                                    <th className="p-3 font-medium">E-posta</th>
                                    <th className="p-3 font-medium w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                        <td className="p-3 font-medium text-[var(--color-text)]">{customer.name}</td>
                                        <td className="p-3 text-[var(--color-text)]">{customer.company}</td>
                                        <td className="p-3 text-[var(--color-text-muted)]">{customer.email}</td>
                                        <td className="p-3 text-right">
                                            <button className="btn btn-sm btn-outline" onClick={() => { onSelect(customer); onClose(); }}>
                                                Seç
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CustomerSelectModal;
