import React, { useMemo } from 'react';
import { formatIban } from '@/utils/themeHelpers';
import { PdfWatermark, PdfPageNumber, PdfCustomFields } from './common';
import { usePdfTheme } from './hooks/usePdfTheme';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const BoldTheme: React.FC<PdfThemeProps> = (props) => {
    const {
        id,
        containerStyles,
        config,
        color = '#0284c7',
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
    const hasCustomerData = !!(customerData.name || customerData.company || customerData.phone || customerData.email || customerData.address || customerData.taxOffice || customerData.taxNumber || (quoteData.customFields && quoteData.customFields.length > 0));

    const boldStyles = useMemo(() => `
        .bold-theme-container {
            font-family: ${config.globalFontFamily || "'Montserrat', 'Inter', sans-serif"};
            line-height: ${config.bodyLineHeight || '1.35'};
            color: ${config.globalFontColor || '#0f172a'};
            background: var(--pdf-page-bg, #ffffff) !important;
            font-size: ${typeof config.fontSize === 'number' ? config.fontSize + 'px' : (config.fontSize || '11px')};
            position: relative;
            box-sizing: border-box;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        [data-theme="dark"] .bold-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#0f172a'} !important;
        }

        [data-theme="dark"] .bold-party-card,
        [data-theme="dark"] .bold-table td,
        [data-theme="dark"] .bold-summary-section {
            background-color: #ffffff !important;
            color: #0f172a !important;
        }

        .bold-theme-container * {
            box-sizing: border-box;
        }

        .bold-top-gradient {
            height: 6px;
            background: linear-gradient(90deg, ${color} 0%, ${color} 70%, #0f172a 70%, #0f172a 100%);
            margin-bottom: 12px;
            border-radius: 2px;
        }

        .bold-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 3px solid ${color};
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .bold-parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .bold-party-box {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-left: 4px solid ${color};
            border-radius: 6px;
            padding: 8px 12px;
        }

        .bold-party-title {
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: ${color};
            margin-bottom: 4px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 2px;
        }

        .bold-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .bold-table th {
            background: ${config.tableHeaderBg || '#0f172a'};
            color: ${config.tableHeaderColor || '#ffffff'};
            padding: ${config.tableHeaderPadding || '6px 8px'};
            text-align: left;
            font-weight: 800;
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '8.5pt')};
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .bold-table td {
            padding: ${config.tableCellPadding || '6px 8px'};
            border-bottom: 1px solid #e2e8f0;
            font-size: ${config.tableBodyFontSize || '9pt'};
            color: #1e293b;
            vertical-align: middle;
        }

        .bold-table tbody tr:nth-child(even) td {
            background-color: ${config.tableStripedColor || '#f8fafc'};
        }

        .bold-summary-section {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 12px;
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .bold-total-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: ${config.summaryLabelFontSize || '8.5pt'};
            color: #475569;
        }

        .bold-grand-total {
            display: flex;
            justify-content: space-between;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 2.5px solid ${color};
            font-weight: 900;
            font-size: ${config.summaryTotalFontSize || '11pt'};
            color: #0f172a;
        }

        .bold-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 10px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .bold-sig-box {
            text-align: center;
        }

        .bold-sig-area {
            height: 48px;
            border-bottom: 2px solid #0f172a;
            margin-bottom: 4px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 4px;
            gap: 10px;
        }

        .bold-sig-label {
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            color: #0f172a;
        }
    `, [color, config]);

    const renderTable = (tableItems: QuoteItem[], startIndex: number) => (
        <table className="bold-table">
            <thead>
                <tr>
                    <th style={{ width: '35px', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '45px', textAlign: 'center' }}>{t.image}</th>}
                    <th style={{ textAlign: 'left' }}>{config.textItem ?? t.item}</th>
                    {config.showTableUnit && <th style={{ width: '50px', textAlign: 'center' }}>{config.textUnit ?? t.unit}</th>}
                    <th style={{ width: '55px', textAlign: 'center' }}>{config.textQuantity ?? t.quantity}</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>{config.textUnitPrice ?? t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '50px', textAlign: 'center' }}>{config.textDiscount ?? t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '50px', textAlign: 'center' }}>{config.textVat ?? t.tax}</th>}
                    <th style={{ width: '105px', textAlign: 'right' }}>{config.textTotal ?? t.total}</th>
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
                        <tr key={startIndex + index} style={config.tableStriped && (startIndex + index) % 2 === 1 ? { backgroundColor: typeof config.tableStripedColor === 'string' && config.tableStripedColor ? config.tableStripedColor : '#f8fafc' } : undefined}>
                            <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{startIndex + index + 1}</td>
                            {config.showTableImages && (
                                <td>
                                    <div style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', overflow: 'hidden' }}>
                                        {item.image ? (
                                            <img src={item.image} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ fontSize: '9px', color: '#9ca3af' }}>-</span>
                                        )}
                                    </div>
                                </td>
                            )}
                            <td>
                                <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.name}</div>
                                {item.description && <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '1px', lineHeight: '1.2', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.description}</div>}
                            </td>
                            {config.showTableUnit && <td style={{ textAlign: 'center', color: '#475569' }}>{item.unit}</td>}
                            <td style={{ textAlign: 'center', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                            {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{discountDisplay}</td>}
                            {config.showTableTax && <td style={{ textAlign: 'center', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>{(quoteData.language === 'en' || quoteData.language === 'de') ? `${Number(item.taxRate) || 0}%` : `%${Number(item.taxRate) || 0}`}</td>}
                            <td style={{ textAlign: 'right', fontWeight: '800', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(lineTotal)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div id={id} className={`bold-theme-container w-full max-w-[210mm] mx-auto ${config.margins === 'compact' ? 'pdf-compact-mode' : ''}`} style={containerStyles}>
            <style>{boldStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview pdf-page" style={{
                    position: 'relative',
                    minHeight: containerStyles?.pageMinHeight || '284mm',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                }}>
                    <div className="bold-top-gradient" />

                    {/* Watermark - Per Page */}
                    <PdfWatermark config={config} />

                    {/* Header */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="bold-header">
                            <div style={{ flex: 1, paddingRight: '12px' }}>
                                {config.showLogo && companyData.logo && (
                                    <div style={{ display: 'flex', justifyContent: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                                        <img src={companyData.logo} alt="Logo" style={{ maxHeight: `${config.logoMaxHeight || 48}px`, maxWidth: '160px', objectFit: config.logoStyle === 'circle' ? 'cover' : 'contain', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '6px' : '0' }} />
                                    </div>
                                )}
                                <div style={{ fontSize: config.headerTitleFontSize || '1.25rem', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{renderEditable(companyData.name, 'companyName')}</div>
                                <div style={{ fontSize: '8pt', color: '#475569', marginTop: '2px', lineHeight: '1.3' }}>
                                    {companyData.address && <div>{companyData.address}</div>}
                                    <div style={{ marginTop: '2px' }}>
                                        {companyData.phone && <span>{companyData.phone}</span>}
                                        {companyData.phone && companyData.email && <span> • </span>}
                                        {companyData.email && <span>{companyData.email}</span>}
                                    </div>
                                    {(companyData.taxOffice || companyData.taxNumber) && (
                                        <div style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: '1px' }}>
                                            {companyData.taxOffice && <span>{(currentLocale || 'tr').startsWith('tr') ? `${companyData.taxOffice} (${t.taxOffice || 'V.D.'}) ` : `${t.taxOffice || 'Tax Office'}: ${companyData.taxOffice} `}</span>}
                                            {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '1.35rem', fontWeight: '900', textTransform: 'uppercase', color: color }}>{renderEditable(quoteData.title || config.title || t.quoteTitle, 'quoteTitle')}</div>
                                <div style={{ marginTop: '4px', display: 'inline-flex', gap: '8px', fontSize: '8pt', background: '#f8fafc', padding: '3px 6px', borderRadius: '4px', border: '1.5px solid #e2e8f0' }}>
                                    {quoteData.number?.trim() && <span style={{ fontWeight: '800' }}>#{quoteData.number.trim()}</span>}
                                    {quoteData.number?.trim() && <span>•</span>}
                                    <span>{t.date}: {formatDate(quoteData.date, currentLocale)}</span>
                                    <span>•</span>
                                    <span>{t.validUntil}: {formatDate(quoteData.validUntil, currentLocale)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: `2px solid ${color}`, paddingBottom: '4px', fontSize: '8pt', color: '#64748b' }}>
                            <span><strong>{companyData.name ? `${companyData.name} - ` : ''}</strong>{quoteData.title || config.title || t.quoteTitle}{quoteData.number ? ` (#${quoteData.number})` : ''}</span>
                            {config.showPageNumbers !== false && (
                                <span style={{ fontWeight: '700' }}>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                            )}
                        </div>
                    ))}

                    {/* Customer & Quote Details */}
                    {showSection('customer') && pageIndex === 0 && hasCustomerData && (
                        <>
                        <div className="bold-parties-grid">
                            {/* Customer Box */}
                            <div className="bold-party-box">
                                <div className="bold-party-title">{[t.customer, t.to].filter(Boolean).join(' / ')}</div>
                                {customerData.company && (
                                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                                        {renderEditable(customerData.company, 'customerCompany')}
                                    </div>
                                )}
                                {customerData.name && (
                                    <div style={{ fontSize: '8.5pt', color: '#334155' }}>
                                        <span style={{ color: '#64748b', fontWeight: '700' }}>{t.authorized}: </span>
                                        <span>{renderEditable(customerData.name, 'customerName')}</span>
                                    </div>
                                )}
                                {customerData.phone && (
                                    <div style={{ fontSize: '8pt', color: '#334155' }}>
                                        <span style={{ color: '#64748b', fontWeight: '700' }}>{t.phone}: </span>
                                        <span>{renderEditable(customerData.phone, 'customerPhone')}</span>
                                    </div>
                                )}
                                {customerData.email && (
                                    <div style={{ fontSize: '8pt', color: '#334155' }}>
                                        <span style={{ color: '#64748b', fontWeight: '700' }}>{t.email}: </span>
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
                                        {customerData.taxOffice && <span>{(currentLocale || 'tr').startsWith('tr') ? `${customerData.taxOffice} (${t.taxOffice || 'V.D.'}) ` : `${t.taxOffice || 'Tax Office'}: ${customerData.taxOffice} `}</span>}
                                        {customerData.taxNumber && <span>No: {customerData.taxNumber}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Quote Info Box */}
                            <div className="bold-party-box">
                                <div className="bold-party-title">{t.details}</div>
                                <div style={{ fontSize: '8.5pt', color: '#334155', lineHeight: '1.4' }}>
                                    <div><strong>{t.quoteNo}:</strong> {quoteData.number ? `#${quoteData.number}` : '-'}</div>
                                    <div><strong>{t.date}:</strong> {formatDate(quoteData.date, currentLocale)}</div>
                                    <div><strong>{t.validUntil}:</strong> {formatDate(quoteData.validUntil, currentLocale)}</div>
                                    {config.showNotes && quoteData.notes && (
                                        <div style={{ marginTop: '2px', fontSize: '8pt', color: '#64748b', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                            {renderEditable(quoteData.notes, 'notes', 'textarea')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <PdfCustomFields customFields={quoteData.customFields} themeColor={color} />
                        </>
                    )}

                    {/* Items Table */}
                    {showSection('items') && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {renderTable(chunk, itemChunks.slice(0, pageIndex).reduce((acc, c) => acc + c.length, 0))}
                        {pageIndex < itemChunks.length - 1 && (
                            <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', paddingBottom: '0.2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '7.5pt', color: '#64748b', fontStyle: 'italic' }}>
                                <span>{t.continuedOnNextPage || 'Teklif devamı sonraki sayfadadır ➔'}</span>
                            </div>
                        )}
                    </div>
                    )}

                    {/* Summary, Signatures, Terms - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: '1.25rem', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            {config.showSummary && (
                                <div className="bold-summary-section">
                                    <div>
                                        {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                            <div>
                                                <div style={{ color: color, fontSize: '8pt', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px', borderBottom: '1px solid #f1f5f9', paddingBottom: '2px' }}>
                                                    {t.bankInfo}
                                                </div>
                                                <div style={{ fontSize: '8pt', color: '#475569', lineHeight: '1.4' }}>
                                                    {bankData.bankName && <div><strong>{bankData.bankName}</strong> {bankData.branch && <span>({bankData.branch})</span>}</div>}
                                                    {bankData.iban && <div><span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0f172a' }}>{formatIban(bankData.iban)}</span></div>}
                                                    {bankData.accountHolder && <div style={{ color: '#64748b' }}>{bankData.accountHolder}</div>}
                                                </div>
                                            </div>
                                        )}
                                        {showSection('notes') && config.showTerms && (quoteData.deliveryTerms || quoteData.terms) && (
                                            <div style={{ fontSize: '7.5pt', color: '#475569', lineHeight: '1.35', marginTop: '4px' }}>
                                                {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                                {quoteData.terms && <div><strong>{t.payment}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="bold-total-row">
                                            <span>{t.subtotal}</span>
                                            <span style={{ fontWeight: '700', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="bold-total-row" style={{ color: '#dc2626' }}>
                                                <span>{t.discount}{props.discount?.type !== 'fixed' ? props.discount?.value ? ` (%${props.discount.value})` : ` (%${subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0})` : ''}:</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '700' }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <>
                                                {Object.keys(vatBreakdown).length > 1 ? (
                                                    Object.entries(vatBreakdown)
                                                        .filter(([_, data]) => data.taxable > 0)
                                                        .map(([rate, data]) => (
                                                            <div key={rate} className="bold-total-row" style={{ fontSize: '7.5pt' }}>
                                                                <span>{t.vat || t.tax} ({(currentLocale || 'tr').startsWith('tr') ? `%${rate}` : `${rate}%`}):</span>
                                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(data.tax)}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="bold-total-row">
                                                        <span>{t.vat || t.tax}:</span>
                                                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(totalTax)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="bold-grand-total">
                                            <span>{t.generalTotal}</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '7pt', color: '#64748b', fontStyle: 'italic', marginTop: '3px', textAlign: 'right', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                            {amountInWords}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="bold-signatures" style={{ gridTemplateColumns: config.showCustomerSignature ? '1fr 1fr' : '1fr', maxWidth: config.showCustomerSignature ? '100%' : '280px', margin: config.showCustomerSignature ? '10px 0 8px 0' : '10px auto 8px auto' }}>
                                    <div className="bold-sig-box">
                                        <div className="bold-sig-area">
                                            {(() => {
                                                const effectiveSig = (signature === null || signature === '') ? null : (signature || companyData.signature);
                                                return effectiveSig ? <img src={effectiveSig as string}
                                                    alt="Signature"
                                                    style={{ maxHeight: '38px', maxWidth: '110px', objectFit: 'contain' }}
                                                /> : null;
                                            })()}
                                            {companyData.stamp && (
                                                <img
                                                    src={companyData.stamp}
                                                    alt="Stamp"
                                                    style={{ maxHeight: '38px', maxWidth: '80px', objectFit: 'contain', opacity: 0.85 }}
                                                />
                                            )}
                                        </div>
                                        <div className="bold-sig-label">
                                            {t.seller} ({t.deliveredBy || 'Kaşe & İmza'})
                                        </div>
                                    </div>
                                    {config.showCustomerSignature && (
                                        <div className="bold-sig-box">
                                            <div className="bold-sig-area">
                                            </div>
                                            <div className="bold-sig-label">
                                                {t.customer} ({t.customerApproval || 'Onay / İmza'})
                                            </div>
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
                                            <div style={{ fontSize: '7pt', color: '#94a3b8', marginTop: '2px' }}>
                                                <span>{t.thankYou} • {t.regards}</span>
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

export default BoldTheme;
