import * as XLSX from 'xlsx';

export const exportQuoteToExcel = (quoteData, items) => {
    try {
        // 1. Prepare Data for the Sheet
        const rows = [];

        // Header Info
        rows.push(['FİYAT TEKLİFİ']);
        rows.push(['']); // Empty row
        rows.push(['Tarih:', new Date().toLocaleDateString('tr-TR')]);
        rows.push(['Teklif No:', quoteData?.id || '-']);
        rows.push(['']);

        // Customer & Company Info (Side by Side if possible, but sequential for simplicity in CSV/Basic Excel)
        rows.push(['MÜŞTERİ BİLGİLERİ', '', 'FİRMA BİLGİLERİ']);
        rows.push([
            quoteData?.customer?.name || '-',
            '',
            quoteData?.company?.name || '-'
        ]);
        rows.push([
            quoteData?.customer?.company || '',
            '',
            quoteData?.company?.email || ''
        ]);
        rows.push([
            quoteData?.customer?.email || '',
            '',
            quoteData?.company?.phone || ''
        ]);
        rows.push(['']);
        rows.push(['']);

        // Items Table Header
        rows.push(['Ürün/Hizmet', 'Açıklama', 'Miktar', 'Birim', 'Birim Fiyat', 'Toplam']);

        // Items Data
        items.forEach(item => {
            rows.push([
                item.name,
                item.description || '',
                item.quantity,
                item.unit,
                item.price,
                item.total
            ]);
        });

        rows.push(['']);

        // Totals
        rows.push(['', '', '', '', 'Ara Toplam:', quoteData?.subTotal]);
        if (quoteData?.discount > 0) {
            rows.push(['', '', '', '', 'İskonto:', quoteData?.discount]);
        }
        rows.push(['', '', '', '', `KDV (%${quoteData?.taxRate || 20}):`, quoteData?.taxAmount]);
        rows.push(['', '', '', '', 'GENEL TOPLAM:', quoteData?.grandTotal]);

        // 2. Create Workbook and Worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Optional: Set column widths
        const wscols = [
            { wch: 30 }, // A: Name
            { wch: 30 }, // B: Description
            { wch: 10 }, // C: Quantity
            { wch: 10 }, // D: Unit
            { wch: 15 }, // E: Price
            { wch: 15 }  // F: Total
        ];
        ws['!cols'] = wscols;

        // 3. Append Sheet
        XLSX.utils.book_append_sheet(wb, ws, "Teklif");

        // 4. Generate File
        const fileName = `Teklif_${quoteData?.customer?.name || 'Musteri'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        return true;
    } catch (error) {
        console.error("Excel export error:", error);
        throw error;
    }
};
