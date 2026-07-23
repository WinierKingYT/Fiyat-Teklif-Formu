import Logger from './logger';
import toast from 'react-hot-toast';

const PAGE_SIZES = {
  'a4': { width: 210, height: 297 },
  'a5': { width: 148, height: 210 },
  'letter': { width: 215.9, height: 279.4 },
  'legal': { width: 215.9, height: 355.6 }
};

const QUALITY_MAP = {
  'draft': { scale: 1.5, letterRendering: false },
  'normal': { scale: 2, letterRendering: true },
  'high': { scale: 3, letterRendering: true },
  'print': { scale: 4, letterRendering: true }
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

    const opt = {
      margin: margin,
      filename: filename,
      image: { type: 'png' as any },
      html2canvas: {
        scale: qual.scale,
        useCORS: true,
        logging: false,
        letterRendering: qual.letterRendering,
      },
      jsPDF: {
        unit: 'mm',
        format: [size.width, size.height],
        orientation: isLandscape ? 'landscape' : 'portrait',
        filters: ['ASCIIHexEncode'],
        compress: true,
      },
      pagebreak: { mode: ['css'] },
    } as any;

    const worker = html2pdf().set(opt);

    if (typeof worker.outputPdf === 'function') {
      const pdf = await worker.from(element).outputPdf('arraybuffer');
      const doc = await import('jspdf').then(m => (m.default as any).doc);
      if (doc) {
        doc.setProperties({
          title: docTitle,
          author: author,
          subject: subject,
          keywords: keywords,
          creator: 'TeklifApp v6',
        });
      }
    }

    await worker.from(element).save();
    Logger.log('PDF generated successfully:', { pageSize, quality, size });
  } catch (error) {
    Logger.error('PDF generation error:', error);
    toast.error('PDF oluşturulurken bir hata oluştu.');
  }
};

export const printQuote = (elementId, options: any = {}) => {
  const element = document.getElementById(elementId);
  if (!element) {
    Logger.error('Print failed: Element not found');
    return;
  }
  window.print();
};

export const PAGE_SIZE_OPTIONS = Object.keys(PAGE_SIZES).map(key => ({
  value: key,
  label: key.toUpperCase()
}));

export const QUALITY_OPTIONS = Object.keys(QUALITY_MAP).map(key => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1)
}));
