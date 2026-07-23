import React from 'react';
import { useMemo } from 'react';

const ClassicTheme = ({
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
    hasLineItemDiscounts
}) => {
    const classicStyles = useMemo(() => `
        .classic-theme-container {
            font-family: ${config.globalFontFamily || "'Times New Roman', Times, serif"};
            line-height: ${config.bodyLineHeight || '1.15'};
            color: ${config.globalFontColor || '#000'};
            background: #fff !important;
            font-size: ${config.fontSize || 11}px;
        }

        .classic-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: ${config.tableBodyFontSize || '10pt'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
        }

        .classic-table th {
            border: 1px solid #000;
            padding: ${config.tableHeaderPadding || '8px'};
            background: ${config.tableHeaderBg || '#e0e0e0'};
            text-align: center;
            font-weight: ${config.tableHeaderFontWeight || 'bold'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '10pt')};
            color: ${config.tableHeaderColor || '#000'};
            text-transform: ${config.tableHeaderTransform || 'none'};
        }

        .classic-table td {
            border: 1px solid #000;
            padding: ${config.tableCellPadding || '8px'};
            vertical-align: middle;
            font-size: ${config.tableBodyFontSize || 'inherit'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
        }

        ${config.tableStriped ? `
        .classic-table tr:nth-child(even) {
            background: ${config.tableStripedColor || '#f9f9f9'};
        }
        ` : ''}

        .classic-theme-container .footer {
            font-size: ${config.footerFontSize || '8pt'} !important;
            font-weight: ${config.footerFontWeight || 'normal'} !important;
            color: ${config.footerColor || '#444'};
        }
    `, [config]);

    const itemsPerPage = config.itemsPerPage || 14;
    const itemChunks = useMemo(() => {
        const chunks: any[] = [];
        if (items.length === 0) {
            chunks.push([]);
        } else {
            for (let i = 0; i < items.length; i += itemsPerPage) {
                chunks.push(items.slice(i, i + itemsPerPage));
            }
        }
        return chunks;
    }, [items, itemsPerPage]);

    const renderTable = (tableItems, startIndex) => (
        <table className="classic-table">
            <thead>
                <tr>
                    <th style={{ width: '35px' }}>#</th>
                    {config.showTableImages && <th style={{ width: '45px' }}>{t.image}</th>}
                    <th style={{ textAlign: 'left' }}>{config.textItem || t.item}</th>
                    {config.showTableUnit && <th style={{ width: '50px' }}>{config.textUnit || t.unit}</th>}
                    <th style={{ width: '60px' }}>{config.textQuantity || t.quantity}</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '50px', textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '50px' }}>{config.textVat || t.tax}</th>}
                    <th style={{ width: '100px', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td style={{ textAlign: 'center' }}>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td style={{ textAlign: 'center' }}>
                                {item.image && <img src={item.image} alt="" style={{ height: '40px', objectFit: 'contain' }} />}
                            </td>
                        )}
                        <td>
                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: '8.5pt', color: '#444' }}>{item.description}</div>}
                        </td>
                        {config.showTableUnit && <td style={{ textAlign: 'center' }}>{item.unit}</td>}
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#ef4444' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td style={{ textAlign: 'center' }}>%{item.taxRate}</td>}
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="classic-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{classicStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview" style={{
                    position: 'relative',
                    minHeight: containerStyles.pageMinHeight || '290mm',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                }}>
                    {/* Watermark */}
                    {config.showWatermark && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                                zIndex: 0,
                                transform: `rotate(${config.watermarkRotation || -45}deg)`,
                                opacity: config.watermarkOpacity,
                                fontSize: `${config.watermarkFontSize || 120}px`,
                                fontWeight: 'bold',
                                color: config.watermarkColor || '#000000',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {config.watermarkText}
                        </div>
                    )}

                    {/* Header Section - Grid Layout */}
                    {pageIndex === 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 180px', border: '1px solid #000', marginBottom: '8px' }}>
                            {/* Logo Area */}
                            <div style={{ borderRight: '1px solid #000', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {config.showLogo && companyData.logo ? (
                                    <img src={companyData.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: '12pt', fontWeight: 'bold' }}>{t.logo}</span>
                                )}
                            </div>

                            {/* Company Info */}
                            <div style={{ borderRight: '1px solid #000', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                                <div style={{ fontSize: config.headerTitleFontSize || '14pt', fontWeight: config.headerTitleFontWeight || 'bold', textTransform: 'uppercase' }}>{companyData.name}</div>
                                <div style={{ fontSize: config.headerInfoFontSize || '9pt', marginTop: '4px' }}>{companyData.address}</div>
                                <div style={{ fontSize: config.headerInfoFontSize || '9pt' }}>{companyData.phone} | {companyData.email}</div>
                                <div style={{ fontSize: config.headerInfoFontSize || '9pt' }}>{companyData.website}</div>
                            </div>

                            {/* Document Info */}
                            <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: '#e0e0e0', borderBottom: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '9pt' }}>
                                    {t.quoteNo}
                                </div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
                                    #{quoteData.number}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
                                    <div style={{ borderRight: '1px solid #000', padding: '2px', fontSize: config.quoteMetaLabelFontSize || '7.5pt', fontWeight: config.quoteMetaLabelFontWeight || 'normal', textAlign: 'center', background: '#f9f9f9' }}>
                                        {t.date}
                                    </div>
                                    <div style={{ padding: '2px', fontSize: config.quoteMetaLabelFontSize || '7.5pt', fontWeight: config.quoteMetaLabelFontWeight || 'normal', textAlign: 'center', background: '#f9f9f9' }}>
                                        {t.validUntil}
                                    </div>
                                    <div style={{ borderRight: '1px solid #000', borderTop: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: config.quoteMetaValueFontSize || '8.5pt', fontWeight: config.quoteMetaValueFontWeight || 'normal' }}>
                                        {formatDate(quoteData.date, currentLocale)}
                                    </div>
                                    <div style={{ borderTop: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: config.quoteMetaValueFontSize || '8.5pt', fontWeight: config.quoteMetaValueFontWeight || 'normal' }}>
                                        {formatDate(quoteData.validUntil, currentLocale)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ borderBottom: '2px solid #000', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em', color: '#666' }}>
                                <span>{companyData.name} - {config.title}</span>
                                <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                            </div>
                        </div>
                    )}

                    {/* Customer & Details Section - Only Page 1 */}
                    {pageIndex === 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            {/* Customer Box */}
                            <div style={{ border: '1px solid #000' }}>
                                <div style={{ background: '#e0e0e0', padding: '4px 8px', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '9pt' }}>
                                    {t.customer} / {t.to}
                                </div>
                                <div style={{ padding: '8px' }}>
                                    <div style={{ fontWeight: config.customerTitleFontWeight || 'bold', fontSize: config.customerTitleFontSize || '10pt' }}>{customerData.company}</div>
                                    <div style={{ fontSize: config.customerLabelFontSize || '9pt', fontWeight: config.customerLabelFontWeight || 'normal' }}>
                                        <span style={{ fontWeight: config.customerLabelFontWeight || 'normal' }}>{t.authorized}: </span>
                                        <span style={{ fontSize: config.customerValueFontSize || 'inherit', fontWeight: config.customerValueFontWeight || 'normal' }}>{customerData.name}</span>
                                    </div>
                                    <div style={{ fontSize: config.customerLabelFontSize || '9pt', fontWeight: config.customerLabelFontWeight || 'normal' }}>
                                        <span style={{ fontWeight: config.customerLabelFontWeight || 'normal' }}>{t.phone}: </span>
                                        <span style={{ fontSize: config.customerValueFontSize || 'inherit', fontWeight: config.customerValueFontWeight || 'normal' }}>{customerData.phone}</span>
                                    </div>
                                    <div style={{ fontSize: config.customerLabelFontSize || '9pt', fontWeight: config.customerLabelFontWeight || 'normal' }}>
                                        <span style={{ fontWeight: config.customerLabelFontWeight || 'normal' }}>{t.email}: </span>
                                        <span style={{ fontSize: config.customerValueFontSize || 'inherit', fontWeight: config.customerValueFontWeight || 'normal' }}>{customerData.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quote Details Box */}
                            <div style={{ border: '1px solid #000' }}>
                                <div style={{ background: '#e0e0e0', padding: '4px 8px', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '9pt' }}>
                                    {t.details}
                                </div>
                                <div style={{ padding: '8px' }}>
                                    <div style={{ fontWeight: config.titleFontWeight || 'bold', fontSize: config.titleFontSize || '10pt', fontFamily: config.titleFontFamily || 'inherit' }}>{config.title}</div>
                                    {config.showNotes && quoteData.notes && (
                                        <div style={{ marginTop: '4px', fontSize: '8.5pt', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                            {quoteData.notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div style={{ flex: 1 }}>
                        {renderTable(chunk, pageIndex * itemsPerPage)}
                    </div>

                    {/* Totals & Notes - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            <div style={{ display: 'flex', marginTop: '8px', pageBreakInside: 'avoid' }}>
                                {/* Left Side: Bank & Notes */}
                                <div style={{ flex: 1, paddingRight: '8px' }}>
                                    {config.showBankInfo && (
                                        <div style={{ border: '1px solid #000', marginBottom: '8px' }}>
                                            <div style={{ background: '#e0e0e0', padding: '3px 6px', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '8.5pt' }}>
                                                {t.bankInfo}
                                            </div>
                                            <div style={{ padding: '6px', fontSize: '8.5pt' }}>
                                                <div><strong>{bankData.bankName}</strong></div>
                                                <div>TR {bankData.iban}</div>
                                                <div>{bankData.accountHolder}</div>
                                            </div>
                                        </div>
                                    )}
                                    {config.showTerms && (
                                        <div style={{ border: '1px solid #000' }}>
                                            <div style={{ background: '#e0e0e0', padding: '3px 6px', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '8.5pt' }}>
                                                {t.deliveryConditions}
                                            </div>
                                            <div style={{ padding: '6px', fontSize: '8.5pt', whiteSpace: 'pre-wrap' }}>
                                                {quoteData.deliveryTerms}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Totals */}
                                <div style={{ width: '260px' }}>
                                    {config.showSummary && (
                                        <table className="classic-table" style={{ marginTop: 0 }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ textAlign: 'right', fontWeight: config.summaryLabelFontWeight || 'bold', fontSize: config.summaryLabelFontSize || 'inherit', background: '#f9f9f9', width: '40%' }}>{t.subtotal}:</td>
                                                    <td style={{ textAlign: 'right', fontWeight: config.summaryValueFontWeight || 'normal', fontSize: config.summaryValueFontSize || 'inherit' }}>{formatCurrency(subtotal)}</td>
                                                </tr>
                                                {discountAmount > 0 && (
                                                    <tr>
                                                        <td style={{ textAlign: 'right', fontWeight: config.summaryLabelFontWeight || 'bold', fontSize: config.summaryLabelFontSize || 'inherit', background: '#f9f9f9' }}>{t.discount}:</td>
                                                        <td style={{ textAlign: 'right', color: 'red', fontWeight: config.summaryValueFontWeight || 'normal', fontSize: config.summaryValueFontSize || 'inherit' }}>-{formatCurrency(discountAmount)}</td>
                                                    </tr>
                                                )}
                                                {config.showTableTax && (
                                                    <tr>
                                                        <td style={{ textAlign: 'right', fontWeight: config.summaryLabelFontWeight || 'bold', fontSize: config.summaryLabelFontSize || 'inherit', background: '#f9f9f9' }}>{t.tax}:</td>
                                                        <td style={{ textAlign: 'right', fontWeight: config.summaryValueFontWeight || 'normal', fontSize: config.summaryValueFontSize || 'inherit' }}>{formatCurrency(totalTax)}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#e0e0e0', fontSize: config.summaryTotalFontSize || '11pt' }}>{t.generalTotal}:</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#e0e0e0', fontSize: config.summaryTotalFontSize || '11pt' }}>{formatCurrency(total)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {/* Signatures */}
                            {config.showSignatures && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px', pageBreakInside: 'avoid' }}>
                                    <div style={{ border: '1px solid #000', height: '100px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#e0e0e0', padding: '3px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '8.5pt' }}>
                                            {t.deliveredBy}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: '20px' }}>
                                            {signature ? (
                                                <img src={signature} alt="Signature" style={{ maxHeight: '70px', maxWidth: '100%' }} />
                                            ) : (
                                                <span style={{ color: '#ccc', fontSize: '9pt' }}>{t.signature}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ border: '1px solid #000', height: '100px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#e0e0e0', padding: '3px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '8.5pt' }}>
                                            {t.receivedBy}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: '20px' }}>
                                            {companyData.stamp ? (
                                                <img src={companyData.stamp} alt="Stamp" style={{ maxHeight: '70px', maxWidth: '100%' }} />
                                            ) : (
                                                <span style={{ color: '#ccc', fontSize: '9pt' }}>{t.stamp} / {t.signature}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Custom Footer */}
                            {config.customFooter && (
                                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '8pt', color: '#444', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
                                    {config.customFooter}
                                </div>
                            )}

                            {/* Footer - Only Last Page */}
                            <div className="footer" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #ccc', textAlign: 'center', color: config.footerColor || '#444' }}>
                                <div style={{ marginBottom: '3px' }}>{companyData.address}</div>
                                <div style={{ marginBottom: '5px' }}>
                                    {companyData.phone} | {companyData.email} | {companyData.website}
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{ marginBottom: '3px' }}>Teşekkür Ederiz</div>
                                    <div style={{ marginBottom: '3px' }}>Saygılarımızla, {companyData.name}</div>
                                    <div style={{ fontWeight: 'bold', color: '#000' }}>{companyData.name} - {config.title}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ClassicTheme;
