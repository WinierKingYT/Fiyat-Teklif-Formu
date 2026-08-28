import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, CreditCard, User, Building, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { InputField } from '@/components/ui';
import { useQuoteData } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';

const bankInfoSchema = z.object({
  bankName: z.string().optional(),
  branch: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  accountHolder: z.string().optional(),
});

type BankInfoFormData = z.infer<typeof bankInfoSchema>;

interface BankInfoFormProps {
  data?: Record<string, string | undefined>;
  onChange: (name: string, value: string) => void;
  onOpenManager?: () => void;
}

const BankInfoForm: React.FC<BankInfoFormProps> = ({ data = {}, onChange, onOpenManager }) => {
  const { quoteData, db } = useQuoteData();
  const { t } = useTranslation();
  const [showExtra, setShowExtra] = useState(Boolean(data.branch || data.accountNumber));
  const [savedBanks, setSavedBanks] = useState<Array<Record<string, string>>>([]);

  useEffect(() => {
    if (!db) return;
    db.getAll<Record<string, string>>('bankInfo')
      .then((banks) => {
        if (banks && banks.length > 0) setSavedBanks(banks);
      })
      .catch(() => {});
  }, [db]);

  const selectBank = (bank: Record<string, string>) => {
    onChange('bankName', bank.bankName || '');
    onChange('iban', bank.iban || '');
    onChange('accountHolder', bank.accountHolder || '');
    onChange('branch', bank.branch || '');
    onChange('accountNumber', bank.accountNumber || '');
  };

  const {
    register,
    reset,
  } = useForm<BankInfoFormData>({
    resolver: zodResolver(bankInfoSchema),
    defaultValues: {
      bankName: data.bankName || '',
      branch: data.branch || '',
      accountNumber: data.accountNumber || '',
      iban: data.iban || '',
      accountHolder: data.accountHolder || '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    reset({
      bankName: data.bankName || '',
      branch: data.branch || '',
      accountNumber: data.accountNumber || '',
      iban: data.iban || '',
      accountHolder: data.accountHolder || '',
    });
  }, [data, reset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--color-border)]/50">
        <button
          type="button"
          className="btn btn-ghost btn-xs text-[var(--color-text-secondary)]"
          onClick={() => setShowExtra(!showExtra)}
        >
          {showExtra ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span>{showExtra ? (t('hideExtraFields') || 'Ek Alanları Gizle') : (t('addBranchAndAccount') || 'Şube & Hesap No Ekle')}</span>
        </button>
        {onOpenManager && (
          <button type="button" className="btn btn-outline btn-xs" onClick={onOpenManager}>
            <Landmark size={12} /> {t('bankInfo')}
          </button>
        )}
      </div>

      {savedBanks.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pb-1 border-b border-[var(--color-border)]/40">
          <span className="text-[11px] text-[var(--color-text-muted)] font-medium">{t('recent') || 'Kayıtlı'}:</span>
          {savedBanks.map((b, i) => (
            <button
              key={b.id || i}
              type="button"
              onClick={() => selectBank(b)}
              className="px-2 py-0.5 text-xs bg-[var(--color-bg-muted)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary)] text-[var(--color-text)] border border-[var(--color-border)] rounded-full transition-colors truncate max-w-[140px]"
              title={`${b.bankName || ''} - ${b.iban || ''}`}
            >
              {b.bankName || b.accountHolder || 'Banka'}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <InputField
          id="bankName"
          name="bankName"
          register={register}
          icon={<Building size={14} />}
          placeholder={t('bankName')}
          onChange={handleChange}
        />
        <InputField
          id="iban"
          name="iban"
          register={register}
          icon={<Landmark size={14} />}
          placeholder={t('iban')}
          onChange={handleChange}
        />
      </div>

      <InputField
        id="accountHolder"
        name="accountHolder"
        register={register}
        icon={<User size={14} />}
        placeholder={t('accountHolder')}
        onChange={handleChange}
      />

      {showExtra && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 animate-in fade-in">
          <InputField
            id="bankBranch"
            name="branch"
            register={register}
            icon={<Hash size={14} />}
            placeholder={t('branch')}
            onChange={handleChange}
          />
          <InputField
            id="accountNumber"
            name="accountNumber"
            register={register}
            icon={<CreditCard size={14} />}
            placeholder={t('accountNumber')}
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(BankInfoForm);
