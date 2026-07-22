import React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Plus, Trash, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const BankManagerModal = ({ isOpen, onClose, onSelect }) => {
    const { db } = useIndexedDB();
    const [banks, setBanks] = useState([]);
    const [editingBank, setEditingBank] = useState(null);
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
            const result = await db.getAll('bankInfo');
            setBanks(result);
        } catch (error) {
            console.error('Error loading banks:', error);
            toast.error('Bankalar yüklenirken hata oluştu');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBank) {
                await db.put('bankInfo', { ...formData, id: editingBank.id });
                toast.success('Banka güncellendi');
            } else {
                await db.add('bankInfo', formData);
                toast.success('Banka eklendi');
            }
            setFormData({
                bankName: '',
                branch: '',
                accountNumber: '',
                iban: '',
                accountHolder: ''
            });
            setEditingBank(null);
            loadBanks();
        } catch (error) {
            console.error('Error saving bank:', error);
            toast.error('Banka kaydedilirken hata oluştu');
        }
    };

    const handleEdit = (bank) => {
        setEditingBank(bank);
        setFormData(bank);
    };

    const handleDelete = async (id) => {
        setConfirmDialog({ isOpen: true, title: 'Bankayı Sil', message: 'Bu bankayı silmek istediğinizden emin misiniz?', onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { await db.delete('bankInfo', id); toast.success('Banka silindi'); loadBanks(); } catch (error) { console.error('Error deleting bank:', error); toast.error('Banka silinirken hata oluştu'); } }, variant: 'danger' });
    };

    const handleSelect = (bank) => {
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
        <Modal isOpen={isOpen} onClose={onClose} title="Banka Yönetimi" size="xl">
            <div className="flex flex-col md:flex-row gap-6 h-[70vh]">

                {/* Left: List */}
                <div className="w-full md:w-1/2 flex flex-col border-r border-[var(--color-border)] pr-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-[var(--color-text)]">Kayıtlı Bankalar</h4>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleCancelEdit}
                            title="Yeni Banka Ekle"
                        >
                            <Plus size={16} /> Yeni
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {banks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-lg">
                                <p>Henüz kayıtlı banka bulunmuyor.</p>
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
                                                className="p-2 text-[var(--color-info)] hover:bg-[var(--color-primary-muted)] rounded-full transition-colors"
                                                onClick={(e) => { e.stopPropagation(); handleEdit(bank); }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-full transition-colors"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(bank.id); }}
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
                            {editingBank ? 'Bankayı Düzenle' : 'Yeni Banka Ekle'}
                        </h4>
                        {editingBank && (
                            <button className="btn btn-sm btn-ghost text-[var(--color-text-muted)]" onClick={handleCancelEdit}>
                                Vazgeç
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="form-label">Banka Adı</label>
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
                            <label className="form-label">Şube</label>
                            <input
                                type="text"
                                className="form-control"
                                name="branch"
                                value={formData.branch}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="form-label">Hesap No</label>
                            <input
                                type="text"
                                className="form-control"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="form-label">IBAN</label>
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
                            <label className="form-label">Hesap Sahibi</label>
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
                                {editingBank ? 'Değişiklikleri Kaydet' : 'Bankayı Ekle'}
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
