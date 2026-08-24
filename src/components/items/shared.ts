import React from 'react';
import ImageOptimizer from '@/utils/imageOptimizer';
import Logger from '@/utils/logger';

export const UNIT_OPTIONS = [
  { value: 'Adet', labelKey: 'unitPiece' },
  { value: 'Saat', labelKey: 'unitHour' },
  { value: 'Gün', labelKey: 'unitDay' },
  { value: 'Ay', labelKey: 'unitMonth' },
  { value: 'Kg', labelKey: 'unitKg' },
  { value: 'Mt', labelKey: 'unitMeter' },
  { value: 'M2', labelKey: 'unitM2' },
  { value: 'Kutu', labelKey: 'unitBox' },
];

const optimizer = new ImageOptimizer();

export const optimizeAndSetImage = async (
  file: File,
  index: number,
  handleItemChange: (index: number, field: string, value: string) => void,
) => {
  try {
    const optimized = await optimizer.optimizeImage(file);
    handleItemChange(index, 'image', optimized);
  } catch (err) {
    Logger.error('Resim optimize edilemedi, ham okunuyor:', err);
    const reader = new FileReader();
    reader.onloadend = () => handleItemChange(index, 'image', reader.result as string);
    reader.readAsDataURL(file);
  }
};

export const handleImageUpload = (
  e: React.ChangeEvent<HTMLInputElement>,
  index: number,
  handleItemChange: (index: number, field: string, value: string) => void,
) => {
  const file = e.target.files?.[0];
  if (file) {
    optimizeAndSetImage(file, index, handleItemChange);
  }
};
