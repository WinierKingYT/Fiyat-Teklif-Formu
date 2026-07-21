import * as XLSX from 'xlsx';

export const exportQuoteToExcel = (quoteData, items) => {
    try {
        const rows = [];

        rows.push(['FİYAT TEKLİFİ']);
        rows.push(['']);
        rows.push(['Tarih:', quoteData?.date || new Date().toLocaleDateString('tr-TR')]);
        rows.push(['Teklif No:', quoteData?.number || '-']);
        rows.push(['']);

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

        rows.push(['Ürün/Hizmet', 'Açıklama', 'Miktar', 'Birim', 'Birim Fiyat', 'İskonto %', 'KDV %', 'Toplam']);

        items.forEach(item => {
            rows.push([
                item.name,
                item.description || '',
                item.quantity,
                item.unit,
                item.price,
                item.lineDiscountRate > 0 ? `${item.lineDiscountRate}%` : '',
                item.taxRate > 0 ? `%${item.taxRate}` : '',
                item.netTotal || (item.quantity * item.price)
            ]);
        });

        rows.push(['']);

        rows.push(['', '', '', '', '', '', 'Ara Toplam:', quoteData?.subTotal]);
        if (quoteData?.discount?.value > 0) {
            const discountLabel = quoteData.discount.type === 'percentage'
                ? `Genel İskonto (%${quoteData.discount.value})`
                : 'Genel İskonto';
            rows.push(['', '', '', '', '', '', discountLabel, quoteData?.grandTotal != null
                ? (quoteData.subTotal + (quoteData.taxAmount || 0) - quoteData.grandTotal)
                : quoteData.discount.value
            ]);
        }
        rows.push(['', '', '', '', '', '', 'Toplam KDV:', quoteData?.taxAmount]);
        rows.push(['', '', '', '', '', '', 'GENEL TOPLAM:', quoteData?.grandTotal]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);

        const wscols = [
            { wch: 30 },
            { wch: 30 },
            { wch: 10 },
            { wch: 10 },
            { wch: 15 },
            { wch: 10 },
            { wch: 10 },
            { wch: 15 }
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Teklif");

        const fileName = `Teklif_${quoteData?.customer?.name || 'Musteri'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        return true;
    } catch (error) {
        console.error("Excel export error:", error);
        throw error;
    }
};
