import { PenTool } from 'lucide-react';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import ImageOptimizer from '@/utils/imageOptimizer';
import type { PdfConfig } from '@/context/quote/types';

interface PdfTextsTabProps {
    pdfConfig: PdfConfig;
    handleConfigChange: (key: string, value: unknown) => void;
    t: (key: string) => string;
    signature: string | null;
    setSignature: React.Dispatch<React.SetStateAction<string | null>>;
}

const PdfTextsTab: React.FC<PdfTextsTabProps> = ({
    pdfConfig,
    handleConfigChange,
    t,
    signature,
    setSignature
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const optimizer = new ImageOptimizer();
            await optimizer.validateImage(file);
            const optimized = await optimizer.optimizeImage(file, true);
            setSignature(optimized);
            toast.success(t('signatureUpdated') || 'İmza güncellendi');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'İmza yüklenirken hata oluştu');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveSignature = () => {
        setSignature(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('tableHeaders')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('itemHeader')}</label>
                        <input
                            type="text"
                            value={pdfConfig.textItem || ''}
                            onChange={(e) => handleConfigChange('textItem', e.target.value)}
                            placeholder={t('item')}
                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('descriptionHeader')}</label>
                        <input
                            type="text"
                            value={pdfConfig.textDescription || ''}
                            onChange={(e) => handleConfigChange('textDescription', e.target.value)}
                            placeholder={t('description')}
                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('unit') || 'Birim'}</label>
                        <input
                            type="text"
                            value={pdfConfig.textUnit || ''}
                            onChange={(e) => handleConfigChange('textUnit', e.target.value)}
                            placeholder={t('unit') || 'Birim'}
                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('quantity')}</label>
                        <input
                            type="text"
                            value={pdfConfig.textQuantity || ''}
                            onChange={(e) => handleConfigChange('textQuantity', e.target.value)}
                            placeholder={t('quantity')}
                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('unitPrice')}</label>
                        <input
                            type="text"
                            value={pdfConfig.textUnitPrice || ''}
                            onChange={(e) => handleConfigChange('textUnitPrice', e.target.value)}
                            placeholder={t('unitPrice')}
                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('discount') || 'İskonto'}</label>
                        <input
                            type="text"
                            value={pdfConfig.textDiscount || ''}
                            onChange={(e) => handleConfigChange('textDiscount', e.target.value)}
                            placeholder={t('discount') || 'İskonto'}
                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('tax') || 'KDV'}</label>
                        <input
                            type="text"
                            value={pdfConfig.textVat || ''}
                            onChange={(e) => handleConfigChange('textVat', e.target.value)}
                            placeholder={t('tax') || 'KDV'}
                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('total')}</label>
                        <input
                            type="text"
                            value={pdfConfig.textTotal || ''}
                            onChange={(e) => handleConfigChange('textTotal', e.target.value)}
                            placeholder={t('total')}
                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        />
                    </div>
                </div>
            </div>

            {/* Custom Footer */}
            <div className="pt-3 border-t border-[var(--color-border)]">
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                    {t('footer')}
                </label>
                <input
                    type="text"
                    value={pdfConfig.customFooter || ''}
                    onChange={(e) => handleConfigChange('customFooter', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                    placeholder={t('footer')}
                />
            </div>

            {/* Digital Signature */}
            <div className="pt-3 border-t border-[var(--color-border)] space-y-3">
                <h4 className="font-semibold text-xs text-[var(--color-text)]">{t('digitalSignature')}</h4>
                {signature ? (
                    <div className="space-y-2">
                        <div className="border border-[var(--color-border)] rounded p-4 bg-[var(--color-bg-card)] flex justify-center items-center h-28">
                            <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                        </div>
                        <button type="button"
                            onClick={handleRemoveSignature}
                            className="w-full py-1.5 text-xs text-[var(--color-error)] hover:text-[var(--color-error)] font-medium border border-[var(--color-border)] hover:border-[var(--color-error)] rounded bg-[var(--color-error)]/10 transition-colors"
                        >
                            {t('removeSignature')}
                        </button>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-[var(--color-info)] transition-colors bg-[var(--color-bg-muted)]/50">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                            className="hidden"
                            id="signature-upload"
                        />
                        <label
                            htmlFor="signature-upload"
                            className="cursor-pointer flex flex-col items-center gap-1.5"
                        >
                            <PenTool size={20} className="text-[var(--color-info)]" />
                            <span className="text-xs font-medium text-[var(--color-text)]">
                                {t('uploadSignature')}
                            </span>
                        </label>
                    </div>
                )}
                <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs border border-[var(--color-border)] mt-2">
                    <span className="text-[var(--color-text)]">{t('customerSignature')}</span>
                    <input
                        type="checkbox"
                        checked={Boolean(pdfConfig.showCustomerSignature)}
                        onChange={(e) => handleConfigChange('showCustomerSignature', e.target.checked)}
                        className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                    />
                </label>
            </div>
        </div>
    );
};

export default PdfTextsTab;
