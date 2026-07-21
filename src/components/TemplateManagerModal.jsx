import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Trash2, Save, FileInput, Check, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuote } from '../context/QuoteContext';

const TemplateManagerModal = ({ isOpen, onClose }) => {
    const { db } = useIndexedDB();
    const {
        quoteData, customerData, companyData, items, discountRate,
        updateQuoteData, updateCustomerData, updateCompanyData, setItems, setDiscountRate
    } = useQuote();

    const [templates, setTemplates] = useState([]);
    const [templateName, setTemplateName] = useState('');

    useEffect(() => {
        if (isOpen && db) {
            loadTemplates();
        }
    }, [isOpen, db]);

    const loadTemplates = async () => {
        const allTemplates = await db.getAll('templates');
        setTemplates(allTemplates);
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            toast.error('Lütfen şablon adı girin.');
            return;
        }

        const template = {
            id: Date.now(),
            name: templateName,
            createdAt: new Date().toISOString(),
            data: {
                quoteData,
                customerData,
                companyData,
                items,
                discountRate
            }
        };

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
        if (window.confirm(`"${template.name}" şablonunu yüklemek istediğinize emin misiniz? Mevcut veriler silinecektir.`)) {
            const { data } = template;

            // Load all data
            if (data.quoteData) Object.entries(data.quoteData).forEach(([k, v]) => updateQuoteData(k, v));
            if (data.customerData) Object.entries(data.customerData).forEach(([k, v]) => updateCustomerData(k, v));
            if (data.companyData) Object.entries(data.companyData).forEach(([k, v]) => updateCompanyData(k, v));
            if (data.items) setItems(data.items);
            if (data.discountRate) setDiscountRate(data.discountRate);

            toast.success('Şablon başarıyla yüklendi');
            onClose();
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (window.confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
            try {
                await db.delete('templates', id);
                toast.success('Şablon silindi');
                loadTemplates();
            } catch (error) {
                console.error(error);
                toast.error('Silinirken hata oluştu');
            }
        }
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

                // Generate new ID to avoid conflicts
                const newTemplate = {
                    ...importedTemplate,
                    id: Date.now(),
                    name: `${importedTemplate.name} (İçe Aktarıldı)`
                };

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

                {/* Save Current as Template */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <Save size={18} /> Mevcut Teklifi Şablon Olarak Kaydet
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="form-control"
                            id="templateName"
                            name="templateName"
                            placeholder="Şablon Adı (Örn: Standart Web Tasarım Teklifi)"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            autoComplete="off"
                        />
                        <button className="btn btn-primary whitespace-nowrap" onClick={handleSaveTemplate}>
                            Kaydet
                        </button>
                    </div>
                </div>

                {/* Template List */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Kayıtlı Şablonlar</h3>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={() => document.getElementById('importTemplateInput').click()}
                                title="Şablon İçe Aktar"
                            >
                                <Upload size={14} /> İçe Aktar
                            </button>
                            <input
                                type="file"
                                id="importTemplateInput"
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={handleImportTemplate}
                            />
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {templates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                <p>Henüz kayıtlı şablon yok.</p>
                            </div>
                        ) : (
                            templates.map(template => (
                                <div key={template.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-slate-100">{template.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(template.createdAt).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-sm btn-outline text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-900"
                                            onClick={() => handleLoadTemplate(template)}
                                            title="Şablonu Yükle"
                                        >
                                            <FileInput size={16} /> Yükle
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900"
                                            onClick={() => handleDeleteTemplate(template.id)}
                                            title="Şablonu Sil"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-900"
                                            onClick={() => handleExportTemplate(template)}
                                            title="Dışa Aktar"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default TemplateManagerModal;
