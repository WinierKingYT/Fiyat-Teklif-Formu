import React, { useState, useEffect, useRef } from 'react';
import { User, Users, Mail, Phone, MapPin } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';

const CustomerInfoForm = ({ data, onChange, onSelectCustomer }) => {
    const { quoteData, db } = useQuote();
    const { t } = useTranslation(quoteData?.language);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchIndex, setSearchIndex] = useState(-1);
    const searchRef = useRef(null);

    useEffect(() => {
        if (!db || searchQuery.length < 2) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            try {
                const all = await db.getAll('customers');
                const q = searchQuery.toLowerCase();
                const filtered = all.filter(c =>
                    (c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
                );
                setSearchResults(filtered.slice(0, 8));
                setSearchIndex(-1);
            } catch (e) { setSearchResults([]); }
        }, 200);
        return () => clearTimeout(timer);
    }, [searchQuery, db]);

    const selectCustomer = (customer) => {
        onChange('name', customer.name || '');
        onChange('company', customer.company || '');
        onChange('email', customer.email || '');
        onChange('phone', customer.phone || '');
        onChange('address', customer.address || '');
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    const handleKeyDown = (e) => {
        if (!searchResults.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(prev => Math.min(prev + 1, searchResults.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIndex(prev => Math.max(prev - 1, 0)); }
        else if (e.key === 'Enter' && searchIndex >= 0) { e.preventDefault(); selectCustomer(searchResults[searchIndex]); }
        else if (e.key === 'Escape') { setShowDropdown(false); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name') {
            setSearchQuery(value);
            setShowDropdown(true);
        }
        onChange(name, value);
    };

    const isFilled = data?.name && data?.email;
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="form-section">
            <div className="section-header">
                <h3 className="section-title">
                    <User size={20} />
                    {t('customerInfo')}
                </h3>
                <div className="flex gap-2">
                    {isFilled && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowDetails(!showDetails)}>
                            {showDetails ? 'Gizle' : 'Detay'}
                        </button>
                    )}
                    <button type="button" className="btn btn-outline btn-sm" onClick={onSelectCustomer}>
                        <Users size={16} />
                        {t('selectCustomer')}
                    </button>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group floating-label-group relative" ref={searchRef}>
                    <input
                        type="text"
                        className="form-control"
                        id="customerName"
                        name="name"
                        value={data.name || ''}
                        onChange={handleChange}
                        onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        onKeyDown={handleKeyDown}
                        placeholder=" "
                        autoComplete="off"
                    />
                    <label className="form-label" htmlFor="customerName">{t('customerName')}</label>
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg max-h-48 overflow-y-auto">
                            {searchResults.map((c, idx) => (
                                <button
                                    key={c.id || idx}
                                    type="button"
                                    onMouseDown={() => selectCustomer(c)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-bg-hover)] ${idx === searchIndex ? 'bg-[var(--color-bg-muted)]' : ''}`}
                                >
                                    <div className="w-7 h-7 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center flex-shrink-0">
                                        <User size={13} className="text-[var(--color-primary)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-[var(--color-text)] truncate">{c.name}</div>
                                        {c.company && <div className="text-xs text-[var(--color-text-muted)] truncate">{c.company}</div>}
                                    </div>
                                    {c.phone && <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">{c.phone}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="form-group floating-label-group">
                    <input
                        type="text"
                        className="form-control"
                        id="customerCompany"
                        name="company"
                        value={data.company || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="organization"
                    />
                    <label className="form-label" htmlFor="customerCompany">{t('company')}</label>
                </div>
            </div>

            {(!isFilled || showDetails) && (
                <>
                    <div className="form-row">
                        <div className="form-group floating-label-group">
                            <input type="email" className="form-control" id="customerEmail" name="email" value={data.email || ''} onChange={handleChange} placeholder=" " autoComplete="email" />
                            <label className="form-label" htmlFor="customerEmail"><span className="flex items-center gap-1"><Mail size={14} /> {t('email')}</span></label>
                        </div>
                        <div className="form-group floating-label-group">
                            <input type="tel" className="form-control" id="customerPhone" name="phone" value={data.phone || ''} onChange={handleChange} placeholder=" " autoComplete="tel" />
                            <label className="form-label" htmlFor="customerPhone"><span className="flex items-center gap-1"><Phone size={14} /> {t('phone')}</span></label>
                        </div>
                    </div>
                    <div className="form-group floating-label-group">
                        <textarea className="form-control" id="customerAddress" name="address" value={data.address || ''} onChange={handleChange} placeholder=" " rows="2" autoComplete="street-address"></textarea>
                        <label className="form-label" htmlFor="customerAddress"><span className="flex items-center gap-1"><MapPin size={14} /> {t('address')}</span></label>
                    </div>
                </>
            )}

            {!isFilled && (
                <div className="px-4 pb-3">
                    <p className="text-xs text-[var(--color-text-muted)]">
                        İsim yazmaya başlayın — kayıtlı müşteriler otomatik önerilir.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CustomerInfoForm;
