import React from 'react';

const ModernTheme = ({
    id,
    containerStyles,
    config,
    color,
    activeLayout,
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
    onEdit
}) => {
    // Helper for editable fields
    const renderEditable = (value, label, onSave, type = 'text', options = [], className = '') => {
        if (!onEdit) return <span className={className}>{value}</span>;

        return (
            <div
                className={`editable-field group relative cursor-pointer hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 rounded px-1 -mx-1 transition-all ${className}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(label, value, onSave, type, options);
                }}
                title="Düzenlemek için tıklayın"
            >
                {value || <span className="text-gray-300 italic">Düzenle</span>}
                <span className="absolute -top-3 -right-3 hidden group-hover:flex h-5 w-5 bg-blue-500 text-white rounded-full items-center justify-center shadow-sm">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </span>
            </div>
        );
    };

    const modernStyles = React.useMemo(() => `
        .modern-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.4'};
            color: #000000 !important;
            background: #ffffff !important;
            font-size: ${config.fontSize || 12}px;
            position: relative;
            overflow: hidden;
            border-radius: ${config.borderRadius || 6}px;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .modern-theme-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: ${color};
        }

        .modern-theme-container, .modern-theme-container * {
            box-sizing: border-box;
        }
        
        /* HEADER */
        .modern-theme-container .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2em;
            padding-bottom: 0;
            position: relative;
            padding-top: 1em;
        }
        
        .modern-theme-container .header-left {
            flex: 1;
            padding-right: 2em;
            display: flex;
            flex-direction: row; /* Changed to row for side-by-side logo */
            align-items: center;
            gap: 1.5em;
        }

        .modern-theme-container .company-logo {
            flex-shrink: 0;
        }

        .modern-theme-container .company-logo img {
            max-height: 80px;
            max-width: 150px;
            object-fit: contain;
        }

        .modern-theme-container .company-info {
            flex: 1;
            min-width: 0; /* Prevents flex item from overflowing */
        }
        
        .modern-theme-container .header-right {
            flex: 0 0 300px;
            padding-left: 1.5em;
            text-align: right;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-end;
            border-left: 3px solid ${color}; /* Thick vertical line */
            border-radius: 2px 0 0 2px;
        }
        
        .modern-theme-container .company-name {
            word-wrap: break-word; /* Ensure long names wrap */
            font-size: ${config.headerTitleFontSize || '1.4em'};
            font-weight: ${config.headerTitleFontWeight || '800'};
        }
        
        .modern-theme-container .company-address {
            font-size: ${config.headerInfoFontSize || '0.8em'};
            color: #4b5563;
            line-height: 1.3;
        }

        .modern-theme-container .quote-title {
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: ${config.titleFontSize || '1.4em'};
            font-weight: ${config.titleFontWeight || '800'};
            font-family: ${config.titleFontFamily || 'inherit'};
        }
        
        .modern-theme-container .quote-meta-grid {
            display: grid;
            grid-template-columns: auto auto;
            gap: 0.5em 1em;
            font-size: ${config.quoteMetaLabelFontSize || '0.8em'};
            color: #4b5563;
        }

        .modern-theme-container .quote-meta-label {
            color: #6b7280;
            font-weight: ${config.quoteMetaLabelFontWeight || '500'};
        }

        .modern-theme-container .quote-meta-value {
            font-weight: ${config.quoteMetaValueFontWeight || '600'};
            color: #000;
            font-size: ${config.quoteMetaValueFontSize || 'inherit'};
        }
        
        /* CUSTOMER SECTION */
        .modern-theme-container .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5em;
            margin-bottom: 2em;
        }
        
        .modern-theme-container .customer-box {
            background: #f8fafc !important;
            border-radius: 8px;
            padding: 1.25em;
            border: 1px solid #e2e8f0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .modern-theme-container .section-title {
            text-transform: uppercase;
            font-size: ${config.customerTitleFontSize || '0.9em'};
            font-weight: ${config.customerTitleFontWeight || '700'};
        }

        /* Force light theme for PDF container - Stronger Selector */
        [data-theme="dark"] .modern-theme-container,
        .modern-theme-container {
            background-color: #ffffff !important;
            color: #000000 !important;
        }

        [data-theme="dark"] .modern-theme-container *,
        .modern-theme-container * {
            border-color: #e2e8f0 !important;
        }

        [data-theme="dark"] .modern-theme-container .customer-box,
        [data-theme="dark"] .modern-theme-container .bottom-section,
        .modern-theme-container .customer-box,
        .modern-theme-container .bottom-section {
            background-color: #f8fafc !important;
            color: #000000 !important;
            border: 1px solid #e2e8f0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        [data-theme="dark"] .modern-theme-container .company-name,
        [data-theme="dark"] .modern-theme-container .quote-title,
        [data-theme="dark"] .modern-theme-container .section-title,
        .modern-theme-container .company-name,
        .modern-theme-container .quote-title,
        .modern-theme-container .section-title {
            color: ${color} !important;
        }

        [data-theme="dark"] .modern-theme-container .quote-meta-value,
        [data-theme="dark"] .modern-theme-container .info-value strong,
        [data-theme="dark"] .modern-theme-container .summary-row,
        .modern-theme-container .quote-meta-value,
        .modern-theme-container .info-value strong,
        .modern-theme-container .summary-row {
            color: #000000 !important;
        }

        [data-theme="dark"] .modern-theme-container .header-right,
        .modern-theme-container .header-right {
            border-left-color: ${color} !important;
        }
        
        /* Ensure summary row text is dark */
        .modern-theme-container .summary-row span {
            color: #000000 !important;
        }
        .modern-theme-container .summary-row.discount span {
            color: #ef4444 !important;
        }
        
        .modern-theme-container .info-grid {
            display: grid;
            gap: 0.5em;
        }
        
        .modern-theme-container .info-line {
            display: grid;
            grid-template-columns: 80px 1fr;
            font-size: 0.8em;
            align-items: baseline;
        }
        
        .modern-theme-container .info-label {
            color: #64748b;
            font-weight: ${config.customerLabelFontWeight || '500'};
            font-size: ${config.customerLabelFontSize || 'inherit'};
        }
        
        .modern-theme-container .info-value {
            color: #1e293b;
            font-weight: ${config.customerValueFontWeight || '500'};
            font-size: ${config.customerValueFontSize || 'inherit'};
        }
        
        /* TABLE */
        .modern-theme-container .pdf-items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 2em;
        }
        
        .modern-theme-container .pdf-items-table th {
            padding: 0.75em 0.5em;
            text-align: left;
            font-weight: ${config.tableHeaderFontWeight || '700'};
            color: #94a3b8; /* Lighter gray for headers */
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '1.15em')} !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .modern-theme-container .pdf-items-table td {
            padding: 1em 0.5em;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
            font-size: ${config.tableBodyFontSize || 'inherit'};
            font-weight: ${config.tableBodyFontWeight || 'normal'};
        }

        .modern-theme-container .item-image {
            width: 48px;
            height: 48px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #fff;
        }
        
        .modern-theme-container .item-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .modern-theme-container .item-name {
            font-weight: 600;
            color: ${color};
            font-size: 1.2em;
            margin-bottom: 0.25em;
        }

        .modern-theme-container .item-desc {
            font-size: 1em !important;
            color: #64748b;
            line-height: 1.4;
        }

        .modern-theme-container .item-value {
            font-weight: 600;
            color: ${color};
            font-size: 0.85em;
        }

        /* SUMMARY & BANK SECTION - COMBINED CONTAINER */
        .modern-theme-container .bottom-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2em;
            margin-bottom: 2em;
            background: #f8fafc !important; /* Shared background */
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5em;
        }

        .modern-theme-container .summary-section {
            /* No individual background */
        }

        .modern-theme-container .bank-section {
            /* No individual background */
        }

        .modern-theme-container .summary-row {
            padding: 0.5em 0;
            font-size: ${config.summaryLabelFontSize || '0.85em'};
            font-weight: ${config.summaryLabelFontWeight || 'normal'};
            color: #475569;
        }

        .modern-theme-container .summary-row.discount {
            color: #ef4444;
        }

        .modern-theme-container .summary-row.grand-total {
            margin-top: 1em;
            padding-top: 1em;
            border-top: 1px solid #e2e8f0;
            align-items: center;
            font-size: ${config.summaryTotalFontSize || '1.1em'};
        }

        .modern-theme-container .bank-list {
            font-size: 0.8em;
            color: #475569;
            line-height: 1.6;
        }

        .modern-theme-container .bank-row {
            display: grid;
            grid-template-columns: 80px 1fr;
            margin-bottom: 0.25em;
        }

        /* TERMS & NOTES */
        .modern-theme-container .notes-section {
            margin-bottom: 2em;
        }

        .modern-theme-container .notes-title {
            font-size: 0.8em;
            font-weight: 700;
            color: ${color};
            margin-bottom: 0.5em;
            text-transform: uppercase;
        }

        .modern-theme-container .notes-content {
            font-size: 0.8em;
            color: #475569;
            line-height: 1.5;
        }

        .modern-theme-container .terms-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1em;
            margin-bottom: 2em;
        }

        /* SIGNATURES */
        .modern-theme-container .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4em;
            margin-top: 3em;
            margin-bottom: 2em;
        }

        .modern-theme-container .signature-col {
            text-align: center;
        }

        .modern-theme-container .signature-line {
            border-bottom: 1px solid #cbd5e1;
            height: 60px;
            margin-bottom: 0.5em;
        }

        .modern-theme-container .signature-label {
            font-size: 0.8em;
            font-weight: 600;
            color: #64748b;
        }

        /* FOOTER */
        .modern-theme-container .pdf-footer {
            text-align: center;
            padding-top: 2em;
            border-top: 1px solid #e2e8f0;
            margin-top: auto;
        }

            margin-bottom: 0.5em;
            font-size: ${config.footerFontSize ? `calc(${config.footerFontSize} * 1.2)` : '0.9rem'};
            font-weight: ${config.footerFontWeight || '700'};
        }

        .modern-theme-container .footer-info {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
            font-size: ${config.footerFontSize || '0.75rem'};
            font-weight: ${config.footerFontWeight || 'normal'};
            color: #64748b;
        }

        .modern-theme-container .footer-item {
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }

        /* COMPACT MODES */
        .pdf-compact-mode .pdf-items-table th,
        .pdf-compact-mode .pdf-items-table td {
            padding: 0.5rem 0.25rem;
        }
        
        .pdf-compact-mode .item-image {
            width: 32px;
            height: 32px;
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
        <table className="pdf-items-table">
            <thead>
                <tr>
                    <th style={{ width: '30px', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '50px', textAlign: 'center' }}>{t.image}</th>}
                    <th>{config.textItem || t.item} / {t.description}</th>
                    {config.showTableUnit && <th style={{ width: '60px', textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                    <th style={{ width: '60px', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '60px', textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '60px', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ width: '110px', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td>
                                <div className="item-image">
                                    {item.image ? (
                                        <img src={item.image} alt="" />
                                    ) : (
                                        <span style={{ fontSize: '8px' }}>-</span>
                                    )}
                                </div>
                            </td>
                        )}
                        <td>
                            <div className="item-name">{item.name}</div>
                            <div className="item-desc">{item.description}</div>
                        </td>
                        {config.showTableUnit && <td className="item-unit" style={{ textAlign: 'center' }}>{item.unit}</td>}
                        <td className="item-quantity" style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td className="item-price" style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td className="item-discount" style={{ textAlign: 'center', color: '#ef4444' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td className="item-tax" style={{ textAlign: 'center' }}>%{item.taxRate}</td>}
                        <td className="item-total" style={{ textAlign: 'right' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="modern-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{modernStyles}</style>

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
                                    <div className="company-details" style={{ fontSize: config.headerInfoFontSize || '0.8rem', color: '#4b5563' }}>
                                        <div className="header-info-grid">
                                            <div className="header-info-line">
                                                <span>{companyData.address}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="header-right">
                                <div className="quote-title">{config.title}</div>
                                <div className="quote-meta" style={{ fontSize: config.quoteMetaLabelFontSize || '0.8rem', color: '#4b5563', marginTop: '0.5rem' }}>
                                    <div>{t.date}: {formatDate(quoteData.date, currentLocale)} &nbsp; {t.validUntil}: {formatDate(quoteData.validUntil, currentLocale)} &nbsp; <strong>#{quoteData.number}</strong></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pdf-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${color}` }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: config.headerInfoFontSize || '0.8em', color: '#666' }}>
                                <span>{companyData.name} - {config.title}</span>
                                <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                            </div>
                        </div>
                    )}

                    {/* Customer Section - Only Page 1 */}
                    {pageIndex === 0 && (
                        <div className="customer-section">
                            <div className="customer-box" style={{ backgroundColor: '#f8fafc', color: '#000000', border: '1px solid #e2e8f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <div className="section-title">
                                    <i className="fas fa-bookmark"></i> {t.company}
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
                            <div className="customer-box" style={{ backgroundColor: '#f8fafc', color: '#000000', border: '1px solid #e2e8f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <div className="section-title">
                                    <i className="fas fa-user"></i> {t.customer}
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
                                    <div className="info-line">
                                        <span className="info-label">{t.email}:</span>
                                        <span className="info-value">{customerData.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div style={{ flex: 1 }}>
                        {renderTable(chunk, pageIndex * itemsPerPage)}
                    </div>

                    {/* Summary, Notes, Signatures - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            {(config.showSummary || config.showBankInfo) && (
                                <div className="bottom-section" style={{ backgroundColor: '#f8fafc', color: '#000000', border: '1px solid #e2e8f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    <div className="summary-section" style={{ backgroundColor: 'transparent', color: '#000000' }}>
                                        <div className="section-title" style={{ marginBottom: '1rem', borderBottom: 'none', paddingBottom: '0', color: '#0f172a' }}>
                                            <i className="fas fa-list-alt" style={{ color: '#000000' }}></i> {t.summary}
                                        </div>
                                        <div className="summary-row" style={{ color: '#475569' }}>
                                            <span style={{ color: '#475569' }}>{t.subtotal}:</span>
                                            <span style={{ fontWeight: config.summaryValueFontWeight || '600', fontSize: config.summaryValueFontSize || 'inherit', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="summary-row" style={{ color: '#ef4444' }}>
                                                <span style={{ color: '#ef4444' }}>{t.discount} (%{Math.round((discountAmount / subtotal) * 100)}):</span>
                                                <span style={{ color: '#ef4444' }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <div className="summary-row" style={{ color: '#475569' }}>
                                                <span style={{ color: '#475569' }}>{t.vat} (%20):</span>
                                                <span style={{ color: '#475569' }}>{formatCurrency(totalTax)}</span>
                                            </div>
                                        )}
                                        <div className="summary-row" style={{ color: '#475569' }}>
                                            <span style={{ color: '#475569' }}>{t.total} {t.vat}:</span>
                                            <span style={{ color: '#475569' }}>{formatCurrency(totalTax)}</span>
                                        </div>
                                        <div className="summary-row grand-total" style={{ borderTop: 'none', marginTop: '0.5rem', paddingTop: '0.5rem', color: '#0f172a' }}>
                                            <span style={{ color: '#0f172a' }}>{t.generalTotal}:</span>
                                            <span style={{ color: '#0f172a', fontSize: 'inherit' }}>{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                    <div className="bank-section" style={{ backgroundColor: 'transparent', color: '#000000' }}>
                                        {config.showBankInfo && (
                                            <div className="bank-info">
                                                <div className="section-title" style={{ marginBottom: '1rem', borderBottom: 'none', paddingBottom: '0', textTransform: 'uppercase', color: '#0f172a' }}>
                                                    {t.bankInfo}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.8' }}>
                                                    <div style={{ display: 'flex', color: '#475569' }}><strong style={{ width: '80px', color: '#475569' }}>{t.bank}:</strong> <span style={{ color: '#475569' }}>{bankData.bankName}</span></div>
                                                    <div style={{ display: 'flex', color: '#475569' }}><strong style={{ width: '80px', color: '#475569' }}>{t.branch}:</strong> <span style={{ color: '#475569' }}>{bankData.branch}</span></div>
                                                    <div style={{ display: 'flex', color: '#475569' }}><strong style={{ width: '80px', color: '#475569' }}>{t.accountNo}:</strong> <span style={{ color: '#475569' }}>-</span></div>
                                                    <div style={{ display: 'flex', color: '#475569' }}><strong style={{ width: '80px', color: '#475569' }}>{t.iban}:</strong> <span style={{ color: '#475569' }}>{bankData.iban}</span></div>
                                                    <div style={{ display: 'flex', color: '#475569' }}><strong style={{ width: '80px', color: '#475569' }}>{t.accountHolder}:</strong> <span style={{ color: '#475569' }}>{bankData.accountHolder}</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes & Terms */}
                            {(config.showTerms || config.showNotes) && (
                                <>
                                    {quoteData.notes && (
                                        <div className="notes-section">
                                            <div className="notes-title">{t.notes}</div>
                                            <div className="notes-content">{quoteData.notes}</div>
                                        </div>
                                    )}
                                    {config.showTerms && (
                                        <div className="terms-box">
                                            <div className="notes-title" style={{ marginBottom: '0.5rem' }}>{t.terms}</div>
                                            <div className="notes-content">
                                                <div><strong>{t.payment}:</strong> {quoteData.warrantyTerms}</div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Signatures */}
                            {config.showSignatures && (
                                <div className="signatures-grid" style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                                    <div className="signature-col" style={{ textAlign: 'center' }}>
                                        <div className="signature-line" style={{
                                            height: 'auto',
                                            minHeight: '80px',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center',
                                            paddingBottom: '5px',
                                            borderBottom: '1px solid #cbd5e1'
                                        }}>
                                            {(signature || companyData.signature) && (
                                                <img
                                                    src={signature || companyData.signature}
                                                    alt="Signature"
                                                    style={{
                                                        maxHeight: '60px',
                                                        maxWidth: '150px',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="signature-label" style={{ paddingTop: '0.5rem', fontWeight: '600', color: '#0f172a' }}>
                                            {t.signature}
                                        </div>
                                    </div>
                                    <div className="signature-col" style={{ textAlign: 'center' }}>
                                        <div className="signature-line" style={{
                                            height: 'auto',
                                            minHeight: '80px',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center',
                                            paddingBottom: '5px',
                                            borderBottom: '1px solid #cbd5e1'
                                        }}>
                                            {companyData.stamp && (
                                                <img
                                                    src={companyData.stamp}
                                                    alt="Stamp"
                                                    style={{
                                                        maxHeight: '60px',
                                                        maxWidth: '150px',
                                                        objectFit: 'contain',
                                                        opacity: 0.8
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="signature-label" style={{ paddingTop: '0.5rem', fontWeight: '600', color: '#0f172a' }}>
                                            {t.companyStamp}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div className="pdf-footer">
                            <div className="footer-company" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                {companyData.address}
                            </div>
                            <div className="footer-info" style={{ marginBottom: '0.5rem' }}>
                                <div className="footer-item">
                                    <i className="fas fa-phone"></i> {companyData.phone}
                                </div>
                                <div className="footer-item">
                                    <i className="fas fa-envelope"></i> {companyData.email}
                                </div>
                                <div className="footer-item">
                                    <i className="fas fa-globe"></i> {companyData.website}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1rem' }}>
                                <div style={{ marginBottom: '0.25rem' }}>Teşekkür Ederiz</div>
                                <div style={{ marginBottom: '0.25rem' }}>Saygılarımızla, {companyData.name}</div>
                                <div style={{ fontWeight: '600', color: color }}>{companyData.name} - {config.title}</div>
                            </div>
                        </div>
                    )}
                    {config.customFooter && (
                        <div className="custom-footer">
                            {config.customFooter}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ModernTheme;
