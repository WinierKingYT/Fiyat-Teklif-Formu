import React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Trash2, Save, FileInput, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Logger from '../utils/logger';
import { useQuoteData } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';

const TemplateManagerModal = ({ isOpen, onClose, language = 'tr' }) => {
    const { t } = useTranslation(language);
    const { db } = useIndexedDB();
    const {
        quoteData, customerData, companyData, items, discount,
        updateQuoteData, updateCustomerData, updateCompanyData, setItems, setDiscount
    } = useQuoteData();

    const [templates, setTemplates] = useState<any[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

    useEffect(() => {
        if (isOpen && db) loadTemplates();
    }, [isOpen, db]);

    const loadTemplates = async () => {
        const allTemplates = await (db).getAll('templates');
        setTemplates(allTemplates);
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) { toast.error(t('enterTemplateName')); return; }
        const template = { id: Date.now(), name: templateName, createdAt: new Date().toISOString(), data: { quoteData, customerData, companyData, items, discount } };
        try {
            await db.add('templates', template);
            toast.success(t('templateSaved'));
            setTemplateName('');
            loadTemplates();
        } catch (error) {
            Logger.error(error);
            toast.error(t('templateSaveError'));
        }
    };

    const handleLoadTemplate = (template) => {
        setConfirmDialog({ isOpen: true, title: t('loadTemplateTitle'), message: t('loadTemplateConfirm').replace('{name}', template.name), onConfirm: () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); const { data } = template; if (data.quoteData) Object.entries(data.quoteData).forEach(([k, v]) => updateQuoteData(k, v)); if (data.customerData) Object.entries(data.customerData).forEach(([k, v]) => updateCustomerData(k, v)); if (data.companyData) Object.entries(data.companyData).forEach(([k, v]) => updateCompanyData(k, v)); if (data.items) setItems(data.items); if (data.discount) setDiscount(data.discount); else if (data.discountRate) setDiscount({ type: 'percentage', value: data.discountRate }); toast.success(t('templateLoaded')); onClose(); }, variant: 'warning' });
    };

    const handleDeleteTemplate = async (id) => {
        setConfirmDialog({ isOpen: true, title: t('deleteTemplateTitle'), message: t('deleteTemplateConfirm'), onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { await db.delete('templates', id); toast.success(t('templateDeleted')); loadTemplates(); } catch (error) { Logger.error(error);
                toast.error(t('templateDeleteError')); } }, variant: 'danger' });
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
            toast.success(t('templateExported'));
        } catch (error) {
            Logger.error('Export error:', error);
            toast.error(t('templateExportError'));
        }
    };

    const handleImportTemplate = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedTemplate = JSON.parse((e.target as any).result);
                if (!importedTemplate.data || !importedTemplate.name) throw new Error('Invalid template format');
                const newTemplate = { ...importedTemplate, id: Date.now(), name: `${importedTemplate.name} (İçe Aktarıldı)` };
                await db.add('templates', newTemplate);
                toast.success(t('templateImported'));
                loadTemplates();
            } catch (error) {
                Logger.error('Import error:', error);
                toast.error(t('templateImportError'));
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('templateManagement')} size="lg">
            <div className="space-y-6">
                <div className="bg-[var(--color-bg-muted)] p-4 rounded-[var(--radius)] border border-[var(--color-border)]">
                    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2 flex items-center gap-2">
                        <Save size={16} className="text-[var(--color-primary)]" /> {t('saveAsTemplate')}
                    </h3>
                    <div className="flex gap-2">
                        <input type="text" className="form-control" placeholder={t('templateNamePlaceholder')} value={templateName} onChange={(e) => setTemplateName(e.target.value)} autoComplete="off" />
                        <button type="button" className="btn btn-primary whitespace-nowrap" onClick={handleSaveTemplate}>{t('save')}</button>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-[var(--color-text)]">{t('savedTemplates')}</h3>
                        <div className="flex gap-2">
                            <button type="button" className="btn btn-sm btn-outline" onClick={() => document.getElementById('importTemplateInput')?.click()} title={t('importTemplate')}>
                                <Upload size={14} /> İçe Aktar
                            </button>
                            <input type="file" id="importTemplateInput" accept=".json" style={{ display: 'none' }} onChange={handleImportTemplate} />
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {templates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-[var(--radius)]">
                                <p>{t('noTemplatesYet')}</p>
                            </div>
                        ) : (
                            templates.map(template => (
                                <div key={template.id} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] transition-colors">
                                    <div>
                                        <div className="font-medium text-[var(--color-text)]">{template.name}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{new Date(template.createdAt).toLocaleDateString('tr-TR')}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" className="btn btn-sm btn-outline" onClick={() => handleLoadTemplate(template)} title={t('loadTemplate')}>
                                            <FileInput size={14} /> Yükle
                                        </button>
                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteTemplate(template.id)} title={t('deleteTemplate')}>
                                            <Trash2 size={14} />
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline" onClick={() => handleExportTemplate(template)} title={t('exportTemplate')}>
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
