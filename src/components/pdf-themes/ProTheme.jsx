import React from 'react';

const ProTheme = ({
    id,
    containerStyles,
    config,
    color,
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
    discount,
    discountAmount,
    totalTax,
    total,
    currentLocale,
    hasLineItemDiscounts
}) => {
    const getAdjustedFontSize = (size) => {
        const factor = 0.8;
        if (!size || size === 'inherit') return '0.75em';
        if (typeof size === 'number') return `${size * factor}px`;
        if (typeof size === 'string') {
            if (size.endsWith('px')) return `${parseFloat(size) * factor}px`;
            if (size.endsWith('rem') || size.endsWith('em')) return `calc(${size} * ${factor})`;
        }
        return '0.75em';
    };

    const proStyles = useMemo(() => `
        .pro-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.4'};
            color: ${config.globalFontColor || '#1e293b'};
            font-size: ${config.fontSize || 12}px;
            background-color: #ffffff !important;
            position: relative;
        }

        .pro-theme-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, ${color}, #ededed);
        }

        .pro-theme-container .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: ${config.sectionSpacing || '1.5em'};
            padding-bottom: 1em;
            border-bottom: ${config.boxBorderWidth || '1px'} ${config.boxBorderStyle || 'solid'} ${config.boxBorderColor || '#e2e8f0'};
        }

        .pro-theme-container .header-left {
            display: flex;
            align-items: flex-start;
            gap: 1.5em;
            flex: 1;
        }

        .pro-theme-container .company-logo {
            width: 120px;
            height: 60px;
            border: ${config.boxBorderWidth || '1px'} ${config.boxBorderStyle || 'solid'} ${config.boxBorderColor || '#e2e8f0'};
            border-radius: ${config.borderRadius || 6}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #000000;
            font-size: 0.6em;
            text-align: center;
            padding: 0.5em;
            overflow: hidden;
        }

        .pro-theme-container .company-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .pro-theme-container .company-info {
            flex: 1;
        }

        .pro-theme-container .company-name {
            font-size: ${config.headerTitleFontSize || '1.4em'} !important;
            font-weight: ${config.headerTitleFontWeight || '800'} !important;
            color: ${color};
            margin-bottom: 0.25em;
            font-family: ${config.headerFontFamily || 'inherit'};
        }

        .pro-theme-container .company-details {
            font-size: ${config.headerInfoFontSize || '0.85em'} !important;
            color: ${config.bodyColor || '#334155'};
            line-height: 1.4;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .pro-theme-container .quote-info {
            text-align: right;
            background: #f8fafc;
            padding: 1em;
            border-radius: ${config.borderRadius || 6}px;
            border-left: 4px solid ${color};
            min-width: 200px;
        }

        .pro-theme-container .quote-title {
            font-family: ${config.titleFontFamily || 'inherit'};
            font-size: ${config.titleFontSize || '1.2em'};
            font-weight: ${config.titleFontWeight || '800'};
            color: ${color};
            letter-spacing: ${config.titleLetterSpacing || 'normal'};
            text-transform: ${config.titleTransform || 'uppercase'};
            margin-bottom: 0.5em;
        }

        .pro-theme-container .quote-meta {
            font-size: ${config.quoteMetaLabelFontSize || '0.85em'};
            color: ${config.labelColor || '#64748b'};
            font-family: ${config.labelFontFamily || 'inherit'};
        }

        .pro-theme-container .quote-meta div {
            margin-bottom: 0.25em;
            font-weight: ${config.quoteMetaValueFontWeight || 'normal'};
            font-size: ${config.quoteMetaValueFontSize || 'inherit'};
        }

        .pro-theme-container .quote-meta div strong {
             font-weight: ${config.quoteMetaLabelFontWeight || 'bold'};
        }

        .pro-theme-container .quote-number {
            font-weight: 700;
            color: #0f172a;
            font-size: 1.1em;
            margin-bottom: 0.5em;
        }

        .pro-theme-container .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5em;
            margin-bottom: ${config.sectionSpacing || '1.5em'};
        }

        .pro-theme-container .customer-box {
            background: #f8fafc;
            border-radius: ${config.borderRadius || 6}px;
            padding: ${config.boxPadding || '1.2em'};
            border: ${config.boxBorderWidth || '1px'} ${config.boxBorderStyle || 'solid'} ${config.boxBorderColor || '#e2e8f0'};
        }

        .pro-theme-container .section-title {
            font-family: ${config.headerFontFamily || 'inherit'};
            font-size: ${config.customerTitleFontSize || '0.9em'} !important;
            font-weight: ${config.customerTitleFontWeight || '700'} !important;
            color: ${color};
            text-transform: ${config.headerTransform || 'uppercase'};
            margin-bottom: 1em;
            display: flex;
            align-items: center;
            gap: 0.5em;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 0.5em;
        }

        .pro-theme-container .info-grid {
            display: grid;
            color: #334155;
            gap: 0.5em;
        }

        .pro-theme-container .info-line {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }

        .pro-theme-container .info-label {
            font-family: ${config.labelFontFamily || 'inherit'};
            font-size: ${config.customerLabelFontSize || '0.85em'} !important;
            font-weight: ${config.customerLabelFontWeight || '600'} !important;
            color: #64748b;
        }

        .pro-theme-container .info-value {
            font-family: ${config.bodyFontFamily || 'inherit'};
            font-size: ${config.customerValueFontSize || '0.9em'} !important;
            font-weight: ${config.customerValueFontWeight || '500'} !important;
            text-align: right;
        }

        .pro-theme-container .term-content {
            font-size: 0.85em;
            line-height: 1.5;
            color: #475569;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .pro-theme-container .pdf-items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 2em;
        }

        .pro-theme-container .pdf-items-table th {
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : config.tableHeaderFontSize || '1.2em'} !important;
            font-weight: ${config.tableHeaderFontWeight || '700'} !important;
            color: ${color};
            background: #f1f5f9;
            padding: ${config.tableHeaderPadding || '1em 1em'};
            text-transform: ${config.tableHeaderTransform || 'uppercase'};
            text-align: left;
        }

        .pro-theme-container .pdf-items-table td {
            font-size: ${getAdjustedFontSize(config.tableBodyFontSize)} !important;
            font-weight: ${config.tableBodyFontWeight || '500'} !important;
            padding: ${config.tableCellPadding || '0.8em'};
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: middle;
        }

        .pro-theme-container .item-image {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            margin: 0 auto;
        }

        .pro-theme-container .item-image img {
            max-width: 80%;
            max-height: 80%;
            object-fit: contain;
        }

        .pro-theme-container .item-name {
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 0.25em;
        }

        .pro-theme-container .item-desc {
            font-size: 0.85em;
            color: #64748b;
        }

        .pro-theme-container .pdf-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2em;
            margin-top: 1em;
            page-break-inside: avoid;
        }

        .pro-theme-container .payment-info {
            background: #f8fafc;
            padding: 1.5em;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }

        .pro-theme-container .totals-section {
            background: #ffffff;
            padding: 1.5em;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }

        .pro-theme-container .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75em;
            padding-bottom: 0.75em;
            border-bottom: 1px dashed #e2e8f0;
        }

        .pro-theme-container .summary-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }

        .pro-theme-container .summary-row span:first-child {
            font-size: ${config.summaryLabelFontSize || '0.9em'} !important;
            font-weight: ${config.summaryLabelFontWeight || '600'} !important;
            color: #64748b;
        }

        .pro-theme-container .summary-row span:last-child {
            font-size: ${config.summaryValueFontSize || '1em'} !important;
            font-weight: ${config.summaryValueFontWeight || '700'} !important;
            color: #0f172a;
        }

        .pro-theme-container .grand-total {
            margin-top: 1em;
            padding-top: 1em;
            border-top: 2px solid #0f172a;
        }

        .pro-theme-container .grand-total span {
            font-size: ${config.summaryTotalFontSize || '1.4em'} !important;
            font-weight: ${config.summaryTotalFontWeight || '800'} !important;
            color: ${color};
        }

        .pro-theme-container .pdf-footer {
            margin-top: 2em;
            padding-top: 1.5em;
            border-top: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1em;
            font-size: ${config.footerFontSize || '0.8em'} !important;
            font-weight: ${config.footerFontWeight || '500'} !important;
            color: ${config.footerColor || '#64748b'};
        }

        .pro-theme-container .footer-contact div {
            margin-bottom: 0.25em;
        }

        .pro-theme-container .footer-thanks {
            text-align: right;
        }

        .pro-theme-container .footer-thanks .thanks-text {
            font-weight: 700;
            color: ${color};
            margin-bottom: 0.25em;
            font-size: 1.1em;
        }
        
        .pro-theme-container .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
            page-break-inside: avoid;
        }

        .pro-theme-container .signature-box {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .pro-theme-container .signature-area {
            height: 80px;
            width: 100%;
            border-bottom: 1px solid #cbd5e1;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 5px;
        }

        .pro-theme-container .stamp-area {
            height: 80px;
            width: 100%;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
        }

        .pro-theme-container .signature-label {
            font-size: 0.8em;
            color: #64748b;
            font-weight: 500;
        }
    `, [color, config]);

    const itemsPerPage = config.itemsPerPage || 14;
    const itemChunks = useMemo(() => {
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
        <table className="pdf-items-table">
            <thead>
                <tr>
                    <th>#</th>
                    {config.showTableImages && <th>{t.image}</th>}
                    <th>{config.textItem || t.item}</th>
                    {config.showTableUnit && <th>{config.textUnit || t.unit}</th>}
                    <th>{config.textQuantity || t.quantity}</th>
                    <th style={{ textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td>
                                <div className="item-image">
                                    {item.image ? (
                                        <img src={item.image} alt="" />
                                    ) : (
                                        <span style={{ fontSize: '8px' }}>{t.noImage}</span>
                                    )}
                                </div>
                            </td>
                        )}
                        <td>
                            <div className="item-description">{item.name}</div>
                            <div className="item-details">{item.description}</div>
                        </td>
                        {config.showTableUnit && <td className="item-unit">{item.unit}</td>}
                        <td className="item-quantity">{item.quantity}</td>
                        <td className="item-price">{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td className="item-discount" style={{ textAlign: 'center', color: '#ef4444' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td className="item-tax">%{item.taxRate}</td>}
                        <td className="item-total">{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className={`pro-theme-container w-full max-w-[210mm] mx-auto ${config.tableDensity === 'compact' ? 'pdf-compact-mode' :
            config.tableDensity === 'ultra-compact' ? 'pdf-ultra-compact' : ''
            } `} style={containerStyles}>
            <style>{proStyles}</style>

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

                    {/* Header */}
                    {pageIndex === 0 ? (
                        <div className="pdf-header">
                            <div className="header-left">
                                {config.showLogo && companyData.logo && (
                                    <div className="company-logo">
                                        <img src={companyData.logo} alt="Logo" />
                                    </div>
                                )}
                                <div className="company-info">
                                    <div className="company-name">{companyData.name}</div>
                                </div>
                            </div>
                            <div className="quote-info">
                                <div className="quote-title">{config.title}</div>
                                <div className="quote-meta">
                                    <div className="quote-number">#{quoteData.number}</div>
                                    <div>{formatDate(quoteData.date, currentLocale)}</div>
                                    <div>{t.validUntil}: {formatDate(quoteData.validUntil, currentLocale)}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pdf-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${config.boxBorderColor || '#e2e8f0'}` }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em', color: '#666' }}>
                                <span>{companyData.name} - {config.title}</span>
                                <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                            </div>
                        </div>
                    )}

                    {/* Customer Section - Only Page 1 */}
                    {pageIndex === 0 && (
                        <div className="customer-section">
                            <div className="customer-box">
                                <div className="section-title">
                                    {t.customer}
                                </div>
                                <div className="info-grid">
                                    <div className="info-line">
                                        <span className="info-label">{t.company}:</span>
                                        <span className="info-value"><strong>{customerData.company}</strong></span>
                                    </div>
                                    <div className="info-line">
                                        <span className="info-label">{t.authorized}:</span>
                                        <span className="info-value">{customerData.name}</span>
                                    </div>
                                    <div className="info-line">
                                        <span className="info-label">{t.phone}:</span>
                                        <span className="info-value">{customerData.phone}</span>
                                    </div>

                                </div>
                            </div>
                            <div className="customer-box">
                                <div className="section-title">
                                    {t.company}
                                </div>
                                <div className="info-grid">
                                    <div className="info-line">
                                        <span className="info-label">{t.company}:</span>
                                        <span className="info-value"><strong>{companyData.name}</strong></span>
                                    </div>
                                    <div className="info-line">
                                        <span className="info-label">{t.authorized}:</span>
                                        <span className="info-value">{companyData.authorizedPerson || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div style={{ flex: 1 }}>
                        {renderTable(chunk, pageIndex * itemsPerPage)}
                    </div>

                    {/* Summary, Signatures, Terms - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            {/* Summary */}
                            {config.showSummary && (
                                <div className="pdf-summary">
                                    <div className="payment-info">
                                        {config.showBankInfo && (
                                            <div className="bank-info" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                                                <div className="section-title" style={{ marginBottom: '1rem', borderBottom: 'none', paddingBottom: '0', textTransform: 'uppercase', color: '#0f172a', fontSize: '0.9em', fontWeight: '700' }}>
                                                    {t.bankInfo}
                                                </div>
                                                <div style={{ fontSize: '0.85em', color: '#475569', lineHeight: '1.6' }}>
                                                    <div style={{ display: 'flex', color: '#475569', marginBottom: '0.25em' }}><strong style={{ width: '90px', color: '#475569', fontWeight: '600' }}>{t.bank}:</strong> <span style={{ color: '#475569' }}>{bankData.bankName}</span></div>
                                                    <div style={{ display: 'flex', color: '#475569', marginBottom: '0.25em' }}><strong style={{ width: '90px', color: '#475569', fontWeight: '600' }}>{t.branch}:</strong> <span style={{ color: '#475569' }}>{bankData.branch}</span></div>
                                                    <div style={{ display: 'flex', color: '#475569', marginBottom: '0.25em' }}><strong style={{ width: '90px', color: '#475569', fontWeight: '600' }}>{t.accountNo}:</strong> <span style={{ color: '#475569' }}>{bankData.accountNumber || '-'}</span></div>
                                                    <div style={{ display: 'flex', color: '#475569', marginBottom: '0.25em' }}><strong style={{ width: '90px', color: '#475569', fontWeight: '600' }}>{t.iban}:</strong> <span style={{ color: '#475569' }}>{bankData.iban}</span></div>
                                                    <div style={{ display: 'flex', color: '#475569' }}><strong style={{ width: '90px', color: '#475569', fontWeight: '600' }}>{t.accountHolder}:</strong> <span style={{ color: '#475569' }}>{bankData.accountHolder}</span></div>
                                                </div>
                                            </div>
                                        )}
                                        {config.showNotes && quoteData.notes && (
                                            <div style={{ marginTop: '1rem' }}>
                                                <h3>{t.notes}</h3>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{quoteData.notes}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="totals-section">
                                        <div className="summary-row">
                                            <span>{t.subtotal}</span>
                                            <span>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="summary-row" style={{ color: '#ef4444' }}>
                                                <span>{t.discount}</span>
                                                <span>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="summary-row">
                                            <span>{t.tax}</span>
                                            <span>{formatCurrency(totalTax)}</span>
                                        </div>
                                        <div className="summary-row grand-total">
                                            <span>{t.generalTotal}</span>
                                            <span>{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            {config.showSignatures && (
                                <div className="signature-section">
                                    <div className="signature-box">
                                        <div className="signature-area">
                                            {signature ? (
                                                <img src={signature} alt="Dijital İmza" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                            ) : companyData.signature ? (
                                                <img src={companyData.signature} alt="İmza" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>{t.signature}</span>
                                            )}
                                        </div>
                                        <div className="signature-label">İmza</div>
                                    </div>
                                    <div className="signature-box">
                                        <div className="stamp-area" style={companyData.stamp ? { border: 'none', background: 'transparent' } : {}}>
                                            {companyData.stamp ? (
                                                <img src={companyData.stamp} alt="Kaşe" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>{t.stamp} / {t.signature}</span>
                                            )}
                                        </div>
                                        <div className="signature-label">Firma Kaşesi</div>
                                    </div>
                                </div>
                            )}

                            {/* Terms */}
                            {config.showTerms && (
                                <div className="terms-section">
                                    <div className="terms-grid">
                                        <div className="term-card">
                                            <h3>{t.deliveryConditions}</h3>
                                            <div className="term-content">{quoteData.deliveryTerms}</div>
                                        </div>
                                        <div className="term-card">
                                            <h3>{t.warrantyConditions}</h3>
                                            <div className="term-content">{quoteData.warrantyTerms}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div className="pdf-footer">
                            <div className="footer-contact">
                                <div>{companyData.address}</div>
                                <div>{companyData.phone} | {companyData.email}</div>
                                <div>{companyData.website}</div>
                            </div>
                            <div className="footer-thanks">
                                <div className="thanks-text">Teşekkür Ederiz</div>
                                <div>Saygılarımızla, {companyData.name}</div>
                                <div style={{ fontWeight: '700', color: color, marginTop: '0.25rem' }}>{companyData.name} - {config.title}</div>
                            </div>
                        </div>
                    )}
                    {config.customFooter && (
                        <div className="pdf-footer" style={{ marginTop: 0, borderTop: 'none', paddingTop: '0.5rem', textAlign: 'center', fontSize: '0.65rem', color: '#94a3b8' }}>
                            {config.customFooter}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ProTheme;
