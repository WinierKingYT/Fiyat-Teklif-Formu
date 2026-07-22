import React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Trash2, Save, FileInput, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuote } from '../context/QuoteContext';

const TemplateManagerModal = ({ isOpen, onClose }) => {
    const { db } = useIndexedDB();
    const {
        quoteData, customerData, companyData, items, discount,
        updateQuoteData, updateCustomerData, updateCompanyData, setItems, setDiscount
    } = useQuote();

    const [templates, setTemplates] = useState([]);
    const [templateName, setTemplateName] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

    useEffect(() => {
        if (isOpen && db) loadTemplates();
    }, [isOpen, db]);

    const loadTemplates = async () => {
        const allTemplates = await db.getAll('templates');
        setTemplates(allTemplates);
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) { toast.error('Lütfen şablon adı girin.'); return; }
        const template = { id: Date.now(), name: templateName, createdAt: new Date().toISOString(), data: { quoteData, customerData, companyData, items, discount } };
        try {
            await db.add('templates', template);
            toast.success('Şablon kaydedildi');
            setTemplateName('');
            loadTemplates();
        } catch (error) {
            console.error(error);
            toast.error('Şablon kaydedilirken hata oluştu');
        }
    };

    const handleLoadTemplate = (template) => {
        setConfirmDialog({ isOpen: true, title: 'Şablon Yükle', message: `"${template.name}" şablonunu yüklemek istediğinize emin misiniz? Mevcut veriler silinecektir.`, onConfirm: () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); const { data } = template; if (data.quoteData) Object.entries(data.quoteData).forEach(([k, v]) => updateQuoteData(k, v)); if (data.customerData) Object.entries(data.customerData).forEach(([k, v]) => updateCustomerData(k, v)); if (data.companyData) Object.entries(data.companyData).forEach(([k, v]) => updateCompanyData(k, v)); if (data.items) setItems(data.items); if (data.discount) setDiscount(data.discount); else if (data.discountRate) setDiscount({ type: 'percentage', value: data.discountRate }); toast.success('Şablon başarıyla yüklendi'); onClose(); }, variant: 'warning' });
    };

    const handleDeleteTemplate = async (id) => {
        setConfirmDialog({ isOpen: true, title: 'Şablonu Sil', message: 'Bu şablonu silmek istediğinize emin misiniz?', onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { await db.delete('templates', id); toast.success('Şablon silindi'); loadTemplates(); } catch (error) { console.error(error); toast.error('Silinirken hata oluştu'); } }, variant: 'danger' });
    };

    const handleExportTemplate = (template) => {
        try {
            const dataStr = JSON.stringify(template, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sablon_${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Şablon dışa aktarıldı');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Dışa aktarma hatası');
        }
    };

    const handleImportTemplate = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedTemplate = JSON.parse(e.target.result);
                if (!importedTemplate.data || !importedTemplate.name) throw new Error('Geçersiz şablon formatı');
                const newTemplate = { ...importedTemplate, id: Date.now(), name: `${importedTemplate.name} (İçe Aktarıldı)` };
                await db.add('templates', newTemplate);
                toast.success('Şablon içe aktarıldı');
                loadTemplates();
            } catch (error) {
                console.error('Import error:', error);
                toast.error('İçe aktarma hatası: Geçersiz dosya');
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Şablon Yönetimi" size="lg">
            <div className="space-y-6">
                <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] border border-[var(--color-border)]">
                    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2 flex items-center gap-2">
                        <Save size={16} className="text-[var(--color-primary)]" /> Mevcut Teklifi Şablon Olarak Kaydet
                    </h3>
                    <div className="flex gap-2">
                        <input type="text" className="form-control" placeholder="Şablon Adı (Örn: Standart Web Tasarım Teklifi)" value={templateName} onChange={(e) => setTemplateName(e.target.value)} autoComplete="off" />
                        <button className="btn btn-primary whitespace-nowrap" onClick={handleSaveTemplate}>Kaydet</button>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-[var(--color-text)]">Kayıtlı Şablonlar</h3>
                        <div className="flex gap-2">
                            <button className="btn btn-sm btn-outline" onClick={() => document.getElementById('importTemplateInput').click()} title="Şablon İçe Aktar">
                                <Upload size={14} /> İçe Aktar
                            </button>
                            <input type="file" id="importTemplateInput" accept=".json" style={{ display: 'none' }} onChange={handleImportTemplate} />
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {templates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-[var(--radius)]">
                                <p>Henüz kayıtlı şablon yok.</p>
                            </div>
                        ) : (
                            templates.map(template => (
                                <div key={template.id} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] transition-colors">
                                    <div>
                                        <div className="font-medium text-[var(--color-text)]">{template.name}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{new Date(template.createdAt).toLocaleDateString('tr-TR')}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn btn-sm btn-outline" onClick={() => handleLoadTemplate(template)} title="Şablonu Yükle">
                                            <FileInput size={14} /> Yükle
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTemplate(template.id)} title="Şablonu Sil">
                                            <Trash2 size={14} />
                                        </button>
                                        <button className="btn btn-sm btn-outline" onClick={() => handleExportTemplate(template)} title="Dışa Aktar">
                                            <Download size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} variant={confirmDialog.variant} />
        </Modal>
    );
};

export default TemplateManagerModal;