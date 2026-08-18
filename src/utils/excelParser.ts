export interface ImportedProduct {
    name: string;
    price: number;
    unit?: string;
    description?: string;
    category?: string;
    quantity?: number;
    taxRate?: number;
}

/**
 * Parses an Excel or CSV file and returns a list of normalized products.
 * @param file - The file object to parse.
 * @returns A promise that resolves to an array of product objects.
 */
export const parseExcelFile = async (file: File): Promise<ImportedProduct[]> => {
    const XLSX = await import('xlsx').then(m => m.default || m);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get the first worksheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                if (!worksheet) {
                    reject(new Error('Dosyada çalışma sayfası bulunamadı.'));
                    return;
                }

                // Convert to JSON
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    reject(new Error("Dosya boş veya başlık satırı yok."));
                    return;
                }

                // Extract headers and map to standardized keys
                const headers = jsonData[0].map(h => String(h ?? '').trim().toLowerCase());
                const rows = jsonData.slice(1);

                const products: ImportedProduct[] = [];

                rows.forEach(row => {
                    const product: Partial<ImportedProduct> = {};

                    headers.forEach((header, index) => {
                        const value = row[index];
                        if (value === undefined || value === null) return;

                        // Map common Turkish and English headers to internal keys
                        if (['ürün adı', 'urun adi', 'ürün', 'name', 'product name'].includes(header)) {
                            product.name = String(value).trim();
                        } else if (['fiyat', 'birim fiyat', 'price', 'unit price'].includes(header)) {
                            const parsed = Number(value);
                            if (Number.isFinite(parsed)) product.price = parsed;
                        } else if (['birim', 'unit'].includes(header)) {
                            product.unit = String(value).trim();
                        } else if (['açıklama', 'aciklama', 'description', 'desc'].includes(header)) {
                            product.description = String(value).trim();
                        } else if (['kategori', 'category'].includes(header)) {
                            product.category = String(value).trim();
                        } else if (['miktar', 'adet', 'quantity', 'qty'].includes(header)) {
                            const parsed = Number(value);
                            if (Number.isFinite(parsed)) product.quantity = parsed;
                        } else if (['kdv', 'kdv %', 'vat', 'tax rate', 'vergi'].includes(header)) {
                            const parsed = Number(value);
                            if (Number.isFinite(parsed)) product.taxRate = parsed;
                        }
                    });

                    // Only return if it has at least a name
                    if (product.name) products.push(product as ImportedProduct);
                });

                resolve(products);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Dosya okunamadı.'));
        reader.readAsArrayBuffer(file);
    });
};