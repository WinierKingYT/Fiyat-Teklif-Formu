import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Search, Package, Plus } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import Logger from '../utils/logger';

const ProductSelectModal = ({ isOpen, onClose, onSelect }) => {
    const { db, isReady } = useIndexedDB();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && isReady) {
            loadProducts();
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

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ürün/Hizmet Seç" size="lg">
            <div className="space-y-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            className="form-control pl-9"
                            placeholder="Ürün adı veya kategori ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary whitespace-nowrap">
                        <Plus size={16} /> Yeni Ürün
                    </button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            {searchTerm ? 'Sonuç bulunamadı.' : 'Henüz kayıtlı ürün yok.'}
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="p-3 font-medium">Ürün Adı</th>
                                    <th className="p-3 font-medium">Kategori</th>
                                    <th className="p-3 font-medium">Birim Fiyat</th>
                                    <th className="p-3 font-medium w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-3 font-medium">{product.name}</td>
                                        <td className="p-3">{product.category}</td>
                                        <td className="p-3 font-mono">
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.price)}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => {
                                                    onSelect(product);
                                                    onClose();
                                                }}
                                            >
                                                Seç
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ProductSelectModal;
