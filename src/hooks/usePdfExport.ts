import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { calculateQuoteTotals } from '@/utils/calculations';
import { shareQuote } from '@/utils/emailService';
import { exportQuoteToExcel, exportQuoteToCSV } from '@/utils/excelExporter';
import { generatePDF, printQuote, loadPdfFonts, getPdfMetadata, PAGE_SIZES, type PageSize, type PdfQuality } from '@/utils/pdfGenerator';
import type { QuoteData, CustomerData, CompanyData, BankData, QuoteItem, Discount } from '@/context/quote/types';
import type { PdfConfig } from '@/context/quote/types';
import type html2pdfType from 'html2pdf.js';

type Html2PdfOptions = NonNullable<Parameters<typeof html2pdfType>[1]>;

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
        const customerPart = sanitizeFileNamePart(customerData.name || 'Musteri');
        const numberPart = quoteData.number || t('draft');
        const datePart = new Date().toISOString().slice(0, 10);
        return `${slug}_${customerPart}_${numberPart}_${datePart}.pdf`;
    }, [quoteData.language, quoteData.number, customerData.name, sanitizeFileNamePart, t]);

    const generationStageLabels: Record<string, string> = {
        fonts: t('pdfPreparing'),
        images: t('pdfProcessingImages'),
        render: t('pagesProcessing'),
        save: t('pdfSaving'),
        done: t('pdfSaving')
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        setGenerationStage(t('pdfPreparing'));
        try {
            const filename = buildPdfFilename();
            await new Promise(resolve => setTimeout(resolve, 100));
            const result = await generatePDF('printable-quote-container-panel', filename, {
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
                onStage: (stage) => setGenerationStage(generationStageLabels[stage] || t('pdfPreparing'))
            });
            if (result) {
                toast.success(t('pdfDownloaded').replace('{size}', result.sizeText).replace('{time}', result.elapsedText));
            }
        } finally {
            setIsGenerating(false);
            setGenerationStage('');
        }
    };

    const handlePrint = () => {
        printQuote('printable-quote-container-panel', {
            language: quoteData.language || 'tr',
            backgroundColor: pdfConfig.pageBackgroundColor || '#ffffff',
            pageSize,
            orientation: pdfConfig.pageOrientation || 'portrait'
        });
    };

    const handleShare = async () => {
        try {
            const element = document.getElementById('printable-quote-container-panel');
            if (!element) { toast.error(t('pdfAreaNotFound')); return; }
            const { default: html2pdf } = await import('html2pdf.js');
            await loadPdfFonts([pdfConfig.globalFontFamily, pdfConfig.titleFontFamily, pdfConfig.labelFontFamily, pdfConfig.bodyFontFamily, pdfConfig.fontFamily].filter((f): f is string => Boolean(f)));
            const isLandscape = pdfConfig.pageOrientation === 'landscape';
            const baseSize = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
            const shareFormat: [number, number] = isLandscape ? [baseSize.height, baseSize.width] : [baseSize.width, baseSize.height];
            const shareOrientation = isLandscape ? 'landscape' : 'portrait';
            const qual = quality === 'draft' ? 2 : quality === 'normal' ? 3 : quality === 'high' ? 4 : quality === 'print' ? 5 : 6;
            const maxDomDim = Math.max(element.scrollWidth || 0, element.scrollHeight || 0, 1);
            const effectiveScale = Math.max(1, Math.min(qual, Math.floor(16384 / Math.max(1, maxDomDim))));

            // Zoom transform protection for all ancestors
            const scaledAncestors: { el: HTMLElement; originalTransform: string; originalZoom: string; originalTransition: string }[] = [];
            let p: HTMLElement | null = element.parentElement as HTMLElement | null;
            while (p) {
                const hasTransform = p.style.transform && p.style.transform.includes('scale(');
                const pStyleZoom = (p.style as unknown as { zoom?: string }).zoom;
                if (hasTransform || (pStyleZoom && pStyleZoom !== '1' && pStyleZoom !== 'normal')) {
                    scaledAncestors.push({
                        el: p,
                        originalTransform: p.style.transform,
                        originalZoom: pStyleZoom || '',
                        originalTransition: p.style.transition
                    });
                    p.style.transition = 'none';
                    p.style.transform = 'none';
                    (p.style as unknown as { zoom?: string }).zoom = '1';
                }
                p = p.parentElement as HTMLElement | null;
            }

            // Canvas to image conversion for signatures/stamps
            const origCanvases = element.querySelectorAll<HTMLCanvasElement>('canvas');
            const canvasReplacements: { canvas: HTMLCanvasElement; placeholder: HTMLImageElement; originalDisplay: string }[] = [];
            origCanvases.forEach(canvas => {
                try {
                    const originalDisplay = canvas.style.display;
                    const img = document.createElement('img');
                    img.src = canvas.toDataURL('image/png');
                    img.style.cssText = canvas.style.cssText;
                    img.className = canvas.className;
                    canvas.parentNode?.insertBefore(img, canvas);
                    canvas.style.display = 'none';
                    canvasReplacements.push({ canvas, placeholder: img, originalDisplay });
                } catch {
                    // Ignore cross-origin canvas security errors
                }
            });

            try {
                const shareOptions = {
                    margin: 0,
                    image: { type: 'png', quality: 1.0 },
                    html2canvas: {
                        scale: effectiveScale,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: pdfConfig.pageBackgroundColor || '#ffffff',
                        imageTimeout: 0,
                        letterRendering: quality !== 'draft',
                        ignoreElements: (el: Element) => {
                            return (
                                el.classList?.contains('no-print') ||
                                el.classList?.contains('pdf-placeholder') ||
                                el.getAttribute?.('data-no-print') === 'true'
                            );
                        }
                    },
                    jsPDF: {
                        unit: 'mm',
                        format: shareFormat,
                        orientation: shareOrientation,
                        compress: true,
                        properties: {
                            title: pdfConfig.title || getPdfMetadata(quoteData.language || 'tr').title,
                            author: companyData.name || 'TeklifApp'
                        }
                    },
                    pagebreak: {
                        mode: ['css', 'legacy'],
                        before: ['.pdf-page:not(:first-child)', '.pdf-page-break', '[class*="pdf-page-break"]'],
                        avoid: [
                            '.pdf-footer',
                            '[class*="pdf-footer"]',
                            '.signatures-grid',
                            '.summary-section',
                            'tr',
                        ],
                    }
                } as Html2PdfOptions;
                const pdfBlob = await html2pdf().set(shareOptions).from(element).outputPdf('blob');
                const filename = buildPdfFilename();
                const meta = getPdfMetadata(quoteData.language || 'tr');
                await shareQuote(pdfBlob, filename, {
                    title: meta.title,
                    text: meta.subject
                });
                toast.success(t('shareSuccess'));
            } finally {
                canvasReplacements.forEach(({ canvas, placeholder, originalDisplay }) => {
                    canvas.style.display = originalDisplay;
                    placeholder.parentNode?.removeChild(placeholder);
                });
                scaledAncestors.forEach(({ el, originalTransform, originalZoom, originalTransition }) => {
                    el.style.transition = originalTransition;
                    el.style.transform = originalTransform;
                    if (originalZoom) {
                        (el.style as unknown as { zoom?: string }).zoom = originalZoom;
                    }
                });
            }
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
