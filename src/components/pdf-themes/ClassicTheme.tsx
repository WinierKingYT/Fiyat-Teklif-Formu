import React, { useMemo } from 'react';
import { formatIban, formatTaxOfficeDisplay } from '@/utils/themeHelpers';
import { PdfWatermark, PdfPageNumber, PdfCustomFields } from './common';
import { usePdfTheme } from './hooks/usePdfTheme';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const ClassicTheme: React.FC<PdfThemeProps> = (props) => {
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
    const { showSection, itemChunks, vatBreakdown, amountInWords, renderEditable, hasAnyImage } = usePdfTheme(props);
    const hasCustomerData = !!(customerData.name || customerData.company || customerData.phone || customerData.email || customerData.address || customerData.taxOffice || customerData.taxNumber || (quoteData.customFields && quoteData.customFields.length > 0));

    const classicStyles = useMemo(() => `
        .classic-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
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

        /* HEADER BOX */
        .classic-header-box {
            border: 1.5px solid #334155;
            margin-bottom: 8px;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        /* SECTION BOX */
        .classic-section-box {
            border: 1.5px solid #334155;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .classic-section-header {
            background: #334155;
            color: #ffffff;
            padding: 3px 8px;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* TABLE */
        .classic-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            border: 1.5px solid #334155;
        }

        .classic-table th {
            background: ${config.tableHeaderBg || '#334155'};
            color: ${config.tableHeaderColor || '#ffffff'};
            padding: ${config.tableHeaderPadding || '5px 6px'};
            font-weight: ${config.tableHeaderFontWeight || 'bold'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '8pt')} !important;
            text-transform: uppercase;
            border: 1px solid #475569;
            text-align: left;
        }

        .classic-table td {
            padding: ${config.tableCellPadding || '6px 7px'};
            border: 1px solid #cbd5e1;
            font-size: ${config.tableBodyFontSize || '8pt'};
            font-weight: ${config.tableBodyFontWeight || 'normal'};
            color: #1e293b;
            vertical-align: middle;
        }

        ${config.tableStriped ? `
        .classic-table tbody tr:nth-child(even) td {
            background-color: ${config.tableStripedColor || '#f8fafc'};
        }` : ''}

        ${config.tableShowVerticalLines ? `
        .classic-table th,
        .classic-table td {
            border-left: 1px solid ${config.tableBorderColor || '#cbd5e1'};
            border-right: 1px solid ${config.tableBorderColor || '#cbd5e1'};
        }` : ''}

        .classic-item-image {
            width: 28px;
            height: 28px;
            border: 1px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin: 0 auto;
        }

        .classic-item-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .classic-item-name {
            font-weight: 700;
            color: #0f172a;
            font-size: 8pt;
        }

        .classic-item-desc {
            font-size: 7.5pt !important;
            color: #64748b;
            line-height: 1.25;
            margin-top: 1px;
            white-space: pre-wrap;
            word-break: break-word;
        }

        /* TOTALS */
        .classic-totals-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #334155;
        }

        .classic-totals-table td {
            padding: 3px 6px;
            border: 1px solid #cbd5e1;
            font-size: ${config.summaryLabelFontSize || '8pt'};
        }

        .classic-totals-table .total-label {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
            width: 55%;
        }

        .classic-totals-table .total-value {
            text-align: right;
            font-weight: 600;
            color: #0f172a;
        }

        .classic-totals-table .grand-total td {
            background: #334155;
            color: #ffffff;
            font-weight: bold;
            font-size: ${config.summaryTotalFontSize || '9.5pt'};
            border-top: 2px solid #0f172a;
        }

        /* SIGNATURES */
        .classic-signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .classic-signature-box {
            border: 1.5px solid #334155;
            background: #ffffff;
        }

        .classic-signature-line {
            height: 38px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 8px;
            padding-bottom: 2px;
        }
    `, [config, color]);

    const showImageCol = config.showTableImages && hasAnyImage;

    const renderTable = (itemsToRender: QuoteItem[], startIndex: number) => {
        const isTr = (currentLocale || 'tr').startsWith('tr');
        return (
            <table className="classic-table">
                <thead>
                    <tr>
                        <th style={{ width: '28px', textAlign: 'center' }}>#</th>
                        {showImageCol && <th style={{ width: '36px', textAlign: 'center' }}>{t.image}</th>}
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
                                {showImageCol && (
                                    <td>
                                        <div className="classic-item-image">
                                            {item.image ? (
                                                <img src={item.image} alt="" />
                                            ) : (
                                                <span style={{ fontSize: '8px', color: '#94a3b8' }}>-</span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                <td>
                                    <div className="classic-item-name">{item.name}</div>
                                    {item.description && <div className="classic-item-desc">{item.description}</div>}
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

                    {/* Header Section */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="classic-header-box" style={{ display: 'grid', gridTemplateColumns: config.showLogo && companyData.logo ? '130px 1fr 180px' : '1fr 180px' }}>
                            {/* Logo Area */}
                            {config.showLogo && companyData.logo && (
                                <div style={{ borderRight: '1.5px solid #334155', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start' }}>
                                    <img src={companyData.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: `${config.logoMaxHeight || 60}px`, objectFit: config.logoStyle === 'circle' ? 'cover' : 'contain', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '6px' : '0' }} />
                                </div>
                            )}

                            {/* Company Info */}
                            <div style={{ borderRight: '1.5px solid #334155', padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                                <div style={{ fontSize: config.headerTitleFontSize || '13pt', fontWeight: config.headerTitleFontWeight || 'bold', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.02em' }}>{renderEditable(companyData.name, 'companyName')}</div>
                                <div style={{ fontSize: config.headerInfoFontSize || '8.5pt', color: '#334155', marginTop: '3px', lineHeight: '1.3' }}>{companyData.address}</div>
                                <div style={{ fontSize: config.headerInfoFontSize || '8.5pt', color: '#475569', marginTop: '2px' }}>{companyData.phone} | {companyData.email}</div>
                                {companyData.website && <div style={{ fontSize: config.headerInfoFontSize || '8.5pt', color: '#475569' }}>{companyData.website}</div>}
                                {(companyData.taxOffice || companyData.taxNumber) && (
                                    <div style={{ fontSize: '8pt', color: '#475569', marginTop: '2px' }}>
                                        {companyData.taxOffice && <span>{formatTaxOfficeDisplay(companyData.taxOffice, t.taxOffice || 'V.D.')} </span>}
                                        {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Document Info */}
                            <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: '#f1f5f9', borderBottom: '1px solid #334155', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '8.5pt', color: '#0f172a', textTransform: 'uppercase' }}>
                                    {renderEditable(quoteData.title || config.title || t.quoteTitle, 'quoteTitle')}
                                </div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11.5pt', fontWeight: 'bold', borderBottom: '1px solid #334155', color: '#0f172a' }}>
                                    {quoteData.number ? `#${quoteData.number}` : '-'}
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
                                <span><strong>{companyData.name ? `${companyData.name} - ` : ''}</strong>{quoteData.title || config.title || t.quoteTitle}{quoteData.number ? ` (#${quoteData.number})` : ''}</span>
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
                                            <div style={{ fontSize: '7.5pt', color: '#475569', marginTop: '2px' }}>
                                                {companyData.taxOffice && <span>{formatTaxOfficeDisplay(companyData.taxOffice, t.taxOffice || 'V.D.')} </span>}
                                                {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Customer Details Box */}
                            {showSection('customer') && hasCustomerData && (
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
                                            <div style={{ fontSize: '8pt', color: '#475569', marginTop: '2px' }}>
                                                {customerData.taxOffice && <span>{formatTaxOfficeDisplay(customerData.taxOffice, t.taxOffice || 'V.D.')} </span>}
                                                {customerData.taxNumber && <span>No: {customerData.taxNumber}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <PdfCustomFields customFields={quoteData.customFields} themeColor="#3b82f6" />
                    </>
                    )}

                    {/* Items Table */}
                    {showSection('items') && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {renderTable(chunk, itemChunks.slice(0, pageIndex).reduce((acc, c) => acc + c.length, 0))}
                        {pageIndex < itemChunks.length - 1 && (
                            <div style={{ marginTop: 'auto', paddingTop: '0.5rem', paddingBottom: '0.2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '7.5pt', color: '#64748b', fontStyle: 'italic' }}>
                                <span>{t.continuedOnNextPage || 'Teklif devamı sonraki sayfadadır ➔'}</span>
                            </div>
                        )}
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
                                                <div style={{ fontFamily: 'monospace', fontSize: '8.5pt', fontWeight: 600, color: '#0f172a' }}>{formatIban(bankData.iban)}</div>
                                                <div style={{ color: '#64748b' }}>{bankData.accountHolder}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Unified Notes & Terms */}
                                    {showSection('notes') && config.showNotes && quoteData.notes && (
                                        <div className="classic-section-box" style={{ marginBottom: '6px' }}>
                                            <div className="classic-section-header">
                                                {t.notes}
                                            </div>
                                            <div style={{ padding: '5px 8px', fontSize: '8pt', color: '#334155', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                                {renderEditable(quoteData.notes, 'notes', 'textarea')}
                                            </div>
                                        </div>
                                    )}

                                    {showSection('terms') && config.showTerms && (quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.terms) && (
                                        <div className="classic-section-box">
                                            <div className="classic-section-header">
                                                {t.termsAndConditions}
                                            </div>
                                            <div style={{ padding: '5px 8px', fontSize: '8pt', color: '#334155', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                                {quoteData.deliveryTerms?.trim() && <div><strong>{t.delivery}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                                {quoteData.warrantyTerms?.trim() && <div><strong>{t.warranty}:</strong> {renderEditable(quoteData.warrantyTerms, 'warrantyTerms', 'textarea')}</div>}
                                                {quoteData.terms?.trim() && <div><strong>{t.payment}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Totals Table */}
                                {config.showSummary && (
                                    <div style={{ width: '220px' }}>
                                        <table className="classic-totals-table">
                                            <tbody>
                                                <tr>
                                                    <td className="total-label">{t.subtotal}</td>
                                                    <td className="total-value" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(subtotal)}</td>
                                                </tr>
                                                {discountAmount > 0 && (
                                                    <tr>
                                                        <td className="total-label" style={{ color: '#dc2626' }}>
                                                            {t.discount}{props.discount?.type !== 'fixed' ? (props.discount?.value ? ((currentLocale || 'tr').startsWith('tr') ? ` (%${props.discount.value})` : ` (${props.discount.value}%)`) : (subtotal > 0 ? ((currentLocale || 'tr').startsWith('tr') ? ` (%${((discountAmount / subtotal) * 100).toFixed(discountAmount % subtotal === 0 ? 0 : 1)})` : ` (${((discountAmount / subtotal) * 100).toFixed(discountAmount % subtotal === 0 ? 0 : 1)}%)`) : '')) : ''}
                                                        </td>
                                                        <td className="total-value" style={{ color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(discountAmount)}</td>
                                                    </tr>
                                                )}
                                                {config.showTableTax && (
                                                    <>
                                                        {Object.keys(vatBreakdown).length > 1 ? (
                                                            Object.entries(vatBreakdown)
                                                                .filter(([_, data]) => data.taxable > 0)
                                                                .map(([rate, data]) => (
                                                                    <tr key={rate}>
                                                                        <td className="total-label">{t.vat || t.tax} ({(currentLocale || 'tr').startsWith('tr') ? `%${rate}` : `${rate}%`})</td>
                                                                        <td className="total-value" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(data.tax)}</td>
                                                                    </tr>
                                                                ))
                                                        ) : (
                                                            <tr>
                                                                <td className="total-label">{t.vat || t.tax}</td>
                                                                <td className="total-value" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(totalTax)}</td>
                                                            </tr>
                                                        )}
                                                    </>
                                                )}
                                                <tr className="grand-total">
                                                    <td>{t.generalTotal}</td>
                                                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div style={{ fontSize: '7pt', color: '#64748b', fontStyle: 'italic', marginTop: '3px', textAlign: 'right', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                            {amountInWords}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="classic-signatures-grid" style={{ gridTemplateColumns: config.showCustomerSignature ? '1fr 1fr' : '1fr', maxWidth: config.showCustomerSignature ? '100%' : '280px', margin: config.showCustomerSignature ? '8px 0 0 0' : '8px auto 0 auto' }}>
                                    <div className="classic-signature-box">
                                        <div className="classic-section-header">{t.seller} ({t.deliveredBy})</div>
                                        <div className="classic-signature-line">
                                            {(() => {
                                                const effectiveSig = (signature === null || signature === '') ? null : (signature || companyData.signature);
                                                return effectiveSig ? <img src={effectiveSig as string} alt="Signature" style={{ maxHeight: '36px', maxWidth: '100px', objectFit: 'contain' }} /> : null;
                                            })()}
                                            {companyData.stamp && <img src={companyData.stamp} alt="Stamp" style={{ maxHeight: '36px', maxWidth: '75px', objectFit: 'contain', opacity: 0.85 }} />}
                                        </div>
                                    </div>
                                    {config.showCustomerSignature && (
                                        <div className="classic-signature-box">
                                            <div className="classic-section-header">{t.customer} ({t.receivedBy})</div>
                                            <div className="classic-signature-line"></div>
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
                                            {[
                                                companyData.name ? <strong key="name" style={{ color: '#0f172a' }}>{companyData.name}</strong> : null,
                                                companyData.address ? <span key="addr">{companyData.address}</span> : null,
                                                companyData.phone ? <span key="phone">{companyData.phone}</span> : null,
                                                companyData.email ? <span key="email">{companyData.email}</span> : null,
                                                companyData.website ? <span key="web">{companyData.website}</span> : null
                                            ].filter(Boolean).reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ' • ', el]), [])}
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
