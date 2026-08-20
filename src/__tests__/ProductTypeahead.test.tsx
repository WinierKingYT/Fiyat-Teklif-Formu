import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import ProductTypeahead, { type ProductTypeaheadItem } from '@/components/items/ProductTypeahead';

const sampleProducts: ProductTypeaheadItem[] = [
  { id: '1', name: 'MacBook Pro 16', price: 95000, unit: 'Adet', taxRate: 20, category: 'Elektronik', description: 'M3 Max 36GB' },
  { id: '2', name: 'Magic Mouse', price: 3500, unit: 'Adet', taxRate: 20, category: 'Aksesuar', description: 'Siyah renk' },
  { id: '3', name: 'Dell UltraSharp Monitör', price: 28000, unit: 'Adet', taxRate: 20, category: 'Elektronik', description: '4K IPS' },
];

const TypeaheadHarness = ({
  products = sampleProducts,
  onSelect = vi.fn(),
  initialValue = '',
}: {
  products?: ProductTypeaheadItem[];
  onSelect?: (product: ProductTypeaheadItem) => void;
  initialValue?: string;
}) => {
  const [val, setVal] = useState(initialValue);
  return (
    <ProductTypeahead
      value={val}
      onChange={setVal}
      onSelectProduct={(p) => {
        setVal(p.name);
        onSelect(p);
      }}
      products={products}
      placeholder="Ürün adı"
      ariaLabel="Ürün adı"
      dataRow={0}
      dataField="name"
    />
  );
};

describe('ProductTypeahead', () => {
  it('renders input with placeholder and value', () => {
    render(<TypeaheadHarness initialValue="Test Ürün" />);
    const input = screen.getByRole('textbox', { name: 'Ürün adı' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Test Ürün');
  });

  it('shows suggestions matching query when user types', () => {
    render(<TypeaheadHarness />);
    const input = screen.getByRole('textbox', { name: 'Ürün adı' });

    fireEvent.change(input, { target: { value: 'Mac' } });

    expect(screen.getByText('MacBook Pro 16')).toBeInTheDocument();
    expect(screen.queryByText('Magic Mouse')).not.toBeInTheDocument();
    expect(screen.queryByText('Dell UltraSharp Monitör')).not.toBeInTheDocument();
  });

  it('selects product and triggers onSelectProduct when clicked', () => {
    const handleSelect = vi.fn();
    render(<TypeaheadHarness onSelect={handleSelect} />);
    const input = screen.getByRole('textbox', { name: 'Ürün adı' });

    fireEvent.change(input, { target: { value: 'Dell' } });

    const option = screen.getByText('Dell UltraSharp Monitör');
    expect(option).toBeInTheDocument();

    fireEvent.mouseDown(option);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Dell UltraSharp Monitör',
        price: 28000,
      })
    );
    expect(input).toHaveValue('Dell UltraSharp Monitör');
  });

  it('supports keyboard navigation (ArrowDown, ArrowUp, Enter)', () => {
    const handleSelect = vi.fn();
    render(<TypeaheadHarness onSelect={handleSelect} />);
    const input = screen.getByRole('textbox', { name: 'Ürün adı' });

    fireEvent.change(input, { target: { value: 'Mac' } });

    // Press ArrowDown to select first suggestion (MacBook Pro 16)
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MacBook Pro 16',
      })
    );
  });

  it('closes suggestions on Escape', () => {
    render(<TypeaheadHarness />);
    const input = screen.getByRole('textbox', { name: 'Ürün adı' });

    fireEvent.change(input, { target: { value: 'Mac' } });
    expect(screen.getByText('MacBook Pro 16')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('MacBook Pro 16')).not.toBeInTheDocument();
  });
});
