import React, { useMemo } from 'react';
import { PdfWatermark, PdfPageNumber, PdfCustomFields } from './common';
import { usePdfTheme } from './hooks/usePdfTheme';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const CorporateTheme: React.FC<PdfThemeProps> = (props) => {
    const {
        id,
        containerStyles,
        config,
        color = '#1e3a8a',
        companyData,
        quoteData,
        customerData,
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
    } = props;
    const { showSection, itemChunks, vatBreakdown, amountInWords, renderEditable } = usePdfTheme(props);

    const corporateStyles = useMemo(() => `
        .corporate-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.4'};
            color: ${config.globalFontColor || '#1e293b'};
            background: var(--pdf-page-bg, #ffffff) !important;
            font-size: ${typeof config.fontSize === 'number' ? config.fontSize + 'px' : (config.fontSize || '11px')};
            position: relative;
            box-sizing: border-box;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        [data-theme="dark"] .corporate-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#1e293b'} !important;
        }

        [data-theme="dark"] .corporate-party-card,
        [data-theme="dark"] .corporate-summary-box,
        [data-theme="dark"] .corporate-table {
            background-color: #ffffff !important;
            color: #1e293b !important;
        }

        .corporate-theme-container * {
            box-sizing: border-box;
        }

        .corporate-top-bar {
            height: 5px;
            background: ${color};
            margin-bottom: 12px;
            border-radius: 2px;
        }

        .corporate-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 10px;
            margin-bottom: 12px;
            border-bottom: 1.5px solid #e2e8f0;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .corporate-logo-box {
            max-height: ${config.logoMaxHeight || 55}px;
            display: flex;
            align-items: center;
            margin-bottom: 4px;
        }

        .corporate-logo-box img {
            max-width: 160px;
            max-height: ${config.logoMaxHeight || 55}px;
            object-fit: contain;
            border-radius: ${config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '6px' : '0'};
        }

        .corporate-parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .corporate-party-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-top: 3px solid ${color};
            border-radius: 6px;
            padding: 8px 12px;
        }

        .corporate-party-label {
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 4px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 2px;
        }

        .corporate-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .corporate-table th {
            background: ${config.tableHeaderBg || color};
            color: ${config.tableHeaderColor || '#ffffff'};
            padding: ${config.tableHeaderPadding || '6px 8px'};
            text-align: left;
            font-weight: ${config.tableHeaderFontWeight || '700'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '8.5pt')};
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-top: 1px solid ${color};
            border-bottom: 1px solid ${color};
        }

        .corporate-table td {
            padding: ${config.tableCellPadding || '6px 8px'};
            border-bottom: 1px solid #e2e8f0;
            font-size: ${config.tableBodyFontSize || '9pt'};
            font-weight: ${config.tableBodyFontWeight || 'normal'};
            color: #1e293b;
            vertical-align: middle;
        }

        .corporate-table tbody tr:nth-child(even) td {
            background-color: ${config.tableStripedColor || '#f8fafc'};
        }

        .corporate-item-image {
            width: 36px;
            height: 36px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            overflow: hidden;
            margin: 0 auto;
        }

        .corporate-item-image img {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        }

        .corporate-summary-section {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 12px;
            margin-top: 8px;
            margin-bottom: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .corporate-bank-box {
            background: #f8fafc;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }

        .corporate-totals-box {
            padding: 8px 12px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }

        .corporate-total-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: ${config.summaryLabelFontSize || '8.5pt'};
            color: #475569;
        }

        .corporate-total-row:last-child {
            border-bottom: none;
        }

        .corporate-grand-total {
            margin-top: 4px;
            padding-top: 4px;
            border-top: 2px solid ${color};
            font-weight: 800;
            font-size: ${config.summaryTotalFontSize || '10.5pt'};
            color: #0f172a;
            display: flex;
            justify-content: space-between;
        }

        .corporate-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 10px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .corporate-sig-box {
            text-align: center;
        }

        .corporate-sig-area {
            height: 48px;
            border-bottom: 1px solid #94a3b8;
            margin-bottom: 4px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 4px;
            gap: 10px;
        }

        .corporate-sig-label {
            font-size: 7.5pt;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
        }
    `, [color, config]);

    const renderTable = (tableItems: QuoteItem[], startIndex: number) => (
        <table className="corporate-table">
            <thead>
                <tr>
                    <th style={{ width: '35px', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '45px', textAlign: 'center' }}>{t.image}</th>}
                    <th style={{ textAlign: 'left' }}>{config.textItem ?? t.item}</th>
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
                    const lineTotal = isFixedDiscount ? Math.max(0, baseTotal - discountVal) : baseTotal * (1 - discountVal / 100);

                    return (
                        <tr key={startIndex + index}>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{startIndex + index + 1}</td>
                            {config.showTableImages && (
                                <td>
                                    <div className="corporate-item-image">
                                        {item.image ? (
                                            <img src={item.image} alt="" />
                                        ) : (
                                            <span style={{ fontSize: '9px', color: '#9ca3af' }}>-</span>
                                        )}
                                    </div>
                                </td>
                            )}
                            <td>
                                <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.name}</div>
                                {item.description && <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px', lineHeight: '1.2', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.description}</div>}
                            </td>
                            {config.showTableUnit && <td style={{ textAlign: 'center', color: '#475569' }}>{item.unit}</td>}
                            <td style={{ textAlign: 'center', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                            {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{discountDisplay}</td>}
                            {config.showTableTax && <td style={{ textAlign: 'center', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>%{item.taxRate}</td>}
                            <td style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(lineTotal)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div id={id} className={`corporate-theme-container w-full max-w-[210mm] mx-auto ${config.margins === 'compact' ? 'pdf-compact-mode' : ''}`} style={containerStyles}>
            <style>{corporateStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview pdf-page" style={{
                    position: 'relative',
                    minHeight: containerStyles?.pageMinHeight || '284mm',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                }}>
                    <div className="corporate-top-bar" />

                    {/* Watermark - Per Page */}
                    <PdfWatermark config={config} />

                    {/* Header */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="corporate-header">
                            <div className="corporate-header-left" style={{ flex: 1 }}>
                                {config.showLogo && companyData.logo && (
                                    <div className="corporate-logo-box" style={{ justifyContent: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start' }}>
                                        <img src={companyData.logo} alt="Logo" />
                                    </div>
                                )}
                                <div style={{ fontSize: config.headerTitleFontSize || '1.15rem', fontWeight: config.headerTitleFontWeight || '800', color: '#0f172a' }}>{renderEditable(companyData.name, 'companyName')}</div>
                                {companyData.address && <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px' }}>{renderEditable(companyData.address, 'companyAddress')}</div>}
                                <div style={{ fontSize: '8pt', color: '#64748b' }}>{companyData.phone} | {companyData.email}</div>
                                {(companyData.taxOffice || companyData.taxNumber) && (
                                    <div style={{ fontSize: '7.5pt', color: '#94a3b8' }}>
                                        {companyData.taxOffice && <span>{companyData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                        {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                    </div>
                                )}
                            </div>
                            <div className="corporate-title-box" style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div className="corporate-title" style={{ fontSize: '1.2rem', fontWeight: '800', color: color, textTransform: 'uppercase' }}>{renderEditable(quoteData.title || config.title || t.quoteTitle, 'quoteTitle')}</div>
                                <div className="corporate-meta" style={{ marginTop: '4px', display: 'inline-flex', gap: '8px', fontSize: '8pt', background: '#f8fafc', padding: '3px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    <div><strong>{t.quoteNo}:</strong> #{quoteData.number}</div>
                                    <span>•</span>
                                    <div><strong>{t.date}:</strong> {formatDate(quoteData.date, currentLocale)}</div>
                                    <span>•</span>
                                    <div><strong>{t.validUntil}:</strong> {formatDate(quoteData.validUntil, currentLocale)}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="corporate-header" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '8px', paddingBottom: '4px' }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8pt', color: '#64748b' }}>
                                <span><strong>{companyData.name}</strong> - {quoteData.title || config.title || t.quoteTitle} {quoteData.number ? ` (#${quoteData.number})` : ''}</span>
                                {config.showPageNumbers !== false && (
                                    <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Customer & Company Details - 2 Column Cards */}
                    {showSection('customer') && pageIndex === 0 && (
                        <>
                        <div className="corporate-parties-grid">
                            {/* Customer Card */}
                            <div className="corporate-party-card">
                                <div className="corporate-party-label">{t.customer} / {t.to}</div>
                                {customerData.company && <div style={{ fontWeight: '700', fontSize: '9.5pt', color: '#0f172a', marginBottom: '2px' }}>{renderEditable(customerData.company, 'customerCompany')}</div>}
                                {customerData.name && (
                                    <div style={{ fontSize: '8.5pt', color: '#334155' }}>
                                        <span style={{ color: '#64748b', fontWeight: '600' }}>{t.authorized}: </span>
                                        <span>{renderEditable(customerData.name, 'customerName')}</span>
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
                                    <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px' }}>
                                        {customerData.address}
                                    </div>
                                )}
                                {(customerData.taxOffice || customerData.taxNumber) && (
                                    <div style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: '2px' }}>
                                        {customerData.taxOffice && <span>{customerData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                        {customerData.taxNumber && <span>No: {customerData.taxNumber}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Quote Info Card */}
                            <div className="corporate-party-card">
                                <div className="corporate-party-label">{t.details}</div>
                                <div style={{ fontSize: '8.5pt', color: '#334155', lineHeight: '1.4' }}>
                                    <div><strong>{t.quoteNo}:</strong> #{quoteData.number}</div>
                                    <div><strong>{t.date}:</strong> {formatDate(quoteData.date, currentLocale)}</div>
                                    <div><strong>{t.validUntil}:</strong> {formatDate(quoteData.validUntil, currentLocale)}</div>
                                    {config.showNotes && quoteData.notes && (
                                        <div style={{ marginTop: '3px', fontSize: '8pt', color: '#64748b', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                            {renderEditable(quoteData.notes, 'notes', 'textarea')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <PdfCustomFields customFields={quoteData.customFields} themeColor={color} />
                    </>
                    )}

                    {/* Items */}
                    {showSection('items') && (
                    <div style={{ flex: 1 }}>
                        {renderTable(chunk, itemChunks.slice(0, pageIndex).reduce((acc, c) => acc + c.length, 0))}
                    </div>
                    )}

                    {/* Summary & Footer - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            {config.showSummary && (
                                <div className="corporate-summary-section">
                                    <div className="corporate-left-col">
                                        {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                            <div className="corporate-bank-box">
                                                <div style={{ fontWeight: '700', color: '#64748b', marginBottom: '3px', textTransform: 'uppercase', fontSize: '7.5pt', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>{t.bankInfo}</div>
                                                <div style={{ fontSize: '8pt', color: '#334155', lineHeight: '1.4' }}>
                                                    {bankData.bankName && <div><strong>{bankData.bankName}</strong> {bankData.branch && <span>({bankData.branch})</span>}</div>}
                                                    {bankData.iban && <div><span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>TR {bankData.iban}</span></div>}
                                                    {bankData.accountHolder && <div style={{ color: '#64748b' }}>{bankData.accountHolder}</div>}
                                                </div>
                                            </div>
                                        )}
                                        {showSection('notes') && config.showTerms && (quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.terms) && (
                                            <div style={{ marginTop: '4px', fontSize: '7.5pt', color: '#64748b', lineHeight: '1.35' }}>
                                                {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                                {quoteData.warrantyTerms && <div><strong>{t.warranty}:</strong> {renderEditable(quoteData.warrantyTerms, 'warrantyTerms', 'textarea')}</div>}
                                                {quoteData.terms && <div><strong>{t.payment}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="corporate-totals-box">
                                        <div className="corporate-total-row">
                                            <span>{t.subtotal}</span>
                                            <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="corporate-total-row" style={{ color: '#dc2626' }}>
                                                <span>{t.discount}{props.discount?.type !== 'fixed' ? ` (%${subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0})` : ''}:</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <>
                                                {Object.keys(vatBreakdown).length > 1 ? (
                                                    Object.entries(vatBreakdown)
                                                        .filter(([_, data]) => data.taxable > 0)
                                                        .map(([rate, data]) => (
                                                            <div key={rate} className="corporate-total-row" style={{ fontSize: '7.5pt' }}>
                                                                <span>{t.vat || t.tax} (%{rate}):</span>
                                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(data.tax)}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="corporate-total-row">
                                                        <span>{t.vat || t.tax}:</span>
                                                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(totalTax)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="corporate-grand-total">
                                            <span>{t.generalTotal}</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '7pt', color: '#64748b', fontStyle: 'italic', marginTop: '3px', textAlign: 'right' }}>
                                            {amountInWords}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="corporate-signatures" style={{ gridTemplateColumns: config.showCustomerSignature ? '1fr 1fr' : '1fr', maxWidth: config.showCustomerSignature ? '100%' : '280px', margin: config.showCustomerSignature ? '8px 0 0 0' : '8px auto 0 auto' }}>
                                    <div className="corporate-sig-box">
                                        <div className="corporate-sig-area">
                                            {(signature || companyData.signature) && (
                                                <img src={(signature !== undefined ? signature : companyData.signature) as string} alt="" style={{ maxHeight: '38px', maxWidth: '110px', objectFit: 'contain' }} />
                                            )}
                                            {companyData.stamp && (
                                                <img src={companyData.stamp} alt="" style={{ maxHeight: '38px', maxWidth: '80px', objectFit: 'contain', opacity: 0.85 }} />
                                            )}
                                        </div>
                                        <div className="corporate-sig-label">{t.seller} ({t.deliveredBy})</div>
                                    </div>
                                    {config.showCustomerSignature && (
                                        <div className="corporate-sig-box">
                                            <div className="corporate-sig-area">
                                            </div>
                                            <div className="corporate-sig-label">{t.customer} ({t.receivedBy})</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            {showSection('footer') && (
                            <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '7.5pt', color: '#64748b' }}>
                                {config.customFooter ? (
                                    <div>{config.customFooter}</div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                            <span><strong style={{ color: '#0f172a' }}>{companyData.name}</strong></span>
                                            {companyData.phone && <span>• {companyData.phone}</span>}
                                            {companyData.email && <span>• {companyData.email}</span>}
                                            {companyData.website && <span>• {companyData.website}</span>}
                                        </div>
                                        <div style={{ marginTop: '2px', fontSize: '7pt', color: '#94a3b8' }}>
                                            {t.thankYou} • {t.regards}
                                        </div>
                                    </>
                                )}
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

export default CorporateTheme;
