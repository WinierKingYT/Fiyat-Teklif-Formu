import React from 'react';

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

export const handleImageUpload = (
  e: React.ChangeEvent<HTMLInputElement>,
  index: number,
  handleItemChange: (index: number, field: string, value: string) => void,
) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => handleItemChange(index, 'image', reader.result as string);
    reader.readAsDataURL(file);
  }
};
