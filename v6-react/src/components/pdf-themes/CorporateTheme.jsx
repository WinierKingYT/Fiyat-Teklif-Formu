import React from 'react';

const CorporateTheme = ({
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
    discountAmount,
    totalTax,
    total,
    currentLocale,
    hasLineItemDiscounts
}) => {
    const getAdjustedFontSize = (size) => {
        const factor = 0.9;
        if (!size || size === 'inherit') return '0.85em';
        if (typeof size === 'number') return `${size * factor}px`;
        if (typeof size === 'string') {
            if (size.endsWith('px')) return `${parseFloat(size) * factor}px`;
            if (size.endsWith('rem') || size.endsWith('em')) return `calc(${size} * ${factor})`;
        }
        return '0.85em';
    };

    const corporateStyles = React.useMemo(() => `
        .corporate-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', 'Roboto', sans-serif"};
            line-height: ${config.bodyLineHeight || '1.5'};
            color: ${config.globalFontColor || '#1f2937'};
            background: white;
            font-size: ${config.fontSize || 11}px;
            position: relative;
        }

        .corporate-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 0.2rem;
            margin-bottom: 0.4rem;
            border-bottom: 2px solid ${color};
        }

        .corporate-logo-box {
            width: 120px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin-bottom: 0.2rem;
        }

        .corporate-logo-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .corporate-title-box {
            text-align: right;
        }

        .corporate-title {
            font-size: ${config.headerTitleFontSize || '1.4rem'} !important;
            font-weight: ${config.headerTitleFontWeight || '800'} !important;
            color: ${color};
            text-transform: uppercase;
            letter-spacing: -0.02em;
            margin-bottom: 0.1rem;
        }

        .corporate-meta {
            display: flex;
            flex-direction: column;
            gap: 0.1rem;
            font-size: 0.75em;
            color: #4b5563;
        }

        .corporate-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 0.8rem;
        }

        .corporate-card-title {
            font-size: ${config.customerTitleFontSize || '0.85rem'} !important;
            font-weight: ${config.customerTitleFontWeight || '700'} !important;
            color: ${color};
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.4rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.2rem;
        }

        .corporate-info-row {
            display: flex;
            margin-bottom: 0.2rem;
            font-size: 0.85em;
        }

        .corporate-info-label {
            width: 90px;
            font-weight: 600;
            color: #6b7280;
            flex-shrink: 0;
        }

        .corporate-info-value {
            color: #111827;
            font-weight: 500;
        }

        .corporate-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }

        .corporate-table th {
            background: ${color};
            color: white;
            padding: 0.25rem 0.4rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.7em;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .corporate-table td {
            padding: 0.25rem 0.4rem;
            border-bottom: 1px solid #e5e7eb;
            font-size: 0.75em;
            color: #374151;
            vertical-align: middle;
        }

        .corporate-table tr:nth-child(even) {
            background-color: #f9fafb;
        }

        .corporate-item-image {
            width: 48px;
            height: 48px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            overflow: hidden;
        }

        .corporate-item-image img {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        }

        .corporate-summary-section {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 3rem;
            margin-top: 2rem;
            page-break-inside: avoid;
        }

        .corporate-bank-box {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }

        .corporate-totals-box {
            padding: 1.5rem;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }

        .corporate-total-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px dashed #e5e7eb;
            font-size: 0.95em;
        }

        .corporate-total-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .corporate-grand-total {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 2px solid ${color};
            font-weight: 800;
            font-size: 1.2em;
            color: ${color};
            display: flex;
            justify-content: space-between;
        }

        .corporate-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            margin-top: 4rem;
            page-break-inside: avoid;
        }

        .corporate-sig-box {
            text-align: center;
        }

        .corporate-sig-area {
            height: 100px;
            border-bottom: 1px solid #d1d5db;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 10px;
        }

        .corporate-sig-label {
            font-size: 0.85em;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
        }
    `, [color, config]);

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
        <table className="corporate-table">
            <thead>
                <tr>
                    <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '10%' }}>{t.image}</th>}
                    <th style={{ width: '40%' }}>{config.textItem || t.item}</th>
                    {config.showTableUnit && <th style={{ width: '10%', textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                    <th style={{ width: '10%', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '8%', textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '8%', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ width: '15%', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#9ca3af' }}>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td>
                                <div className="corporate-item-image">
                                    {item.image ? (
                                        <img src={item.image} alt="" />
                                    ) : (
                                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>-</span>
                                    )}
                                </div>
                            </td>
                        )}
                        <td>
                            <div style={{ fontWeight: '600', color: '#111827' }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '0.25rem' }}>{item.description}</div>}
                        </td>
                        {config.showTableUnit && <td style={{ textAlign: 'center' }}>{item.unit}</td>}
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#ef4444' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td style={{ textAlign: 'center' }}>%{item.taxRate}</td>}
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="corporate-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{corporateStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview" style={{
                    position: 'relative',
                    minHeight: '290mm', // A4 height
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                }}>
                    {/* Watermark - Per Page */}
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
                        <div className="corporate-header">
                            <div className="corporate-header-left">
                                {config.showLogo && companyData.logo && (
                                    <div className="corporate-logo-box">
                                        <img src={companyData.logo} alt="Logo" />
                                    </div>
                                )}
                                <div style={{ fontSize: '1.2em', fontWeight: '700', color: '#111827' }}>{companyData.name}</div>
                                <div style={{ fontSize: '0.9em', color: '#6b7280' }}>{companyData.website}</div>
                            </div>
                            <div className="corporate-title-box">
                                <div className="corporate-title">{config.title}</div>
                                <div className="corporate-meta">
                                    <div><strong>{t.quoteNo}:</strong> {quoteData.number}</div>
                                    <div><strong>{t.date}:</strong> {formatDate(quoteData.date, currentLocale)}</div>
                                    <div><strong>{t.validUntil}:</strong> {formatDate(quoteData.validUntil, currentLocale)}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="corporate-header" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em', color: '#9ca3af' }}>
                                <span>{companyData.name} - {config.title}</span>
                                <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                            </div>
                        </div>
                    )}

                    {/* Info Grid - Only Page 1 */}
                    {pageIndex === 0 && (
                        <div className="corporate-grid">
                            <div className="corporate-card">
                                <div className="corporate-card-title">{t.customer}</div>
                                <div style={{ fontWeight: '700', fontSize: '1.1em', marginBottom: '0.5rem', color: '#1f2937' }}>{customerData.company}</div>
                                <div className="corporate-info-row">
                                    <div className="corporate-info-label">{t.authorized}:</div>
                                    <div className="corporate-info-value">{customerData.name}</div>
                                </div>
                                <div className="corporate-info-row">
                                    <div className="corporate-info-label">{t.phone}:</div>
                                    <div className="corporate-info-value">{customerData.phone}</div>
                                </div>
                                {customerData.email && (
                                    <div className="corporate-info-row">
                                        <div className="corporate-info-label">{t.email}:</div>
                                        <div className="corporate-info-value">{customerData.email}</div>
                                    </div>
                                )}
                                {customerData.address && (
                                    <div className="corporate-info-row">
                                        <div className="corporate-info-label">{t.address}:</div>
                                        <div className="corporate-info-value">{customerData.address}</div>
                                    </div>
                                )}
                            </div>
                            <div className="corporate-card">
                                <div className="corporate-card-title">{t.company}</div>
                                <div style={{ fontWeight: '700', fontSize: '1.1em', marginBottom: '0.5rem', color: '#1f2937' }}>{companyData.name}</div>
                                <div className="corporate-info-row">
                                    <div className="corporate-info-label">{t.authorized}:</div>
                                    <div className="corporate-info-value">{companyData.authorized}</div>
                                </div>
                                <div className="corporate-info-row">
                                    <div className="corporate-info-label">{t.phone}:</div>
                                    <div className="corporate-info-value">{companyData.phone}</div>
                                </div>
                                <div className="corporate-info-row">
                                    <div className="corporate-info-label">{t.email}:</div>
                                    <div className="corporate-info-value">{companyData.email}</div>
                                </div>
                                <div className="corporate-info-row">
                                    <div className="corporate-info-label">{t.address}:</div>
                                    <div className="corporate-info-value">{companyData.address}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    <div style={{ flex: 1 }}>
                        {renderTable(chunk, pageIndex * itemsPerPage)}
                    </div>

                    {/* Summary & Footer - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            {config.showSummary && (
                                <div className="corporate-summary-section">
                                    <div className="corporate-left-col">
                                        {config.showBankInfo && (
                                            <div className="corporate-bank-box">
                                                <div style={{ fontWeight: '700', color: color, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9em' }}>{t.bankInfo}</div>
                                                <div style={{ fontSize: '0.85em', color: '#4b5563', lineHeight: '1.6' }}>
                                                    <div><strong>{t.bank}:</strong> {bankData.bankName}</div>
                                                    <div><strong>{t.branch}:</strong> {bankData.branch}</div>
                                                    <div><strong>{t.iban}:</strong> {bankData.iban}</div>
                                                    <div><strong>{t.accountHolder}:</strong> {bankData.accountHolder}</div>
                                                </div>
                                            </div>
                                        )}
                                        {config.showNotes && quoteData.notes && (
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <div style={{ fontWeight: '700', color: '#4b5563', marginBottom: '0.25rem', fontSize: '0.9em' }}>{t.notes}</div>
                                                <div style={{ fontSize: '0.85em', color: '#6b7280', fontStyle: 'italic' }}>{quoteData.notes}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="corporate-totals-box">
                                        <div className="corporate-total-row">
                                            <span>{t.subtotal}</span>
                                            <span>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="corporate-total-row" style={{ color: '#ef4444' }}>
                                                <span>{t.discount}</span>
                                                <span>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <div className="corporate-total-row">
                                                <span>{t.tax}</span>
                                                <span>{formatCurrency(totalTax)}</span>
                                            </div>
                                        )}
                                        <div className="corporate-grand-total">
                                            <span>{t.generalTotal}</span>
                                            <span>{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            {config.showSignatures && (
                                <div className="corporate-signatures">
                                    <div className="corporate-sig-box">
                                        <div className="corporate-sig-area">
                                            {signature ? (
                                                <img src={signature} alt="" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                                            ) : companyData.signature ? (
                                                <img src={companyData.signature} alt="" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                                            ) : null}
                                        </div>
                                        <div className="corporate-sig-label">İmza</div>
                                    </div>
                                    <div className="corporate-sig-box">
                                        <div className="corporate-sig-area">
                                            {companyData.stamp && (
                                                <img src={companyData.stamp} alt="" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                                            )}
                                        </div>
                                        <div className="corporate-sig-label">Firma Kaşesi</div>
                                    </div>
                                </div>
                            )}

                            {/* Footer - Only Last Page */}
                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.85em', color: '#4b5563' }}>
                                <div style={{ marginBottom: '0.25rem' }}>{companyData.address}</div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    {companyData.phone} | {companyData.email} | {companyData.website}
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{ marginBottom: '0.25rem' }}>Teşekkür Ederiz</div>
                                    <div style={{ marginBottom: '0.25rem' }}>Saygılarımızla, {companyData.name}</div>
                                    <div style={{ fontWeight: '700', color: color }}>{companyData.name} - {config.title}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CorporateTheme;
