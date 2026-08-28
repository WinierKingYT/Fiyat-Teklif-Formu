import React from 'react';
import PrintableQuote from '@/components/PrintableQuoteV2';
import type { QuoteData, CustomerData, CompanyData, BankData, QuoteItem, Discount, PdfConfig, PdfLayoutItem } from '@/context/quote/types';

export interface PdfExportSurfaceProps {
    id?: string;
    quoteData: QuoteData;
    customerData: CustomerData;
    companyData: CompanyData;
    bankData: BankData;
    items: QuoteItem[];
    discount: Discount;
    pdfConfig: PdfConfig;
    pdfLayout?: PdfLayoutItem[];
    signature?: string | null;
}

/**
 * Dedicated, transform-free, shadow-free, un-scaled A4 surface used exclusively
 * for generating PDFs. It guarantees strict WYSIWYG parity with the preview
 * while isolating PDF capture from screen transforms, zoom levels, and UI helpers.
 */
export const PdfExportSurface: React.FC<PdfExportSurfaceProps> = ({
    id = 'canonical-pdf-export-surface',
    quoteData,
    customerData,
    companyData,
    bankData,
    items,
    discount,
    pdfConfig,
    pdfLayout,
    signature = null
}) => {
    return (
        <div
            id="pdf-export-surface-wrapper"
            aria-hidden="true"
            style={{
                position: 'fixed',
                left: '-9999px',
                top: 0,
                width: '210mm',
                minHeight: '297mm',
                margin: 0,
                padding: 0,
                background: '#ffffff',
                transform: 'none',
                zoom: '1',
                boxShadow: 'none',
                pointerEvents: 'none',
                zIndex: -9999
            }}
        >
            <PrintableQuote
                id={id}
                theme={pdfConfig.theme}
                color={pdfConfig.color}
                quoteData={quoteData}
                items={items}
                customerData={customerData}
                companyData={companyData}
                bankData={bankData}
                discount={discount}
                layout={pdfLayout}
                signature={signature}
                config={pdfConfig}
            />
        </div>
    );
};

export default PdfExportSurface;
