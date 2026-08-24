export interface Product {
    id: string | number;
    name: string;
    description?: string;
    price: number;
    unit?: string;
    taxRate?: number;
    category?: string;
    image?: string | null;
}

export interface ProductFormData {
    name: string;
    description: string;
    price: string;
    unit: string;
    taxRate: number;
    category: string;
    image: string | null;
}
