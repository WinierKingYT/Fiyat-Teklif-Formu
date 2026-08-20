import Logger from '@/utils/logger';
import { translations } from '@/utils/translations';
import type { CustomerData, CompanyData, BankData, Discount } from '@/context/quote/types';

export interface ExportItem {
    name?: string;
    description?: string;
    quantity?: number | string;
    unit?: string;
    price?: number | string;
    discountRate?: number | string;
    lineDiscountRate?: number | string;
    taxRate?: number | string;
    netTotal?: number | string;
}

export interface ExportQuoteData {
    date?: string;
    number?: string;
    currency?: string;
    language?: string;
    customer?: Partial<CustomerData>;
    company?: Partial<CompanyData>;
    bankData?: Partial<BankData>;
    terms?: string;
    notes?: string;
    subTotal?: number;
    taxAmount?: number;
    grandTotal?: number;
    globalDiscountAmount?: number;
    discount?: Discount;
}

const LOCALE_MAP: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' };
const FALLBACK_LOCALE = 'tr-TR';
const COL_WIDTHS = [30, 30, 10, 10, 15, 10, 10, 15];

const getLocale = (language?: string) => LOCALE_MAP[language || 'tr'] || FALLBACK_LOCALE;

const getT = (language?: string) => (translations[(language || 'tr') as keyof typeof translations] || translations.tr);

function safe(val: unknown, fallback = ''): string | number {
    return val != null ? (val as string | number) : fallback;
}

function toLocale(val: unknown, locale: string = FALLBACK_LOCALE) {
    if (val == null) return '';
    return typeof val === 'number' ? val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(val);
}

export const buildRows = (quoteData: ExportQuoteData, items: ExportItem[], locale: string): (string | number)[][] => {
    const t = getT(quoteData?.language);
    const rows: (string | number)[][] = [];
    const c = quoteData?.customer || {};
    const comp = quoteData?.company || {};
    const bank = quoteData?.bankData || {};

    rows.push([t.quoteTitle]);
    rows.push([]);
    rows.push([`${t.date}:`, safe(quoteData?.date, new Date().toLocaleDateString(locale))]);
    rows.push([`${t.quoteNo}:`, safe(quoteData?.number, '-')]);
    rows.push([]);

    const custTaxNumber = (c as Record<string, unknown>).taxNumber || (c as Record<string, unknown>).taxNo;
    const compTaxNumber = (comp as Record<string, unknown>).taxNumber || (comp as Record<string, unknown>).taxNo;
    const compTaxOffice = (comp as Record<string, unknown>).taxOffice;

    rows.push([t.customer, '', t.company]);
    rows.push([safe(c.name, '-'), '', safe(comp.name, '-')]);
    rows.push([safe(c.company), '', safe(comp.email)]);
    rows.push([safe(c.email), '', safe(comp.phone)]);
    rows.push([safe(c.phone), '', safe(comp.website)]);
    rows.push([safe(c.address), '', safe(comp.address)]);
    if (c.taxOffice || comp.authorized) {
        rows.push([c.taxOffice ? `${t.taxOffice}: ${safe(c.taxOffice)}` : '', '', comp.authorized ? `${t.authorized}: ${safe(comp.authorized)}` : '']);
    }
    if (custTaxNumber || compTaxOffice || compTaxNumber) {
        const compTaxStr = [compTaxOffice ? `${t.taxOffice}: ${compTaxOffice}` : '', compTaxNumber ? `${t.taxNo}: ${compTaxNumber}` : ''].filter(Boolean).join(' | ');
        rows.push([custTaxNumber ? `${t.taxNo}: ${safe(custTaxNumber)}` : '', '', compTaxStr]);
    }
    rows.push([]);

    rows.push([t.bankInfo]);
    rows.push([`${t.bank}:`, safe(bank.bankName), `${t.branch}:`, safe(bank.branch)]);
    rows.push([`${t.accountNo}:`, safe(bank.accountNumber), `${t.iban}:`, safe(bank.iban)]);
    rows.push([`${t.accountHolder}:`, safe(bank.accountHolder)]);
    rows.push([]);

    rows.push([t.item, t.description, t.quantity, t.unit, t.unitPrice, t.discount, t.vat, t.total]);

    (items || []).forEach(item => {
        const discountRate = Number(item.discountRate ?? item.lineDiscountRate ?? 0);
        const taxRate = Number(item.taxRate ?? 0);
        rows.push([
            safe(item.name),
            safe(item.description),
            safe(item.quantity),
            safe(item.unit),
            safe(item.price),
            discountRate > 0 ? `%${discountRate}` : '',
            taxRate > 0 ? `%${taxRate}` : '',
            toLocale(item.netTotal != null ? item.netTotal : Number(item.quantity) * Number(item.price), locale)
        ]);
    });

    rows.push([]);
    rows.push(['', '', '', '', '', '', t.subtotal, toLocale(quoteData?.subTotal, locale)]);
    const discountValue = quoteData?.discount?.value ?? 0;
    if (discountValue > 0) {
        const discountLabel = quoteData?.discount?.type === 'percentage'
            ? `${t.discount} (%${discountValue})`
            : t.discount;
        rows.push(['', '', '', '', '', '', discountLabel, toLocale(quoteData?.globalDiscountAmount, locale)]);
    }
    rows.push(['', '', '', '', '', '', `${t.total} ${t.vat}`, toLocale(quoteData?.taxAmount, locale)]);
    rows.push(['', '', '', '', '', '', t.generalTotal, toLocale(quoteData?.grandTotal, locale)]);
    rows.push([]);

    if (quoteData?.terms) {
        rows.push([t.terms]);
        rows.push([quoteData.terms]);
        rows.push([]);
    }
    if (quoteData?.notes) {
        rows.push([t.notes]);
        rows.push([quoteData.notes]);
        rows.push([]);
    }

    return rows;
};

export const buildFileName = (quoteData: ExportQuoteData, ext: string) => {
    const t = getT(quoteData?.language);
    const customerName = quoteData?.customer?.name || 'Musteri';
    const slug = (t.quote || 'teklif').toLowerCase();
    return `${slug}_${customerName}_${new Date().toISOString().slice(0, 10)}.${ext}`;
};

export const generateExcelBuffer = async (quoteData: ExportQuoteData, items: ExportItem[]): Promise<Uint8Array> => {
    const XLSX = await import('xlsx').then(m => m.default || m);
    const locale = getLocale(quoteData?.language);
    const rows = buildRows(quoteData, items, locale);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = COL_WIDTHS.map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, getT(quoteData?.language).quote);
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    return new Uint8Array(buffer);
};

export const generateCSVString = (quoteData: ExportQuoteData, items: ExportItem[]): string => {
    const locale = getLocale(quoteData?.language);
    const lines: string[] = [];
    const csvSep = ';';

    const esc = (val: unknown) => {
        const s = String(val != null ? val : '');
        return s.includes(csvSep) || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
    };

    const row = (...cells: unknown[]) => lines.push(cells.map(esc).join(csvSep));
    buildRows(quoteData, items, locale).forEach(r => row(...r));

    const BOM = '\uFEFF';
    return BOM + lines.join('\r\n');
};

export const exportQuoteToExcel = async (quoteData: ExportQuoteData, items: ExportItem[]) => {
    try {
        const XLSX = await import('xlsx').then(m => m.default || m);
        const locale = getLocale(quoteData?.language);
        const rows = buildRows(quoteData, items, locale);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = COL_WIDTHS.map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws, getT(quoteData?.language).quote);
        XLSX.writeFile(wb, buildFileName(quoteData, 'xlsx'));

        return true;
    } catch (error: unknown) {
        Logger.error('Excel export error:', error);
        throw error;
    }
};

export const exportQuoteToCSV = (quoteData: ExportQuoteData, items: ExportItem[]) => {
    try {
        const csvContent = generateCSVString(quoteData, items);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = buildFileName(quoteData, 'csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error: unknown) {
        Logger.error('CSV export error:', error);
        throw error;
    }
};