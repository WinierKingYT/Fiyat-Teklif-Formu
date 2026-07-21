import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Search, Package, Plus, Filter, CheckSquare, Square } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import Logger from '../utils/logger';

const ProductSelectModal = ({ isOpen, onClose, onSelect }) => {
    const { db, isReady } = useIndexedDB();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['Genel']);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [loading, setLoading] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState(new Set());

    useEffect(() => {
        if (isOpen && isReady) {
            loadProducts();
            loadCategories();
            setSelectedProducts(new Set());
        }
    }, [isOpen, isReady]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const result = await db.getAll('products');
            setProducts(result);
        } catch (error) {
            Logger.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const storedCategories = await db.get('settings', 'product_categories');
            if (storedCategories && storedCategories.value) setCategories(storedCategories.value);
            else setCategories(['Genel', 'Hizmet', 'Elektronik', 'Giyim']);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const toggleProductSelection = (product) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(product.id)) newSelected.delete(product.id);
        else newSelected.add(product.id);
        setSelectedProducts(newSelected);
    };

    const toggleAllSelection = () => {
        if (selectedProducts.size === filteredProducts.length && filteredProducts.length > 0) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleAddSelected = () => {
        const selectedItems = products.filter(p => selectedProducts.has(p.id));
        onSelect(selectedItems);
        onClose();
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Tümü' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ürün/Hizmet Seç" size="lg">
            <div className="space-y-4 flex flex-col h-[70vh]">
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                            <input type="text" className="form-control pl-9" placeholder="Ürün adı veya kategori ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <select className="form-control w-40" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            <option value="Tümü">Tüm Kategoriler</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden flex-1 overflow-y-auto relative">
                    {loading ? (
                        <div className="p-8 text-center text-[var(--color-text-muted)]">Yükleniyor...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-8 text-center text-[var(--color-text-muted)]">
                            {searchTerm ? 'Sonuç bulunamadı.' : 'Henüz kayıtlı ürün yok.'}
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 w-10">
                                        <button onClick={toggleAllSelection} className="hover:text-[var(--color-primary)]">
                                            {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ?
                                                <CheckSquare size={18} className="text-[var(--color-primary)]" /> :
                                                <Square size={18} className="text-[var(--color-text-muted)]" />
                                            }
                                        </button>
                                    </th>
                                    <th className="p-3 font-medium">Ürün Adı</th>
                                    <th className="p-3 font-medium">Kategori</th>
                                    <th className="p-3 font-medium text-right">Birim Fiyat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {filteredProducts.map((product) => {
                                    const isSelected = selectedProducts.has(product.id);
                                    return (
                                        <tr key={product.id} className={`hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer ${isSelected ? 'bg-[var(--color-primary-muted)]' : ''}`} onClick={() => toggleProductSelection(product)}>
                                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                                {isSelected ?
                                                    <CheckSquare size={18} className="text-[var(--color-primary)]" /> :
                                                    <Square size={18} className="text-[var(--color-text-muted)]" />
                                                }
                                            </td>
                                            <td className="p-3 font-medium text-[var(--color-text)]">
                                                <div className="flex items-center gap-2">
                                                    {product.image && <img src={product.image} alt="" className="w-8 h-8 rounded-[var(--radius-sm)] object-cover border border-[var(--color-border)]" />}
                                                    {product.name}
                                                </div>
                                            </td>
                                            <td className="p-3 text-[var(--color-text-muted)]">{product.category || '-'}</td>
                                            <td className="p-3 font-mono text-right text-[var(--color-text)]">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.price)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
                    <div className="text-sm text-[var(--color-text-muted)]">
                        {selectedProducts.size} ürün seçildi
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-outline" onClick={onClose}>İptal</button>
                        <button className="btn btn-primary" onClick={handleAddSelected} disabled={selectedProducts.size === 0}>
                            <Plus size={16} /> Seçilenleri Ekle ({selectedProducts.size})
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProductSelectModal;