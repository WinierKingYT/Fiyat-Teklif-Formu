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
        await Promise.all([
            ...families.map(f => document.fonts.load(`400 16px "${f}"`).catch(() => null)),
            ...families.map(f => document.fonts.load(`700 16px "${f}"`).catch(() => null))
        ]);
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

let pageBreakStyleCount = 0;

const injectPageBreakStyles = (containerId?: string) => {
    pageBreakStyleCount++;
    if (document.getElementById(PAGE_BREAK_STYLE_ID)) return;
    const prefix = containerId ? `#${containerId} ` : '';
    const style = document.createElement('style');
    style.id = PAGE_BREAK_STYLE_ID;
    style.textContent = `
        ${prefix}.pdf-page { margin-bottom: 0 !important; }
        ${prefix}.pdf-section, ${prefix}[class*="pdf-section"] { page-break-inside: avoid !important; break-inside: avoid !important; }
        ${prefix}.pdf-header, ${prefix}[class*="pdf-header"], ${prefix}.header-container { page-break-inside: avoid !important; break-inside: avoid !important; }
        ${prefix}.pdf-customer, ${prefix}[class*="pdf-customer"], ${prefix}.customer-section, ${prefix}.customer-seller-grid { page-break-inside: avoid !important; break-inside: avoid !important; }
        ${prefix}.pdf-items-section { page-break-inside: auto; break-inside: auto; }
        ${prefix}.pdf-summary-section, ${prefix}.summary-section, ${prefix}.summary-grid, ${prefix}.summary-box { page-break-inside: avoid !important; break-inside: avoid !important; }
        ${prefix}.pdf-signatures, ${prefix}.signatures-grid, ${prefix}.signature-section { page-break-inside: avoid !important; break-inside: avoid !important; }
        ${prefix}.pdf-terms-section, ${prefix}.terms-box, ${prefix}.notes-section { page-break-inside: avoid !important; break-inside: avoid !important; }
        ${prefix}.pdf-footer, ${prefix}[class*="pdf-footer"] { page-break-inside: avoid !important; break-inside: avoid !important; }
        ${prefix}.pdf-page:not(:first-child) { page-break-before: always !important; break-before: page !important; }
        ${prefix}.pdf-page-break { page-break-before: always !important; break-before: page !important; }
        ${prefix} table { page-break-inside: auto; }
        ${prefix} tr, ${prefix} tbody tr { page-break-inside: avoid !important; break-inside: avoid !important; page-break-after: auto; }
        ${prefix} thead { display: table-header-group !important; }
        ${prefix} tfoot { display: table-footer-group !important; }
        @media print {
            ${prefix}.pdf-section, ${prefix}[class*="pdf-section"] { page-break-inside: avoid !important; break-inside: avoid !important; }
            ${prefix}.pdf-page-break { page-break-before: always !important; break-before: page !important; }
            ${prefix} tr, ${prefix} tbody tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            ${prefix}.signatures-grid, ${prefix}.terms-box, ${prefix}.summary-grid { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
    `;
    document.head.appendChild(style);
};

const removePageBreakStyles = () => {
    pageBreakStyleCount = Math.max(0, pageBreakStyleCount - 1);
    if (pageBreakStyleCount === 0) {
        const style = document.getElementById(PAGE_BREAK_STYLE_ID);
        if (style) style.remove();
    }
};

/**
 * Ensures all images within the container are loaded before rasterization.
 */
const waitForAllImages = async (container: HTMLElement): Promise<void> => {
    const images = Array.from(container.querySelectorAll<HTMLImageElement>('img[src]'));
    if (images.length === 0) return;
    // Ensure all lazy images are eager so they start loading immediately
    images.forEach(img => {
        if (img.loading === 'lazy') {
            img.loading = 'eager';
            img.removeAttribute('loading');
        }
    });
    const promises = images.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 3000);
        });
    });
    await Promise.all(promises);
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
        let w = (img.naturalWidth || img.width) * scale || 100;
        let h = (img.naturalHeight || img.height) * scale || 100;
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
        try {
            if (origFit === 'contain') {
                const s = Math.min(canvas.width / w, canvas.height / h);
                const dx = (canvas.width - w * s) / 2;
                const dy = (canvas.height - h * s) / 2;
                ctx.drawImage(img, dx, dy, w * s, h * s);
            } else if (origFit === 'cover') {
                const s = Math.max(canvas.width / w, canvas.height / h);
                const dx = (canvas.width - w * s) / 2;
                const dy = (canvas.height - h * s) / 2;
                ctx.drawImage(img, dx, dy, w * s, h * s);
            } else {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            img.parentNode?.replaceChild(canvas, img);
            restored.push({ img, canvas });
        } catch (err) {
            Logger.warn('Failed to rasterize image to canvas (CORS or broken image):', err);
        }
    });

    return () => {
        restored.forEach(({ img, canvas }) => {
            canvas.parentNode?.replaceChild(img, canvas);
        });
    };
};

export const PAGE_SIZES: Record<PageSize, { width: number; height: number }> = {
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
    const sanitizeMeta = (str?: string) => (str || '').replace(/[<>\\]/g, '').trim();
    const docTitle = sanitizeMeta(title || meta.title);
    const docSubject = sanitizeMeta(subject || meta.subject);
    const docKeywords = sanitizeMeta(keywords || meta.keywords);
    const docFilename = (filename || meta.filename).replace(/[<>:"/\\|?*]/g, '_');
    const docAuthor = sanitizeMeta(author);

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
        // Ensure all images are fully loaded before capturing
        await waitForAllImages(element);

        // Calculate max allowed scale based on actual DOM pixel dimensions (HTML5 canvas limit max 16384px)
        const domWidthPx = element.offsetWidth || 800;
        const domHeightPx = element.offsetHeight || 1130;
        const maxDomDim = Math.max(domWidthPx, domHeightPx);
        const lowerScale = Math.min(qual.scale, Math.floor(16384 / Math.max(1, maxDomDim)));
        const effectiveScale = Math.max(0.5, lowerScale);

        // PdfPreviewCanvas zoom/scale transform cleanup (handle all nested ancestors)
        const scaledAncestors: { el: HTMLElement; originalTransform: string; originalZoom: string }[] = [];
        let p: HTMLElement | null = element.parentElement as HTMLElement | null;
        while (p) {
            const hasTransform = p.style.transform && p.style.transform.includes('scale(');
            const pStyleZoom = (p.style as unknown as { zoom?: string }).zoom;
            if (hasTransform || (pStyleZoom && pStyleZoom !== '1' && pStyleZoom !== 'normal')) {
                scaledAncestors.push({
                    el: p,
                    originalTransform: p.style.transform,
                    originalZoom: pStyleZoom || ''
                });
                p.style.transform = 'none';
                (p.style as unknown as { zoom?: string }).zoom = '1';
            }
            p = p.parentElement as HTMLElement | null;
        }

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
                    format: [size.width, size.height],
                    orientation: isLandscape ? 'landscape' : 'portrait',
                    compress: true,
                    properties: {
                        title: docTitle,
                        author: docAuthor,
                        subject: docSubject,
                        keywords: docKeywords,
                        creator: 'TeklifApp v7',
                    },
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
                },
            };

            const worker = html2pdf().set(opt as unknown as Html2PdfOptions).from(element);
            const pdfBlob = await worker.outputPdf('blob');
            const realSizeKB = Math.round(pdfBlob.size / 1024);
            await worker.save();

            const elapsedMs = Date.now() - startTime;
            const sizeKB = realSizeKB > 0 ? realSizeKB : Math.round((domWidthPx * domHeightPx * 4) / 1024);
            const sizeText = realSizeKB > 0 ? `~${realSizeKB} KB` : '—';
            const elapsedText = `${(elapsedMs / 1000).toFixed(1)}s`;

            onStage?.('done');
            return { sizeKB, elapsedMs, sizeText, elapsedText };
        } finally {
            restoreImages();
            scaledAncestors.forEach(({ el, originalTransform, originalZoom }) => {
                el.style.transform = originalTransform;
                if (originalZoom) {
                    (el.style as unknown as { zoom?: string }).zoom = originalZoom;
                }
            });
        }
    } catch (error: unknown) {
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

    // Clone element and convert canvases to images so signatures/stamps are preserved
    const cloned = element.cloneNode(true) as HTMLElement;
    const origCanvases = element.querySelectorAll<HTMLCanvasElement>('canvas');
    const cloneCanvases = cloned.querySelectorAll<HTMLCanvasElement>('canvas');
    origCanvases.forEach((orig, idx) => {
        const clone = cloneCanvases[idx];
        if (clone) {
            try {
                const img = document.createElement('img');
                img.src = orig.toDataURL('image/png');
                img.style.cssText = orig.style.cssText;
                img.className = orig.className;
                clone.parentNode?.replaceChild(img, clone);
            } catch (err) {
                Logger.warn('Failed to convert canvas to image for print:', err);
                const fallbackDiv = document.createElement('div');
                fallbackDiv.style.cssText = orig.style.cssText;
                fallbackDiv.className = orig.className;
                clone.parentNode?.replaceChild(fallbackDiv, clone);
            }
        }
    });

    const styles = Array.from(document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('style, link[rel="stylesheet"]'))
        .map(s => {
            if (s.tagName === 'LINK' && 'href' in s && s.href) {
                const absoluteHref = new URL(s.href, document.baseURI).href;
                return `<link rel="stylesheet" href="${absoluteHref}">`;
            }
            return s.outerHTML;
        })
        .join('\n');
    const rootStyles = document.documentElement.style.cssText;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <base href="${document.baseURI}">
            <title>${meta.printTitle}</title>
            ${styles}
            <style>
                :root { ${rootStyles} }
                body { margin: 0; padding: 0; background: ${backgroundColor}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @page { margin: 0; size: ${pageWidth}mm ${pageHeight}mm; }
                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print, .pdf-placeholder { display: none !important; }
                    .pdf-section { page-break-inside: avoid; }
                    .pdf-page-break { page-break-before: always; }
                    .pdf-table-row { page-break-inside: avoid; }
                }
                @page :first { margin-top: 0; }
            </style>
        </head>
        <body>
            ${cloned.outerHTML}
            <script>
                function waitForImages(callback) {
                    var imgs = Array.from(document.querySelectorAll('img'));
                    if (imgs.length === 0) { callback(); return; }
                    var promises = imgs.map(function(img) {
                        if (img.complete) return Promise.resolve();
                        return new Promise(function(resolve) {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });
                    });
                    Promise.all(promises).then(callback).catch(callback);
                }
                function doPrint() {
                    waitForImages(function() {
                        setTimeout(function() {
                            try {
                                window.focus();
                                window.print();
                            } catch (e) {
                                console.error(e);
                            }
                        }, 150);
                    });
                }
                if (document.readyState === 'complete') {
                    setTimeout(doPrint, 100);
                } else {
                    window.addEventListener('load', doPrint);
                    setTimeout(doPrint, 2000);
                }
            <\/script>
        </body>
        </html>
    `;

    // Create a hidden iframe for 100% reliable printing without popup blocking
    const iframeId = 'pdf-print-frame';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (iframe) iframe.remove();
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
        if (iframe.contentWindow) {
            iframe.contentWindow.onafterprint = () => {
                if (iframe) iframe.remove();
            };
        }
        doc.open();
        doc.write(htmlContent);
        doc.close();
    } else {
        // Fallback to window.open if iframe is blocked
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        } else {
            window.print();
        }
    }
};

export const PAGE_SIZE_OPTIONS = (Object.keys(PAGE_SIZES) as PageSize[]).map(key => ({
    value: key,
    label: key.toUpperCase()
}));

export const QUALITY_OPTIONS = (Object.keys(QUALITY_MAP) as PdfQuality[]).map(key => ({
    value: key,
    label: key.charAt(0).toUpperCase() + key.slice(1)
}));
