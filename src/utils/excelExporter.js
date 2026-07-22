import * as XLSX from 'xlsx';

const COL_WIDTHS = [30, 30, 10, 10, 15, 10, 10, 15];

function safe(val, fallback = '') {
    return val != null ? val : fallback;
}

function toLocale(val) {
    if (val == null) return '';
    return typeof val === 'number' ? val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(val);
}

export const exportQuoteToExcel = (quoteData, items) => {
    try {
        const rows = [];

        rows.push(['FİYAT TEKLİFİ']);
        rows.push([]);
        rows.push(['Tarih:', safe(quoteData?.date, new Date().toLocaleDateString('tr-TR'))]);
        rows.push(['Teklif No:', safe(quoteData?.number, '-')]);
        rows.push([]);

        rows.push(['MÜŞTERİ BİLGİLERİ', '', 'FİRMA BİLGİLERİ']);
        rows.push([
            safe(quoteData?.customer?.name, '-'),
            '',
            safe(quoteData?.company?.name, '-')
        ]);
        rows.push([
            safe(quoteData?.customer?.company),
            '',
            safe(quoteData?.company?.email)
        ]);
        rows.push([
            safe(quoteData?.customer?.email),
            '',
            safe(quoteData?.company?.phone)
        ]);
        rows.push([]);
        rows.push([]);

        rows.push(['Ürün/Hizmet', 'Açıklama', 'Miktar', 'Birim', 'Birim Fiyat', 'İskonto %', 'KDV %', 'Toplam']);

        (items || []).forEach(item => {
            rows.push([
                safe(item.name),
                safe(item.description),
                safe(item.quantity),
                safe(item.unit),
                safe(item.price),
                (item.discountRate || item.lineDiscountRate) > 0 ? `${item.discountRate || item.lineDiscountRate}%` : '',
                item.taxRate > 0 ? `%${item.taxRate}` : '',
                toLocale(item.netTotal || (item.quantity * item.price))
            ]);
        });

        rows.push([]);

        rows.push(['', '', '', '', '', '', 'Ara Toplam:', toLocale(quoteData?.subTotal)]);
        if (quoteData?.discount?.value > 0) {
            const discountLabel = quoteData.discount.type === 'percentage'
                ? `Genel İskonto (%${quoteData.discount.value})`
                : 'Genel İskonto';
            rows.push(['', '', '', '', '', '', discountLabel, toLocale(quoteData?.globalDiscountAmount)]);
        }
        rows.push(['', '', '', '', '', '', 'Toplam KDV:', toLocale(quoteData?.taxAmount)]);
        rows.push(['', '', '', '', '', '', 'GENEL TOPLAM:', toLocale(quoteData?.grandTotal)]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = COL_WIDTHS.map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws, 'Teklif');

        const customerName = quoteData?.customer?.name || 'Musteri';
        const fileName = `Teklif_${customerName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        return true;
    } catch (error) {
        console.error('Excel export error:', error);
        throw error;
    }
};

export const exportQuoteToCSV = (quoteData, items) => {
    try {
        const lines = [];
        const csvSep = ';';

        const esc = (val) => {
            const s = String(val != null ? val : '');
            return s.includes(csvSep) || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"`
                : s;
        };

        const row = (...cells) => lines.push(cells.map(esc).join(csvSep));

        row('FİYAT TEKLİFİ');
        row('');
        row('Tarih:', quoteData?.date || new Date().toLocaleDateString('tr-TR'));
        row('Teklif No:', quoteData?.number || '-');
        row('');
        row('MÜŞTERİ BİLGİLERİ', '', 'FİRMA BİLGİLERİ');
        row(
            quoteData?.customer?.name || '-',
            '',
            quoteData?.company?.name || '-'
        );
        row(
            quoteData?.customer?.company || '',
            '',
            quoteData?.company?.email || ''
        );
        row(
            quoteData?.customer?.email || '',
            '',
            quoteData?.company?.phone || ''
        );
        row('');
        row('');
        row('Ürün/Hizmet', 'Açıklama', 'Miktar', 'Birim', 'Birim Fiyat', 'İskonto %', 'KDV %', 'Toplam');

        (items || []).forEach(item => {
            row(
                item.name || '',
                item.description || '',
                item.quantity || 0,
                item.unit || '',
                item.price || 0,
                (item.discountRate || item.lineDiscountRate) > 0 ? `${item.discountRate || item.lineDiscountRate}%` : '',
                item.taxRate > 0 ? `%${item.taxRate}` : '',
                toLocale(item.netTotal || (item.quantity * item.price))
            );
        });

        row('');
        row('', '', '', '', '', '', 'Ara Toplam:', toLocale(quoteData?.subTotal));
        if (quoteData?.discount?.value > 0) {
            const discountLabel = quoteData.discount.type === 'percentage'
                ? `Genel İskonto (%${quoteData.discount.value})`
                : 'Genel İskonto';
            row('', '', '', '', '', '', discountLabel, toLocale(quoteData?.globalDiscountAmount));
        }
        row('', '', '', '', '', '', 'Toplam KDV:', toLocale(quoteData?.taxAmount));
        row('', '', '', '', '', '', 'GENEL TOPLAM:', toLocale(quoteData?.grandTotal));

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const customerName = quoteData?.customer?.name || 'Musteri';
        a.download = `Teklif_${customerName}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('CSV export error:', error);
        throw error;
    }
};
