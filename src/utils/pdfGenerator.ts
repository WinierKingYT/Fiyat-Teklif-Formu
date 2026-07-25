import Logger from './logger';
import toast from 'react-hot-toast';

const PAGE_BREAK_STYLE_ID = 'pdf-page-break-styles';

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

const replaceImagesWithCanvas = (container: HTMLElement, scale: number): (() => void) => {
    const images = container.querySelectorAll<HTMLImageElement>('img[src]');
    const restored: { img: HTMLImageElement; canvas: HTMLCanvasElement }[] = [];

    images.forEach(img => {
        if (!img.src || img.src.startsWith('data:image/svg')) return;
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || (img.width * scale);
        const h = img.naturalHeight || (img.height * scale);
        if (w < 5 || h < 5) return;
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const origX = img.style.objectPosition || 'center';
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

const PAGE_SIZES = {
  'a4': { width: 210, height: 297 },
  'a5': { width: 148, height: 210 },
  'letter': { width: 215.9, height: 279.4 },
  'legal': { width: 215.9, height: 355.6 }
};

const QUALITY_MAP = {
  'draft': { scale: 2, letterRendering: false },
  'normal': { scale: 3, letterRendering: true },
  'high': { scale: 4, letterRendering: true },
  'print': { scale: 5, letterRendering: true },
  'ultra': { scale: 6, letterRendering: true }
};

export const generatePDF = async (elementId, filename = 'teklif.pdf', options: any = {}) => {
  const {
    theme = 'modern',
    color = '#000000',
    pageSize = 'a4',
    quality = 'high',
    orientation = 'portrait',
    margin = 0,
    title: docTitle = 'Fiyat Teklifi',
    author = 'TeklifApp',
    subject = 'Fiyat Teklifi Belgesi',
    keywords = 'teklif, fiyat, fatura'
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    Logger.error('PDF generation failed: Element not found');
    toast.error('PDF oluşturulacak alan bulunamadı!');
    return;
  }

  const baseSize = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
  const isLandscape = orientation === 'landscape';
  const size = isLandscape
    ? { width: baseSize.height, height: baseSize.width }
    : baseSize;
  const qual = QUALITY_MAP[quality] || QUALITY_MAP.high;

    try {
        const { default: html2pdf } = await import('html2pdf.js');
        await document.fonts.ready;

        injectPageBreakStyles(elementId);

        const lowerScale = Math.min(qual.scale, Math.floor(65536 / Math.max(size.width, size.height)));
        const effectiveScale = Math.max(1, lowerScale);

        const restoreImages = replaceImagesWithCanvas(element, effectiveScale);

        try {
            const opt = {
                margin: margin,
                filename: filename,
                image: { type: 'png', quality: 1.0 },
                html2canvas: {
                    scale: effectiveScale,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    letterRendering: qual.letterRendering,
                    backgroundColor: '#ffffff',
                    imageTimeout: 0,
                },
                jsPDF: {
                    unit: 'mm',
                    format: [size.width, size.height],
                    orientation: isLandscape ? 'landscape' : 'portrait',
                    compress: true,
                    properties: {
                        title: docTitle,
                        author: author,
                        subject: subject,
                        keywords: keywords,
                        creator: 'TeklifApp v7',
                    },
                },
                pagebreak: { mode: ['css', 'legacy'] },
            } as any;

            const worker = html2pdf().set(opt);
            await worker.from(element).save();
            Logger.log('PDF generated successfully:', { pageSize, quality, size, scale: effectiveScale });
        } finally {
            restoreImages();
        }
    } catch (error) {
        Logger.error('PDF generation error:', error);
        toast.error('PDF oluşturulurken bir hata oluştu.');
    } finally {
        removePageBreakStyles();
    }
};

export const printQuote = (elementId, options: any = {}) => {
    const element = document.getElementById(elementId);
    if (!element) {
        Logger.error('Print failed: Element not found');
        return;
    }
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
            <title>Yazdır - Fiyat Teklifi</title>
            ${styles}
            <style>
                body { margin: 0; padding: 10mm; }
                @page { margin: 0; size: A4; }
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

export const PAGE_SIZE_OPTIONS = Object.keys(PAGE_SIZES).map(key => ({
  value: key,
  label: key.toUpperCase()
}));

export const QUALITY_OPTIONS = Object.keys(QUALITY_MAP).map(key => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1)
}));
