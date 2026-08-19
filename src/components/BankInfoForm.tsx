import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Landmark, CreditCard, User, Building, Hash } from 'lucide-react';
import { useQuoteData } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';
import { InputField } from './ui';

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
  const { quoteData } = useQuoteData();
  const { t } = useTranslation(quoteData?.language);

  const {
    register,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputField
          id="bankName"
          name="bankName"
          register={register}
          icon={<Building size={15} />}
          placeholder={t('bankName')}
          onChange={handleChange}
        />
        <InputField
          id="bankBranch"
          name="branch"
          register={register}
          icon={<Hash size={15} />}
          placeholder={t('branch')}
          onChange={handleChange}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputField
          id="accountNumber"
          name="accountNumber"
          register={register}
          icon={<CreditCard size={15} />}
          placeholder={t('accountNumber')}
          onChange={handleChange}
        />
        <InputField
          id="iban"
          name="iban"
          register={register}
          icon={<Landmark size={15} />}
          placeholder={t('iban')}
          onChange={handleChange}
        />
      </div>
      <InputField
        id="accountHolder"
        name="accountHolder"
        register={register}
        icon={<User size={15} />}
        placeholder={t('accountHolder')}
        onChange={handleChange}
      />
    </div>
  );
};

export default React.memo(BankInfoForm);
