import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { Trash2, Edit, Plus, Search, Image as ImageIcon, Grid, List, Filter, CheckSquare, Square, Download, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageOptimizer from '../utils/imageOptimizer';
import { parseExcelFile } from '../utils/excelParser';

const ProductManagerModal = ({ isOpen, onClose }) => {
    const { db } = useIndexedDB();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['Genel']);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
    const [selectedProducts, setSelectedProducts] = useState(new Set());

    // Edit/Add State
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        unit: 'Adet',
        taxRate: 20,
        category: 'Genel',
        image: null
    });

    useEffect(() => {
        if (isOpen && db) {
            loadProducts();
            loadCategories();
        }
    }, [isOpen, db]);

    const loadProducts = async () => {
        const allProducts = await db.getAll('products');
        setProducts(allProducts);
    };

    const loadCategories = async () => {
        try {
            const storedCategories = await db.get('settings', 'product_categories');
            if (storedCategories && storedCategories.value) {
                setCategories(storedCategories.value);
            } else {
                // Initialize default categories if not found
                const defaults = ['Genel', 'Hizmet', 'Elektronik', 'Giyim'];
                await db.put('settings', { key: 'product_categories', value: defaults });
                setCategories(defaults);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        if (categories.includes(newCategoryName.trim())) {
            toast.error('Bu kategori zaten mevcut');
            return;
        }

        const updatedCategories = [...categories, newCategoryName.trim()];
        setCategories(updatedCategories);
        await db.put('settings', { key: 'product_categories', value: updatedCategories });
        setNewCategoryName('');
        toast.success('Kategori eklendi');
    };

    const handleDeleteCategory = async (categoryToDelete) => {
        if (window.confirm(`${categoryToDelete} kategorisini silmek istediğinize emin misiniz?`)) {
            const updatedCategories = categories.filter(c => c !== categoryToDelete);
            setCategories(updatedCategories);
            await db.put('settings', { key: 'product_categories', value: updatedCategories });

            // Reset products with this category to 'Genel'
            // Note: This would require updating all products, which might be expensive. 
            // For now, we just delete the category from the list.
            toast.success('Kategori silindi');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const optimizer = new ImageOptimizer();
                const optimizedImage = await optimizer.optimizeImage(file);
                setFormData(prev => ({ ...prev, image: optimizedImage }));
            } catch (error) {
                console.error("Image upload error:", error);
                toast.error('Resim yüklenirken hata oluştu');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.price) {
            toast.error('Ürün adı ve fiyatı zorunludur.');
            return;
        }

        // Duplicate Check
        if (!isEditing) {
            const isDuplicate = products.some(p =>
                p.name && p.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
            );

            if (isDuplicate) {
                if (!window.confirm('Bu isimde bir ürün zaten kayıtlı. Yine de kaydetmek istiyor musunuz?')) {
                    return;
                }
            }
        }

        const productData = {
            ...formData,
            price: parseFloat(formData.price),
            taxRate: parseFloat(formData.taxRate)
        };

        try {
            if (isEditing && currentProduct) {
                await db.put('products', { ...productData, id: currentProduct.id });
                toast.success('Ürün güncellendi');
            } else {
                await db.add('products', { ...productData, id: Date.now() });
                toast.success('Ürün eklendi');
            }
            loadProducts();
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error('Bir hata oluştu');
        }
    };

    const handleEdit = (product) => {
        setCurrentProduct(product);
        setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            unit: product.unit || 'Adet',
            taxRate: product.taxRate || 20,
            category: product.category || 'Genel',
            image: product.image || null
        });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu ürünü silmek istediğinize emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)')) {
            try {
                const productToDelete = products.find(p => p.id === id);
                if (productToDelete) {
                    await db.add('recycle_bin', {
                        ...productToDelete,
                        originalStore: 'products',
                        deletedAt: new Date().toISOString(),
                        originalId: id
                    });
                    await db.delete('products', id);
                    toast.success('Ürün geri dönüşüm kutusuna taşındı');
                    loadProducts();
                    // Remove from selection if selected
                    if (selectedProducts.has(id)) {
                        const newSelected = new Set(selectedProducts);
                        newSelected.delete(id);
                        setSelectedProducts(newSelected);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error('Silinirken hata oluştu');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`${selectedProducts.size} adet ürünü silmek istediğinize emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)`)) {
            try {
                for (const id of selectedProducts) {
                    const productToDelete = products.find(p => p.id === id);
                    if (productToDelete) {
                        await db.add('recycle_bin', {
                            ...productToDelete,
                            originalStore: 'products',
                            deletedAt: new Date().toISOString(),
                            originalId: id
                        });
                        await db.delete('products', id);
                    }
                }
                toast.success('Seçili ürünler geri dönüşüm kutusuna taşındı');
                setSelectedProducts(new Set());
                loadProducts();
            } catch (error) {
                console.error(error);
                toast.error('Toplu silme işlemi başarısız oldu');
            }
        }
    };

    const toggleProductSelection = (id) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    const toggleAllSelection = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            const newSelected = new Set(filteredProducts.map(p => p.id));
            setSelectedProducts(newSelected);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            unit: 'Adet',
            taxRate: 20,
            category: 'Genel',
            image: null
        });
        setIsEditing(false);
        setCurrentProduct(null);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Tümü' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(products, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `urunler_${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            toast.loading('İçe aktarılıyor...', { id: 'import-loading' });
            let importedProducts = [];

            if (file.name.endsWith('.json')) {
                const text = await file.text();
                importedProducts = JSON.parse(text);
            } else if (file.name.match(/\.(xlsx|xls|csv)$/)) {
                importedProducts = await parseExcelFile(file);
            } else {
                toast.error('Desteklenmeyen dosya formatı', { id: 'import-loading' });
                return;
            }

            toast.dismiss('import-loading');

            if (Array.isArray(importedProducts)) {
                let count = 0;
                for (const p of importedProducts) {
                    if (p.name && (p.price !== undefined && p.price !== null)) {
                        const { id, ...productData } = p;
                        await db.add('products', {
                            ...productData,
                            price: parseFloat(productData.price),
                            id: Date.now() + count++
                        });
                    }
                }
                toast.success(`${count} ürün başarıyla eklendi`);
                loadProducts();
            } else {
                toast.error('Geçersiz veri formatı');
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('İçe aktarma hatası: ' + error.message, { id: 'import-loading' });
        }

        e.target.value = '';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ürün Kataloğu Yönetimi" size="xl">
            <div className="flex flex-col md:flex-row gap-6 h-[75vh]">

                {/* Left: List/Grid */}
                <div className="w-full md:w-3/5 flex flex-col border-r border-[var(--border-color)] pr-4">

                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 mb-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 text-[var(--text-muted)]" size={18} />
                                <input
                                    type="text"
                                    className="form-control pl-10"
                                    placeholder="Ürün Ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border-color)]">
                                <button
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-[var(--text-muted)]'}`}
                                    onClick={() => setViewMode('list')}
                                    title="Liste Görünümü"
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-[var(--text-muted)]'}`}
                                    onClick={() => setViewMode('grid')}
                                    title="Izgara Görünümü"
                                >
                                    <Grid size={18} />
                                </button>
                            </div>

                            <div className="flex gap-1 ml-2 items-center">
                                <label className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer transition-colors" title="İçe Aktar (Excel/CSV/JSON)">
                                    <Upload size={18} />
                                    <input type="file" className="hidden" accept=".json, .xlsx, .xls, .csv" onChange={handleImport} />
                                </label>
                                <button
                                    className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                                    onClick={handleExport}
                                    title="JSON Dışa Aktar"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                <button
                                    className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${selectedCategory === 'Tümü' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
                                    onClick={() => setSelectedCategory('Tümü')}
                                >
                                    Tümü
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bulk Actions Bar */}
                        {selectedProducts.size > 0 && (
                            <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                <span className="text-sm text-red-600 dark:text-red-400 font-medium px-2">
                                    {selectedProducts.size} ürün seçildi
                                </span>
                                <button
                                    className="btn btn-sm btn-danger flex items-center gap-1"
                                    onClick={handleBulkDelete}
                                >
                                    <Trash2 size={14} /> Seçilenleri Sil
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                                <p>Ürün bulunamadı.</p>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'list' ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[var(--text-muted)] border-b border-[var(--border-color)]">
                                            <button onClick={toggleAllSelection} className="hover:text-[var(--primary)]">
                                                {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </button>
                                            <span className="flex-1">Ürün Adı</span>
                                            <span className="w-24 text-right">Fiyat</span>
                                            <span className="w-8"></span>
                                        </div>
                                        {filteredProducts.map(product => (
                                            <div
                                                key={product.id}
                                                className={`p-3 border rounded-lg flex justify-between items-center group transition-colors cursor-pointer ${currentProduct?.id === product.id
                                                    ? 'bg-[var(--bg-hover)] border-[var(--primary)]'
                                                    : 'border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                                                    }`}
                                                onClick={() => handleEdit(product)}
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div onClick={(e) => { e.stopPropagation(); toggleProductSelection(product.id); }} className="text-[var(--text-muted)] hover:text-[var(--primary)]">
                                                        {selectedProducts.has(product.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </div>
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded flex items-center justify-center text-[var(--text-muted)] border border-[var(--border-color)]">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-[var(--text-primary)]">{product.name}</div>
                                                        <div className="text-xs text-[var(--text-muted)]">{product.category || 'Genel'}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="font-semibold text-[var(--text-primary)]">{product.price} ₺</div>
                                                    <button
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        {filteredProducts.map(product => (
                                            <div
                                                key={product.id}
                                                className={`border rounded-lg overflow-hidden group transition-all cursor-pointer flex flex-col ${currentProduct?.id === product.id
                                                    ? 'ring-2 ring-[var(--primary)] border-transparent'
                                                    : 'border-[var(--border-color)] hover:shadow-md'
                                                    }`}
                                                onClick={() => handleEdit(product)}
                                            >
                                                <div className="relative aspect-square bg-[var(--bg-secondary)]">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                                            <ImageIcon size={32} />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 left-2" onClick={(e) => { e.stopPropagation(); toggleProductSelection(product.id); }}>
                                                        <div className={`bg-white/90 dark:bg-black/50 rounded p-1 ${selectedProducts.has(product.id) ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                                                            {selectedProducts.has(product.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            className="p-1.5 bg-white/90 dark:bg-black/50 text-red-600 hover:text-red-700 rounded shadow-sm"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-3 flex flex-col flex-1">
                                                    <div className="font-medium text-[var(--text-primary)] line-clamp-1" title={product.name}>{product.name}</div>
                                                    <div className="text-xs text-[var(--text-muted)] mb-2">{product.category || 'Genel'}</div>
                                                    <div className="mt-auto font-bold text-[var(--primary)]">{product.price} ₺</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div >

                {/* Right: Form */}
                < div className="w-full md:w-2/5 pl-2 overflow-y-auto custom-scrollbar" >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            {isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                        </h3>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <button className="btn btn-sm btn-ghost text-[var(--text-muted)]" onClick={handleCancelEdit}>
                                    Vazgeç
                                </button>
                            ) : (
                                <button
                                    className="btn btn-sm btn-ghost text-[var(--primary)]"
                                    onClick={resetForm}
                                    title="Formu Temizle"
                                >
                                    <Plus size={16} /> Yeni
                                </button>
                            )}
                        </div>

                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-group">
                            <label className="form-label" htmlFor="productName">Ürün Adı</label>
                            <input type="text" className="form-control" id="productName" name="name" value={formData.name} onChange={handleInputChange} autoComplete="off" />
                        </div>

                        <div className="form-group">
                            <div className="flex justify-between items-center mb-1">
                                <label className="form-label mb-0" htmlFor="productCategory">Kategori</label>
                                <button
                                    type="button"
                                    className="text-xs text-[var(--primary)] hover:underline"
                                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                                >
                                    {showCategoryManager ? 'Kapat' : 'Yönet'}
                                </button>
                            </div>

                            {showCategoryManager && (
                                <div className="mb-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="form-control text-sm"
                                            placeholder="Yeni Kategori..."
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                        />
                                        <button type="button" className="btn btn-sm btn-primary" onClick={handleAddCategory}>Ekle</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                        {categories.map(cat => (
                                            <div key={cat} className="flex items-center gap-1 bg-white dark:bg-slate-700 px-2 py-1 rounded text-xs border border-[var(--border-color)]">
                                                <span>{cat}</span>
                                                {cat !== 'Genel' && (
                                                    <button type="button" onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:text-red-700">
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <select
                                className="form-control form-select"
                                id="productCategory"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <button type="submit" className="btn btn-primary w-full">
                                {isEditing ? 'Değişiklikleri Kaydet' : 'Ürünü Ekle'}
                            </button>
                        </div>
                    </form>
                </div >
            </div >
        </Modal >
    );
};

export default ProductManagerModal;
