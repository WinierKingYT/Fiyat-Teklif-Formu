import React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import {
    ProductToolbar,
    ProductListView,
    ProductGridView,
    ProductFormPanel,
    type Product,
    type ProductFormData
} from '@/components/products';
import useDebounce from '@/hooks/useDebounce';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import { parseExcelFile, type ImportedProduct } from '@/utils/excelParser';
import ImageOptimizer from '@/utils/imageOptimizer';
import Logger from '@/utils/logger';

interface ProductManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (product: Product | Product[]) => void;
}

const INITIAL_FORM_DATA: ProductFormData = {
    name: '',
    description: '',
    price: '',
    unit: 'Adet',
    taxRate: 20,
    category: 'Genel',
    image: null
};

const ProductManagerModal: React.FC<ProductManagerModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { t } = useTranslation();
    const { db } = useIndexedDB();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState(['Genel']);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedProducts, setSelectedProducts] = useState<Set<string | number>>(new Set());

    // Edit/Add State
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'info' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Form State
    const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);

    const loadProducts = useCallback(async () => {
        if (!db) return;
        const allProducts = await db.getAll<Product>('products');
        setProducts(allProducts);
    }, [db]);

    const loadCategories = useCallback(async () => {
        if (!db) return;
        try {
            const storedCategories = await db.get<{ id?: string; key?: string; value: string[] }>('settings', 'product_categories');
            if (storedCategories && storedCategories.value) {
                setCategories(storedCategories.value);
            } else {
                const defaults = ['Genel', 'Hizmet', 'Elektronik', 'Giyim'];
                await db.put('settings', { id: 'product_categories', key: 'product_categories', value: defaults });
                setCategories(defaults);
            }
        } catch (error) {
            Logger.error('Error loading categories:', error);
        }
    }, [db]);

    useEffect(() => {
        if (isOpen && db) {
            loadProducts();
            loadCategories();
        }
    }, [isOpen, db, loadProducts, loadCategories]);

    const handleAddCategory = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
            toast.error('Bu kategori zaten mevcut');
            return;
        }

        const updatedCategories = [...categories, trimmed];
        setCategories(updatedCategories);
        await db.put('settings', { id: 'product_categories', key: 'product_categories', value: updatedCategories });
        setNewCategoryName('');
        toast.success(t('savedSuccess'));
    };

    const handleDeleteCategory = async (categoryToDelete: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t('delete'),
            message: `${categoryToDelete} kategorisini silmek istediğinize emin misiniz?`,
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                const updatedCategories = categories.filter(c => c !== categoryToDelete);
                setCategories(updatedCategories);
                if (selectedCategory === categoryToDelete) {
                    setSelectedCategory('Tümü');
                }
                try {
                    await db.put('settings', { id: 'product_categories', key: 'product_categories', value: updatedCategories });
                    toast.success(t('deletedSuccess'));
                } catch (err) {
                    Logger.error('Kategori silinemedi:', err);
                    toast.error(t('error'));
                }
            },
            variant: 'danger'
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const optimizer = new ImageOptimizer();
                const base64 = await optimizer.optimizeImage(file);
                setFormData(prev => ({ ...prev, image: base64 as string | null }));
            } catch (err) {
                Logger.error('Görsel optimizasyon hatası:', err);
                toast.error(t('error'));
            } finally {
                e.target.value = '';
            }
        }
    };

    const performSave = async () => {
        const productData = {
            ...formData,
            price: parseFloat(formData.price),
            taxRate: parseFloat(String(formData.taxRate))
        };

        try {
            if (isEditing && currentProduct) {
                await db.put('products', { ...productData, id: currentProduct.id });
                toast.success(t('savedSuccess'));
            } else {
                await db.add('products', { ...productData, id: Date.now() });
                toast.success(t('savedSuccess'));
            }
            loadProducts();
            resetForm();
        } catch (error) {
            Logger.error(error);
            toast.error(t('error'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.price) {
            toast.error(t('productNameRequired'));
            return;
        }

        const priceNum = parseFloat(formData.price);
        if (isNaN(priceNum) || priceNum < 0) {
            toast.error(t('error'));
            return;
        }

        if (!isEditing) {
            const isDuplicate = products.some(p =>
                p.name && p.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
            );

            if (isDuplicate) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Mükerrer Ürün',
                    message: 'Bu isimde bir ürün zaten kayıtlı. Yine de kaydetmek istiyor musunuz?',
                    onConfirm: () => {
                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        performSave();
                    },
                    variant: 'warning'
                });
                return;
            }
        }

        performSave();
    };

    const handleEdit = (product: Product) => {
        setCurrentProduct(product);
        setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price ? String(product.price) : '',
            unit: product.unit || 'Adet',
            taxRate: product.taxRate || 20,
            category: product.category || 'Genel',
            image: product.image || null
        });
        setIsEditing(true);
    };

    const performDelete = async (id: number | string) => {
        try {
            const productToDelete = products.find(p => p.id === id);
            if (productToDelete) {
                await db.moveToRecycleBin('products', id as IDBValidKey, productToDelete, { deletedBy: 'user' });
                toast.success(t('deletedSuccess'));
                loadProducts();
                if (selectedProducts.has(id)) {
                    const newSelected = new Set(selectedProducts);
                    newSelected.delete(id);
                    setSelectedProducts(newSelected);
                }
                if (currentProduct?.id === id) {
                    resetForm();
                }
            }
        } catch (error) {
            Logger.error(error);
            toast.error(t('error'));
        }
    };

    const handleDelete = async (id: number | string) => {
        setConfirmDialog({
            isOpen: true,
            title: t('deleteProduct'),
            message: 'Bu ürünü silmek istediğinize emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)',
            onConfirm: () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                performDelete(id);
            },
            variant: 'danger'
        });
    };

    const handleBulkDelete = async () => {
        setConfirmDialog({
            isOpen: true,
            title: t('delete'),
            message: `${selectedProducts.size} ürünü silmek istediğinize emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)`,
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    for (const id of selectedProducts) {
                        const productToDelete = products.find(p => p.id === id);
                        if (productToDelete) {
                            await db.moveToRecycleBin('products', id as IDBValidKey, productToDelete, { deletedBy: 'user' });
                        }
                    }
                    if (currentProduct && selectedProducts.has(currentProduct.id)) {
                        resetForm();
                    }
                    toast.success(t('deletedSuccess'));
                    setSelectedProducts(new Set());
                    loadProducts();
                } catch (error) {
                    Logger.error(error);
                    toast.error(t('error'));
                }
            },
            variant: 'danger'
        });
    };

    const toggleProductSelection = (id: number | string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    const debouncedSearch = useDebounce(searchTerm, 250);
    const filteredProducts = useMemo(() =>
        products.filter(p => {
            const q = debouncedSearch.toLocaleLowerCase('tr-TR').trim();
            const pName = (p.name || '').toLocaleLowerCase('tr-TR');
            const pDesc = (p.description || '').toLocaleLowerCase('tr-TR');
            const matchesSearch = !q || pName.includes(q) || pDesc.includes(q);
            const matchesCategory = selectedCategory === 'Tümü' || selectedCategory === t('all') || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        }),
        [products, debouncedSearch, selectedCategory, t]
    );

    const toggleAllSelection = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            const newSelected = new Set(filteredProducts.map(p => p.id));
            setSelectedProducts(newSelected);
        }
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setIsEditing(false);
        setCurrentProduct(null);
    };

    const handleAddSelectedToQuote = () => {
        if (!onSelect || selectedProducts.size === 0) return;
        const itemsToAdd = products.filter(p => selectedProducts.has(p.id));
        itemsToAdd.forEach(item => onSelect(item));
        setSelectedProducts(new Set());
        onClose();
    };

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const paginatedProducts = useMemo(() =>
        filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredProducts, page]
    );

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategory]);

    const handleExport = () => {
        try {
            const dataStr = JSON.stringify(products, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const exportFileDefaultName = `urunler_${new Date().toISOString().slice(0, 10)}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', url);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            URL.revokeObjectURL(url);
            toast.success(t('exportedSuccess'));
        } catch (error) {
            Logger.error(error);
            toast.error(t('error'));
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            toast.loading(t('loading'), { id: 'import-loading' });
            let importedProducts: ImportedProduct[] = [];

            if (file.name.endsWith('.json')) {
                const text = await file.text();
                importedProducts = JSON.parse(text);
            } else if (file.name.match(/\.(xlsx|xls|csv)$/)) {
                importedProducts = await parseExcelFile(file);
            } else {
                toast.error(t('error'), { id: 'import-loading' });
                return;
            }

            toast.dismiss('import-loading');

            if (Array.isArray(importedProducts)) {
                let count = 0;
                for (const p of importedProducts) {
                    if (p.name && (p.price !== undefined && p.price !== null)) {
                        const { id: _id, ...productData } = p as ImportedProduct & { id?: unknown };
                        await db.add('products', {
                            ...productData,
                            price: Number(productData.price),
                            id: Date.now() + count++
                        });
                    }
                }
                toast.success(`${count} ${t('itemsAddedSuccessfully')}`);
                loadProducts();
            } else {
                toast.error('Geçersiz veri formatı');
            }
        } catch (error) {
            Logger.error('Import error:', error);
            toast.error(`${t('error')}: ${(error as Error).message}`, { id: 'import-loading' });
        }

        e.target.value = '';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={onSelect ? `${t('products')} (Teklife Ürün Ekle)` : t('products')}
            size="2xl"
        >
            <div className="flex flex-col lg:flex-row gap-6 max-h-[80vh]">
                {/* Left: Product List */}
                <div className="flex-1 flex flex-col min-w-0">
                    <ProductToolbar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                        selectedCount={selectedProducts.size}
                        onBulkDelete={handleBulkDelete}
                        onImport={handleImport}
                        onExport={handleExport}
                        t={t}
                    />

                    {/* Batch Selection Action Bar for Quote Insertion */}
                    {onSelect && selectedProducts.size > 0 && (
                        <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                {selectedProducts.size} ürün seçildi
                            </span>
                            <button
                                type="button"
                                onClick={handleAddSelectedToQuote}
                                className="btn btn-xs btn-primary text-xs font-bold px-3 py-1.5 shadow-xs"
                            >
                                Seçilenleri Teklife Ekle ({selectedProducts.size})
                            </button>
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                                <p>{t('noData')}</p>
                            </div>
                        ) : viewMode === 'list' ? (
                            <ProductListView
                                products={paginatedProducts}
                                selectedProducts={selectedProducts}
                                currentProductId={currentProduct?.id}
                                onSelectAll={toggleAllSelection}
                                onToggleSelect={toggleProductSelection}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onSelect={onSelect ? (product) => { onSelect(product); onClose(); } : undefined}
                                t={t}
                            />
                        ) : (
                            <ProductGridView
                                products={paginatedProducts}
                                selectedProducts={selectedProducts}
                                currentProductId={currentProduct?.id}
                                onToggleSelect={toggleProductSelection}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                t={t}
                            />
                        )}
                    </div>

                    {filteredProducts.length > PAGE_SIZE && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={filteredProducts.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>

                {/* Right: Form */}
                <ProductFormPanel
                    isEditing={isEditing}
                    formData={formData}
                    categories={categories}
                    showCategoryManager={showCategoryManager}
                    newCategoryName={newCategoryName}
                    onInputChange={handleInputChange}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={() => setFormData(prev => ({ ...prev, image: null }))}
                    onSubmit={handleSubmit}
                    onCancelEdit={() => resetForm()}
                    onResetForm={resetForm}
                    onToggleCategoryManager={() => setShowCategoryManager(!showCategoryManager)}
                    onNewCategoryNameChange={setNewCategoryName}
                    onAddCategory={handleAddCategory}
                    onDeleteCategory={handleDeleteCategory}
                    t={t}
                />
            </div>
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                variant={confirmDialog.variant}
            />
        </Modal>
    );
};

export default ProductManagerModal;
