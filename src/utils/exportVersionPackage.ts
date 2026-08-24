import JSZip from 'jszip';
import { calculateQuoteTotals } from '@/utils/calculations';
import { generateExcelBuffer, generateCSVString } from '@/utils/excelExporter';
import Logger from '@/utils/logger';
import type { QuoteVersion, DbQuote } from '@/context/quote/types';

export interface VersionPackageResult {
    blob: Blob;
    fileName: string;
}

const escapeHtml = (text: unknown): string => {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

export const generatePrintableHtml = (quote: DbQuote, version: QuoteVersion): string => {
    const quoteCurrency = quote.quoteData?.currency || 'TRY';
    const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quoteCurrency });
    const c = quote.customerData || {};
    const comp = quote.companyData || {};
    const bank = quote.bankData || {};

    const rows = calc.items.map((item, idx) => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">
                <strong>${escapeHtml(item.name || '-')}</strong>
                ${item.description ? `<div style="font-size:12px;color:#64748b;">${escapeHtml(item.description)}</div>` : ''}
            </td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.quantity || 0} ${escapeHtml(item.unit || '')}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${Number(item.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">%${item.discountRate || 0}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">%${item.taxRate || 0}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${Number(item.netTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(quote.quoteData?.title || 'Fiyat Teklifi')} - ${escapeHtml(version.versionName || 'Sürüm')}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; border: 1px solid #bfdbfe; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; }
        .box h3 { margin: 0 0 8px 0; font-size: 14px; color: #475569; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
        th { background: #f1f5f9; padding: 8px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; }
        .totals { float: right; width: 320px; margin-bottom: 24px; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .grand-total { font-size: 16px; font-weight: bold; color: #0f172a; border-top: 2px solid #cbd5e1; padding-top: 8px; margin-top: 8px; }
        .footer { clear: both; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 style="margin:0 0 4px 0; font-size: 22px;">${escapeHtml(quote.quoteData?.title || 'FİYAT TEKLİFİ')}</h1>
            <div style="color: #64748b; font-size: 14px;">Teklif No: <strong>${escapeHtml(quote.quoteData?.number || '-')}</strong> | Tarih: ${escapeHtml(quote.quoteData?.date || '-')}</div>
        </div>
        <div style="text-align: right;">
            <span class="badge">Sürüm: ${escapeHtml(version.versionName || 'Snapshot')}</span>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Kayıt: ${new Date(version.createdAt).toLocaleString('tr-TR')}</div>
        </div>
    </div>

    <div class="grid">
        <div class="box">
            <h3>Müşteri Bilgileri</h3>
            <strong>${escapeHtml(c.company || c.name || '-')}</strong>
            ${c.company && c.name ? `<div>Yetkili: ${escapeHtml(c.name)}</div>` : ''}
            ${c.email ? `<div>E-posta: ${escapeHtml(c.email)}</div>` : ''}
            ${c.phone ? `<div>Tel: ${escapeHtml(c.phone)}</div>` : ''}
            ${c.address ? `<div>Adres: ${escapeHtml(c.address)}</div>` : ''}
        </div>
        <div class="box">
            <h3>Teklifi Hazırlayan</h3>
            <strong>${escapeHtml(comp.name || '-')}</strong>
            ${comp.authorized ? `<div>Yetkili: ${escapeHtml(comp.authorized)}</div>` : ''}
            ${comp.email ? `<div>E-posta: ${escapeHtml(comp.email)}</div>` : ''}
            ${comp.phone ? `<div>Tel: ${escapeHtml(comp.phone)}</div>` : ''}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="text-align:center;width:40px;">#</th>
                <th>Ürün / Hizmet</th>
                <th style="text-align:right;">Miktar</th>
                <th style="text-align:right;">Birim Fiyat</th>
                <th style="text-align:right;">İndirim</th>
                <th style="text-align:right;">KDV</th>
                <th style="text-align:right;">Toplam</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>

    <div class="totals">
        <div class="total-row"><span>Ara Toplam:</span> <span>${calc.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${quoteCurrency}</span></div>
        ${calc.globalDiscountAmount > 0 ? `<div class="total-row" style="color:#ef4444;"><span>İndirim:</span> <span>-${calc.globalDiscountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${quoteCurrency}</span></div>` : ''}
        <div class="total-row"><span>KDV Toplamı:</span> <span>${calc.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${quoteCurrency}</span></div>
        <div class="total-row grand-total"><span>Genel Toplam:</span> <span>${calc.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${quoteCurrency}</span></div>
    </div>

    ${bank.bankName || bank.iban ? `
    <div style="clear:both; padding-top:16px;">
        <div class="box">
            <h3>Banka & Ödeme Bilgileri</h3>
            <div><strong>${bank.bankName || ''}</strong> ${bank.branch ? `(${bank.branch})` : ''}</div>
            ${bank.iban ? `<div>IBAN: <code>${bank.iban}</code></div>` : ''}
            ${bank.accountHolder ? `<div>Hesap Sahibi: ${bank.accountHolder}</div>` : ''}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        Bu paket ve sürüm kaydı Fiyat Teklif Formu sistemi tarafından oluşturulmuştur.
    </div>
</body>
</html>`;
};

export const buildVersionPackageZip = async (version: QuoteVersion): Promise<VersionPackageResult> => {
    const snap = version.snapshot;
    const quoteNo = (snap.quoteData?.number || 'TEKLIF').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeVerName = (version.versionName || `v_${version.createdAt}`).replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
    const baseName = `Teklif_${quoteNo}_${safeVerName}`;
    const zipFileName = `${baseName}_Paket.zip`;

    const zip = new JSZip();

    // 1. JSON Snapshot
    const jsonContent = JSON.stringify({
        manifest: {
            packageVersion: '1.0',
            exportedAt: new Date().toISOString(),
            versionId: version.versionId,
            quoteId: version.quoteId,
            versionName: version.versionName,
            createdAt: version.createdAt,
        },
        quote: snap
    }, null, 2);
    zip.file(`${baseName}.json`, jsonContent);

    // 2. CSV Export
    const quoteCurrency = snap.quoteData?.currency || 'TRY';
    const calc = calculateQuoteTotals(snap.items || [], snap.discount || {}, { currency: quoteCurrency });
    const fullData = {
        ...snap.quoteData,
        customer: snap.customerData,
        company: snap.companyData,
        bankData: snap.bankData,
        items: calc.items,
        subTotal: calc.subtotal,
        taxAmount: calc.taxTotal,
        grandTotal: calc.grandTotal,
        globalDiscountAmount: calc.globalDiscountAmount,
        discount: snap.discount
    };

    const csvContent = generateCSVString(fullData, calc.items);
    zip.file(`${baseName}.csv`, csvContent);

    // 3. Excel Export (.xlsx)
    try {
        const xlsxBuffer = await generateExcelBuffer(fullData, calc.items);
        zip.file(`${baseName}.xlsx`, xlsxBuffer);
    } catch (e) {
        Logger.warn('Version package excel generation warning:', e);
    }

    // 4. Standalone Printable HTML
    const htmlContent = generatePrintableHtml(snap, version);
    zip.file(`${baseName}_Ozet.html`, htmlContent);

    // 5. Readme / Manifest
    const readmeContent = `=====================================================
TEKLIF SURUM PAKETI
=====================================================
Teklif No      : ${snap.quoteData?.number || '-'}
Baslik         : ${snap.quoteData?.title || '-'}
Musteri        : ${snap.customerData?.company || snap.customerData?.name || '-'}
Surum Adi      : ${version.versionName || '-'}
Surum Tarihi   : ${new Date(version.createdAt).toLocaleString('tr-TR')}
Paketleme Zamani: ${new Date().toLocaleString('tr-TR')}
Genel Toplam   : ${calc.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${quoteCurrency}
Kalem Sayisi   : ${(snap.items || []).length}

Icerik:
1. ${baseName}.json        -> Tam yedekleme ve yeniden ice aktarilabilir veri
2. ${baseName}.csv         -> Tablo formatinda virgulle ayrilmis veriler (Excel/ERP uyumlu)
3. ${baseName}.xlsx        -> Microsoft Excel formatinda bicimlendirilmis teklif
4. ${baseName}_Ozet.html   -> Tarayicida acilip dogrudan PDF olarak yazdirilabilir gorunum
=====================================================
`;
    zip.file('README.txt', readmeContent);

    const blob = await zip.generateAsync({ type: 'blob' });
    return { blob, fileName: zipFileName };
};

export const exportVersionPackage = async (version: QuoteVersion): Promise<boolean> => {
    try {
        const { blob, fileName } = await buildVersionPackageZip(version);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        Logger.error('Error exporting version package:', error);
        throw error;
    }
};
