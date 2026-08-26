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
        <div className="origin-top shadow-[var(--shadow-lg)] transition-all duration-300 bg-[var(--color-bg-card)] relative" style={{ transform: `scale(${zoomLevel})` }}>
            <div ref={contentRef} className="relative">
                <style>{`
                    @media screen {
                        #printable-quote-container-panel .pdf-page {
                            margin-bottom: 34px;
                            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.08);
                            position: relative;
                            background: #ffffff;
                        }
                        #printable-quote-container-panel .pdf-page:not(:last-child)::after {
                            content: '✂ ────────── A4 Sayfa Kırılımı ──────────';
                            position: absolute;
                            bottom: -24px;
                            left: 0;
                            right: 0;
                            text-align: center;
                            font-size: 9px;
                            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                            font-weight: 600;
                            color: #94a3b8;
                            letter-spacing: 0.08em;
                            pointer-events: none;
                        }
                        #printable-quote-container-panel .pdf-page:last-child {
                            margin-bottom: 0;
                        }
                    }
                    @media print {
                        #printable-quote-container-panel .pdf-page {
                            margin-bottom: 0 !important;
                            box-shadow: none !important;
                        }
                        #printable-quote-container-panel .pdf-page::after {
                            display: none !important;
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
