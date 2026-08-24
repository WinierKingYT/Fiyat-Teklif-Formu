import React, { useMemo } from 'react';
import { formatIban } from '@/utils/themeHelpers';
import { PdfWatermark, PdfPageNumber, PdfCustomFields } from './common';
import { usePdfTheme } from './hooks/usePdfTheme';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const InvoiceTheme: React.FC<PdfThemeProps> = (props) => {
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

    const invoiceStyles = useMemo(() => `
        .invoice-theme-container {
            font-family: ${config.globalFontFamily || "'Roboto', 'Segoe UI', Tahoma, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.35'};
            color: ${config.globalFontColor || '#1e293b'};
            background: var(--pdf-page-bg, #ffffff) !important;
            font-size: ${typeof config.fontSize === 'number' ? config.fontSize + 'px' : (config.fontSize || '11px')};
            position: relative;
            box-sizing: border-box;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        [data-theme="dark"] .invoice-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#1e293b'} !important;
        }

        [data-theme="dark"] .invoice-party-card,
        [data-theme="dark"] .invoice-summary-box,
        [data-theme="dark"] .invoice-sig-box {
            background-color: #ffffff !important;
            color: #1e293b !important;
        }

        .invoice-theme-container * {
            box-sizing: border-box;
        }

        .invoice-header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2.5px solid ${color};
            padding-bottom: 8px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .invoice-parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .invoice-party-card {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            background: #ffffff;
            padding: 8px 12px;
        }

        .invoice-party-label {
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            margin-bottom: 4px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 2px;
        }

        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .invoice-table th {
            background: ${config.tableHeaderBg || '#f1f5f9'};
            color: ${config.tableHeaderColor || '#1e293b'};
            padding: ${config.tableHeaderPadding || '6px 8px'};
            text-align: left;
            font-weight: 700;
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '8.5pt')};
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
        }

        .invoice-table td {
            padding: ${config.tableCellPadding || '5px 8px'};
            border: 1px solid #e2e8f0;
            font-size: ${config.tableBodyFontSize || '8.5pt'};
            color: #1e293b;
            vertical-align: middle;
        }

        .invoice-table tbody tr:nth-child(even) td {
            background-color: ${config.tableStripedColor || '#f8fafc'};
        }

        .invoice-summary-wrap {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 12px;
            margin-top: 8px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .invoice-summary-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            background: #ffffff;
            padding: 8px 12px;
        }

        .invoice-summary-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: ${config.summaryLabelFontSize || '8.5pt'};
            color: #475569;
        }

        .invoice-summary-total {
            border-top: 2px solid ${color};
            margin-top: 4px;
            padding-top: 4px;
            font-weight: 800;
            font-size: ${config.summaryTotalFontSize || '10.5pt'};
            color: #0f172a;
        }

        .invoice-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 8px;
            margin-bottom: 6px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .invoice-sig-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            background: #ffffff;
            padding: 4px 8px;
            text-align: center;
        }

        .invoice-sig-area {
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 2px 0;
        }
    `, [color, config]);

    const renderTable = (chunkItems: QuoteItem[], startIndex: number) => (
        <table className="invoice-table">
            <thead>
                <tr>
                    <th style={{ width: '35px', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '45px', textAlign: 'center' }}>{t.image}</th>}
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
                {chunkItems.map((item, idx) => {
                    const isFixedDiscount = item.discountType === 'fixed';
                    const discountVal = Number(item.discountRate) || 0;
                    const discountDisplay = discountVal > 0 ? (isFixedDiscount ? formatCurrency(discountVal) : `%${discountVal}`) : '-';
                    const baseTotal = (Number(item.quantity) || 0) * (Number(item.price) || 0);
                    const lineTotal = typeof item.total === 'number' ? item.total : (isFixedDiscount ? Math.max(0, baseTotal - discountVal) : baseTotal * (1 - discountVal / 100));

                    return (
                        <tr key={startIndex + idx}>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{startIndex + idx + 1}</td>
                            {config.showTableImages && (
                                <td style={{ textAlign: 'center' }}>
                                    {item.image ? (
                                        <img src={item.image} alt="" style={{ height: '32px', width: '32px', objectFit: 'contain', margin: '0 auto' }} />
                                    ) : (
                                        <span style={{ fontSize: '8px', color: '#94a3af' }}>-</span>
                                    )}
                                </td>
                            )}
                            <td>
                                <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.name}</div>
                                {item.description && <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '1px', lineHeight: '1.2', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.description}</div>}
                            </td>
                            {config.showTableUnit && <td style={{ textAlign: 'center', color: '#475569' }}>{item.unit || t.unit || '-'}</td>}
                            <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(Number(item.price))}</td>
                            {hasLineItemDiscounts && (
                                <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                    {discountDisplay}
                                </td>
                            )}
                            {config.showTableTax && (
                                <td style={{ textAlign: 'center', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                                    {Number(item.taxRate || 0) > 0 ? `%${item.taxRate}` : '-'}
                                </td>
                            )}
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                                {formatCurrency(lineTotal)}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div id={id} className={`invoice-theme-container w-full max-w-[210mm] mx-auto ${config.margins === 'compact' ? 'pdf-compact-mode' : ''}`} style={containerStyles}>
            <style>{invoiceStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div
                    key={pageIndex}
                    className="pdf-preview pdf-page"
                    style={{
                        position: 'relative',
                        minHeight: containerStyles?.pageMinHeight || '284mm',
                        padding: '0',
                        display: 'flex',
                        flexDirection: 'column',
                        pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                    }}
                >
                    {/* Watermark */}
                    <PdfWatermark config={config} />

                    {/* Header */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="invoice-header-bar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {config.showLogo && companyData.logo && (
                                    <img
                                        src={companyData.logo}
                                        alt="Logo"
                                        style={{ maxHeight: `${config.logoMaxHeight || 48}px`, maxWidth: '140px', objectFit: 'contain', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '4px' : '0' }}
                                    />
                                )}
                                <div>
                                    <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: color, textTransform: 'uppercase', margin: 0 }}>{renderEditable(quoteData.title || config.title || t.quoteTitle, 'quoteTitle')}</h1>
                                    <div style={{ fontSize: '9pt', fontWeight: 600, color: '#334155' }}>{renderEditable(companyData.name, 'companyName')}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '8px', fontSize: '8pt', background: '#f8fafc', padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                    {quoteData.number && <span style={{ fontWeight: '700', color: '#0f172a' }}>#{quoteData.number}</span>}
                                    <span>•</span>
                                    <span>{t.date}: {formatDate(quoteData.date, currentLocale)}</span>
                                    <span>•</span>
                                    <span>{t.validUntil}: {formatDate(quoteData.validUntil, currentLocale)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8pt', color: '#64748b', paddingBottom: '4px', marginBottom: '8px', borderBottom: '1px solid #cbd5e1' }}>
                            <span><strong>{companyData.name}</strong> - {quoteData.title || config.title || t.quoteTitle} {quoteData.number ? ` (#${quoteData.number})` : ''}</span>
                            {config.showPageNumbers !== false && (
                                <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                            )}
                        </div>
                    ))}

                    {/* Customer & Seller Information Grid - Page 1 */}
                    {showSection('customer') && pageIndex === 0 && (
                        <>
                        <div className="invoice-parties-grid">
                            {/* Seller / Düzenleyen Box */}
                            <div className="invoice-party-card">
                                <div className="invoice-party-label">{t.seller} / {t.from || 'Düzenleyen'}</div>
                                <div style={{ fontSize: '9.5pt', fontWeight: 700, color: '#0f172a' }}>{renderEditable(companyData.name, 'companyName')}</div>
                                <div style={{ fontSize: '8pt', color: '#475569', marginTop: '2px', lineHeight: '1.35' }}>
                                    {companyData.address && <div>{companyData.address}</div>}
                                    <div>{companyData.phone} | {companyData.email}</div>
                                    {(companyData.taxOffice || companyData.taxNumber) && (
                                        <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '2px' }}>
                                            {companyData.taxOffice && <span>{companyData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                            {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer / Alıcı Box */}
                            <div className="invoice-party-card">
                                <div className="invoice-party-label">{t.customer} / {t.to}</div>
                                <div style={{ fontWeight: 700, fontSize: '9.5pt', color: '#0f172a', marginBottom: '2px' }}>
                                    {renderEditable(customerData.company || customerData.name, 'customerCompany')}
                                </div>
                                <div style={{ fontSize: '8pt', color: '#475569', lineHeight: '1.35' }}>
                                    {customerData.name && customerData.company && (
                                        <div><span style={{ fontWeight: 600, color: '#64748b' }}>{t.authorized}: </span>{renderEditable(customerData.name, 'customerName')}</div>
                                    )}
                                    {customerData.phone && (
                                        <div><span style={{ fontWeight: 600, color: '#64748b' }}>{t.phone}: </span>{renderEditable(customerData.phone, 'customerPhone')}</div>
                                    )}
                                    {customerData.email && (
                                        <div><span style={{ fontWeight: 600, color: '#64748b' }}>{t.email}: </span>{renderEditable(customerData.email, 'customerEmail')}</div>
                                    )}
                                    {customerData.address && <div>{customerData.address}</div>}
                                    {(customerData.taxOffice || customerData.taxNumber) && (
                                        <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '2px' }}>
                                            {customerData.taxOffice && <span>{customerData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                            {customerData.taxNumber && <span>No: {customerData.taxNumber}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <PdfCustomFields customFields={quoteData.customFields} themeColor="#0284c7" />
                        </>
                    )}

                    {/* Items Table */}
                    {showSection('items') && (
                        <div style={{ flex: 1 }}>
                            {renderTable(chunk, itemChunks.slice(0, pageIndex).reduce((acc, c) => acc + c.length, 0))}
                        </div>
                    )}

                    {/* Summary & Footer on Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <div className="invoice-summary-wrap">
                                {/* Left Side: Bank / Notes / Terms */}
                                <div>
                                    {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                        <div style={{ fontSize: '8pt', color: '#475569', lineHeight: '1.4', marginBottom: '4px' }}>
                                            <div style={{ fontWeight: 700, color: '#64748b', fontSize: '7.5pt', textTransform: 'uppercase', marginBottom: '2px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>{t.bankInfo}</div>
                                            {bankData.bankName && <div><strong>{bankData.bankName}</strong> {bankData.branch && `(${bankData.branch})`}</div>}
                                            {bankData.iban && <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{formatIban(bankData.iban)}</span></div>}
                                            {bankData.accountHolder && <div style={{ color: '#64748b' }}>{bankData.accountHolder}</div>}
                                        </div>
                                    )}
                                    {showSection('notes') && quoteData.notes && (
                                        <div style={{ fontSize: '7.5pt', color: '#475569', marginBottom: '4px' }}>
                                            <div style={{ fontWeight: 700, color: '#64748b', fontSize: '7pt' }}>{t.notes}</div>
                                            <div style={{ whiteSpace: 'pre-wrap' }}>{renderEditable(quoteData.notes, 'notes', 'textarea')}</div>
                                        </div>
                                    )}
                                    {config.showTerms && (quoteData.deliveryTerms || quoteData.terms) && (
                                        <div style={{ fontSize: '7.5pt', color: '#475569', lineHeight: '1.3' }}>
                                            {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                            {quoteData.terms && <div><strong>{t.payment}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Totals */}
                                {config.showSummary && (
                                    <div className="invoice-summary-box">
                                        <div className="invoice-summary-row">
                                            <span>{t.subtotal}:</span>
                                            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="invoice-summary-row" style={{ color: '#dc2626' }}>
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
                                                            <div key={rate} className="invoice-summary-row" style={{ fontSize: '7.5pt' }}>
                                                                <span>{t.vat || t.tax} (%{rate}):</span>
                                                                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(data.tax)}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="invoice-summary-row">
                                                        <span>{t.vat || t.tax}:</span>
                                                        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="invoice-summary-row invoice-summary-total">
                                            <span>{t.generalTotal}:</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '7pt', color: '#64748b', fontStyle: 'italic', marginTop: '3px', textAlign: 'right', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                            {amountInWords}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="invoice-signatures" style={{ gridTemplateColumns: config.showCustomerSignature ? '1fr 1fr' : '1fr', maxWidth: config.showCustomerSignature ? '100%' : '280px', margin: config.showCustomerSignature ? '8px 0 6px 0' : '8px auto 6px auto' }}>
                                    <div className="invoice-sig-box">
                                        <div className="invoice-sig-area">
                                            {(() => {
                                                const effectiveSig = (signature === null || signature === '') ? null : (signature || companyData.signature);
                                                return effectiveSig ? <img src={effectiveSig as string}
                                                    alt="Signature"
                                                    style={{ maxHeight: '36px', maxWidth: '100px', objectFit: 'contain' }}
                                                /> : null;
                                            })()}
                                            {companyData.stamp && (
                                                <img
                                                    src={companyData.stamp}
                                                    alt="Stamp"
                                                    style={{ maxHeight: '36px', maxWidth: '75px', objectFit: 'contain', opacity: 0.85 }}
                                                />
                                            )}
                                        </div>
                                        <div style={{ fontSize: '7pt', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '2px' }}>{t.seller} ({t.deliveredBy})</div>
                                    </div>
                                    {config.showCustomerSignature && (
                                        <div className="invoice-sig-box">
                                            <div className="invoice-sig-area">
                                            </div>
                                            <div style={{ fontSize: '7pt', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '2px' }}>{t.customer} ({t.receivedBy})</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            {showSection('footer') && (
                                <div style={{ marginTop: '4px', paddingTop: '3px', borderTop: '1px solid #cbd5e1', textAlign: 'center', fontSize: '7pt', color: '#64748b' }}>
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
                                            <div style={{ fontSize: '6.5pt', color: '#94a3b8', marginTop: '1px' }}>
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

export default InvoiceTheme;
