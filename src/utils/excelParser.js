import * as XLSX from 'xlsx';

/**
 * Parses an Excel or CSV file and returns a list of normalized products.
 * @param {File} file - The file object to parse.
 * @returns {Promise<Array>} - A promise that resolves to an array of product objects.
 */
export const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get the first worksheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    reject(new Error("Dosya boş veya başlık satırı yok."));
                    return;
                }

                // Extract headers and map to standardized keys
                const headers = jsonData[0].map(h => h?.toString().trim().toLowerCase());
                const rows = jsonData.slice(1);

                const products = rows.map(row => {
                    const product = {};

                    headers.forEach((header, index) => {
                        const value = row[index];
                        if (value === undefined || value === null) return;

                        // Map common Turkish and English headers to internal keys
                        if (['ürün adı', 'urun adi', 'ürün', 'name', 'product name'].includes(header)) {
                            product.name = value.toString().trim();
                        } else if (['fiyat', 'birim fiyat', 'price', 'unit price'].includes(header)) {
                            product.price = parseFloat(value);
                        } else if (['birim', 'unit'].includes(header)) {
                            product.unit = value.toString().trim();
                        } else if (['açıklama', 'aciklama', 'description', 'desc'].includes(header)) {
                            product.description = value.toString().trim();
                        } else if (['kategori', 'category'].includes(header)) {
                            product.category = value.toString().trim();
                        }
                    });

                    // Only return if it has at least a name
                    return product.name ? product : null;
                }).filter(p => p !== null);

                resolve(products);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
