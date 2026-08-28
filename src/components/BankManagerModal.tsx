import { Plus, Trash, Edit, Save } from 'lucide-react';
import React from 'react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import Logger from '@/utils/logger';
import type { BankData } from '@/context/quote/types';

interface StoredBank extends BankData {
    id: number;
}

interface BankManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (bank: StoredBank) => void;
    language?: string;
}

const BankManagerModal = ({ isOpen, onClose, onSelect, language = 'tr' }: BankManagerModalProps) => {
    const { t } = useTranslation();
    const { db } = useIndexedDB();
    const [banks, setBanks] = useState<StoredBank[]>([]);
    const [editingBank, setEditingBank] = useState<StoredBank | null>(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const [formData, setFormData] = useState({
        bankName: '',
        branch: '',
        accountNumber: '',
        iban: '',
        accountHolder: ''
    });

    useEffect(() => {
        if (isOpen && db) {
            loadBanks();
        }
    }, [isOpen, db]);

    const loadBanks = async () => {
        try {
            const result = await (db).getAll<StoredBank>('bankInfo');
            setBanks(result);
        } catch (error) {
            Logger.error('Error loading banks:', error);
            toast.error(t('bankLoadError'));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const finalValue = name === 'iban' ? value.replace(/\s+/g, '').toUpperCase() : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const cleanedData = {
                bankName: formData.bankName.trim(),
                branch: formData.branch.trim(),
                accountNumber: formData.accountNumber.trim(),
                iban: formData.iban.replace(/\s+/g, '').toUpperCase(),
                accountHolder: formData.accountHolder.trim()
            };

            if (editingBank) {
                await db.put('bankInfo', { ...cleanedData, id: editingBank.id });
                toast.success(t('bankUpdated'));
            } else {
                await db.add('bankInfo', { ...cleanedData, id: Date.now() });
                toast.success(t('bankAdded'));
            }
            handleCancelEdit();
            loadBanks();
        } catch (error) {
            Logger.error('Error saving bank:', error);
            toast.error(t('bankSaveError'));
        }
    };

    const handleEdit = (bank: StoredBank) => {
        setEditingBank(bank);
        setFormData({ bankName: bank.bankName ?? '', branch: bank.branch ?? '', accountNumber: bank.accountNumber ?? '', iban: bank.iban ?? '', accountHolder: bank.accountHolder ?? '' });
    };

    const handleDelete = async (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: t('deleteBank'),
            message: t('deleteBankConfirm'),
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
                try {
                    const bankToDelete = banks.find(b => b.id === id);
                    if (bankToDelete) {
                        await db.moveToRecycleBin('bankInfo', id, bankToDelete, { deletedBy: 'user' });
                    }
                    toast.success(t('bankDeleted'));
                    loadBanks();
                    if (editingBank?.id === id) {
                        handleCancelEdit();
                    }
                } catch (error) {
                    Logger.error('Error deleting bank:', error);
                    toast.error(t('bankDeleteError'));
                }
            },
            variant: 'danger'
        });
    };

    const handleSelect = (bank: StoredBank) => {
        if (onSelect) {
            onSelect(bank);
            onClose();
        }
    };

    const handleCancelEdit = () => {
        setEditingBank(null);
        setFormData({
            bankName: '',
            branch: '',
            accountNumber: '',
            iban: '',
            accountHolder: ''
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('bankManagement')} size="xl">
            <div className="flex flex-col md:flex-row gap-6 h-[70vh]">

                {/* Left: List */}
                <div className="w-full md:w-1/2 flex flex-col border-r border-[var(--color-border)] pr-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-[var(--color-text)]">{t('savedBanks')}</h4>
                        <button type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleCancelEdit}
                            title={t('addNewBank')}
                        >
                            <Plus size={16} /> {t('new') || 'Yeni'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {banks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-lg">
                                <p>{t('noBanksYet')}</p>
                            </div>
                        ) : (
                            banks.map(bank => (
                                <div
                                    key={bank.id}
                                    className={`p-4 border rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group cursor-pointer ${editingBank?.id === bank.id
                                            ? 'bg-[var(--color-bg-hover)] border-[var(--color-primary)]'
                                            : 'border-[var(--color-border)]'
                                        }`}
                                    onClick={() => handleSelect(bank)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h5 className="font-semibold text-[var(--color-text)]">{bank.bankName}</h5>
                                            <p className="text-sm text-[var(--color-text-secondary)]">{bank.branch} - {bank.accountHolder}</p>
                                            <p className="text-xs font-mono mt-1 text-[var(--color-text-muted)]">{bank.iban}</p>
                                        </div>
                                        <div className="flex gap-2 ml-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                className="p-2 text-[var(--color-info)] hover:bg-[var(--color-primary-muted)] rounded-full transition-colors"
                                                onClick={(e) => { e.stopPropagation(); handleEdit(bank); }}
                                                aria-label={`${t('editBank')}: ${bank.bankName || ''}`}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-full transition-colors"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(bank.id); }}
                                                aria-label={`${t('deleteBank')}: ${bank.bankName || ''}`}
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Form */}
                <div className="w-full md:w-1/2 pl-2 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-[var(--color-text)]">
                            {editingBank ? t('editBank') : t('addNewBank')}
                        </h4>
                        {editingBank && (
                            <button type="button" className="btn btn-sm btn-ghost text-[var(--color-text-muted)]" onClick={handleCancelEdit}>
                                {t('cancelEdit')}
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="form-label">{t('bankName')}</label>
                            <input
                                type="text"
                                className="form-control"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">{t('branch')}</label>
                            <input
                                type="text"
                                className="form-control"
                                name="branch"
                                value={formData.branch}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="form-label">{t('accountNumber')}</label>
                            <input
                                type="text"
                                className="form-control"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="form-label">{t('iban')}</label>
                            <input
                                type="text"
                                className="form-control"
                                name="iban"
                                value={formData.iban}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">{t('accountHolder')}</label>
                            <input
                                type="text"
                                className="form-control"
                                name="accountHolder"
                                value={formData.accountHolder}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="btn btn-primary w-full">
                                {editingBank ? <Save size={16} /> : <Plus size={16} />}
                                {editingBank ? t('saveChanges') : t('addBank')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} variant={confirmDialog.variant} />
        </Modal>
    );
};

export default BankManagerModal;
