import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import React from 'react';
import { CategoryManagerSection } from './CategoryManagerSection';
import type { ProductFormData } from './types';

interface ProductFormPanelProps {
    isEditing: boolean;
    formData: ProductFormData;
    categories: string[];
    showCategoryManager: boolean;
    newCategoryName: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancelEdit: () => void;
    onResetForm: () => void;
    onToggleCategoryManager: () => void;
    onNewCategoryNameChange: (val: string) => void;
    onAddCategory: () => void;
    onDeleteCategory: (cat: string) => void;
    t: (key: string) => string;
}

export const ProductFormPanel: React.FC<ProductFormPanelProps> = ({
    isEditing,
    formData,
    categories,
    showCategoryManager,
    newCategoryName,
    onInputChange,
    onImageUpload,
    onRemoveImage,
    onSubmit,
    onCancelEdit,
    onResetForm,
    onToggleCategoryManager,
    onNewCategoryNameChange,
    onAddCategory,
    onDeleteCategory,
    t
}) => {
    return (
        <div className="w-full md:w-2/5 pl-2 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    {isEditing ? t('edit') : t('addProduct')}
                </h3>
                <div className="flex gap-2">
                    {isEditing ? (
                        <button type="button" className="btn btn-sm btn-ghost text-[var(--color-text-muted)]" onClick={onCancelEdit}>
                            {t('cancel')}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost text-[var(--color-primary)]"
                            onClick={onResetForm}
                            title="Formu Temizle"
                        >
                            <Plus size={16} /> {t('add')}
                        </button>
                    )}
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="form-group">
                    <label className="form-label" htmlFor="productName">{t('productName')} <span className="text-[var(--color-error)]">*</span></label>
                    <input type="text" className="form-control" id="productName" name="name" value={formData.name} onChange={onInputChange} autoComplete="off" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                        <label className="form-label" htmlFor="productPrice">{t('unitPrice')} <span className="text-[var(--color-error)]">*</span></label>
                        <input type="number" className="form-control" id="productPrice" name="price" value={formData.price} onChange={onInputChange} min="0" step="0.01" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="productUnit">{t('unit') || 'Birim'}</label>
                        <select className="form-control form-select" id="productUnit" name="unit" value={formData.unit} onChange={onInputChange}>
                            <option value="Adet">{t('unitPiece')}</option>
                            <option value="Metre">{t('unitMeter')}</option>
                            <option value="Kg">{t('unitKg')}</option>
                            <option value="Litre">{t('unitLiter') || 'Litre'}</option>
                            <option value="Saat">{t('unitHour')}</option>
                            <option value="Gün">{t('unitDay')}</option>
                            <option value="Ay">{t('unitMonth')}</option>
                            <option value="Yıl">{t('unitYear') || 'Yıl'}</option>
                            <option value="Paket">{t('unitPack') || 'Paket'}</option>
                            <option value="Koli">{t('unitBox')}</option>
                            <option value="Set">{t('unitSet') || 'Set'}</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="productTax">{t('vatRate')} (%)</label>
                    <select className="form-control form-select" id="productTax" name="taxRate" value={formData.taxRate} onChange={onInputChange}>
                        <option value="0">%0</option>
                        <option value="1">%1</option>
                        <option value="8">%8</option>
                        <option value="10">%10</option>
                        <option value="18">%18</option>
                        <option value="20">%20</option>
                    </select>
                </div>

                <div className="form-group">
                    <div className="flex justify-between items-center mb-1">
                        <label className="form-label mb-0" htmlFor="productCategory">{t('category')}</label>
                        <button
                            type="button"
                            className="text-xs text-[var(--color-primary)] hover:underline"
                            onClick={onToggleCategoryManager}
                        >
                            {showCategoryManager ? t('close') : (t('manage') || 'Yönet')}
                        </button>
                    </div>

                    {showCategoryManager && (
                        <CategoryManagerSection
                            categories={categories}
                            newCategoryName={newCategoryName}
                            onNewCategoryNameChange={onNewCategoryNameChange}
                            onAddCategory={onAddCategory}
                            onDeleteCategory={onDeleteCategory}
                            t={t}
                        />
                    )}

                    <select
                        className="form-control form-select"
                        id="productCategory"
                        name="category"
                        value={formData.category}
                        onChange={onInputChange}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="productDescription">{t('description')}</label>
                    <textarea
                        className="form-control"
                        id="productDescription"
                        name="description"
                        value={formData.description}
                        onChange={onInputChange}
                        rows={3}
                        placeholder={t('searchProductPlaceholder') || 'Ürün özellikleri, detaylar vb.'}
                    ></textarea>
                </div>

                <div className="form-group">
                    <label className="form-label">{t('image')}</label>
                    <div className="flex items-center gap-4">
                        {formData.image ? (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--color-border)] group">
                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                    onClick={onRemoveImage}
                                    aria-label={t('removeImage')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]">
                                <ImageIcon size={24} />
                            </div>
                        )}
                        <div className="flex-1">
                            <label className="btn btn-outline btn-sm cursor-pointer inline-flex items-center gap-2">
                                <Upload size={16} />
                                {t('addImage')}
                                <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                            </label>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                PNG, JPG, WEBP (Max 2MB)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button type="submit" className="btn btn-primary w-full">
                        {isEditing ? t('save') : t('addProduct')}
                    </button>
                </div>
            </form>
        </div>
    );
};
