import { zodResolver } from '@hookform/resolvers/zod';
import { Hash, Calendar, Clock, AlignLeft, DollarSign, Globe } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { InputField, SelectField, TextAreaField } from '@/components/ui';
import type { QuoteData } from '@/context/quote/types';

const quoteInfoSchema = z.object({
  title: z.string().min(1, 'Teklif başlığı zorunludur'),
  number: z.string().optional(),
  currency: z.string(),
  language: z.string(),
  date: z.string().optional(),
  validUntilDays: z.string(),
  description: z.string().optional(),
});

type QuoteInfoFormData = z.infer<typeof quoteInfoSchema>;

interface QuoteInfoFormProps {
  data: Partial<QuoteData>;
  onChange: (name: string, value: string) => void;
}

const QuoteInfoForm: React.FC<QuoteInfoFormProps> = ({ data, onChange }) => {
  const {
    register,
    formState: { errors },
  } = useForm<QuoteInfoFormData>({
    resolver: zodResolver(quoteInfoSchema),
    defaultValues: {
      title: data.title || '',
      number: data.number || '',
      currency: data.currency || 'TRY',
      language: data.language || 'tr',
      date: data.date || '',
      validUntilDays: data.validUntilDays || '10',
      description: data.description || '',
    },
    mode: 'onBlur',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputField
          id="quoteTitle"
          name="title"
          register={register}
          error={errors.title}
          icon={<Hash size={15} />}
          placeholder="Teklif Başlığı"
          autoComplete="off"
          onChange={handleChange}
        />
        <InputField
          id="quoteNumber"
          name="number"
          register={register}
          error={errors.number}
          icon={<Hash size={15} />}
          placeholder="Teklif No (opsiyonel)"
          autoComplete="off"
          onChange={handleChange}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SelectField
          id="quoteCurrency"
          name="currency"
          register={register}
          icon={<DollarSign size={15} />}
          options={[
            { value: 'TRY', label: '₺ TRY' },
            { value: 'USD', label: '$ USD' },
            { value: 'EUR', label: '€ EUR' },
            { value: 'GBP', label: '£ GBP' },
            { value: 'CHF', label: 'Fr CHF' },
            { value: 'JPY', label: '¥ JPY' },
          ]}
          onChange={handleChange}
        />
        <SelectField
          id="quoteLanguage"
          name="language"
          register={register}
          icon={<Globe size={15} />}
          options={[
            { value: 'tr', label: 'Türkçe' },
            { value: 'en', label: 'English' },
            { value: 'de', label: 'Deutsch' },
          ]}
          onChange={handleChange}
        />
        <InputField
          id="quoteDate"
          name="date"
          type="date"
          register={register}
          icon={<Calendar size={15} />}
          onChange={handleChange}
        />
        <SelectField
          id="validUntilDays"
          name="validUntilDays"
          register={register}
          icon={<Clock size={15} />}
          options={[
            { value: '3', label: '3 Gün' },
            { value: '5', label: '5 Gün' },
            { value: '7', label: '7 Gün' },
            { value: '10', label: '10 Gün' },
            { value: '15', label: '15 Gün' },
            { value: '30', label: '30 Gün' },
            { value: '60', label: '60 Gün' },
            { value: '90', label: '90 Gün' },
          ]}
          onChange={handleChange}
        />
      </div>
      <TextAreaField
        id="quoteDescription"
        name="description"
        register={register}
        icon={<AlignLeft size={15} />}
        placeholder="Teklif açıklaması"
        rows={3}
        autoComplete="off"
        onChange={handleChange}
      />
    </div>
  );
};

export default QuoteInfoForm;
