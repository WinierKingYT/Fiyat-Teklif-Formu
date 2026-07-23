import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { User, Users, Mail, Phone, MapPin, ChevronDown, ChevronUp, Search, Plus } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';
import FieldError from './FieldError';

const CustomerInfoForm = ({ data, onChange, onSelectCustomer }) => {
    const { quoteData, db } = useQuote();
    const { t } = useTranslation(quoteData?.language);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchIndex, setSearchIndex] = useState(-1);
    const [showDetails, setShowDetails] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    const isFilled = data?.name && data?.email;

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

    const createAndSelectCustomer = async () => {
        if (!db || !searchQuery.trim()) return;
        const newCustomer = {
            id: `cust-${Date.now()}`,
            name: searchQuery.trim(),
            company: data.company || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            createdAt: new Date().toISOString(),
        };
        try {
            await db.add('customers', newCustomer);
            selectCustomer(newCustomer);
        } catch (e) {
            console.error('Müşteri oluşturulamadı:', e);
        }
    };

    const selectCustomer = (customer) => {
        onChange('name', customer.name || '');
        onChange('company', customer.company || '');
        onChange('email', customer.email || '');
        onChange('phone', customer.phone || '');
        onChange('address', customer.address || '');
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
        setTouched({});
        setErrors({});
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (!searchResults.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(prev => Math.min(prev + 1, searchResults.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIndex(prev => Math.max(prev - 1, 0)); }
        else if (e.key === 'Enter' && searchIndex >= 0) { e.preventDefault(); selectCustomer(searchResults[searchIndex]); }
        else if (e.key === 'Escape') { setShowDropdown(false); }
    };

    const validateField = (name, value) => {
        if (name === 'name' && !value) return 'Müşteri adı zorunludur';
        if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Geçerli bir e-posta girin';
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name') {
            setSearchQuery(value);
            setShowDropdown(true);
        }
        onChange(name, value);
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (name, value) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const getFieldProps = (name, value, placeholder, extra = {}) => ({
        name,
        value: value || '',
        onChange: handleChange,
        onBlur: () => handleBlur(name, value || ''),
        placeholder,
        className: `form-control${errors[name] && touched[name] ? ' field-error' : ''}`,
        'aria-invalid': touched[name] && !!errors[name],
        'aria-describedby': errors[name] ? `field-${name}-error` : undefined,
        ...extra,
    });

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                        <User size={16} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="card-title">{t('customerInfo')}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isFilled && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowDetails(!showDetails)}
                        >
                            {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            {showDetails ? t('hide') || 'Gizle' : t('details') || 'Detay'}
                        </button>
                    )}
                    <button type="button" className="btn btn-outline btn-sm" onClick={onSelectCustomer}>
                        <Users size={15} />
                        {t('selectCustomer')}
                    </button>
                </div>
            </div>
            <div className="card-body space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative" ref={searchRef}>
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                id="customerName"
                                {...getFieldProps('name', data.name, t('customerName'), { autoComplete: 'off' })}
                                onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <FieldError message={errors.name} show={touched.name && !!errors.name} />
                        {showDropdown && (
                            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg overflow-hidden">
                                {searchResults.length > 0 ? (
                                    searchResults.map((c, idx) => (
                                        <button
                                            key={c.id || idx}
                                            type="button"
                                            onMouseDown={() => selectCustomer(c)}
                                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${
                                                idx === searchIndex
                                                    ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                                                    : 'text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'
                                            }`}
                                        >
                                            <div className="w-7 h-7 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center flex-shrink-0">
                                                <User size={13} className="text-[var(--color-text-muted)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{c.name}</div>
                                                {c.company && <div className="text-xs text-[var(--color-text-muted)] truncate">{c.company}</div>}
                                            </div>
                                            {c.phone && <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">{c.phone}</span>}
                                        </button>
                                    ))
                                ) : searchQuery.length >= 2 ? (
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                        onMouseDown={createAndSelectCustomer}
                                    >
                                        <div className="w-7 h-7 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center flex-shrink-0">
                                            <Plus size={13} className="text-[var(--color-primary)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-[var(--color-primary)]">
                                                "{searchQuery}" müşterisini oluştur
                                            </div>
                                            <div className="text-xs text-[var(--color-text-muted)]">
                                                Yeni müşteri kaydı oluşturulacak
                                            </div>
                                        </div>
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </div>
                    <div>
                        <input
                            type="text"
                            id="customerCompany"
                            {...getFieldProps('company', data.company, t('company'), { autoComplete: 'organization' })}
                        />
                        <FieldError message={errors.company} show={touched.company && !!errors.company} />
                    </div>
                </div>

                {(!isFilled || showDetails) && (
                    <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                                <input
                                    type="email"
                                    id="customerEmail"
                                    {...getFieldProps('email', data.email, t('email'), { autoComplete: 'email' })}
                                />
                                <FieldError message={errors.email} show={touched.email && !!errors.email} />
                            </div>
                            <div className="relative">
                                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                                <input
                                    type="tel"
                                    id="customerPhone"
                                    {...getFieldProps('phone', data.phone, t('phone'), { autoComplete: 'tel' })}
                                />
                                <FieldError message={errors.phone} show={touched.phone && !!errors.phone} />
                            </div>
                        </div>
                        <div className="relative">
                            <MapPin size={15} className="absolute left-3 top-4 text-[var(--color-text-muted)] pointer-events-none" />
                            <textarea
                                id="customerAddress"
                                {...getFieldProps('address', data.address, t('address'))}
                                rows={2}
                                autoComplete="street-address"
                            />
                            <FieldError message={errors.address} show={touched.address && !!errors.address} />
                        </div>
                    </div>
                )}

                {!isFilled && (
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 pt-0.5">
                        <Search size={12} />
                        İsim yazmaya başlayın — kayıtlı müşteriler otomatik önerilir
                    </p>
                )}
            </div>
        </div>
    );
};

export default CustomerInfoForm;
