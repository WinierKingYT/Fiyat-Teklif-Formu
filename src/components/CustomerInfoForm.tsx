import { zodResolver } from '@hookform/resolvers/zod';
import { User, Users, Mail, Phone, MapPin, ChevronDown, ChevronUp, Search, Plus, Clock } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { InputField, TextAreaField } from '@/components/ui';
import { useQuoteData } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';
import Logger from '@/utils/logger';
import type { CustomerData } from '@/context/quote/types';

const createCustomerInfoSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('customerNameRequired') || 'Müşteri adı zorunludur'),
  company: z.string().optional(),
  email: z.string().optional().refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    t('invalidEmail') || 'Geçerli bir e-posta girin'
  ),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CustomerInfoFormData = z.infer<ReturnType<typeof createCustomerInfoSchema>>;

interface CustomerInfoFormProps {
  data: Partial<CustomerData>;
  onChange: (name: string, value: string) => void;
  onSelectCustomer: () => void;
}

const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({ data, onChange, onSelectCustomer }) => {
  const { quoteData, db, setCustomerData } = useQuoteData();
  const { t } = useTranslation(quoteData?.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<CustomerData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [showDetails, setShowDetails] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => createCustomerInfoSchema(t), [t]);

  const {
    register,
    reset,
    formState: { errors },
  } = useForm<CustomerInfoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data.name || '',
      company: data.company || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    reset({
      name: data.name || '',
      company: data.company || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
    });
  }, [data.name, data.company, data.email, data.phone, data.address, reset]);

  // Load recent customers for quick select
  useEffect(() => {
    if (!db) return;
    db.getAll<CustomerData>('customers')
      .then((all) => {
        if (all && all.length > 0) {
          const sorted = [...all].reverse().slice(0, 4);
          setRecentCustomers(sorted);
        }
      })
      .catch(() => {});
  }, [db]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!db || searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const all = await db.getAll<CustomerData>('customers');
        const q = searchQuery.toLocaleLowerCase('tr-TR');
        const filtered = all.filter(c =>
          (c.name?.toLocaleLowerCase('tr-TR').includes(q) || c.company?.toLocaleLowerCase('tr-TR').includes(q) || c.email?.toLocaleLowerCase('tr-TR').includes(q))
        );
        setSearchResults(filtered.slice(0, 8));
        setSearchIndex(-1);
      } catch { setSearchResults([]); }
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
      Logger.error('Müşteri oluşturulamadı:', e);
    }
  };

  const selectCustomer = (customer: CustomerData) => {
    setCustomerData({
      name: customer.name || '',
      company: customer.company || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      taxOffice: customer.taxOffice || '',
      taxNumber: customer.taxNumber || (customer as Record<string, string>).taxNo || '',
    });
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(prev => Math.min(prev + 1, searchResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIndex(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter' && searchIndex >= 0) { e.preventDefault(); selectCustomer(searchResults[searchIndex]); }
    else if (e.key === 'Escape') { setShowDropdown(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setSearchQuery(value);
      setShowDropdown(true);
    }
    onChange(name, value);
  };

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-3 space-y-2.5">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--color-border)]/50">
        <div className="flex items-center gap-2">
          <User size={15} className="text-[var(--color-primary)]" />
          <span className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wide">{t('customerInfo')}</span>
          {data?.name && (
            <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[200px] hidden sm:inline">
              ({data.name}{data.company ? ` - ${data.company}` : ''})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn btn-ghost btn-xs text-[var(--color-text-secondary)]"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>{showDetails ? (t('hide') || 'Gizle') : (t('details') || 'Detaylar')}</span>
          </button>
          <button type="button" className="btn btn-outline btn-xs" onClick={onSelectCustomer}>
            <Users size={12} />
            <span>{t('selectCustomer')}</span>
          </button>
        </div>
      </div>
        {/* Recent Customers Quick Chips */}
        {recentCustomers.length > 0 && !data.name && (
          <div className="flex items-center gap-1.5 flex-wrap pb-1 border-b border-[var(--color-border)]/50">
            <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
              <Clock size={11} /> {t('recent') || 'Son'}:
            </span>
            {recentCustomers.map((c, i) => (
              <button
                key={c.id || c.name || i}
                type="button"
                onClick={() => selectCustomer(c)}
                className="px-2 py-0.5 text-xs bg-[var(--color-bg-muted)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary)] text-[var(--color-text)] border border-[var(--color-border)] rounded-full transition-colors truncate max-w-[150px]"
                title={c.company ? `${c.name} (${c.company})` : c.name}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              <input
                type="text"
                id="customerName"
                {...register('name')}
                ref={(e) => {
                  register('name').ref(e);
                  (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }}
                onChange={handleChange}
                onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder={t('customerName')}
                autoComplete="off"
                className={`form-control pl-9 text-sm ${errors.name ? 'field-error' : ''}`}
                aria-invalid={!!errors.name}
              />
            </div>
            {errors.name && (
              <p className="field-error-message" role="alert">
                {errors.name.message}
              </p>
            )}
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
                        "{searchQuery}" {t('createCustomer') || 'müşterisini oluştur'}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {t('newCustomerWillBeCreated') || 'Yeni müşteri kaydı oluşturulacak'}
                      </div>
                    </div>
                  </button>
                ) : null}
              </div>
            )}
          </div>
          <InputField
            id="customerCompany"
            name="company"
            register={register}
            error={errors.company}
            placeholder={t('company')}
            autoComplete="organization"
            onChange={handleChange}
          />
        </div>

        {showDetails && (
          <div className="space-y-2.5 pt-1 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <InputField
                id="customerEmail"
                name="email"
                type="email"
                register={register}
                error={errors.email}
                icon={<Mail size={14} />}
                placeholder={t('email')}
                autoComplete="email"
                onChange={handleChange}
              />
              <InputField
                id="customerPhone"
                name="phone"
                type="tel"
                register={register}
                error={errors.phone}
                icon={<Phone size={14} />}
                placeholder={t('phone')}
                autoComplete="tel"
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-2.5 text-[var(--color-text-muted)] pointer-events-none" />
              <input
                id="customerAddress"
                {...register('address')}
                placeholder={t('address')}
                autoComplete="street-address"
                onChange={handleChange}
                className="form-control pl-9 text-xs py-1.5"
              />
            </div>
          </div>
        )}
      </div>
  );
};

export default React.memo(CustomerInfoForm);
