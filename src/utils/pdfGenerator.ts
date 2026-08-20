import toast from 'react-hot-toast';
import Logger from '@/utils/logger';
import type html2pdfType from 'html2pdf.js';

type Html2PdfOptions = NonNullable<Parameters<typeof html2pdfType>[1]>;

const PAGE_BREAK_STYLE_ID = 'pdf-page-break-styles';
const MAX_IMAGE_DIMENSION = 4096;

export type PageSize = 'a4' | 'a5' | 'letter' | 'legal';
export type PdfQuality = 'draft' | 'normal' | 'high' | 'print' | 'ultra';
export type PdfStage = 'fonts' | 'images' | 'render' | 'save' | 'done';
export type PageOrientation = 'portrait' | 'landscape';

export interface GeneratePdfOptions {
    theme?: string;
    color?: string;
    pageSize?: PageSize;
    quality?: PdfQuality;
    orientation?: PageOrientation;
    margin?: number;
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    language?: string;
    fontFamilies?: string[];
    backgroundColor?: string;
    onStage?: (stage: PdfStage) => void;
}

export interface PrintQuoteOptions {
    language?: string;
    backgroundColor?: string;
    pageSize?: PageSize;
    orientation?: PageOrientation;
}

export interface PdfGenerationResult {
    sizeKB: number;
    elapsedMs: number;
    sizeText: string;
    elapsedText: string;
}

// ─── PDF Font Loading ─────────────────────────────────────────────────────────
const PDF_FONTS: Record<string, string> = {
    'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap',
    'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
    'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap',
    'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
    'Roboto Slab': 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700&display=swap',
    'Oswald': 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap',
    'Merriweather': 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
};

const loadedFonts = new Set<string>();

const extractFontName = (value: string): string => {
    if (!value) return '';
    const match = value.match(/['"]?([A-Za-z][A-Za-z\s]+)['"]?/);
    return match ? match[1].trim() : value.trim();
};

/**
 * Ensures the given font families (bare names or CSS stacks like "'Inter', sans-serif")
 * are loaded from Google Fonts before rendering the PDF.
 */
export const loadPdfFonts = async (fontFamilies: string[] = []) => {
    const families = fontFamilies.map(extractFontName).filter(Boolean);
    if (families.length === 0) {
        await document.fonts.ready;
        return;
    }
    const toLoad = families.filter(f => !loadedFonts.has(f));
    for (const family of toLoad) {
        const url = PDF_FONTS[family];
        if (!url) continue;
        if (!document.querySelector(`link[data-pdf-font="${family}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.dataset.pdfFont = family;
            document.head.appendChild(link);
        }
        loadedFonts.add(family);
    }
    try {
        await Promise.all(families.map(f => document.fonts.load(`400 16px "${f}"`).catch(() => null)));
        await document.fonts.ready;
    } catch (error) {
        Logger.warn('PDF font loading failed (non-critical):', error);
    }
};

// ─── PDF Metadata (language aware) ────────────────────────────────────────────
interface PdfMetadata {
    title: string;
    subject: string;
    keywords: string;
    printTitle: string;
    filename: string;
}

const PDF_METADATA: Record<string, PdfMetadata> = {
    tr: {
        title: 'Fiyat Teklifi',
        subject: 'Fiyat Teklifi Belgesi',
        keywords: 'teklif, fiyat, fatura',
        printTitle: 'Yazdır - Fiyat Teklifi',
        filename: 'teklif.pdf',
    },
    en: {
        title: 'Price Quote',
        subject: 'Price Quote Document',
        keywords: 'quote, price, invoice',
        printTitle: 'Print - Price Quote',
        filename: 'quote.pdf',
    },
    de: {
        title: 'Preisangebot',
        subject: 'Preisangebot Dokument',
        keywords: 'Angebot, Preis, Rechnung',
        printTitle: 'Drucken - Preisangebot',
        filename: 'angebot.pdf',
    },
};

export const getPdfMetadata = (language: string = 'tr'): PdfMetadata => PDF_METADATA[language] || PDF_METADATA.tr;

const injectPageBreakStyles = (containerId?: string) => {
    if (document.getElementById(PAGE_BREAK_STYLE_ID)) return;
    const prefix = containerId ? `#${containerId} ` : '';
    const style = document.createElement('style');
    style.id = PAGE_BREAK_STYLE_ID;
    style.textContent = `
        ${prefix}.pdf-section, ${prefix}[class*="pdf-section"] { page-break-inside: avoid; }
        ${prefix}.pdf-header, ${prefix}[class*="pdf-header"] { page-break-inside: avoid; }
        ${prefix}.pdf-customer, ${prefix}[class*="pdf-customer"] { page-break-inside: avoid; }
        ${prefix}.pdf-items-section { page-break-inside: avoid; }
        ${prefix}.pdf-summary-section { page-break-inside: avoid; }
        ${prefix}.pdf-signatures { page-break-inside: avoid; }
        ${prefix}.pdf-terms-section { page-break-inside: avoid; }
        ${prefix}.pdf-footer { page-break-inside: avoid; }
        ${prefix}.pdf-page-break { page-break-before: always; }
        ${prefix} table { page-break-inside: auto; }
        ${prefix} tr { page-break-inside: avoid; page-break-after: auto; }
        ${prefix} thead { display: table-header-group; }
        ${prefix} tfoot { display: table-footer-group; }
        @media print {
            ${prefix}.pdf-section, ${prefix}[class*="pdf-section"] { page-break-inside: avoid; }
            ${prefix}.pdf-page-break { page-break-before: always; }
            ${prefix} tr { page-break-inside: avoid; }
        }
    `;
    document.head.appendChild(style);
};

const removePageBreakStyles = () => {
    const style = document.getElementById(PAGE_BREAK_STYLE_ID);
    if (style) style.remove();
};

/**
 * Replaces <img> elements with canvases so html2canvas renders them correctly,
 * while capping the final raster size to keep memory usage in check.
 */
const replaceImagesWithCanvas = (container: HTMLElement, scale: number): (() => void) => {
    const images = container.querySelectorAll<HTMLImageElement>('img[src]');
    const restored: { img: HTMLImageElement; canvas: HTMLCanvasElement }[] = [];

    images.forEach(img => {
        if (!img.src || img.src.startsWith('data:image/svg')) return;
        const canvas = document.createElement('canvas');
        let w = img.naturalWidth || (img.width * scale);
        let h = img.naturalHeight || (img.height * scale);
        if (w < 5 || h < 5) return;
        const maxDim = Math.max(w, h);
        if (maxDim > MAX_IMAGE_DIMENSION) {
            const ratio = MAX_IMAGE_DIMENSION / maxDim;
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const origFit = img.style.objectFit || 'contain';
        canvas.style.cssText = img.style.cssText;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        if (origFit === 'contain') {
            const scaleX = canvas.width / w;
            const scaleY = canvas.height / h;
            const s = Math.min(scaleX, scaleY);
            const dx = (canvas.width - w * s) / 2;
            const dy = (canvas.height - h * s) / 2;
            ctx.drawImage(img, dx, dy, w * s, h * s);
        } else {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        img.parentNode?.replaceChild(canvas, img);
        restored.push({ img, canvas });
    });

    return () => {
        restored.forEach(({ img, canvas }) => {
            canvas.parentNode?.replaceChild(img, canvas);
        });
    };
};

const PAGE_SIZES: Record<PageSize, { width: number; height: number }> = {
    'a4': { width: 210, height: 297 },
    'a5': { width: 148, height: 210 },
    'letter': { width: 215.9, height: 279.4 },
    'legal': { width: 215.9, height: 355.6 }
};

const QUALITY_MAP: Record<PdfQuality, { scale: number; letterRendering: boolean }> = {
    'draft': { scale: 2, letterRendering: false },
    'normal': { scale: 3, letterRendering: true },
    'high': { scale: 4, letterRendering: true },
    'print': { scale: 5, letterRendering: true },
    'ultra': { scale: 6, letterRendering: true }
};

export const generatePDF = async (elementId: string, filename?: string, options: GeneratePdfOptions = {}): Promise<PdfGenerationResult | undefined> => {
    const {
        pageSize = 'a4',
        quality = 'high',
        orientation = 'portrait',
        margin = 0,
        title,
        author = 'TeklifApp',
        subject,
        keywords,
        language = 'tr',
        fontFamilies = [],
        backgroundColor = '#ffffff',
        onStage,
    } = options;

    const meta = getPdfMetadata(language);
    const docTitle = title || meta.title;
    const docSubject = subject || meta.subject;
    const docKeywords = keywords || meta.keywords;
    const docFilename = filename || meta.filename;

    const element = document.getElementById(elementId);
    if (!element) {
        Logger.error('PDF generation failed: Element not found', { elementId });
        toast.error('PDF oluşturulacak alan bulunamadı!');
        return undefined;
    }

    const baseSize = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
    const isLandscape = orientation === 'landscape';
    const size = isLandscape
        ? { width: baseSize.height, height: baseSize.width }
        : baseSize;
    const qual = QUALITY_MAP[quality] || QUALITY_MAP.high;
    const startTime = Date.now();

    try {
        onStage?.('fonts');
        const { default: html2pdf } = await import('html2pdf.js');
        await loadPdfFonts(fontFamilies);

        injectPageBreakStyles(elementId);

        onStage?.('images');
        const lowerScale = Math.min(qual.scale, Math.floor(65536 / Math.max(size.width, size.height)));
        const effectiveScale = Math.max(1, lowerScale);

        const restoreImages = replaceImagesWithCanvas(element, effectiveScale);

        try {
            onStage?.('render');
            const opt = {
                margin: margin,
                filename: docFilename,
                image: { type: 'png', quality: 1.0 },
                html2canvas: {
                    scale: effectiveScale,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    letterRendering: qual.letterRendering,
                    backgroundColor,
                    imageTimeout: 0,
                },
                jsPDF: {
                    unit: 'mm',
                    format: [size.width, size.height],
                    orientation: isLandscape ? 'landscape' : 'portrait',
                    compress: true,
                    properties: {
                        title: docTitle,
                        author,
                        subject: docSubject,
                        keywords: docKeywords,
                        creator: 'TeklifApp v7',
                    },
                },
                pagebreak: { mode: ['css', 'legacy'] },
            } as Html2PdfOptions;

            const worker = html2pdf().set(opt);
            const blob = await worker.from(element).outputPdf('blob');
            onStage?.('save');

            const sizeKB = blob.size / 1024;
            const sizeText = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(2)} MB` : `${sizeKB.toFixed(0)} KB`;
            const elapsedMs = Date.now() - startTime;
            const elapsedText = (elapsedMs / 1000).toFixed(1);

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = docFilename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            Logger.log('PDF generated successfully:', { pageSize, quality, size, scale: effectiveScale, sizeKB, elapsedMs });
            return { sizeKB, elapsedMs, sizeText, elapsedText };
        } finally {
            restoreImages();
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
        Logger.error('PDF generation error:', error);
        toast.error(`PDF oluşturulurken bir hata oluştu: ${message}`);
        return undefined;
    } finally {
        removePageBreakStyles();
    }
};

export const printQuote = (elementId: string, options: PrintQuoteOptions = {}) => {
    const { language = 'tr', backgroundColor = '#ffffff', pageSize = 'a4', orientation = 'portrait' } = options;
    const meta = getPdfMetadata(language);
    const element = document.getElementById(elementId);
    if (!element) {
        Logger.error('Print failed: Element not found');
        return;
    }
    const baseSize = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
    const isLandscape = orientation === 'landscape';
    const pageWidth = isLandscape ? baseSize.height : baseSize.width;
    const pageHeight = isLandscape ? baseSize.width : baseSize.height;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        Logger.error('Print failed: Could not open print window');
        window.print();
        return;
    }
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(s => s.outerHTML)
        .join('\n');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${meta.printTitle}</title>
            ${styles}
            <style>
                body { margin: 0; padding: 10mm; background: ${backgroundColor}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @page { margin: 0; size: ${pageWidth}mm ${pageHeight}mm; }
                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    .pdf-section { page-break-inside: avoid; }
                    .pdf-page-break { page-break-before: always; }
                    .pdf-table-row { page-break-inside: avoid; }
                }
                @page :first { margin-top: 0; }
            </style>
        </head>
        <body>
            ${element.innerHTML}
            <script>
                window.onload = function() { window.print(); window.close(); };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

export const PAGE_SIZE_OPTIONS = (Object.keys(PAGE_SIZES) as PageSize[]).map(key => ({
    value: key,
    label: key.toUpperCase()
}));

export const QUALITY_OPTIONS = (Object.keys(QUALITY_MAP) as PdfQuality[]).map(key => ({
    value: key,
    label: key.charAt(0).toUpperCase() + key.slice(1)
}));
