import React from 'react';
import PrintableQuote from '@/components/PrintableQuoteV2';
import type { PdfConfig, QuoteData, CustomerData, CompanyData, BankData, QuoteItem, Discount, PdfLayoutItem } from '@/context/quote/types';

interface PdfPreviewCanvasProps {
    zoomLevel: number;
    contentRef: React.RefObject<HTMLDivElement | null>;
    marginGuidesRef: React.RefObject<HTMLDivElement | null>;
    pdfConfig: PdfConfig;
    renderedConfig: PdfConfig;
    quoteData: QuoteData;
    items: QuoteItem[];
    customerData: CustomerData;
    companyData: CompanyData;
    bankData: BankData;
    discount: Discount;
    pdfLayout: PdfLayoutItem[];
    signature: string | null;
    handleFieldEdit: (fieldKey: string, value: unknown, type?: string) => void;
}

const PdfPreviewCanvas: React.FC<PdfPreviewCanvasProps> = ({
    zoomLevel,
    contentRef,
    marginGuidesRef,
    pdfConfig,
    renderedConfig,
    quoteData,
    items,
    customerData,
    companyData,
    bankData,
    discount,
    pdfLayout,
    signature,
    handleFieldEdit
}) => {
    return (
        <div className="origin-top shadow-[var(--shadow-lg)] transition-all duration-300 bg-[var(--color-bg-card)] relative" style={{ transform: `scale(${zoomLevel})`, imageRendering: zoomLevel < 0.5 ? 'auto' : 'crisp-edges' } as React.CSSProperties}>
            <div ref={contentRef} className="relative">
                <style>{`
                    @media screen {
                        #printable-quote-container-panel .pdf-page {
                            margin-bottom: 28px;
                        }
                        #printable-quote-container-panel .pdf-page:last-child {
                            margin-bottom: 0;
                        }
                    }
                `}</style>
                <PrintableQuote
                    id="printable-quote-container-panel"
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
                    onEdit={handleFieldEdit}
                    config={renderedConfig}
                />
            </div>
            <div ref={marginGuidesRef} className="absolute inset-0 z-[5] pointer-events-none"></div>
        </div>
    );
};

export default PdfPreviewCanvas;
