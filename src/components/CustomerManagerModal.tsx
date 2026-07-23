import React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Trash2, Edit, Plus, Search, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Logger from '../utils/logger';
import { getLocalDateString } from '../utils/dateUtils';

const CustomerManagerModal = ({ isOpen, onClose }) => {
    const { db } = useIndexedDB();
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        taxOffice: '',
        taxNo: ''
    });

    useEffect(() => {
        if (isOpen && db) {
            loadCustomers();
        }
    }, [isOpen, db]);

    const loadCustomers = async () => {
        const allCustomers = await (db as any).getAll('customers');
        setCustomers(allCustomers);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name && !formData.company) {
            toast.error('Lütfen en azından İsim veya Şirket adı girin.');
            return;
        }

        // Duplicate Check
        if (!isEditing) {
            const isDuplicate = customers.some(c =>
                (formData.company && c.company && c.company.trim().toLowerCase() === formData.company.trim().toLowerCase()) ||
                (formData.email && c.email && c.email.trim().toLowerCase() === formData.email.trim().toLowerCase())
            );

            if (isDuplicate) {
                setConfirmDialog({ isOpen: true, title: 'Mükerrer Müşteri', message: 'Bu isimde veya e-postada bir müşteri zaten kayıtlı. Yine de kaydetmek istiyor musunuz?', onConfirm: () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); performSave(); }, variant: 'warning' });
                return;
            }
        }

        performSave();
    };

    const performSave = async () => {
        try {
            if (isEditing && currentCustomer) {
                await db.put('customers', { ...formData, id: currentCustomer.id });
                toast.success('Müşteri güncellendi');
            } else {
                await db.add('customers', { ...formData, id: Date.now() });
                toast.success('Müşteri eklendi');
            }
            loadCustomers();
            resetForm();
        } catch (error) {
            Logger.error(error);
            toast.error('Bir hata oluştu');
        }
    };

    const handleEdit = (customer) => {
        setCurrentCustomer(customer);
        setFormData({
            name: customer.name || '',
            company: customer.company || '',
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            taxOffice: customer.taxOffice || '',
            taxNo: customer.taxNo || ''
        });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        setConfirmDialog({ isOpen: true, title: 'Müşteriyi Sil', message: 'Bu müşteriyi silmek istediğinize emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)', onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { const customerToDelete = customers.find(c => c.id === id); if (customerToDelete) { await db.add('recycle_bin', { ...customerToDelete, originalStore: 'customers', deletedAt: new Date().toISOString(), originalId: id }); await db.delete('customers', id); toast.success('Müşteri geri dönüşüm kutusuna taşındı'); loadCustomers(); } } catch (error) { Logger.error(error);
                toast.error('Silinirken hata oluştu'); } }, variant: 'danger' });
    };

    const resetForm = () => {
        setFormData({ name: '', company: '', email: '', phone: '', address: '', taxOffice: '', taxNo: '' });
        setIsEditing(false);
        setCurrentCustomer(null);
    };

    const filteredCustomers = customers.filter(c =>
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
            toast.success('Müşteriler dışa aktarıldı');
        } catch (error) {
            Logger.error('Export error:', error);
            toast.error('Dışa aktarma hatası');
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedCustomers = JSON.parse((e.target as any).result);
                if (!Array.isArray(importedCustomers)) throw new Error('Geçersiz format');

                let count = 0;
                for (const customer of importedCustomers) {
                    if (customer.name || customer.company) {
                        await db.add('customers', { ...customer, id: Date.now() + Math.random() });
                        count++;
                    }
                }
                toast.success(`${count} müşteri içe aktarıldı`);
                loadCustomers();
            } catch (error) {
                Logger.error('Import error:', error);
                toast.error('İçe aktarma hatası: Geçersiz dosya formatı');
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Müşteri Yönetimi" size="xl">
            <div className="flex flex-col md:flex-row gap-6 h-[70vh]">

                {/* Left: List */}
                <div className="w-full md:w-1/2 flex flex-col border-r border-[var(--color-border)] pr-4">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-[var(--color-text-muted)]" size={18} />
                            <input
                                type="text"
                                className="form-control pl-10"
                                placeholder="Müşteri Ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            className="btn btn-primary whitespace-nowrap"
                            onClick={resetForm}
                            title="Yeni Müşteri Ekle"
                        >
                            <Plus size={18} /> Yeni
                        </button>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button className="btn btn-outline btn-sm flex-1" onClick={handleExport}>
                            <Download size={14} /> Dışa Aktar
                        </button>
                        <button className="btn btn-outline btn-sm flex-1" onClick={() => document.getElementById('importCustomerInput').click()}>
                            <Upload size={14} /> İçe Aktar
                        </button>
                        <input
                            type="file"
                            id="importCustomerInput"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleImport}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                        {filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                                <p>Müşteri bulunamadı.</p>
                            </div>
                        ) : (
                            filteredCustomers.map(customer => (
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
                                            className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-full transition-colors"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Form */}
                <div className="w-full md:w-1/2 pl-2 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                            {isEditing ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}
                        </h3>
                        {isEditing && (
                            <button className="btn btn-sm btn-ghost text-[var(--color-text-muted)]" onClick={handleCancelEdit}>
                                Vazgeç
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-group">
                            <label className="form-label" htmlFor="customerCompany">Firma Adı</label>
                            <input type="text" className="form-control" id="customerCompany" name="company" value={formData.company} onChange={handleInputChange} autoComplete="off" />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="customerName">Yetkili Kişi</label>
                            <input type="text" className="form-control" id="customerName" name="name" value={formData.name} onChange={handleInputChange} autoComplete="off" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="customerPhone">Telefon</label>
                                <input type="tel" className="form-control" id="customerPhone" name="phone" value={formData.phone} onChange={handleInputChange} autoComplete="off" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="customerEmail">E-posta</label>
                                <input type="email" className="form-control" id="customerEmail" name="email" value={formData.email} onChange={handleInputChange} autoComplete="off" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="customerAddress">Adres</label>
                            <textarea className="form-control" id="customerAddress" rows={2} name="address" value={formData.address} onChange={handleInputChange} autoComplete="off"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="customerTaxOffice">Vergi Dairesi</label>
                                <input type="text" className="form-control" id="customerTaxOffice" name="taxOffice" value={formData.taxOffice} onChange={handleInputChange} autoComplete="off" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="customerTaxNo">Vergi No</label>
                                <input type="text" className="form-control" id="customerTaxNo" name="taxNo" value={formData.taxNo} onChange={handleInputChange} autoComplete="off" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <button type="submit" className="btn btn-primary w-full">
                                {isEditing ? 'Değişiklikleri Kaydet' : 'Müşteriyi Ekle'}
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
