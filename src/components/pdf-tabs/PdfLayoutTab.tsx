import React from 'react';
import PdfSectionsTab from './PdfSectionsTab';
import type { PdfConfig } from '@/context/quote/types';

interface PdfLayoutTabProps {
    pdfConfig: PdfConfig;
    handleConfigChange: (key: string, value: unknown) => void;
    t: (key: string) => string;
}

const PdfLayoutTab: React.FC<PdfLayoutTabProps> = ({
    pdfConfig,
    handleConfigChange,
    t
}) => {
    return (
        <div className="space-y-4">
            <PdfSectionsTab pdfConfig={pdfConfig} handleConfigChange={handleConfigChange} t={t} />

            {/* Spacing & Margins */}
            <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('spacing')}</h4>
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('pageMargin')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { val: 'compact', label: t('marginCompact') || 'Dar' },
                            { val: 'normal', label: t('marginNormal') || 'Normal' },
                            { val: 'wide', label: t('marginWide') || 'Geniş' }
                        ].map(opt => (
                            <button type="button"
                                key={opt.val}
                                onClick={() => handleConfigChange('margins', opt.val)}
                                className={`py-1.5 text-xs rounded border transition-colors ${pdfConfig.margins === opt.val ? 'bg-[var(--color-info)] text-white border-[var(--color-info)]' : 'border-[var(--color-border)] hover:bg-[var(--color-bg-muted)]'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Options */}
            <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('tableStyle')}</h4>
                <div className="space-y-2">
                    <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                        <span className="text-[var(--color-text)]">{t('stripedRows')}</span>
                        <input
                            type="checkbox"
                            checked={pdfConfig.tableStriped}
                            onChange={(e) => handleConfigChange('tableStriped', e.target.checked)}
                            className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                        />
                    </label>
                    {[
                        { key: 'showTableImages', label: t('productImages') },
                        { key: 'showTableUnit', label: t('unitColumn') },
                        { key: 'showTableTax', label: t('vatColumn') }
                    ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                            <span className="text-[var(--color-text)]">{item.label}</span>
                            <input
                                type="checkbox"
                                checked={Boolean((pdfConfig as Record<string, unknown>)[item.key])}
                                onChange={(e) => handleConfigChange(item.key, e.target.checked)}
                                className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                            />
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PdfLayoutTab;
