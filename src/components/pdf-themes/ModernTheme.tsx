import React, { useMemo } from 'react';
import { PdfWatermark, PdfContinuationHeader, PdfPageNumber, PdfFooter, PdfBankInfo, PdfTermsList, PdfSignatures, PdfAmountInWords, PdfCustomFields } from './common';
import { usePdfTheme } from './hooks/usePdfTheme';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const ModernTheme: React.FC<PdfThemeProps> = (props) => {
    const {
        id,
        containerStyles,
        config,
        color = '#2563eb',
        activeLayout,
        companyData,
        quoteData,
        customerData,
        items,
        bankData,
        signature,
        t,
        formatDate,
        formatCurrency,
        subtotal,
        discountAmount,
        totalTax,
        total,
        currentLocale,
        hasLineItemDiscounts,
        onEdit
    } = props;
    const { layoutMap, showSection, itemChunks, vatBreakdown, amountInWords, renderEditable } = usePdfTheme(props);


    const modernStyles = useMemo(() => `
        .modern-theme-container {
            font-family: ${config.globalFontFamily || "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.35'};
            color: ${config.globalFontColor || '#0f172a'} !important;
            background: var(--pdf-page-bg, #ffffff) !important;
            font-size: ${typeof config.fontSize === 'number' ? config.fontSize + 'px' : (config.fontSize || '11px')};
            position: relative;
            box-sizing: border-box;
            border-radius: ${config.borderRadius || 6}px;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .modern-theme-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, ${color}, #3b82f6);
            z-index: 10;
        }

        .modern-theme-container, .modern-theme-container * {
            box-sizing: border-box;
        }

        /* Force light theme for PDF container & dark mode protection */
        [data-theme="dark"] .modern-theme-container,
        .modern-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#0f172a'} !important;
        }

        [data-theme="dark"] .modern-theme-container .customer-box,
        [data-theme="dark"] .modern-theme-container .bottom-section,
        [data-theme="dark"] .modern-theme-container .terms-box,
        .modern-theme-container .customer-box,
        .modern-theme-container .bottom-section,
        .modern-theme-container .terms-box {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        [data-theme="dark"] .modern-theme-container .pdf-items-table td,
        .modern-theme-container .pdf-items-table td {
            color: #1e293b !important;
        }
        
        /* HEADER */
        .modern-theme-container .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.75rem;
            padding-bottom: 0.6rem;
            border-bottom: 2px solid ${color};
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .modern-theme-container .header-left {
            flex: 1;
            padding-right: 1.25rem;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 1rem;
        }

        .modern-theme-container .company-logo {
            flex-shrink: 0;
        }

        .modern-theme-container .company-logo img {
            max-height: 48px;
            max-width: 130px;
            object-fit: contain;
        }

        .modern-theme-container .company-info {
            flex: 1;
            min-width: 0;
        }
        
        .modern-theme-container .header-right {
            flex: 0 0 auto;
            text-align: right;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-end;
            border-left: 3px solid ${color};
            padding-left: 0.85rem;
            border-radius: 2px 0 0 2px;
        }
        
        .modern-theme-container .company-name {
            word-wrap: break-word;
            font-size: ${config.headerTitleFontSize || '1.15rem'};
            font-weight: ${config.headerTitleFontWeight || '800'};
            color: #0f172a;
            letter-spacing: -0.01em;
        }
        
        .modern-theme-container .company-details {
            font-size: ${config.headerInfoFontSize || '0.76rem'};
            color: #475569;
            line-height: 1.3;
            margin-top: 0.15rem;
        }

        .modern-theme-container .quote-title {
            text-transform: uppercase;
            letter-spacing: 0.02em;
            font-size: ${config.titleFontSize || '1.25rem'};
            font-weight: ${config.titleFontWeight || '800'};
            color: ${color};
        }
        
        .modern-theme-container .quote-meta {
            font-size: 0.76rem;
            color: #475569;
            margin-top: 0.25rem;
            display: inline-flex;
            gap: 0.4rem;
            align-items: center;
            background: #f8fafc;
            padding: 0.2rem 0.5rem;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }

        /* CUSTOMER SECTION */
        .modern-theme-container .customer-section {
            margin-bottom: 0.65rem;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .modern-theme-container .customer-box {
            background: #f8fafc;
            border-radius: 8px;
            padding: 0.65rem 0.95rem;
            border: 1px solid #e2e8f0;
            border-left: 4px solid ${color};
        }
        
        .modern-theme-container .section-title {
            text-transform: uppercase;
            font-size: ${config.customerTitleFontSize || '0.72rem'};
            font-weight: ${config.customerTitleFontWeight || '800'};
            color: ${color};
            letter-spacing: 0.06em;
            margin-bottom: 0.35rem;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 0.2rem;
        }
        
        /* TABLE */
        .modern-theme-container .pdf-items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 0.65rem;
        }
        
        .modern-theme-container .pdf-items-table th {
            padding: ${config.tableHeaderPadding || '6px 8px'};
            text-align: left;
            font-weight: ${config.tableHeaderFontWeight || '700'};
            color: ${config.tableHeaderColor || '#334155'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '7.5pt')} !important;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            background: ${config.tableHeaderBg || '#f8fafc'};
            border-top: 1px solid ${config.tableBorderColor || '#cbd5e1'};
            border-bottom: 2px solid ${color};
        }
        .modern-theme-container .pdf-items-table thead th:first-child { border-top-left-radius: 6px; }
        .modern-theme-container .pdf-items-table thead th:last-child { border-top-right-radius: 6px; }
        
        .modern-theme-container .pdf-items-table td {
            padding: ${config.tableCellPadding || '5px 8px'};
            border-bottom: 1px solid ${config.tableBorderColor || '#f1f5f9'};
            vertical-align: middle;
            font-size: ${config.tableBodyFontSize || '8.5pt'};
            font-weight: ${config.tableBodyFontWeight || 'normal'};
            color: #1e293b;
        }

        ${config.tableStriped ? `
        .modern-theme-container .pdf-items-table tbody tr:nth-child(even) td {
            background-color: ${config.tableStripedColor || '#f8fafc'};
        }` : `
        .modern-theme-container .pdf-items-table tbody tr:nth-child(even) td {
            background-color: #fafbfc;
        }`}

        ${config.tableShowVerticalLines ? `
        .modern-theme-container .pdf-items-table th,
        .modern-theme-container .pdf-items-table td {
            border-left: 1px solid ${config.tableBorderColor || '#e2e8f0'};
        }
        .modern-theme-container .pdf-items-table th:first-child,
        .modern-theme-container .pdf-items-table td:first-child {
            border-left: none;
        }` : ''}

        .modern-theme-container .item-image {
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            flex-shrink: 0;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #ffffff;
            margin: 0 auto;
        }
        
        .modern-theme-container .item-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .modern-theme-container .item-name {
            font-weight: 700;
            color: #0f172a;
            font-size: 8.5pt;
        }

        .modern-theme-container .item-desc {
            font-size: 7.5pt !important;
            color: #64748b;
            line-height: 1.25;
            margin-top: 1px;
            white-space: pre-wrap;
            word-break: break-word;
        }

        /* SUMMARY & BANK SECTION */
        .modern-theme-container .bottom-section {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 1rem;
            margin-bottom: 0.5rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .modern-theme-container .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 0.15rem 0;
            font-size: ${config.summaryLabelFontSize || '8pt'};
            font-weight: ${config.summaryLabelFontWeight || 'normal'};
            color: #475569;
        }

        .modern-theme-container .summary-row.discount {
            color: #dc2626;
        }

        .modern-theme-container .summary-row.grand-total {
            display: flex;
            justify-content: space-between;
            margin-top: 0.35rem;
            padding: 0.35rem 0.5rem;
            background: linear-gradient(135deg, ${color}14 0%, ${color}06 100%);
            border: 1.5px solid ${color}35;
            border-radius: 6px;
            align-items: center;
            font-size: ${config.summaryTotalFontSize || '11pt'};
            font-weight: 800;
            color: #0f172a;
        }

        /* TERMS & NOTES */
        .modern-theme-container .terms-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 0.5rem 0.75rem;
            margin-bottom: 0.5rem;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        /* SIGNATURES */
        .modern-theme-container .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin-top: 0.65rem;
            margin-bottom: 0.5rem;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .modern-theme-container .signature-col {
            text-align: center;
        }

        .modern-theme-container .signature-line {
            border-bottom: 1.5px solid #94a3b8;
            min-height: 40px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 0.75rem;
            padding-bottom: 3px;
        }

        .modern-theme-container .signature-label {
            font-size: 7.5pt;
            font-weight: 700;
            color: #0f172a;
            padding-top: 0.25rem;
        }

        /* FOOTER */
        .modern-theme-container .pdf-footer {
            text-align: center;
            padding-top: 0.35rem;
            border-top: 1px solid #e2e8f0;
            margin-top: auto;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        /* COMPACT MODES */
        .pdf-compact-mode .customer-section { margin-bottom: 0.5rem; }
        .pdf-compact-mode .customer-box { padding: 0.5rem 0.75rem; }
        .pdf-compact-mode .pdf-items-table { margin-bottom: 0.5rem; }
        .pdf-compact-mode .pdf-items-table th,
        .pdf-compact-mode .pdf-items-table td {
            padding: 4px 6px;
            font-size: 8pt;
        }
        
        .pdf-compact-mode .item-image {
            width: 28px;
            height: 28px;
        }

        .pdf-compact-mode .signatures-grid {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            gap: 1.25rem;
        }

        .pdf-compact-mode .signature-line {
            min-height: 32px;
        }
    `, [color, config]);



    
    const renderTable = (tableItems: QuoteItem[], startIndex: number) => (
        <table className="pdf-items-table">
            <thead>
                <tr>
                    <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '46px', textAlign: 'center' }}>{t.image}</th>}
                    <th>{config.textItem ?? t.item}</th>
                    {config.showTableUnit && <th style={{ width: '50px', textAlign: 'center' }}>{config.textUnit ?? t.unit}</th>}
                    <th style={{ width: '55px', textAlign: 'center' }}>{config.textQuantity ?? t.quantity}</th>
                    <th style={{ width: '85px', textAlign: 'right' }}>{config.textUnitPrice ?? t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '50px', textAlign: 'center' }}>{config.textDiscount ?? t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '50px', textAlign: 'center' }}>{config.textVat ?? t.tax}</th>}
                    <th style={{ width: '100px', textAlign: 'right' }}>{config.textTotal ?? t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => {
                    const isFixedDiscount = item.discountType === 'fixed';
                    const discountVal = Number(item.discountRate) || 0;
                    const discountDisplay = discountVal > 0 ? (isFixedDiscount ? formatCurrency(discountVal) : `%${discountVal}`) : '-';
                    const baseTotal = (item.quantity || 0) * (item.price || 0);
                    const lineTotal = (typeof item.total === 'number' && item.total > 0) ? item.total : (isFixedDiscount ? Math.max(0, baseTotal - discountVal) : baseTotal * (1 - discountVal / 100));

                    return (
                        <tr key={startIndex + index}>
                            <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{startIndex + index + 1}</td>
                            {config.showTableImages && (
                                <td>
                                    <div className="item-image">
                                        {item.image ? (
                                            <img src={item.image} alt="" />
                                        ) : (
                                            <span style={{ fontSize: '8px', color: '#94a3b8' }}>-</span>
                                        )}
                                    </div>
                                </td>
                            )}
                            <td>
                                <div className="item-name">{item.name}</div>
                                {item.description && <div className="item-desc">{item.description}</div>}
                            </td>
                            {config.showTableUnit && <td className="item-unit" style={{ textAlign: 'center', color: '#475569' }}>{item.unit}</td>}
                            <td className="item-quantity" style={{ textAlign: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                            <td className="item-price" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                            {hasLineItemDiscounts && <td className="item-discount" style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{discountDisplay}</td>}
                            {config.showTableTax && <td className="item-tax" style={{ textAlign: 'center', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>{(quoteData.language === 'en' || quoteData.language === 'de') ? `${Number(item.taxRate) || 0}%` : `%${Number(item.taxRate) || 0}`}</td>}
                            <td className="item-total" style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(lineTotal)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div id={id} className={`modern-theme-container w-full max-w-[210mm] mx-auto ${config.margins === 'compact' ? 'pdf-compact-mode' : ''}`} style={containerStyles}>
            <style>{modernStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview pdf-page" style={{
                    position: 'relative',
                    minHeight: containerStyles?.pageMinHeight || '284mm',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                }}>
                    {/* Watermark */}
                    <PdfWatermark config={config} />

                    {/* Header */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="pdf-header">
                            <div className="header-left">
                                {config.showLogo && companyData.logo && (
                                    <div className="company-logo" style={{ display: 'flex', justifyContent: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start', marginBottom: '0.25rem' }}>
                                        <img src={companyData.logo} alt="Logo" style={{ maxHeight: `${config.logoMaxHeight || 48}px`, maxWidth: '140px', objectFit: 'contain', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '6px' : '0' }} />
                                    </div>
                                )}
                                <div className="company-info">
                                    <div className="company-name">{renderEditable(companyData.name, 'companyName')}</div>
                                    <div className="company-details">
                                        {companyData.address && <div>{companyData.address}</div>}
                                        {(companyData.phone || companyData.email || companyData.website) && (
                                            <div style={{ marginTop: '0.15rem' }}>
                                                {companyData.phone && <span>{companyData.phone}</span>}
                                                {companyData.phone && companyData.email && <span> • </span>}
                                                {companyData.email && <span>{companyData.email}</span>}
                                                {(companyData.phone || companyData.email) && companyData.website && <span> • </span>}
                                                {companyData.website && <span>{companyData.website}</span>}
                                            </div>
                                        )}
                                        {(companyData.taxOffice || companyData.taxNumber) && (
                                            <div style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: '1px' }}>
                                                {companyData.taxOffice && <span>{companyData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                                {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="header-right">
                                <div className="quote-title">{renderEditable(quoteData.title || config.title || t.quoteTitle, 'quoteTitle')}</div>
                                <div className="quote-meta">
                                    {quoteData.number && <span style={{ fontWeight: '700', background: color, color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontSize: '7.5pt' }}>#{quoteData.number}</span>}
                                    {quoteData.date && <span>{t.date}: <strong>{formatDate(quoteData.date, currentLocale)}</strong></span>}
                                    {quoteData.validUntil && <span>• {t.validUntil}: <strong>{formatDate(quoteData.validUntil, currentLocale)}</strong></span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pdf-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.35rem', borderBottom: `1.5px solid ${color}` }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: config.headerInfoFontSize || '8pt', color: '#64748b' }}>
                                <span><strong>{companyData.name ? `${companyData.name} - ` : ''}</strong>{quoteData.title || config.title || t.quoteTitle}{quoteData.number ? ` (#${quoteData.number})` : ''}</span>
                                {config.showPageNumbers !== false && (
                                    <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Customer Section - Only Page 1 */}
                    {showSection('customer') && pageIndex === 0 && (
                        <div className="customer-section">
                            <div className="customer-box">
                                <div className="section-title">
                                    {[t.customer, t.to].filter(Boolean).join(' / ')}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.35rem 1.25rem', alignItems: 'baseline' }}>
                                    {customerData.company && (
                                        <div style={{ gridColumn: '1 / -1', fontSize: '9.5pt', fontWeight: '700', color: '#0f172a' }}>
                                            {renderEditable(customerData.company, 'customerCompany')}
                                        </div>
                                    )}
                                    {customerData.name && (
                                        <div style={{ fontSize: '8pt', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.authorized}: </span>
                                            <span style={{ fontWeight: '500' }}>{renderEditable(customerData.name, 'customerName')}</span>
                                        </div>
                                    )}
                                    {customerData.phone && (
                                        <div style={{ fontSize: '8pt', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.phone}: </span>
                                            <span>{renderEditable(customerData.phone, 'customerPhone')}</span>
                                        </div>
                                    )}
                                    {customerData.email && (
                                        <div style={{ fontSize: '8pt', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.email}: </span>
                                            <span>{renderEditable(customerData.email, 'customerEmail')}</span>
                                        </div>
                                    )}
                                    {customerData.address && (
                                        <div style={{ gridColumn: '1 / -1', fontSize: '8pt', color: '#475569' }}>
                                            <span>{customerData.address}</span>
                                        </div>
                                    )}
                                    {(customerData.taxOffice || customerData.taxNumber) && (
                                        <div style={{ gridColumn: '1 / -1', fontSize: '7.5pt', color: '#94a3b8' }}>
                                            {customerData.taxOffice && <span>{customerData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                            {customerData.taxNumber && <span>No: {customerData.taxNumber}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <PdfCustomFields customFields={quoteData.customFields} themeColor={color} />
                        </div>
                    )}

                    {/* Items Table */}
                    {showSection('items') && (
                    <div style={{ flex: 1 }}>
                        {renderTable(chunk, itemChunks.slice(0, pageIndex).reduce((acc, c) => acc + c.length, 0))}
                    </div>
                    )}

                    {/* Bottom Section - Only on Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            {config.showSummary && (
                                <div className="bottom-section">
                                    <div className="bottom-left-col">
                                        {config.showBankInfo && (
                                            <PdfBankInfo bankData={bankData} t={t} className="bank-info-box" />
                                        )}
                                        {showSection('notes') && config.showTerms && (quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.terms) && (
                                            <div style={{ fontSize: '7.5pt', color: '#475569', lineHeight: '1.35', marginTop: '6px' }}>
                                                {quoteData.deliveryTerms && <div><strong>{t.deliveryConditions || t.delivery || 'Teslimat'}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                                {quoteData.warrantyTerms && <div><strong>{t.warrantyConditions || t.warranty || 'Garanti'}:</strong> {renderEditable(quoteData.warrantyTerms, 'warrantyTerms', 'textarea')}</div>}
                                                {quoteData.terms && <div><strong>{t.payment || 'Ödeme'}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="summary-section">
                                        <div className="section-title">
                                            {t.summary}
                                        </div>
                                        <div className="summary-row">
                                            <span>{t.subtotal}:</span>
                                            <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="summary-row discount">
                                                <span>{t.discount}{props.discount?.type !== 'fixed' ? props.discount?.value ? ` (%${props.discount.value})` : ` (%${subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0})` : ''}:</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <>
                                                {Object.keys(vatBreakdown).length > 1 ? (
                                                    Object.entries(vatBreakdown)
                                                        .filter(([_, data]) => data.taxable > 0)
                                                        .map(([rate, data]) => (
                                                            <div key={rate} className="summary-row" style={{ fontSize: '7.5pt' }}>
                                                                <span>{t.vat || t.tax} (%{rate}):</span>
                                                                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(data.tax)}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="summary-row">
                                                        <span>{t.vat || t.tax}:</span>
                                                        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="summary-row grand-total">
                                            <span>{t.generalTotal}:</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '7.2pt', color: '#64748b', fontStyle: 'italic', marginTop: '4px', textAlign: 'right', wordBreak: 'break-word', whiteSpace: 'normal', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 6px' }}>
                                            {amountInWords}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Unified Notes & Terms */}
                            {showSection('notes') && config.showNotes && quoteData.notes && (
                                <div className="terms-box">
                                    <div className="section-title">{t.notes}</div>
                                    <div style={{ fontSize: '7.5pt', color: '#475569', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                        {renderEditable(quoteData.notes, 'notes', 'textarea')}
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && (
                                <PdfSignatures
                                    companyData={companyData}
                                    customerData={customerData}
                                    signature={signature}
                                    config={config}
                                    t={t}
                                    className="signatures-grid"
                                />
                            )}

                            {/* Footer */}
                            {showSection('footer') && (
                                <div className="pdf-footer">
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', fontSize: '7.5pt', color: '#64748b' }}>
                                        <span><strong style={{ color: '#0f172a' }}>{companyData.name}</strong></span>
                                        {companyData.phone && <span>• {companyData.phone}</span>}
                                        {companyData.email && <span>• {companyData.email}</span>}
                                        {companyData.website && <span>• {companyData.website}</span>}
                                    </div>
                                    <div style={{ marginTop: '2px', fontSize: '7pt', color: '#94a3b8' }}>
                                        {t.thankYou} • {t.regards}
                                    </div>
                                </div>
                            )}
                            {config.customFooter && (
                                <div style={{ fontSize: '6.5pt', color: '#94a3b8', textAlign: 'center', marginTop: '2px' }}>
                                    {config.customFooter}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Page Number on every page */}
                    <PdfPageNumber config={config} quoteData={quoteData} pageIndex={pageIndex} totalPages={itemChunks.length} t={t} />
                </div>
            ))}
        </div>
    );
};

export default ModernTheme;
