import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash, GripVertical, Image as ImageIcon, Package, Upload } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as XLSX from 'xlsx';
import Logger from '../utils/logger';

import { evaluateMathExpression } from '../utils/smartCalc';

// Sortable Row Component
const SortableRow = ({ item, index, handleItemChange, removeItem, formatCurrency, onKeyDown }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const fileInputRef = useRef(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 999 : 'auto',
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleItemChange(index, 'image', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCalc = (field, value) => {
        const calculatedValue = evaluateMathExpression(value);
        if (calculatedValue !== value) {
            handleItemChange(index, field, calculatedValue);
        }
    };

    return (
        <tr ref={setNodeRef} style={style}>
            <td {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical size={16} className="text-muted" />
            </td>
            <td>
                <div
                    className="item-image-container cursor-pointer hover:opacity-80"
                    onClick={() => fileInputRef.current?.click()}
                    title="Resim Ekle/Değiştir"
                >
                    {item.image ? (
                        <img src={item.image} alt="Item" className="item-image" />
                    ) : (
                        <div className="item-image-placeholder">
                            <ImageIcon size={16} />
                            <span className="text-[10px] mt-1">Ekle</span>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />
                </div>
            </td>
            <td>
                <input
                    type="text"
                    className="form-control mb-1"
                    placeholder="Ürün adı"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index, 'name')}
                    data-row={index}
                    data-field="name"
                    aria-label="Ürün Adı"
                    name={`items[${index}].name`}
                    autoComplete="off"
                />
                <textarea
                    className="form-control text-xs"
                    placeholder="Açıklama"
                    rows="2"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index, 'description')}
                    data-row={index}
                    data-field="description"
                    aria-label="Ürün Açıklaması"
                    name={`items[${index}].description`}
                    autoComplete="off"
                ></textarea>
            </td>
            <td>
                <input
                    type="text"
                    className="form-control"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    onBlur={(e) => handleCalc('quantity', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index, 'quantity')}
                    data-row={index}
                    data-field="quantity"
                    aria-label="Miktar"
                    name={`items[${index}].quantity`}
                    autoComplete="off"
                />
            </td>
            <td>
                <select
                    className="form-control form-select"
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index, 'unit')}
                    data-row={index}
                    data-field="unit"
                    aria-label="Birim"
                    name={`items[${index}].unit`}
                    autoComplete="off"
                >
                    <option value="Adet">Adet</option>
                    <option value="Saat">Saat</option>
                    <option value="Gün">Gün</option>
                    <option value="Ay">Ay</option>
                    <option value="Kg">Kg</option>
                    <option value="Mt">Mt</option>
                    <option value="M2">M2</option>
                    <option value="Kutu">Kutu</option>
                </select>
            </td>
            <td>
                <input
                    type="text"
                    className="form-control"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    onBlur={(e) => handleCalc('price', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index, 'price')}
                    data-row={index}
                    data-field="price"
                    aria-label="Birim Fiyat"
                    name={`items[${index}].price`}
                    autoComplete="off"
                />
            </td>
            <td>
                <input
                    type="text"
                    className="form-control"
                    value={item.taxRate}
                    onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                    onBlur={(e) => handleCalc('taxRate', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index, 'taxRate')}
                    data-row={index}
                    data-field="taxRate"
                    aria-label="KDV Oranı"
                    name={`items[${index}].taxRate`}
                    autoComplete="off"
                />
            </td>
            <td>
                <input
                    type="text"
                    className="form-control"
                    value={item.discountRate || 0}
                    onChange={(e) => handleItemChange(index, 'discountRate', e.target.value)}
                    onBlur={(e) => handleCalc('discountRate', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index, 'discountRate')}
                    data-row={index}
                    data-field="discountRate"
                    aria-label="İskonto Oranı"
                    name={`items[${index}].discountRate`}
                    autoComplete="off"
                />
            </td>
            <td className="text-right font-medium">
                {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0) * (1 - (parseFloat(item.discountRate) || 0) / 100))}
            </td>
            <td>
                <button
                    type="button"
                    className="btn btn-danger btn-sm p-1"
                    onClick={() => removeItem(index)}
                >
                    <Trash size={14} />
                </button>
            </td>
        </tr>
    );
};

// Sortable Row Card Component (For Card View)
const SortableRowCard = ({ item, index, handleItemChange, removeItem, formatCurrency }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const fileInputRef = useRef(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 999 : 'auto',
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleItemChange(index, 'image', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="glass-card p-4 relative group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="absolute top-2 right-2 p-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <GripVertical size={16} />
            </div>

            <div className="flex gap-4 mb-4">
                {/* Image */}
                <div
                    className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden border border-gray-200 dark:border-slate-600 hover:opacity-80 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {item.image ? (
                        <img src={item.image} alt="Item" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center text-gray-400">
                            <ImageIcon size={20} className="mx-auto mb-1" />
                            <span className="text-[10px]">Ekle</span>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                {/* Main Info */}
                <div className="flex-1">
                    <input
                        type="text"
                        className="form-control mb-2 font-semibold"
                        placeholder="Ürün adı"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    />
                    <textarea
                        className="form-control text-xs resize-none"
                        placeholder="Açıklama"
                        rows="2"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    ></textarea>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Miktar</label>
                    <div className="flex gap-1">
                        <input
                            type="text"
                            className="form-control text-sm"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                        <select
                            className="form-control form-select text-sm w-20"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        >
                            <option value="Adet">Adet</option>
                            <option value="Saat">Saat</option>
                            <option value="Gün">Gün</option>
                            <option value="Ay">Ay</option>
                            <option value="Kg">Kg</option>
                            <option value="Mt">Mt</option>
                            <option value="M2">M2</option>
                            <option value="Kutu">Kutu</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Birim Fiyat</label>
                    <input
                        type="text"
                        className="form-control text-sm"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">KDV %</label>
                    <input
                        type="text"
                        className="form-control text-sm"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">İskonto %</label>
                    <input
                        type="text"
                        className="form-control text-sm"
                        value={item.discountRate || 0}
                        onChange={(e) => handleItemChange(index, 'discountRate', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold text-right block">Toplam</label>
                    <div className="text-right font-bold text-blue-600 dark:text-blue-400 text-sm pt-2">
                        {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0) * (1 - (parseFloat(item.discountRate) || 0) / 100))}
                    </div>
                </div>
            </div>

            <button
                type="button"
                className="btn btn-danger btn-sm w-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeItem(index)}
            >
                <Trash size={14} /> Ürünü Sil
            </button>
        </div>
    );
};

const ItemsTable = ({ items, onItemsChange, currency = 'TRY', onAddProduct }) => {
    const fileInputRef = useRef(null);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'

    // Ensure all items have IDs
    useEffect(() => {
        const itemsWithIds = items.map(item => {
            if (!item.id) {
                return { ...item, id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
            }
            return item;
        });

        // Only update if changes were made to avoid infinite loop
        const hasChanges = items.some((item, index) => item.id !== itemsWithIds[index].id);
        if (hasChanges) {
            onItemsChange(itemsWithIds);
        }
    }, [items, onItemsChange]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            onItemsChange(arrayMove(items, oldIndex, newIndex));
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate total for the row
        if (field === 'quantity' || field === 'price' || field === 'taxRate' || field === 'discountRate') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const price = parseFloat(newItems[index].price) || 0;
            const discountRate = parseFloat(newItems[index].discountRate) || 0;
            const subtotal = qty * price;
            const discountAmount = subtotal * (discountRate / 100);
            newItems[index].total = subtotal - discountAmount;
        }

        onItemsChange(newItems);
    };

    const addItem = () => {
        onItemsChange([
            ...items,
            {
                id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: '',
                description: '',
                quantity: 1,
                unit: 'Adet',
                price: 0,
                taxRate: 20,
                discountRate: 0,
                total: 0,
                image: null
            }
        ]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onItemsChange(newItems);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency }).format(amount);
    };

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Skip header row if exists and map data
                // Assuming format: Name, Description, Quantity, Unit, Price, TaxRate
                const newItems = [];

                // Start from index 1 if header exists, otherwise 0. Simple check: if row 0 has "Name" or "Ürün"
                let startIndex = 0;
                if (jsonData.length > 0 && (typeof jsonData[0][0] === 'string')) {
                    startIndex = 1;
                }

                for (let i = startIndex; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    newItems.push({
                        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
                        name: row[0] || '',
                        description: row[1] || '',
                        quantity: parseFloat(row[2]) || 1,
                        unit: row[3] || 'Adet',
                        price: parseFloat(row[4]) || 0,
                        taxRate: parseFloat(row[5]) || 20,
                        total: (parseFloat(row[2]) || 1) * (parseFloat(row[4]) || 0),
                        image: null
                    });
                }

                if (newItems.length > 0) {
                    onItemsChange([...items, ...newItems]);
                    Logger.log(`${newItems.length} items imported from Excel.`);
                    alert(`${newItems.length} ürün başarıyla eklendi.`);
                } else {
                    alert('Excel dosyasında uygun veri bulunamadı.');
                }

            } catch (error) {
                Logger.error('Excel import error:', error);
                alert('Excel dosyası okunurken bir hata oluştu.');
            }
        };
        reader.readAsArrayBuffer(file);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Keyboard Navigation Logic
    const handleKeyDown = (e, index, field) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Trigger blur to calculate
            return;
        }

        const fields = ['name', 'description', 'quantity', 'unit', 'price', 'taxRate', 'discountRate'];
        const fieldIndex = fields.indexOf(field);

        let nextRow = index;
        let nextField = field;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (fieldIndex < fields.length - 1) {
                nextField = fields[fieldIndex + 1];
            } else if (index < items.length - 1) {
                nextRow = index + 1;
                nextField = fields[0];
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (fieldIndex > 0) {
                nextField = fields[fieldIndex - 1];
            } else if (index > 0) {
                nextRow = index - 1;
                nextField = fields[fields.length - 1];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (index < items.length - 1) {
                nextRow = index + 1;
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (index > 0) {
                nextRow = index - 1;
            }
        } else {
            return; // Not an arrow key
        }

        // Find and focus the element
        const selector = `[data-row="${nextRow}"][data-field="${nextField}"]`;
        const element = document.querySelector(selector);
        if (element) {
            element.focus();
            // Select text if it's an input
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                setTimeout(() => element.select(), 0);
            }
        }
    };

    return (
        <div className="form-section">
            <div className="flex justify-end mb-4 px-1">
                <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-lg inline-flex">
                    <button
                        className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'table' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                        onClick={() => setViewMode('table')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                        <span>Liste</span>
                    </button>
                    <button
                        className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'card' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                        onClick={() => setViewMode('card')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        <span>Galeri</span>
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="p-4 bg-blue-100 text-blue-600 rounded-full mb-4 dark:bg-blue-900/30 dark:text-blue-400">
                            <Package size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Henüz ürün eklenmedi</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                            Teklifinize ürün veya hizmet ekleyerek başlayın. Excel'den toplu yükleme yapabilir veya katalogdan seçebilirsiniz.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="btn btn-primary shadow-lg shadow-blue-500/30"
                                onClick={addItem}
                            >
                                <Plus size={18} /> İlk Satırı Ekle
                            </button>
                            {onAddProduct && (
                                <button
                                    type="button"
                                    className="btn btn-outline bg-white dark:bg-slate-800"
                                    onClick={onAddProduct}
                                >
                                    <Package size={18} /> Katalogdan Seç
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        {viewMode === 'table' ? (
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}></th>
                                        <th style={{ width: '80px' }}>Görsel</th>
                                        <th style={{ minWidth: '250px' }}>Ürün/Hizmet</th>
                                        <th style={{ width: '100px' }}>Miktar</th>
                                        <th style={{ width: '100px' }}>Birim</th>
                                        <th style={{ width: '120px' }}>Birim Fiyat</th>
                                        <th style={{ width: '80px' }}>KDV %</th>
                                        <th style={{ width: '80px' }}>İskonto %</th>
                                        <th style={{ width: '120px' }}>Toplam</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <SortableContext
                                    items={items.map(item => item.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <tbody>
                                        {items.map((item, index) => (
                                            <SortableRow
                                                key={item.id || index}
                                                item={item}
                                                index={index}
                                                handleItemChange={handleItemChange}
                                                removeItem={removeItem}
                                                formatCurrency={formatCurrency}
                                                onKeyDown={handleKeyDown}
                                            />
                                        ))}
                                    </tbody>
                                </SortableContext>
                            </table>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <SortableContext
                                    items={items.map(item => item.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {items.map((item, index) => (
                                        <SortableRowCard
                                            key={item.id || index}
                                            item={item}
                                            index={index}
                                            handleItemChange={handleItemChange}
                                            removeItem={removeItem}
                                            formatCurrency={formatCurrency}
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        )}
                    </DndContext>
                )}
            </div>

            <div className="table-actions flex gap-3">
                <button type="button" className="btn btn-sm shadow-sm border-0" style={{ backgroundColor: '#2563eb', color: 'white' }} onClick={addItem}>
                    <Plus size={16} /> Yeni Satır Ekle
                </button>
                {onAddProduct && (
                    <button type="button" className="btn btn-sm shadow-sm border-0" style={{ backgroundColor: '#9333ea', color: 'white' }} onClick={onAddProduct}>
                        <Package size={16} /> Ürün Kataloğundan Seç
                    </button>
                )}
                <button type="button" className="btn btn-sm shadow-sm border-0" style={{ backgroundColor: '#16a34a', color: 'white' }} onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} /> Excel'den Yükle
                </button>
                <button
                    type="button"
                    className="btn btn-sm shadow-sm border-0 bg-orange-500 text-white hover:bg-orange-600"
                    onClick={() => {
                        const testItems = [
                            { id: `test-${Date.now()}-1`, name: 'Profesyonel Web Tasarım', description: 'Kurumsal kimliğe uygun responsive tasarım', quantity: 1, unit: 'Adet', price: 15000, taxRate: 20, total: 15000 },
                            { id: `test-${Date.now()}-2`, name: 'Hosting ve Domain', description: '1 Yıllık sınırsız hosting ve .com domain', quantity: 1, unit: 'Yıl', price: 2500, taxRate: 20, total: 2500 },
                            { id: `test-${Date.now()}-3`, name: 'SEO Optimizasyonu', description: 'Google arama motoru optimizasyonu', quantity: 3, unit: 'Ay', price: 5000, taxRate: 20, total: 15000 }
                        ];
                        onItemsChange([...items, ...testItems]);
                        alert('Test verileri eklendi!');
                    }}
                >
                    <Package size={16} /> Test Verisi Ekle
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleExcelUpload}
                    accept=".xlsx, .xls"
                    style={{ display: 'none' }}
                    title="Excel Dosyası Seç"
                />
            </div >
        </div >
    );
};

export default ItemsTable;
