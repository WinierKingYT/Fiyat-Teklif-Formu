import React, { useMemo } from 'react';
import { formatIban } from '@/utils/themeHelpers';
import { PdfWatermark, PdfPageNumber, PdfCustomFields } from './common';
import { usePdfTheme } from './hooks/usePdfTheme';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const ProTheme: React.FC<PdfThemeProps> = (props) => {
    const {
        id,
        containerStyles,
        config,
        color = '#2563eb',
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

    const proStyles = useMemo(() => `
        .pro-theme-container {
            font-family: ${config.globalFontFamily || "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.35'};
            color: ${config.globalFontColor || '#1e293b'};
            background: var(--pdf-page-bg, #ffffff) !important;
            font-size: ${typeof config.fontSize === 'number' ? config.fontSize + 'px' : (config.fontSize || '11px')};
            position: relative;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        [data-theme="dark"] .pro-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#1e293b'} !important;
        }

        [data-theme="dark"] .pro-header,
        [data-theme="dark"] .pro-summary-section,
        [data-theme="dark"] .pro-table {
            background-color: #ffffff !important;
            color: #1e293b !important;
        }

        .pro-theme-container * {
            box-sizing: border-box;
        }

        /* HEADER */
        .pro-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 10px;
            margin-bottom: 10px;
            border-bottom: 2px solid ${color};
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .pro-logo-area {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
        }

        .pro-logo-area img {
            max-height: ${config.logoMaxHeight || 50}px;
            max-width: 160px;
            object-fit: ${config.logoStyle === 'circle' ? 'cover' : 'contain'};
            border-radius: ${config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '6px' : '0'};
        }

        /* CUSTOMER SECTION */
        .pro-customer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .pro-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: ${config.borderRadius || '6px'};
            padding: 8px 10px;
        }

        .pro-card-title {
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: ${color};
            margin-bottom: 4px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 2px;
        }

        /* TABLE */
        .pro-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .pro-table th {
            background: ${config.tableHeaderBg || '#0f172a'};
            color: ${config.tableHeaderColor || '#ffffff'};
            padding: ${config.tableHeaderPadding || '5px 8px'};
            font-weight: ${config.tableHeaderFontWeight || '600'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '8pt')} !important;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            text-align: left;
        }

        .pro-table td {
            padding: ${config.tableCellPadding || '6px 8px'};
            border-bottom: 1px solid #e2e8f0;
            font-size: ${config.tableBodyFontSize || '8pt'};
            font-weight: ${config.tableBodyFontWeight || 'normal'};
            color: #334155;
            vertical-align: middle;
        }

        ${config.tableStriped ? `
        .pro-table tbody tr:nth-child(even) td {
            background-color: ${config.tableStripedColor || '#f8fafc'};
        }` : ''}

        .pro-item-image {
            width: 28px;
            height: 28px;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
        }

        .pro-item-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .pro-item-name {
            font-weight: 600;
            color: #0f172a;
            font-size: 8pt;
        }

        .pro-item-desc {
            font-size: 7.5pt !important;
            color: #64748b;
            line-height: 1.25;
            margin-top: 1px;
            white-space: pre-wrap;
            word-break: break-word;
        }

        /* TOTALS & SUMMARY */
        .pro-summary-section {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 12px;
            margin-top: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: ${config.borderRadius || '6px'};
            padding: 8px 12px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .pro-grand-total {
            display: flex;
            justify-content: space-between;
            border-top: 2px solid ${color};
            margin-top: 4px;
            padding-top: 4px;
            font-weight: 800;
            font-size: ${config.summaryTotalFontSize || '10pt'};
            color: #0f172a;
        }

        /* SIGNATURES */
        .pro-signatures {
            display: grid;
            gap: 16px;
            margin-top: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .pro-sig-box {
            text-align: center;
        }

        .pro-sig-area {
            min-height: 38px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 2px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 8px;
        }

        .pro-sig-label {
            font-size: 7pt;
            font-weight: 600;
            color: #475569;
            padding-top: 3px;
        }
    `, [config, color]);

    const renderTable = (itemsToRender: QuoteItem[], startIndex: number) => {
        const isTr = (currentLocale || 'tr').startsWith('tr');
        return (
            <table className="pro-table">
                <thead>
                    <tr>
                        <th style={{ width: '28px', textAlign: 'center' }}>#</th>
                        {config.showTableImages && <th style={{ width: '36px', textAlign: 'center' }}>{t.image}</th>}
                        <th>{config.textDescription ?? t.description}</th>
                        {config.showTableUnit && <th style={{ width: '60px', textAlign: 'center' }}>{config.textUnit ?? t.unit}</th>}
                        <th style={{ width: '50px', textAlign: 'center' }}>{config.textQuantity ?? t.quantity}</th>
                        <th style={{ width: '90px', textAlign: 'right' }}>{config.textUnitPrice ?? t.price}</th>
                        {hasLineItemDiscounts && <th style={{ width: '70px', textAlign: 'center' }}>{config.textDiscount ?? t.discount}</th>}
                        {config.showTableTax && <th style={{ width: '55px', textAlign: 'center' }}>{config.textVat ?? t.vat}</th>}
                        <th style={{ width: '95px', textAlign: 'right' }}>{config.textTotal ?? t.total}</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsToRender.map((item, index) => {
                        const isFixedDiscount = item.discountType === 'fixed';
                        const discountVal = Number(item.discountRate) || 0;
                        const discountDisplay = discountVal > 0 ? (isFixedDiscount ? formatCurrency(discountVal) : (isTr ? `%${discountVal}` : `${discountVal}%`)) : '-';
                        const baseTotal = (item.quantity || 0) * (item.price || 0);
                        const lineTotal = (typeof item.total === 'number' && item.total > 0) ? item.total : (isFixedDiscount ? Math.max(0, baseTotal - discountVal) : baseTotal * (1 - discountVal / 100));

                        return (
                            <tr key={startIndex + index} style={config.tableStriped && (startIndex + index) % 2 === 1 ? { backgroundColor: typeof config.tableStripedColor === 'string' && config.tableStripedColor ? config.tableStripedColor : '#f8fafc' } : undefined}>
                                <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{startIndex + index + 1}</td>
                                {config.showTableImages && (
                                    <td>
                                        <div className="pro-item-image">
                                            {item.image ? (
                                                <img src={item.image} alt="" />
                                            ) : (
                                                <span style={{ fontSize: '8px', color: '#94a3b8' }}>-</span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                <td>
                                    <div className="pro-item-name">{item.name}</div>
                                    {item.description && <div className="pro-item-desc">{item.description}</div>}
                                </td>
                                {config.showTableUnit && <td style={{ textAlign: 'center', color: '#475569' }}>{item.unit}</td>}
                                <td style={{ textAlign: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                                {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{discountDisplay}</td>}
                                {config.showTableTax && <td style={{ textAlign: 'center', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>{isTr ? `%${Number(item.taxRate) || 0}` : `${Number(item.taxRate) || 0}%`}</td>}
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(lineTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return (
        <div id={id} className={`pro-theme-container w-full max-w-[210mm] mx-auto ${config.margins === 'compact' ? 'pdf-compact-mode' : ''}`} style={containerStyles}>
            <style>{proStyles}</style>

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
                        <div className="pro-header">
                            <div style={{ flex: 1 }}>
                                {config.showLogo && companyData.logo && (
                                    <div className="pro-logo-area" style={{ justifyContent: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start' }}>
                                        <img src={companyData.logo} alt="Logo" />
                                    </div>
                                )}
                                <div style={{ fontSize: config.headerTitleFontSize || '14pt', fontWeight: config.headerTitleFontWeight || '800', color: '#0f172a', letterSpacing: '-0.02em' }}>{renderEditable(companyData.name, 'companyName')}</div>
                                {companyData.address && <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px' }}>{renderEditable(companyData.address, 'companyAddress')}</div>}
                                {(companyData.phone || companyData.email) && <div style={{ fontSize: '8pt', color: '#64748b' }}>{[companyData.phone, companyData.email].filter(v => typeof v === 'string' && v.trim().length > 0).join(' | ')}</div>}
                                {(companyData.taxOffice || companyData.taxNumber) && (
                                    <div style={{ fontSize: '7.5pt', color: '#94a3b8' }}>
                                        {companyData.taxOffice && <span>{(currentLocale || 'tr').startsWith('tr') ? `${companyData.taxOffice} (${t.taxOffice || 'V.D.'}) ` : `${t.taxOffice || 'Tax Office'}: ${companyData.taxOffice} `}</span>}
                                        {companyData.taxNumber && <span>No: ${companyData.taxNumber}</span>}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '16pt', fontWeight: '800', color: color, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{renderEditable(quoteData.title || config.title || t.quoteTitle, 'quoteTitle')}</div>
                                <div style={{ fontSize: '11pt', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{quoteData.number ? `#${quoteData.number}` : '-'}</div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px', fontSize: '8pt', color: '#64748b' }}>
                                    <div><strong>{t.date}:</strong> {formatDate(quoteData.date, currentLocale)}</div>
                                    <span>•</span>
                                    <div><strong>{t.validUntil}:</strong> {formatDate(quoteData.validUntil, currentLocale)}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pro-header" style={{ paddingBottom: '4px', marginBottom: '8px' }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8pt', color: '#64748b' }}>
                                <span><strong>{companyData.name ? `${companyData.name} - ` : ''}</strong>{quoteData.title || config.title || t.quoteTitle}{quoteData.number ? ` (#${quoteData.number})` : ''}</span>
                                {config.showPageNumbers !== false && (
                                    <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Customer Info Card */}
                    {showSection('customer') && pageIndex === 0 && hasCustomerData && (
                        <>
                        <div style={{ marginBottom: '10px' }}>                            <div className="pro-card">
                                <div className="pro-card-title">{[t.customer, t.to].filter(Boolean).join(' / ')}</div>
                                {customerData.company?.trim() && <div style={{ fontWeight: '700', fontSize: '9pt', color: '#0f172a', marginBottom: '2px' }}>{renderEditable(customerData.company.trim(), 'customerCompany')}</div>}
                                {customerData.name?.trim() && (
                                    <div style={{ fontSize: '8.5pt', color: '#334155' }}>
                                        <span style={{ color: '#64748b', fontWeight: '600' }}>{t.authorized}: </span>
                                        <span>{renderEditable(customerData.name.trim(), 'customerName')}</span>
                                    </div>
                                )}
                                {customerData.phone?.trim() && (
                                    <div style={{ fontSize: '8pt', color: '#334155' }}>
                                        <span style={{ color: '#64748b', fontWeight: '600' }}>{t.phone}: </span>
                                        <span>{renderEditable(customerData.phone.trim(), 'customerPhone')}</span>
                                    </div>
                                )}
                                {customerData.email?.trim() && (
                                    <div style={{ fontSize: '8pt', color: '#334155' }}>
                                        <span style={{ color: '#64748b', fontWeight: '600' }}>{t.email}: </span>
                                        <span>{renderEditable(customerData.email.trim(), 'customerEmail')}</span>
                                    </div>
                                )}
                                {customerData.address?.trim() && (
                                    <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px' }}>
                                        {customerData.address.trim()}
                                    </div>
                                )}
                                {(customerData.taxOffice?.trim() || customerData.taxNumber?.trim()) && (
                                    <div style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: '2px' }}>
                                        {customerData.taxOffice?.trim() && <span>{(currentLocale || 'tr').startsWith('tr') ? `${customerData.taxOffice.trim()} (${t.taxOffice || 'V.D.'}) ` : `${t.taxOffice || 'Tax Office'}: ${customerData.taxOffice.trim()} `}</span>}
                                        {customerData.taxNumber?.trim() && <span>No: {customerData.taxNumber.trim()}</span>}
                                    </div>
                                )}
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

                    {/* Summary Section - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: '1.25rem', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            {config.showSummary && (
                                <div className="pro-summary-section">
                                    <div>
                                        {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                            <div>
                                                <div style={{ color: color, fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px', borderBottom: '1px solid #f1f5f9', paddingBottom: '2px' }}>
                                                    {t.bankInfo}
                                                </div>
                                                <div style={{ fontSize: '8pt', color: '#475569', lineHeight: '1.4' }}>
                                                    {bankData.bankName && <div><strong>{bankData.bankName}</strong> {bankData.branch && <span>({bankData.branch})</span>}</div>}
                                                    {bankData.iban && <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{formatIban(bankData.iban)}</span></div>}
                                                    {bankData.accountHolder && <div style={{ color: '#64748b' }}>{bankData.accountHolder}</div>}
                                                </div>
                                            </div>
                                        )}
                                        {(showSection('terms') || showSection('notes')) && config.showTerms && (quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.terms) && (
                                            <div style={{ fontSize: '7.5pt', color: '#475569', lineHeight: '1.35', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                                {quoteData.deliveryTerms && <div><strong>{t.deliveryConditions}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                                {quoteData.warrantyTerms && <div><strong>{t.warrantyConditions}:</strong> {renderEditable(quoteData.warrantyTerms, 'warrantyTerms', 'textarea')}</div>}
                                                {quoteData.terms && <div><strong>{t.payment || 'Ödeme'}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '8pt', color: '#475569' }}>
                                            <span>{t.subtotal}</span>
                                            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '8pt', color: '#dc2626' }}>
                                                <span>{t.discount}{props.discount?.type !== 'fixed' ? (props.discount?.value ? ((currentLocale || 'tr').startsWith('tr') ? ` (%${props.discount.value})` : ` (${props.discount.value}%)`) : (subtotal > 0 ? ((currentLocale || 'tr').startsWith('tr') ? ` (%${((discountAmount / subtotal) * 100).toFixed(discountAmount % subtotal === 0 ? 0 : 1)})` : ` (${((discountAmount / subtotal) * 100).toFixed(discountAmount % subtotal === 0 ? 0 : 1)}%)`) : '')) : ''}:</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <>
                                                {Object.keys(vatBreakdown).length > 1 ? (
                                                    Object.entries(vatBreakdown)
                                                        .filter(([_, data]) => data.taxable > 0)
                                                        .map(([rate, data]) => (
                                                            <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '7.5pt', color: '#475569' }}>
                                                                <span>{t.vat || t.tax} ({(currentLocale || 'tr').startsWith('tr') ? `%${rate}` : `${rate}%`}):</span>
                                                                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(data.tax)}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '8pt', color: '#475569' }}>
                                                        <span>{t.vat || t.tax}:</span>
                                                        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="pro-grand-total">
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
                                <div className="pro-signatures" style={{ gridTemplateColumns: config.showCustomerSignature ? '1fr 1fr' : '1fr', maxWidth: config.showCustomerSignature ? '100%' : '280px', margin: config.showCustomerSignature ? '10px 0 8px 0' : '10px auto 8px auto' }}>
                                    <div className="pro-sig-box">
                                        <div className="pro-sig-area">
                                            {(() => {
                                                const effectiveSig = (signature === null || signature === '') ? null : (signature || companyData.signature);
                                                return effectiveSig ? <img src={effectiveSig as string} alt={t.signature} style={{ maxHeight: '38px', maxWidth: '110px', objectFit: 'contain' }} /> : null;
                                            })()}
                                            {companyData.stamp && (
                                                <img src={companyData.stamp} alt={t.companyStamp} style={{ maxHeight: '38px', maxWidth: '80px', objectFit: 'contain', opacity: 0.85 }} />
                                            )}
                                        </div>
                                        <div className="pro-sig-label">{t.seller} ({t.deliveredBy})</div>
                                    </div>
                                    {config.showCustomerSignature && (
                                        <div className="pro-sig-box">
                                            <div className="pro-sig-area">
                                            </div>
                                            <div className="pro-sig-label">{t.customer} ({t.receivedBy})</div>
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

export default ProTheme;
