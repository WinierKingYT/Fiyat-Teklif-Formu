import html2pdf from 'html2pdf.js';
import Logger from './logger';

export const generatePDF = async (elementId, filename = 'teklif.pdf', options = {}) => {
    const element = document.getElementById(elementId);
    if (!element) {
        Logger.error('PDF generation failed: Element not found');
        alert('PDF oluşturulacak alan bulunamadı!');
        return;
    }

    const opt = {
        margin: 0, // No margin, let the component handle padding
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
        Logger.log('Generating PDF with options:', options);
        await html2pdf().set(opt).from(element).save();
        Logger.log('PDF generated successfully');
    } catch (error) {
        Logger.error('PDF generation error:', error);
        alert('PDF oluşturulurken bir hata oluştu.');
    }
};
