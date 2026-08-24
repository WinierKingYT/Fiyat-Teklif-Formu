import { Trash2, Edit, Plus, Search, Download, Upload } from 'lucide-react';
import React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import useDebounce from '@/hooks/useDebounce';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import { getLocalDateString } from '@/utils/dateUtils';
import Logger from '@/utils/logger';
import type { CustomerData } from '@/context/quote/types';

interface CustomerManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    language?: string;
}

const CustomerManagerModal = ({ isOpen, onClose, language = 'tr' }: CustomerManagerModalProps) => {
    const { t } = useTranslation(language);
    const { db } = useIndexedDB();
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        taxOffice: '',
        taxNumber: ''
    });

    useEffect(() => {
        if (isOpen && db) {
            loadCustomers();
        }
    }, [isOpen, db]);

    const loadCustomers = async () => {
        const allCustomers = await (db).getAll<CustomerData>('customers');
        setCustomers(allCustomers);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name && !formData.company) {
            toast.error(t('enterNameOrCompany'));
            return;
        }

        if (!isEditing) {
            const isDuplicate = customers.some(c =>
                (formData.company && c.company && c.company.trim().toLowerCase() === formData.company.trim().toLowerCase()) ||
                (formData.email && c.email && c.email.trim().toLowerCase() === formData.email.trim().toLowerCase()) ||
                (!formData.company && formData.name && c.name && c.name.trim().toLowerCase() === formData.name.trim().toLowerCase())
            );

            if (isDuplicate) {
                setConfirmDialog({ isOpen: true, title: t('duplicateCustomer'), message: t('duplicateCustomerConfirm'), onConfirm: () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); performSave(); }, variant: 'warning' });
                return;
            }
        }

        performSave();
    };

    const performSave = async () => {
        try {
            if (isEditing && currentCustomer) {
                await db.put('customers', { ...formData, id: currentCustomer.id });
                toast.success(t('customerUpdated'));
            } else {
                await db.add('customers', { ...formData, id: Date.now() });
                toast.success(t('customerAdded'));
            }
            loadCustomers();
            resetForm();
        } catch (error) {
            Logger.error(error);
            toast.error(t('customerSaveError'));
        }
    };

    const handleEdit = (customer: CustomerData) => {
        setCurrentCustomer(customer);
        setFormData({
            name: customer.name || '',
            company: customer.company || '',
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            taxOffice: customer.taxOffice || '',
            taxNumber: customer.taxNumber || (customer as Record<string, string>).taxNo || ''
        });
        setIsEditing(true);
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDelete = async (id: string | number) => {
        setConfirmDialog({
            isOpen: true,
            title: t('deleteCustomer'),
            message: t('deleteCustomerConfirm'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    const customerToDelete = customers.find(c => c.id === id);
                    if (customerToDelete) {
                        await db.add('recycle_bin', { ...customerToDelete, originalStore: 'customers', deletedAt: new Date().toISOString(), originalId: id });
                        await db.delete('customers', id);
                        toast.success(t('customerMovedToBin'));
                        loadCustomers();
                        if (currentCustomer?.id === id) {
                            resetForm();
                        }
                    }
                } catch (error) {
                    Logger.error(error);
                    toast.error(t('customerDeleteError'));
                }
            },
            variant: 'danger'
        });
    };

    const resetForm = () => {
        setFormData({ name: '', company: '', email: '', phone: '', address: '', taxOffice: '', taxNumber: '' });
        setIsEditing(false);
        setCurrentCustomer(null);
    };

    const debouncedSearch = useDebounce(searchTerm, 250);
    const filteredCustomers = useMemo(() => {
        const q = debouncedSearch.toLowerCase().trim();
        if (!q) return customers;
        return customers.filter(c =>
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.company && c.company.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.phone && c.phone.toLowerCase().includes(q)) ||
            (c.taxNumber && c.taxNumber.toLowerCase().includes(q)) ||
            ((c as Record<string, unknown>).taxNo && String((c as Record<string, unknown>).taxNo).toLowerCase().includes(q))
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

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleExport = () => {
        try {
            const dataStr = JSON.stringify(customers, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `musteriler_${getLocalDateString()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast.success(t('customersExported'));
        } catch (error) {
            Logger.error('Export error:', error);
            toast.error(t('exportError'));
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const inputEl = e.target;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedCustomers = JSON.parse((event.target as FileReader).result as string);
                if (!Array.isArray(importedCustomers)) throw new Error('Invalid format');

                let count = 0;
                let baseId = Date.now();
                for (const customer of importedCustomers) {
                    if (customer.name || customer.company) {
                        await db.add('customers', { ...customer, id: baseId++ });
                        count++;
                    }
                }
                toast.success(t('customersImported').replace('{count}', String(count)));
                loadCustomers();
            } catch (error) {
                Logger.error('Import error:', error);
                toast.error(t('importErrorInvalid'));
            } finally {
                inputEl.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('customerManagement')} size="xl">
            <div className="flex flex-col md:flex-row gap-6 h-[70vh]">

                {/* Left: List */}
                <div className="w-full md:w-1/2 flex flex-col border-r border-[var(--color-border)] pr-4">
                    <div className="flex items-center gap-1.5 mb-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
                            <input
                                type="text"
                                className="form-control pl-8 text-xs"
                                placeholder={t('searchCustomers')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button type="button" className="btn btn-outline btn-xs p-1.5" onClick={handleExport} title={t('exportJson') || 'Dışa Aktar (JSON)'}>
                            <Download size={13} />
                        </button>
                        <button type="button" className="btn btn-outline btn-xs p-1.5" onClick={() => fileInputRef.current?.click()} title={t('importJson') || 'İçe Aktar (JSON)'}>
                            <Upload size={13} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleImport}
                        />
                        <button type="button"
                            className="btn btn-primary btn-xs whitespace-nowrap"
                            onClick={resetForm}
                            title={t('addNewCustomer')}
                        >
                            <Plus size={13} /> {t('new') || 'Yeni'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                        {filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                                <p>{t('noCustomersFound')}</p>
                            </div>
                        ) : (
                            paginatedCustomers.map(customer => (
                                <div
                                    key={customer.id}
                                    className={`p-3 border rounded-lg flex justify-between items-center group transition-colors cursor-pointer ${currentCustomer?.id === customer.id
                                        ? 'bg-[var(--color-bg-hover)] border-[var(--color-primary)]'
                                        : 'border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                                        }`}
                                    onClick={() => handleEdit(customer)}
                                >
                                    <div>
                                        <div className="font-medium text-[var(--color-text)]">{customer.company}</div>
                                        <div className="text-sm text-[var(--color-text-muted)]">{customer.name}</div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-full transition-colors"
                                            onClick={(e) => { e.stopPropagation(); if (customer.id !== undefined) handleDelete(customer.id); }}
                                            aria-label={`${t('deleteCustomer')}: ${customer.name || customer.company || ''}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {filteredCustomers.length > PAGE_SIZE && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={filteredCustomers.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>

                {/* Right: Form */}
                <div className="w-full md:w-1/2 pl-2 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                            {isEditing ? t('editCustomer') : t('addNewCustomer')}
                        </h3>
                        {isEditing && (
                            <button type="button" className="btn btn-sm btn-ghost text-[var(--color-text-muted)]" onClick={handleCancelEdit}>
                                {t('cancelEdit')}
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-group">
                            <label className="form-label" htmlFor="mgr-customerCompany">{t('companyName')}</label>
                            <input type="text" className="form-control" id="mgr-customerCompany" name="company" value={formData.company} onChange={handleInputChange} autoComplete="off" />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="mgr-customerName">{t('authorizedDealer')}</label>
                            <input type="text" className="form-control" id="mgr-customerName" name="name" value={formData.name} onChange={handleInputChange} autoComplete="off" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="mgr-customerPhone">{t('phone')}</label>
                                <input type="tel" className="form-control" id="mgr-customerPhone" name="phone" value={formData.phone} onChange={handleInputChange} autoComplete="off" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="mgr-customerEmail">{t('email')}</label>
                                <input type="email" className="form-control" id="mgr-customerEmail" name="email" value={formData.email} onChange={handleInputChange} autoComplete="off" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="mgr-customerAddress">{t('address')}</label>
                            <textarea className="form-control" id="mgr-customerAddress" rows={2} name="address" value={formData.address} onChange={handleInputChange} autoComplete="off"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="customerTaxOffice">{t('taxOffice')}</label>
                                <input type="text" className="form-control" id="customerTaxOffice" name="taxOffice" value={formData.taxOffice} onChange={handleInputChange} autoComplete="off" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="customerTaxNo">{t('taxNo')}</label>
                                <input type="text" className="form-control" id="customerTaxNo" name="taxNumber" value={formData.taxNumber} onChange={handleInputChange} autoComplete="off" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <button type="submit" className="btn btn-primary w-full">
                                {isEditing ? t('saveChanges') : t('addCustomer')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} variant={confirmDialog.variant} />
        </Modal>
    );
};

export default CustomerManagerModal;
