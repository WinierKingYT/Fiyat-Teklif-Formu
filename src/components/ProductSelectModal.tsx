import { Search, Package, Plus, Filter, CheckSquare, Square } from 'lucide-react';
import React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Skeleton from '@/components/Skeleton';
import useDebounce from '@/hooks/useDebounce';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import Logger from '@/utils/logger';

interface SelectableProduct {
    id: string | number;
    name: string;
    price: number;
    unit?: string;
    category?: string;
    image?: string | null;
}

interface ProductSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (products: SelectableProduct | SelectableProduct[]) => void;
}

const ProductSelectModal: React.FC<ProductSelectModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { db, isReady } = useIndexedDB();
    const [products, setProducts] = useState<SelectableProduct[]>([]);
    const [categories, setCategories] = useState(['Genel']);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [loading, setLoading] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Set<string | number>>(new Set());
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

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
            const result = await (db).getAll<SelectableProduct>('products');
            setProducts(result);
        } catch (error) {
            Logger.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const storedCategories = await (db).get<{ id?: string; key?: string; value: string[] }>('settings', 'product_categories');
            if (storedCategories && storedCategories.value) setCategories(storedCategories.value);
            else setCategories(['Genel', 'Hizmet', 'Elektronik', 'Giyim']);
        } catch (error) {
            Logger.error('Error loading categories:', error);
        }
    };

    const toggleProductSelection = (product: SelectableProduct) => {
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

    const debouncedSearch = useDebounce(searchTerm, 250);
    const filteredProducts = useMemo(() =>
        products.filter(p => {
            const q = debouncedSearch.toLowerCase();
            const matchesSearch = p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
            const matchesCategory = selectedCategory === 'Tümü' || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        }),
        [products, debouncedSearch, selectedCategory]
    );

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const paginatedProducts = useMemo(() =>
        filteredProducts.slice(0, page * PAGE_SIZE),
        [filteredProducts, page]
    );

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    // Reset page when search/filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategory]);

    const hasFilter = searchTerm || selectedCategory !== 'Tümü';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Katalogdan Ürün Ekle" size="lg">
            <div className="space-y-3 flex flex-col h-[65vh]">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
                        <input type="text" className="form-control pl-8 text-xs" placeholder="Ürün adı veya kategori ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="form-control text-xs w-36 cursor-pointer" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="Tümü">Tüm Kategoriler</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden flex-1 overflow-y-auto relative">
                    {loading ? (
                        <div className="p-4 space-y-2">
                            <Skeleton variant="row" count={4} />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <EmptyState
                            icon={<Package size={24} />}
                            title={hasFilter ? 'Sonuç bulunamadı' : 'Henüz kayıtlı ürün yok'}
                            text={hasFilter ? 'Farklı bir arama terimi deneyin.' : 'Ürün yöneticisinden ürün ekleyebilirsiniz.'}
                        />
                    ) : (
                        <table className="w-full text-xs text-left">
                            <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] sticky top-0 z-10 font-semibold border-b border-[var(--color-border)]">
                                <tr>
                                    <th className="p-2.5 w-8">
                                        <button type="button" onClick={toggleAllSelection} className="hover:text-[var(--color-primary)]">
                                            {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ?
                                                <CheckSquare size={14} className="text-[var(--color-primary)]" /> :
                                                <Square size={14} className="text-[var(--color-text-muted)]" />
                                            }
                                        </button>
                                    </th>
                                    <th className="p-2.5">Ürün Adı</th>
                                    <th className="p-2.5">Kategori</th>
                                    <th className="p-2.5 text-right">Birim Fiyat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]/50">
                                {paginatedProducts.map((product) => {
                                    const isSelected = selectedProducts.has(product.id);
                                    return (
                                        <tr key={product.id} className={`hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer ${isSelected ? 'bg-[var(--color-primary-muted)]' : ''}`} onClick={() => toggleProductSelection(product)}>
                                            <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                                {isSelected ?
                                                    <CheckSquare size={14} className="text-[var(--color-primary)]" /> :
                                                    <Square size={14} className="text-[var(--color-text-muted)]" />
                                                }
                                            </td>
                                            <td className="p-2.5 font-medium text-[var(--color-text)]">
                                                <div className="flex items-center gap-2">
                                                    {product.image && <img src={product.image} alt="" className="w-6 h-6 rounded object-cover border border-[var(--color-border)]" />}
                                                    <span>{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-2.5 text-[var(--color-text-muted)]">{product.category || '-'}</td>
                                            <td className="p-2.5 font-mono font-semibold text-right text-[var(--color-text)]">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.price)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    {!loading && filteredProducts.length > PAGE_SIZE && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={filteredProducts.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]/50">
                    <div className="text-xs text-[var(--color-text-muted)]">
                        {selectedProducts.size > 0 ? `${selectedProducts.size} ürün seçildi` : 'Seçmek için satıra tıklayın'}
                    </div>
                    <div className="flex gap-2">
                        <button type="button" className="btn btn-outline btn-xs" onClick={onClose}>Kapat</button>
                        <button type="button" className="btn btn-primary btn-xs" onClick={handleAddSelected} disabled={selectedProducts.size === 0}>
                            <Plus size={13} /> Ekle ({selectedProducts.size})
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProductSelectModal;
