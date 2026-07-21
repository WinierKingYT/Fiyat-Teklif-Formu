import React from 'react';

const MinimalTheme = ({
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
    const minimalStyles = React.useMemo(() => `
        .minimal-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"};
            color: ${config.globalFontColor || '#000'} !important;
            background: #fff !important;
            line-height: ${config.bodyLineHeight || '1.3'};
            font-size: ${config.fontSize || 11}px;
        }

        .minimal-header {
            font-size: ${config.headerTitleFontSize || '0.7rem'} !important;
            font-weight: ${config.headerTitleFontWeight || '600'} !important;
            text-transform: ${config.headerTransform || 'uppercase'};
            letter-spacing: 0.05em;
            color: #9ca3af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.25rem;
            margin-bottom: 0.5rem;
            font-family: ${config.headerFontFamily || 'inherit'};
        }

        .minimal-label {
            font-size: ${config.customerLabelFontSize || '0.65rem'} !important;
            font-weight: ${config.customerLabelFontWeight || 'normal'} !important;
            color: ${config.labelColor || '#6b7280'};
            margin-bottom: 0.1rem;
            font-family: ${config.labelFontFamily || 'inherit'};
        }

        .minimal-value {
            font-size: ${config.customerValueFontSize || '0.85rem'} !important;
            font-weight: ${config.customerValueFontWeight || '500'} !important;
            color: ${config.bodyColor || '#111'};
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .minimal-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }

        .minimal-table th {
            text-align: left;
            padding: ${config.tableHeaderPadding || '0.5rem 0'};
            border-bottom: 2px solid ${config.tableHeaderBorderColor || '#000'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '0.7rem')};
            text-transform: ${config.tableHeaderTransform || 'uppercase'};
            letter-spacing: 0.05em;
            font-weight: ${config.tableHeaderFontWeight || '600'};
            color: ${config.tableHeaderColor || '#000'};
            background: ${config.tableHeaderBg || 'transparent'};
        }

        .minimal-table td {
            padding: ${config.tableCellPadding || '0.5rem 0'};
            border-bottom: 1px solid ${config.tableBorderColor || '#e5e7eb'};
            font-size: ${config.tableBodyFontSize || 'inherit'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
            vertical-align: middle;
        }

        ${config.tableStriped ? `
        .minimal-table tr:nth-child(even) {
            background: ${config.tableStripedColor || '#f9fafb'};
        }
        ` : ''}
    `, [config]);

    const itemsPerPage = config.itemsPerPage || 14;
    const itemChunks = React.useMemo(() => {
        const chunks = [];
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
        <table className="minimal-table">
            <thead>
                <tr>
                    <th style={{ width: '5%' }}>#</th>
                    {config.showTableImages && <th style={{ width: '10%' }}>{t.image}</th>}
                    <th style={{ width: '45%' }}>{config.textItem || t.item}</th>
                    {config.showTableUnit && <th style={{ width: '10%', textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                    <th style={{ width: '10%', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '10%', textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '10%', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ width: '15%', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td style={{ color: '#9ca3af' }}>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td>
                                {item.image && <img src={item.image} alt="" style={{ width: '30px', height: '30px', objectFit: 'contain', borderRadius: '4px' }} />}
                            </td>
                        )}
                        <td>
                            <div style={{ fontWeight: '500', color: '#111' }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>{item.description}</div>}
                        </td>
                        {config.showTableUnit && <td style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>{item.unit}</td>}
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#ef4444' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>%{item.taxRate}</td>}
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="minimal-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{minimalStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview" style={{
                    position: 'relative',
                    minHeight: '290mm',
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

                    {/* Header Section */}
                    {pageIndex === 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {config.showLogo && companyData.logo ? (
                                    <img src={companyData.logo} alt="Logo" style={{ height: '35px', objectFit: 'contain', marginBottom: '0.5rem', alignSelf: 'flex-start' }} />
                                ) : (
                                    <div style={{ fontSize: config.headerTitleFontSize || '1.25rem', fontWeight: config.headerTitleFontWeight || '700', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{companyData.name}</div>
                                )}
                                <div style={{ fontSize: config.headerInfoFontSize || '0.8rem', color: '#4b5563' }}>{companyData.address}</div>
                                <div style={{ fontSize: config.headerInfoFontSize || '0.8rem', color: '#4b5563' }}>{companyData.phone} &bull; {companyData.email}</div>
                                <div style={{ fontSize: config.headerInfoFontSize || '0.8rem', color: '#4b5563' }}>{companyData.website}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: config.titleFontSize || '1.5rem', fontWeight: config.titleFontWeight || '300', lineHeight: '1', marginBottom: '0.25rem' }}>{config.title}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>#{quoteData.number}</div>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
                                        <div>
                                            <div className="minimal-label">{t.date}</div>
                                            <div className="minimal-value">{formatDate(quoteData.date, currentLocale)}</div>
                                        </div>
                                        <div>
                                            <div className="minimal-label" style={{ fontSize: config.quoteMetaLabelFontSize || '0.65rem', fontWeight: config.quoteMetaLabelFontWeight || 'normal' }}>{t.validUntil}</div>
                                            <div className="minimal-value" style={{ fontSize: config.quoteMetaValueFontSize || '0.85rem', fontWeight: config.quoteMetaValueFontWeight || '500' }}>{formatDate(quoteData.validUntil, currentLocale)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                            <span>{companyData.name} - {config.title}</span>
                            <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                        </div>
                    )}

                    {/* Info Grid - Only Page 1 */}
                    {pageIndex === 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            <div>
                                <div className="minimal-header" style={{ fontSize: config.customerTitleFontSize, fontWeight: config.customerTitleFontWeight }}>{t.customer}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.2rem' }}>{customerData.company}</div>
                                <div style={{ fontSize: '0.85rem', color: '#374151' }}>{customerData.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.2rem' }}>
                                    <div>{customerData.phone}</div>
                                    <div>{customerData.email}</div>
                                </div>
                            </div>
                            <div>
                                <div className="minimal-header">{t.details}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.2rem' }}>{config.title}</div>
                                {config.showNotes && quoteData.notes && (
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                        {quoteData.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div style={{ flex: 1 }}>
                        {renderTable(chunk, pageIndex * itemsPerPage)}
                    </div>

                    {/* Totals Section & Footer - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            {config.showSummary && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #000', paddingTop: '1rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ width: '220px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: config.summaryLabelFontSize || '0.85rem' }}>
                                            <span style={{ color: '#6b7280', fontWeight: config.summaryLabelFontWeight || 'normal' }}>{t.subtotal}</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: config.summaryValueFontWeight || 'normal', fontSize: config.summaryValueFontSize || 'inherit' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#ef4444' }}>
                                                <span>{t.discount}</span>
                                                <span style={{ fontFamily: 'monospace' }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#6b7280' }}>{t.tax}</span>
                                                <span style={{ fontFamily: 'monospace' }}>{formatCurrency(totalTax)}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700', color: '#000' }}>
                                            <span>{t.generalTotal}</span>
                                            <span style={{ fontFamily: 'monospace' }}>{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer / Bank / Signatures */}
                            <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', pageBreakInside: 'avoid' }}>
                                <div>
                                    {config.showBankInfo && (
                                        <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                                            <div className="minimal-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '0.2rem', color: '#9ca3af' }}>{t.bankInfo}</div>
                                            <div style={{ fontWeight: '600', color: '#111' }}>{bankData.bankName}</div>
                                            <div style={{ fontFamily: 'monospace' }}>TR {bankData.iban}</div>
                                        </div>
                                    )}
                                </div>

                                {config.showSignatures && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                                        <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '70px' }}>
                                            {signature && <img src={signature} alt="" style={{ maxHeight: '50px', objectFit: 'contain', alignSelf: 'center', marginBottom: 'auto' }} />}
                                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textAlign: 'center' }}>{t.deliveredBy}</div>
                                        </div>
                                        <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '70px' }}>
                                            {companyData.stamp && <img src={companyData.stamp} alt="" style={{ maxHeight: '50px', objectFit: 'contain', alignSelf: 'center', marginBottom: 'auto' }} />}
                                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textAlign: 'center' }}>{t.receivedBy}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Terms */}
                            {config.showTerms && (
                                <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'pre-wrap' }}>
                                    {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {quoteData.deliveryTerms}</div>}
                                    {quoteData.terms && <div><strong>{t.payment}:</strong> {quoteData.terms}</div>}
                                </div>
                            )}

                            {/* Custom Footer */}
                            {config.customFooter && (
                                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '0.5rem' }}>
                                    {config.customFooter}
                                </div>
                            )}

                            {/* Footer - Only Last Page */}
                            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', textAlign: 'center', fontSize: config.footerFontSize || '0.75rem', fontWeight: config.footerFontWeight || 'normal', color: '#6b7280' }}>
                                <div style={{ marginBottom: '0.2rem' }}>{companyData.address}</div>
                                <div style={{ marginBottom: '0.4rem' }}>
                                    {companyData.phone} | {companyData.email} | {companyData.website}
                                </div>
                                <div style={{ marginTop: '0.8rem' }}>
                                    <div style={{ marginBottom: '0.2rem' }}>Teşekkür Ederiz</div>
                                    <div style={{ marginBottom: '0.2rem' }}>Saygılarımızla, {companyData.name}</div>
                                    <div style={{ fontWeight: '600', color: '#000' }}>{companyData.name} - {config.title}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default MinimalTheme;
