import React, { useMemo } from 'react';
import { formatIban } from '@/utils/themeHelpers';
import { PdfWatermark, PdfContinuationHeader, PdfPageNumber, PdfFooter, PdfBankInfo, PdfTermsList, PdfSignatures, PdfAmountInWords, PdfCustomFields } from './common';
import { usePdfTheme } from './hooks/usePdfTheme';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const MinimalTheme: React.FC<PdfThemeProps> = (props) => {
    const {
        id,
        containerStyles,
        config,
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
        onEdit,
        activeLayout
    } = props;
    const { layoutMap, showSection, itemChunks, vatBreakdown, amountInWords, renderEditable } = usePdfTheme(props);


    const minimalStyles = useMemo(() => `
        .minimal-theme-container {
            font-family: ${config.globalFontFamily || "'Helvetica Neue', Helvetica, Arial, sans-serif"};
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

        [data-theme="dark"] .minimal-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#0f172a'} !important;
        }

        [data-theme="dark"] .minimal-table {
            background-color: #ffffff !important;
            color: #0f172a !important;
        }

        .minimal-theme-container * {
            box-sizing: border-box;
        }

        .minimal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 10px;
            margin-bottom: 12px;
            border-bottom: 1.5px solid #0f172a;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .minimal-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 8px;
        }

        .minimal-table th {
            border-bottom: 1.5px solid #0f172a;
            border-top: 1.5px solid #0f172a;
            padding: ${config.tableHeaderPadding || '5px 6px'};
            text-align: left;
            font-weight: 700;
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '8pt')};
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: transparent;
        }

        .minimal-table td {
            border-bottom: 1px solid #f1f5f9;
            padding: ${config.tableCellPadding || '5px 6px'};
            font-size: ${config.tableBodyFontSize || '8.5pt'};
            color: #1e293b;
            vertical-align: middle;
        }

        ${config.tableStriped ? `
        .minimal-table tbody tr:nth-child(even) td {
            background-color: ${config.tableStripedColor || '#f8fafc'};
        }
        ` : ''}

        .minimal-box {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 10px;
            background: #ffffff;
        }

        .minimal-box-title {
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 4px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 2px;
        }
    `, [config]);



    const renderTable = (tableItems: QuoteItem[], startIndex: number) => (
        <table className="minimal-table">
            <thead>
                <tr>
                    <th style={{ width: '30px', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '40px', textAlign: 'center' }}>{t.image}</th>}
                    <th style={{ textAlign: 'left' }}>{config.textItem ?? t.item}</th>
                    {config.showTableUnit && <th style={{ width: '45px', textAlign: 'center' }}>{config.textUnit ?? t.unit}</th>}
                    <th style={{ width: '50px', textAlign: 'center' }}>{config.textQuantity ?? t.quantity}</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>{config.textUnitPrice ?? t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '45px', textAlign: 'center' }}>{config.textDiscount ?? t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '45px', textAlign: 'center' }}>{config.textVat ?? t.tax}</th>}
                    <th style={{ width: '95px', textAlign: 'right' }}>{config.textTotal ?? t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => {
                    const isFixedDiscount = item.discountType === 'fixed';
                    const discountVal = Number(item.discountRate) || 0;
                    const discountDisplay = discountVal > 0 ? (isFixedDiscount ? formatCurrency(discountVal) : `%${discountVal}`) : '-';
                    const baseTotal = (item.quantity || 0) * (item.price || 0);
                    const lineTotal = typeof item.total === 'number' ? item.total : (isFixedDiscount ? Math.max(0, baseTotal - discountVal) : baseTotal * (1 - discountVal / 100));

                    return (
                        <tr key={startIndex + index}>
                            <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '8pt' }}>{startIndex + index + 1}</td>
                            {config.showTableImages && (
                                <td style={{ textAlign: 'center' }}>
                                    {item.image ? (
                                        <img src={item.image} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', margin: '0 auto' }} />
                                    ) : (
                                        <span style={{ fontSize: '8px', color: '#94a3b8' }}>-</span>
                                    )}
                                </td>
                            )}
                            <td>
                                <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</div>
                                {item.description && <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '1px', lineHeight: '1.2', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.description}</div>}
                            </td>
                            {config.showTableUnit && <td style={{ textAlign: 'center', color: '#64748b', fontSize: '7.5pt' }}>{item.unit}</td>}
                            <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                            {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#dc2626', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{discountDisplay}</td>}
                            {config.showTableTax && <td style={{ textAlign: 'center', fontSize: '7.5pt', fontVariantNumeric: 'tabular-nums', color: '#64748b' }}>{(quoteData.language === 'en' || quoteData.language === 'de') ? `${Number(item.taxRate) || 0}%` : `%${Number(item.taxRate) || 0}`}</td>}
                            <td style={{ textAlign: 'right', fontWeight: '600', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(lineTotal)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div id={id} className={`minimal-theme-container w-full max-w-[210mm] mx-auto ${config.margins === 'compact' ? 'pdf-compact-mode' : ''}`} style={containerStyles}>
            <style>{minimalStyles}</style>

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

                    {/* Header Section */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="minimal-header">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                {config.showLogo && companyData.logo ? (
                                    <img src={companyData.logo} alt="Logo" style={{ maxHeight: `${config.logoMaxHeight || 36}px`, objectFit: 'contain', marginBottom: '3px', alignSelf: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '4px' : '0' }} />
                                ) : (
                                    <div style={{ fontSize: config.headerTitleFontSize || '1.15rem', fontWeight: config.headerTitleFontWeight || '800', letterSpacing: '-0.02em', color: '#0f172a' }}>{renderEditable(companyData.name, 'companyName')}</div>
                                )}
                                {companyData.address && <div style={{ fontSize: '7.5pt', color: '#64748b' }}>{companyData.address}</div>}
                                <div style={{ fontSize: '7.5pt', color: '#64748b' }}>
                                    {companyData.phone && <span>{companyData.phone}</span>}
                                    {companyData.phone && companyData.email && <span> • </span>}
                                    {companyData.email && <span>{companyData.email}</span>}
                                    {(companyData.phone || companyData.email) && companyData.website && <span> • </span>}
                                    {companyData.website && <span>{companyData.website}</span>}
                                </div>
                                {(companyData.taxOffice || companyData.taxNumber) && (
                                    <div style={{ fontSize: '7pt', color: '#94a3b8' }}>
                                        {companyData.taxOffice && <span>{companyData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                        {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a' }}>{renderEditable(quoteData.title || config.title || t.quoteTitle, 'quoteTitle')}</div>
                                <div style={{ marginTop: '3px', display: 'inline-flex', gap: '6px', fontSize: '7.5pt', background: '#f8fafc', padding: '2px 6px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                                    {quoteData.number && <span style={{ fontWeight: '700', color: '#0f172a' }}>#{quoteData.number}</span>}
                                    <span>•</span>
                                    <span>{t.date}: {formatDate(quoteData.date, currentLocale)}</span>
                                    <span>•</span>
                                    <span>{t.validUntil}: {formatDate(quoteData.validUntil, currentLocale)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', fontSize: '7.5pt', color: '#94a3b8' }}>
                            <span><strong>{companyData.name}</strong> - {quoteData.title || config.title || t.quoteTitle} {quoteData.number ? ` (#${quoteData.number})` : ''}</span>
                            {config.showPageNumbers !== false && (
                                <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                            )}
                        </div>
                    ))}

                    {/* Customer Info Box - Only Page 1 */}
                    {showSection('customer') && pageIndex === 0 && (
                        <div className="minimal-box" style={{ marginBottom: '10px' }}>
                            <div className="minimal-box-title">{t.customer} / {t.to}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3px 12px', alignItems: 'center' }}>
                                {customerData.company && <div style={{ gridColumn: '1 / -1', fontSize: '9pt', fontWeight: '700', color: '#0f172a' }}>{renderEditable(customerData.company, 'customerCompany')}</div>}
                                {customerData.name && <div style={{ fontSize: '7.5pt', color: '#334155' }}><span style={{ color: '#64748b', fontWeight: '600' }}>{t.authorized}: </span>{renderEditable(customerData.name, 'customerName')}</div>}
                                {customerData.phone && <div style={{ fontSize: '7.5pt', color: '#334155' }}><span style={{ color: '#64748b', fontWeight: '600' }}>{t.phone}: </span>{renderEditable(customerData.phone, 'customerPhone')}</div>}
                                {customerData.email && <div style={{ fontSize: '7.5pt', color: '#334155' }}><span style={{ color: '#64748b', fontWeight: '600' }}>{t.email}: </span>{renderEditable(customerData.email, 'customerEmail')}</div>}
                                {customerData.address && <div style={{ gridColumn: '1 / -1', fontSize: '7.5pt', color: '#64748b' }}>{customerData.address}</div>}
                                {(customerData.taxOffice || customerData.taxNumber) && (
                                    <div style={{ gridColumn: '1 / -1', fontSize: '7pt', color: '#94a3b8' }}>
                                        {customerData.taxOffice && <span>{customerData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                        {customerData.taxNumber && <span>No: {customerData.taxNumber}</span>}
                                    </div>
                                )}
                            </div>
                            <PdfCustomFields customFields={quoteData.customFields} themeColor="#0f172a" />
                        </div>
                    )}

                    {/* Items Table */}
                    <div style={{ flex: 1 }}>
                        {showSection('items') && renderTable(chunk, itemChunks.slice(0, pageIndex).reduce((acc, c) => acc + c.length, 0))}
                    </div>

                    {/* Totals Section & Footer - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            {config.showSummary && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '12px', marginTop: '8px', borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
                                    <div>
                                        {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                            <div style={{ fontSize: '7.5pt', color: '#475569', lineHeight: '1.4' }}>
                                                <div style={{ fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '7pt', marginBottom: '2px' }}>{t.bankInfo}</div>
                                                {bankData.bankName && <div><strong>{bankData.bankName}</strong> {bankData.branch && <span>({bankData.branch})</span>}</div>}
                                                {bankData.iban && <div><span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>{formatIban(bankData.iban)}</span></div>}
                                                {bankData.accountHolder && <div style={{ color: '#64748b' }}>{bankData.accountHolder}</div>}
                                            </div>
                                        )}
                                        {showSection('notes') && config.showNotes && quoteData.notes && (
                                            <div style={{ marginTop: '4px', fontSize: '7.5pt', color: '#475569' }}>
                                                <div style={{ fontWeight: '700', color: '#64748b', fontSize: '7pt' }}>{t.notes}</div>
                                                <div>{renderEditable(quoteData.notes, 'notes', 'textarea')}</div>
                                            </div>
                                        )}
                                        {showSection('notes') && config.showTerms && (quoteData.deliveryTerms || quoteData.terms) && (
                                            <div style={{ marginTop: '4px', fontSize: '7pt', color: '#64748b', lineHeight: '1.3' }}>
                                                {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                                {quoteData.terms && <div><strong>{t.payment}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '7.5pt', color: '#475569' }}>
                                            <span>{t.subtotal}</span>
                                            <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '7.5pt', color: '#dc2626' }}>
                                                <span>{t.discount}</span>
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
                                                                <span>{t.vat || t.tax} (%{rate})</span>
                                                                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(data.tax)}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '7.5pt', color: '#475569' }}>
                                                        <span>{t.vat || t.tax}</span>
                                                        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #0f172a', marginTop: '3px', paddingTop: '3px', fontSize: '9.5pt', fontWeight: '800', color: '#0f172a' }}>
                                            <span>{t.generalTotal}</span>
                                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '6.5pt', color: '#64748b', fontStyle: 'italic', marginTop: '2px', textAlign: 'right' }}>
                                            {amountInWords}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div style={{ display: 'grid', gridTemplateColumns: config.showCustomerSignature ? '1fr 1fr' : '1fr', maxWidth: config.showCustomerSignature ? '100%' : '260px', margin: config.showCustomerSignature ? '8px 0 4px 0' : '8px auto 4px auto', gap: '16px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ minHeight: '40px', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px' }}>
                                            {(signature || companyData.signature) && <img src={(signature !== undefined ? signature : companyData.signature) as string} alt="" style={{ maxHeight: '36px', maxWidth: '90px', objectFit: 'contain' }} />}
                                            {companyData.stamp && <img src={companyData.stamp} alt="" style={{ maxHeight: '36px', maxWidth: '70px', objectFit: 'contain', opacity: 0.85 }} />}
                                        </div>
                                        <div style={{ fontSize: '7pt', fontWeight: '600', color: '#0f172a', paddingTop: '2px' }}>{t.seller} ({t.deliveredBy})</div>
                                    </div>
                                    {config.showCustomerSignature && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ minHeight: '40px', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                            </div>
                                            <div style={{ fontSize: '7pt', fontWeight: '600', color: '#0f172a', paddingTop: '2px' }}>{t.customer} ({t.receivedBy})</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            {showSection('footer') && (
                            <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '7pt', color: '#64748b' }}>
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
                                        <div style={{ marginTop: '1px', fontSize: '6.5pt', color: '#94a3b8' }}>
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

export default MinimalTheme;
