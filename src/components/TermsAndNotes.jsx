import React, { useState } from 'react';
import { ScrollText, FileText, Truck, Shield, StickyNote, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';

const fields = [
    { id: 'terms', icon: FileText, labelKey: 'paymentTerms' },
    { id: 'deliveryTerms', icon: Truck, labelKey: 'deliveryTerms' },
    { id: 'warrantyTerms', icon: Shield, labelKey: 'warrantyTerms' },
    { id: 'notes', icon: StickyNote, labelKey: 'extraNotes' },
];

const TermsAndNotes = ({ data, onChange }) => {
    const { quoteData } = useQuote();
    const { t } = useTranslation(quoteData?.language);
    const [showAll, setShowAll] = useState(false);

    const hasAnyContent = fields.some(f => data[f.id]);
    const isExpanded = hasAnyContent || showAll;

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                        <ScrollText size={16} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="card-title">{t('conditionsAndNotes')}</span>
                </div>
                <div className="flex items-center gap-2">
                    {hasAnyContent && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)}>
                            {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {showAll ? 'Gizle' : 'Detay'}
                        </button>
                    )}
                    {!hasAnyContent && !showAll && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAll(true)}>
                            <Plus size={16} /> Ekle
                        </button>
                    )}
                </div>
            </div>
            <div className="card-body">
                {!isExpanded ? (
                    <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                        {t('addTermsHint') || 'Ödeme koşulları, teslimat ve garanti şartlarını buraya ekleyin.'}
                    </p>
                ) : (
                    <div className="space-y-3.5">
                        {fields.map(field => {
                            const Icon = field.icon;
                            return (
                                <div key={field.id}>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] mb-1.5" htmlFor={field.id}>
                                        <Icon size={15} className="text-[var(--color-primary)]" />
                                        {t(field.labelKey)}
                                    </label>
                                    <textarea
                                        className="form-control"
                                        id={field.id}
                                        name={field.id}
                                        value={data[field.id] || ''}
                                        onChange={handleChange}
                                        placeholder={t(field.labelKey)}
                                        rows="3"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TermsAndNotes;