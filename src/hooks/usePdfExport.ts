import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { calculateQuoteTotals } from '@/utils/calculations';
import { shareQuote } from '@/utils/emailService';
import { exportQuoteToExcel, exportQuoteToCSV } from '@/utils/excelExporter';
import { generatePDF, printQuote, getPdfMetadata, type PageSize, type PdfQuality } from '@/utils/pdfGenerator';
import type { QuoteData, CustomerData, CompanyData, BankData, QuoteItem, Discount } from '@/context/quote/types';
import type { PdfConfig } from '@/context/quote/types';

interface UsePdfExportProps {
    quoteData: QuoteData;
    customerData: CustomerData;
    companyData: CompanyData;
    bankData: BankData;
    items: QuoteItem[];
    discount: Discount;
    pdfConfig: PdfConfig;
    pageSize: PageSize;
    quality: PdfQuality;
    t: (key: string) => string;
}

export const usePdfExport = ({
    quoteData,
    customerData,
    companyData,
    bankData,
    items,
    discount,
    pdfConfig,
    pageSize,
    quality,
    t
}: UsePdfExportProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStage, setGenerationStage] = useState('');

    const sanitizeFileNamePart = useCallback((value: string) => {
        const trMap: Record<string, string> = {
            'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G',
            'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
        };
        const clean = value
            .split('')
            .map(ch => trMap[ch] || ch)
            .join('')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\p{L}\p{N}\s-]/gu, '')
            .trim()
            .replace(/\s+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 40);
        return clean || 'Teklif';
    }, []);

    const buildPdfFilename = useCallback(() => {
        const meta = getPdfMetadata(quoteData.language || 'tr');
        const slug = meta.filename.replace(/\.pdf$/i, '');
        const customerPart = sanitizeFileNamePart(customerData.company || customerData.name || 'Musteri');
        const numberPart = sanitizeFileNamePart(quoteData.number || t('draft'));
        const datePart = new Date().toISOString().slice(0, 10);
        return `${slug}_${customerPart}_${numberPart}_${datePart}.pdf`;
    }, [quoteData.language, quoteData.number, customerData.company, customerData.name, sanitizeFileNamePart, t]);

    const generationStageLabels: Record<string, string> = {
        fonts: t('pdfPreparing'),
        images: t('pdfProcessingImages'),
        render: t('pagesProcessing'),
        save: t('pdfSaving'),
        done: t('pdfSaving')
    };

    const buildPdfGenerationOptions = (saveFile: boolean, onStage?: (stage: 'fonts' | 'images' | 'render' | 'save' | 'done') => void) => ({
        theme: pdfConfig.theme,
        color: pdfConfig.color,
        pageSize,
        quality,
        orientation: pdfConfig.pageOrientation || 'portrait',
        margin: 0,
        title: quoteData.title || pdfConfig.title || getPdfMetadata(quoteData.language || 'tr').title,
        author: companyData.name || 'TeklifApp',
        language: quoteData.language || 'tr',
        fontFamilies: [pdfConfig.globalFontFamily, pdfConfig.titleFontFamily, pdfConfig.labelFontFamily, pdfConfig.bodyFontFamily, pdfConfig.fontFamily].filter((f): f is string => Boolean(f)),
        backgroundColor: pdfConfig.pageBackgroundColor || '#ffffff',
        saveFile,
        onStage
    });

    const getTargetElementId = () => {
        if (document.getElementById('canonical-pdf-export-surface')) {
            return 'canonical-pdf-export-surface';
        }
        return 'printable-quote-container-panel';
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        setGenerationStage(t('pdfPreparing'));
        try {
            const filename = buildPdfFilename();
            await new Promise(resolve => setTimeout(resolve, 100));
            const targetId = getTargetElementId();
            const result = await generatePDF(targetId, filename, buildPdfGenerationOptions(
                true,
                (stage) => setGenerationStage(generationStageLabels[stage] || t('pdfPreparing'))
            ));
            if (result) {
                toast.success(t('pdfDownloaded').replace('{size}', result.sizeText).replace('{time}', result.elapsedText));
            }
        } finally {
            setIsGenerating(false);
            setGenerationStage('');
        }
    };

    const handlePrint = () => {
        const targetId = getTargetElementId();
        printQuote(targetId, {
            language: quoteData.language || 'tr',
            backgroundColor: pdfConfig.pageBackgroundColor || '#ffffff',
            pageSize,
            orientation: pdfConfig.pageOrientation || 'portrait'
        });
    };

    const handleShare = async () => {
        try {
            const filename = buildPdfFilename();
            const targetId = getTargetElementId();
            const result = await generatePDF(targetId, filename, buildPdfGenerationOptions(false));
            if (!result) return;
            const meta = getPdfMetadata(quoteData.language || 'tr');
            await shareQuote(result.blob, filename, {
                title: meta.title,
                text: meta.subject
            });
            toast.success(t('shareSuccess'));
        } catch (error) {
            if (error instanceof Error && error.message !== 'Share cancelled' && error.name !== 'AbortError') {
                toast.error(t('shareFailed') + error.message);
            }
        }
    };

    const buildExportData = () => {
        const calc = calculateQuoteTotals(items, discount, { currency: quoteData.currency, taxMode: quoteData.taxMode });
        return {
            fullQuoteData: {
                ...quoteData,
                customer: customerData,
                company: companyData,
                bankData: bankData,
                items: calc.items,
                subTotal: calc.subtotal,
                taxAmount: calc.taxTotal,
                grandTotal: calc.grandTotal,
                globalDiscountAmount: calc.globalDiscountAmount,
                discount: discount
            },
            calculatedItems: calc.items
        };
    };

    const handleExcelExport = async () => {
        try {
            const { fullQuoteData, calculatedItems } = buildExportData();
            await exportQuoteToExcel(fullQuoteData, calculatedItems);
            toast.success(t('excelDownloaded'));
        } catch (error) {
            toast.error(t('excelError'));
        }
    };

    const handleCsvExport = () => {
        try {
            const { fullQuoteData, calculatedItems } = buildExportData();
            exportQuoteToCSV(fullQuoteData, calculatedItems);
            toast.success(t('csvDownloaded'));
        } catch (error) {
            toast.error(t('csvError'));
        }
    };

    return {
        isGenerating,
        generationStage,
        handleDownload,
        handlePrint,
        handleShare,
        handleExcelExport,
        handleCsvExport,
        buildPdfFilename,
        buildExportData
    };
};
