import React, { useMemo } from 'react';
import { PdfWatermark, PdfContinuationHeader, PdfPageNumber, PdfFooter, PdfBankInfo, PdfTermsList, PdfSignatures, PdfAmountInWords, PdfCustomFields } from './common';
import { usePdfTheme } from './hooks/usePdfTheme';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const ClassicTheme: React.FC<PdfThemeProps> = (props) => {
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


    const classicStyles = useMemo(() => `
        .classic-theme-container {
            font-family: ${config.globalFontFamily || "'Georgia', 'Times New Roman', Times, serif"};
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

        [data-theme="dark"] .classic-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#1e293b'} !important;
        }

        [data-theme="dark"] .classic-header-box,
        [data-theme="dark"] .classic-section-box,
        [data-theme="dark"] .classic-table {
            background-color: #ffffff !important;
            color: #1e293b !important;
        }

        .classic-theme-container * {
            box-sizing: border-box;
        }

        .classic-header-box {
            border: 1.5px solid #334155;
            margin-bottom: 12px;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .classic-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 8px;
            font-size: ${config.tableBodyFontSize || '9.5pt'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
        }

        .classic-table th {
            border: 1px solid #475569;
            padding: ${config.tableHeaderPadding || '6px 8px'};
            background: ${config.tableHeaderBg || '#f1f5f9'};
            text-align: center;
            font-weight: ${config.tableHeaderFontWeight || 'bold'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '9pt')};
            color: ${config.tableHeaderColor || '#0f172a'};
            text-transform: ${config.tableHeaderTransform || 'uppercase'};
            letter-spacing: 0.03em;
        }

        .classic-table td {
            border: 1px solid #cbd5e1;
            padding: ${config.tableCellPadding || '6px 8px'};
            vertical-align: middle;
            font-size: ${config.tableBodyFontSize || 'inherit'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
            color: #1e293b;
        }

        ${config.tableStriped ? `
        .classic-table tr:nth-child(even) td {
            background: ${config.tableStripedColor || '#f8fafc'};
        }
        ` : ''}

        .classic-table td {
            height: ${typeof config.tableRowHeight === 'number' && config.tableRowHeight > 0 ? config.tableRowHeight + 'px' : 'auto'};
        }

        ${config.tableShowVerticalLines ? `
        .classic-table th,
        .classic-table td {
            border-left: 1px solid ${config.tableBorderColor || '#cbd5e1'};
        }
        .classic-table th:first-child,
        .classic-table td:first-child {
            border-left: none;
        }
        ` : ''}

        .classic-section-box {
            border: 1px solid #94a3b8;
            background: #ffffff;
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .classic-section-header {
            background: #f1f5f9;
            padding: 4px 8px;
            font-weight: 700;
            border-bottom: 1px solid #94a3b8;
            font-size: 8.5pt;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .classic-theme-container .footer {
            font-size: ${config.footerFontSize || '8pt'} !important;
            font-weight: ${config.footerFontWeight || 'normal'} !important;
            color: ${config.footerColor || '#64748b'};
            page-break-inside: avoid;
            break-inside: avoid;
        }
    `, [config]);



    const renderTable = (tableItems: QuoteItem[], startIndex: number) => (
        <table className="classic-table">
            <thead>
                <tr>
                    <th style={{ width: '35px' }}>#</th>
                    {config.showTableImages && <th style={{ width: '45px' }}>{t.image}</th>}
                    <th style={{ textAlign: 'left' }}>{config.textItem ?? t.item}</th>
                    {config.showTableUnit && <th style={{ width: '50px' }}>{config.textUnit ?? t.unit}</th>}
                    <th style={{ width: '60px' }}>{config.textQuantity ?? t.quantity}</th>
                    <th style={{ width: '85px', textAlign: 'right' }}>{config.textUnitPrice ?? t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '50px', textAlign: 'center' }}>{config.textDiscount ?? t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '50px' }}>{config.textVat ?? t.tax}</th>}
                    <th style={{ width: '105px', textAlign: 'right' }}>{config.textTotal ?? t.total}</th>
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
                            <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{startIndex + index + 1}</td>
                            {config.showTableImages && (
                                <td style={{ textAlign: 'center' }}>
                                    {item.image ? (
                                        <img src={item.image} alt="" style={{ height: '36px', width: '36px', objectFit: 'contain', margin: '0 auto' }} />
                                    ) : (
                                        <span style={{ fontSize: '8px', color: '#94a3b8' }}>-</span>
                                    )}
                                </td>
                            )}
                            <td>
                                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.name}</div>
                                {item.description && <div style={{ fontSize: '8pt', color: '#475569', marginTop: '2px', lineHeight: '1.2', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.description}</div>}
                            </td>
                            {config.showTableUnit && <td style={{ textAlign: 'center', color: '#475569' }}>{item.unit}</td>}
                            <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                            {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#dc2626', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{discountDisplay}</td>}
                            {config.showTableTax && <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: '#475569' }}>%{item.taxRate}</td>}
                            <td style={{ textAlign: 'right', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(lineTotal)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div id={id} className={`classic-theme-container w-full max-w-[210mm] mx-auto ${config.margins === 'compact' ? 'pdf-compact-mode' : ''}`} style={containerStyles}>
            <style>{classicStyles}</style>

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

                    {/* Header Section - Grid Layout */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="classic-header-box" style={{ display: 'grid', gridTemplateColumns: '130px 1fr 180px' }}>
                            {/* Logo Area */}
                            <div style={{ borderRight: '1.5px solid #334155', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start' }}>
                                {config.showLogo && companyData.logo ? (
                                    <img src={companyData.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: `${config.logoMaxHeight || 60}px`, objectFit: 'contain', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '6px' : '0' }} />
                                ) : (
                                    <span style={{ fontSize: '11pt', fontWeight: 'bold', color: '#475569' }}>{t.logo}</span>
                                )}
                            </div>

                            {/* Company Info */}
                            <div style={{ borderRight: '1.5px solid #334155', padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                                <div style={{ fontSize: config.headerTitleFontSize || '13pt', fontWeight: config.headerTitleFontWeight || 'bold', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.02em' }}>{renderEditable(companyData.name, 'companyName')}</div>
                                <div style={{ fontSize: config.headerInfoFontSize || '8.5pt', color: '#334155', marginTop: '3px', lineHeight: '1.3' }}>{companyData.address}</div>
                                <div style={{ fontSize: config.headerInfoFontSize || '8.5pt', color: '#475569', marginTop: '2px' }}>{companyData.phone} | {companyData.email}</div>
                                {companyData.website && <div style={{ fontSize: config.headerInfoFontSize || '8.5pt', color: '#475569' }}>{companyData.website}</div>}
                                {(companyData.taxOffice || companyData.taxNumber) && (
                                    <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px' }}>
                                        {companyData.taxOffice && <span>{companyData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                        {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Document Info */}
                            <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: '#f1f5f9', borderBottom: '1px solid #334155', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '8.5pt', color: '#0f172a', textTransform: 'uppercase' }}>
                                    {t.quoteNo}
                                </div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11.5pt', fontWeight: 'bold', borderBottom: '1px solid #334155', color: '#0f172a' }}>
                                    #{quoteData.number}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
                                    <div style={{ borderRight: '1px solid #334155', padding: '2px', fontSize: config.quoteMetaLabelFontSize || '7.5pt', fontWeight: config.quoteMetaLabelFontWeight || 'normal', textAlign: 'center', background: '#f8fafc', color: '#475569' }}>
                                        {t.date}
                                    </div>
                                    <div style={{ padding: '2px', fontSize: config.quoteMetaLabelFontSize || '7.5pt', fontWeight: config.quoteMetaLabelFontWeight || 'normal', textAlign: 'center', background: '#f8fafc', color: '#475569' }}>
                                        {t.validUntil}
                                    </div>
                                    <div style={{ borderRight: '1px solid #334155', borderTop: '1px solid #334155', padding: '2px', textAlign: 'center', fontSize: config.quoteMetaValueFontSize || '8pt', fontWeight: config.quoteMetaValueFontWeight || '600', color: '#0f172a' }}>
                                        {formatDate(quoteData.date, currentLocale)}
                                    </div>
                                    <div style={{ borderTop: '1px solid #334155', padding: '2px', textAlign: 'center', fontSize: config.quoteMetaValueFontSize || '8pt', fontWeight: config.quoteMetaValueFontWeight || '600', color: '#0f172a' }}>
                                        {formatDate(quoteData.validUntil, currentLocale)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ borderBottom: '1.5px solid #334155', marginBottom: '0.75rem', paddingBottom: '0.35rem' }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8pt', color: '#475569' }}>
                                <span><strong>{companyData.name}</strong> - {quoteData.title || config.title || t.quoteTitle} {quoteData.number ? ` (#${quoteData.number})` : ''}</span>
                                {config.showPageNumbers !== false && (
                                    <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Customer & Quote Details Box */}
                    {pageIndex === 0 && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: config.showCompanyDetails !== false ? '1fr 1fr' : '1fr', gap: '8px', marginBottom: '10px' }}>
                            {/* Seller Box */}
                            {config.showCompanyDetails !== false && (
                                <div className="classic-section-box">
                                    <div className="classic-section-header">
                                        {t.seller}
                                    </div>
                                    <div style={{ padding: '6px 8px', fontSize: '8pt', color: '#334155', lineHeight: '1.4' }}>
                                        <div style={{ fontWeight: '700', fontSize: '9pt', color: '#0f172a', marginBottom: '2px' }}>
                                            {renderEditable(companyData.name, 'companyName')}
                                        </div>
                                        {companyData.phone && (
                                            <div>
                                                <span style={{ color: '#64748b', fontWeight: '600' }}>{t.phone}: </span>
                                                <span>{companyData.phone}</span>
                                            </div>
                                        )}
                                        {companyData.email && (
                                            <div>
                                                <span style={{ color: '#64748b', fontWeight: '600' }}>{t.email}: </span>
                                                <span>{companyData.email}</span>
                                            </div>
                                        )}
                                        {companyData.address && (
                                            <div style={{ marginTop: '2px', color: '#64748b' }}>
                                                {companyData.address}
                                            </div>
                                        )}
                                        {(companyData.taxOffice || companyData.taxNumber) && (
                                            <div style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: '2px' }}>
                                                {companyData.taxOffice && <span>{companyData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                                {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Customer Details Box */}
                            <div className="classic-section-box">
                                <div className="classic-section-header">
                                    {t.customer}
                                </div>
                                <div style={{ padding: '6px 8px', fontSize: '8pt', color: '#334155', lineHeight: '1.4' }}>
                                    {customerData.company && (
                                        <div style={{ fontWeight: '700', fontSize: '9pt', color: '#0f172a', marginBottom: '2px' }}>
                                            {renderEditable(customerData.company, 'customerCompany')}
                                        </div>
                                    )}
                                    {customerData.name && (
                                        <div>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.authorized}: </span>
                                            <span style={{ fontWeight: '600' }}>{renderEditable(customerData.name, 'customerName')}</span>
                                        </div>
                                    )}
                                    {customerData.phone && (
                                        <div>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.phone}: </span>
                                            <span>{renderEditable(customerData.phone, 'customerPhone')}</span>
                                        </div>
                                    )}
                                    {customerData.email && (
                                        <div>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.email}: </span>
                                            <span>{renderEditable(customerData.email, 'customerEmail')}</span>
                                        </div>
                                    )}
                                    {customerData.address && (
                                        <div style={{ marginTop: '2px', color: '#64748b' }}>
                                            {customerData.address}
                                        </div>
                                    )}
                                    {(customerData.taxOffice || customerData.taxNumber) && (
                                        <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px' }}>
                                            {customerData.taxOffice && <span>{customerData.taxOffice} ({t.taxOffice || 'V.D.'}) </span>}
                                            {customerData.taxNumber && <span>No: {customerData.taxNumber}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <PdfCustomFields customFields={quoteData.customFields} themeColor="#3b82f6" />
                    </>
                    )}

                    {/* Items Table */}
                    {showSection('items') && (
                    <div style={{ flex: 1 }}>
                        {renderTable(chunk, itemChunks.slice(0, pageIndex).reduce((acc, c) => acc + c.length, 0))}
                    </div>
                    )}

                    {/* Totals & Notes - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <div style={{ display: 'flex', marginTop: '6px', gap: '8px' }}>
                                {/* Left Side: Bank & Notes */}
                                <div style={{ flex: 1 }}>
                                    {config.showBankInfo && (
                                        <div className="classic-section-box" style={{ marginBottom: '6px' }}>
                                            <div className="classic-section-header">
                                                {t.bankInfo}
                                            </div>
                                            <div style={{ padding: '5px 8px', fontSize: '8pt', color: '#334155' }}>
                                                <div><strong>{bankData.bankName}</strong> {bankData.branch && <span>({bankData.branch})</span>}</div>
                                                <div style={{ fontFamily: 'monospace', fontSize: '8.5pt', fontWeight: 600, color: '#0f172a' }}>TR {bankData.iban}</div>
                                                <div style={{ color: '#64748b' }}>{bankData.accountHolder}</div>
                                            </div>
                                        </div>
                                    )}
                                    {showSection('notes') && config.showTerms && (
                                        <div className="classic-section-box" style={{ marginBottom: '0' }}>
                                            <div className="classic-section-header">
                                                {t.deliveryConditions}
                                            </div>
                                            <div style={{ padding: '5px 8px', fontSize: '8pt', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.3' }}>
                                                {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Totals */}
                                <div style={{ width: '250px' }}>
                                    {config.showSummary && (
                                        <>
                                            <table className="classic-table" style={{ marginTop: 0, marginBottom: 0 }}>
                                                <tbody>
                                                    <tr>
                                                        <td style={{ textAlign: 'right', fontWeight: config.summaryLabelFontWeight || '600', fontSize: config.summaryLabelFontSize || '8.5pt', background: '#f8fafc', width: '45%', color: '#334155' }}>{t.subtotal}:</td>
                                                        <td style={{ textAlign: 'right', fontWeight: config.summaryValueFontWeight || 'normal', fontSize: config.summaryValueFontSize || '8.5pt', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</td>
                                                    </tr>
                                                    {discountAmount > 0 && (
                                                        <tr>
                                                            <td style={{ textAlign: 'right', fontWeight: config.summaryLabelFontWeight || '600', fontSize: config.summaryLabelFontSize || '8.5pt', background: '#f8fafc', color: '#dc2626' }}>{t.discount}:</td>
                                                            <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: config.summaryValueFontWeight || '600', fontSize: config.summaryValueFontSize || '8.5pt', fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(discountAmount)}</td>
                                                        </tr>
                                                    )}
                                                    {config.showTableTax && (
                                                        <>
                                                            {Object.keys(vatBreakdown).length > 1 ? (
                                                                Object.entries(vatBreakdown)
                                                                    .filter(([_, data]) => data.taxable > 0)
                                                                    .map(([rate, data]) => (
                                                                        <tr key={rate}>
                                                                            <td style={{ textAlign: 'right', fontWeight: config.summaryLabelFontWeight || '600', fontSize: config.summaryLabelFontSize || '8.5pt', background: '#f8fafc', color: '#334155' }}>{t.vat || t.tax} (%{rate}):</td>
                                                                            <td style={{ textAlign: 'right', fontWeight: config.summaryValueFontWeight || 'normal', fontSize: config.summaryValueFontSize || '8.5pt', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(data.tax)}</td>
                                                                        </tr>
                                                                    ))
                                                            ) : (
                                                                <tr>
                                                                    <td style={{ textAlign: 'right', fontWeight: config.summaryLabelFontWeight || '600', fontSize: config.summaryLabelFontSize || '8.5pt', background: '#f8fafc', color: '#334155' }}>{t.vat || t.tax}:</td>
                                                                    <td style={{ textAlign: 'right', fontWeight: config.summaryValueFontWeight || 'normal', fontSize: config.summaryValueFontSize || '8.5pt', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    )}
                                                    <tr>
                                                        <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#e2e8f0', fontSize: config.summaryTotalFontSize || '10pt', color: '#0f172a' }}>{t.generalTotal}:</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#e2e8f0', fontSize: config.summaryTotalFontSize || '10pt', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(total)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div style={{ fontSize: '7.5pt', color: '#64748b', fontStyle: 'italic', marginTop: '4px', textAlign: 'right' }}>
                                                {amountInWords}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div style={{ display: 'grid', gridTemplateColumns: config.showCustomerSignature ? '1fr 1fr' : '1fr', maxWidth: config.showCustomerSignature ? '100%' : '320px', margin: config.showCustomerSignature ? '10px 0 0 0' : '10px auto 0 auto', gap: '12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                    <div className="classic-section-box" style={{ minHeight: '55px', margin: 0 }}>
                                        <div className="classic-section-header" style={{ textAlign: 'center', fontSize: '7.5pt' }}>
                                            {t.seller} ({t.deliveredBy})
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '4px', minHeight: '40px' }}>
                                            {(signature || companyData.signature) && (
                                                <img src={(signature !== undefined ? signature : companyData.signature) as string} alt="Signature" style={{ maxHeight: '38px', maxWidth: '100px', objectFit: 'contain' }} />
                                            )}
                                            {companyData.stamp && (
                                                <img src={companyData.stamp} alt="Stamp" style={{ maxHeight: '38px', maxWidth: '75px', objectFit: 'contain', opacity: 0.85 }} />
                                            )}
                                            {!signature && !companyData.signature && !companyData.stamp && (
                                                <span style={{ color: '#94a3b8', fontSize: '7.5pt' }}>{t.signature} / {t.stamp}</span>
                                            )}
                                        </div>
                                    </div>
                                    {config.showCustomerSignature && (
                                        <div className="classic-section-box" style={{ minHeight: '55px', margin: 0 }}>
                                            <div className="classic-section-header" style={{ textAlign: 'center', fontSize: '7.5pt' }}>
                                                {t.customer} ({t.receivedBy})
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', minHeight: '40px' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '7.5pt' }}>{t.customerApproval || t.approvedBy || 'Kaşe / İmza'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer - Only Last Page */}
                            {showSection('footer') && (
                            <div className="footer" style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #cbd5e1', textAlign: 'center', color: (config.footerColor as string) || '#64748b', fontSize: '7.5pt' }}>
                                {config.customFooter ? (
                                    <div>{config.customFooter}</div>
                                ) : (
                                    <>
                                        <div>
                                            <strong style={{ color: '#0f172a' }}>{companyData.name}</strong> • {companyData.address}
                                            {companyData.phone && <span> • {companyData.phone}</span>}
                                            {companyData.email && <span> • {companyData.email}</span>}
                                            {companyData.website && <span> • {companyData.website}</span>}
                                        </div>
                                        <div style={{ marginTop: '2px', color: '#94a3b8' }}>
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

export default ClassicTheme;


