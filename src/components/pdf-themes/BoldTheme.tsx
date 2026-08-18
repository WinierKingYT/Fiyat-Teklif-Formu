import React from 'react';
import { useMemo } from 'react';

const BoldTheme = ({
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
    hasLineItemDiscounts,
    onEdit,
    activeLayout
}) => {
    // Helper for editable fields
    const layoutMap = useMemo(() => {
        const map = {};
        (activeLayout || []).forEach((l) => { map[l.id] = l.enabled !== false; });
        return map;
    }, [activeLayout]);
    const showSection = (id) => layoutMap[id] !== false;

    const renderEditable = (value, fieldKey, type = 'text', className = '') => {
        if (!onEdit) return <span className={className}>{value}</span>;

        return (
            <span
                className={`editable-field group relative cursor-pointer hover:bg-[var(--color-primary-muted)] hover:ring-2 hover:ring-[var(--color-primary-ring)] rounded px-1 -mx-1 transition-all ${className}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(fieldKey, value, type);
                }}
                title={t.clickToEdit}
            >
                {value || <span className="italic text-[var(--color-text-muted)]">{t.edit}</span>}
            </span>
        );
    };

    const boldStyles = useMemo(() => `
        .bold-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.4'};
            color: #000000 !important;
            background: var(--pdf-page-bg, #ffffff) !important;
            font-size: ${config.fontSize || 12}px;
            position: relative;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .bold-theme-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 12px;
            background: linear-gradient(90deg, ${color} 0%, ${color} 70%, #000000 70%, #000000 100%);
        }

        .bold-theme-container, .bold-theme-container * {
            box-sizing: border-box;
        }

        /* HEADER */
        .bold-theme-container .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2em;
            padding-bottom: 1.2em;
            border-bottom: 4px solid ${color};
            position: relative;
            padding-top: 2.2em;
        }

        .bold-theme-container .header-left {
            flex: 1;
            padding-right: 2em;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 1.5em;
        }

        .bold-theme-container .company-logo {
            flex-shrink: 0;
        }

        .bold-theme-container .company-logo img {
            max-height: 90px;
            max-width: 160px;
            object-fit: contain;
        }

        .bold-theme-container .company-info {
            flex: 1;
            min-width: 0;
        }

        .bold-theme-container .header-right {
            flex: 0 0 320px;
            padding-left: 1.5em;
            text-align: right;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-end;
        }

        .bold-theme-container .company-name {
            word-wrap: break-word;
            font-size: ${config.headerTitleFontSize || '1.5em'};
            font-weight: ${config.headerTitleFontWeight || '900'};
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }

        .bold-theme-container .company-address {
            font-size: ${config.headerInfoFontSize || '0.8em'};
            color: #4b5563;
            line-height: 1.3;
        }

        .bold-theme-container .quote-title {
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: ${config.titleFontSize || '1.6em'};
            font-weight: ${config.titleFontWeight || '900'};
            font-family: ${config.titleFontFamily || 'inherit'};
            color: ${color};
        }

        .bold-theme-container .quote-meta-grid {
            display: grid;
            grid-template-columns: auto auto;
            gap: 0.5em 1em;
            font-size: ${config.quoteMetaLabelFontSize || '0.8em'};
            color: #4b5563;
        }

        .bold-theme-container .quote-meta-label {
            color: #6b7280;
            font-weight: ${config.quoteMetaLabelFontWeight || '600'};
            text-transform: uppercase;
            font-size: 0.85em;
        }

        .bold-theme-container .quote-meta-value {
            font-weight: ${config.quoteMetaValueFontWeight || '800'};
            color: #000;
            font-size: ${config.quoteMetaValueFontSize || 'inherit'};
        }

        /* CUSTOMER SECTION */
        .bold-theme-container .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5em;
            margin-bottom: 2em;
        }

        .bold-theme-container .customer-box {
            background: #f8fafc !important;
            border-left: 6px solid ${color};
            border-radius: 0 8px 8px 0;
            padding: 1.25em;
            border-top: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .bold-theme-container .section-title {
            text-transform: uppercase;
            font-size: ${config.customerTitleFontSize || '0.85em'};
            font-weight: ${config.customerTitleFontWeight || '800'};
            letter-spacing: 0.06em;
            color: ${color};
            margin-bottom: 0.75em;
        }

        [data-theme="dark"] .bold-theme-container,
        .bold-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: #000000 !important;
        }

        [data-theme="dark"] .bold-theme-container *,
        .bold-theme-container * {
            border-color: #e2e8f0 !important;
        }

        .bold-theme-container .info-grid {
            display: grid;
            gap: 0.5em;
        }

        .bold-theme-container .info-line {
            display: grid;
            grid-template-columns: 80px 1fr;
            font-size: 0.8em;
            align-items: baseline;
        }

        .bold-theme-container .info-label {
            color: #64748b;
            font-weight: ${config.customerLabelFontWeight || '600'};
            font-size: ${config.customerLabelFontSize || 'inherit'};
            text-transform: uppercase;
            font-size: 0.75em;
            letter-spacing: 0.04em;
        }

        .bold-theme-container .info-value {
            color: #1e293b;
            font-weight: ${config.customerValueFontWeight || '600'};
            font-size: ${config.customerValueFontSize || 'inherit'};
        }

        /* TABLE */
        .bold-theme-container .pdf-items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 2em;
            border: 2px solid ${color};
            border-radius: 8px;
            overflow: hidden;
        }

        .bold-theme-container .pdf-items-table thead {
            background: ${color} !important;
        }

        .bold-theme-container .pdf-items-table th {
            padding: 0.75em 0.5em;
            text-align: left;
            font-weight: ${config.tableHeaderFontWeight || '800'};
            color: #ffffff !important;
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '0.9em')} !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .bold-theme-container .pdf-items-table td {
            padding: 0.9em 0.5em;
            border-bottom: 2px solid ${config.tableBorderColor || '#e2e8f0'};
            vertical-align: middle;
            font-size: ${config.tableBodyFontSize || 'inherit'};
            font-weight: ${config.tableBodyFontWeight || 'normal'};
            height: ${config.tableRowHeight || 0}px;
        }

        ${config.tableStriped ? `
        .bold-theme-container .pdf-items-table tbody tr:nth-child(even) td {
            background: ${config.tableStripedColor || '#f8fafc'};
        }` : ''}

        ${config.tableShowVerticalLines ? `
        .bold-theme-container .pdf-items-table th,
        .bold-theme-container .pdf-items-table td {
            border-left: 2px solid ${config.tableBorderColor || '#e2e8f0'};
        }
        .bold-theme-container .pdf-items-table th:first-child,
        .bold-theme-container .pdf-items-table td:first-child {
            border-left: none;
        }` : ''}

        .bold-theme-container .pdf-items-table tbody tr:last-child td {
            border-bottom: none;
        }

        .bold-theme-container .item-image {
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

        .bold-theme-container .item-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .bold-theme-container .item-name {
            font-weight: 800;
            color: ${color};
            font-size: 1.1em;
            margin-bottom: 0.25em;
        }

        .bold-theme-container .item-desc {
            font-size: 1em !important;
            color: #64748b;
            line-height: 1.4;
        }

        .bold-theme-container .item-value {
            font-weight: 700;
            color: ${color};
            font-size: 0.85em;
        }

        /* SUMMARY & BANK SECTION */
        .bold-theme-container .bottom-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2em;
            margin-bottom: 2em;
            background: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5em;
        }

        .bold-theme-container .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 0.55em 0;
            font-size: ${config.summaryLabelFontSize || '0.85em'};
            font-weight: ${config.summaryLabelFontWeight || '500'};
            color: #475569;
            border-bottom: 1px dashed #cbd5e1;
        }

        .bold-theme-container .summary-row:last-of-type {
            border-bottom: none;
        }

        .bold-theme-container .summary-row.discount span:last-child {
            color: #ef4444;
            font-weight: 700;
        }

        .bold-theme-container .grand-total {
            margin-top: 1em;
            background: ${color};
            color: #ffffff !important;
            border-radius: 6px;
            padding: 0.75em 1em !important;
            border: none !important;
            font-size: ${config.summaryTotalFontSize || '1.05em'};
            font-weight: ${config.summaryTotalFontWeight || '800'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .bold-theme-container .grand-total span {
            color: #ffffff !important;
        }

        .bold-theme-container .bank-list {
            font-size: 0.8em;
            color: #475569;
            line-height: 1.8;
        }

        .bold-theme-container .bank-row {
            display: grid;
            grid-template-columns: 90px 1fr;
            margin-bottom: 0.25em;
        }

        /* TERMS & NOTES */
        .bold-theme-container .notes-section {
            margin-bottom: 2em;
        }

        .bold-theme-container .notes-title {
            font-size: 0.8em;
            font-weight: 800;
            color: ${color};
            margin-bottom: 0.5em;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .bold-theme-container .notes-content {
            font-size: 0.8em;
            color: #475569;
            line-height: 1.5;
        }

        .bold-theme-container .terms-box {
            background: #f8fafc;
            border-left: 6px solid ${color};
            border-radius: 0 8px 8px 0;
            border-top: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            padding: 1em;
            margin-bottom: 2em;
        }

        /* SIGNATURES */
        .bold-theme-container .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4em;
            margin-top: 3em;
            margin-bottom: 2em;
        }

        .bold-theme-container .signature-col {
            text-align: center;
        }

        .bold-theme-container .signature-line {
            border-bottom: 3px solid #475569;
            height: 60px;
            margin-bottom: 0.5em;
        }

        .bold-theme-container .signature-label {
            font-size: 0.8em;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* FOOTER */
        .bold-theme-container .pdf-footer {
            text-align: center;
            padding-top: 1.5em;
            border-top: 4px solid ${color};
            margin-top: auto;
        }

        .bold-theme-container .footer-info {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
            font-size: ${config.footerFontSize || '0.75rem'};
            font-weight: ${config.footerFontWeight || 'normal'};
            color: #64748b;
        }

        .bold-theme-container .footer-item {
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }

        .bold-theme-container .custom-footer {
            margin-top: 0.5em;
            font-size: 0.75em;
            color: #64748b;
            text-align: center;
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
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: '700' }}>{startIndex + index + 1}</td>
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
                        <td className="item-quantity" style={{ textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                        <td className="item-price" style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td className="item-discount" style={{ textAlign: 'center', color: '#ef4444' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td className="item-tax" style={{ textAlign: 'center' }}>%{item.taxRate}</td>}
                        <td className="item-total" style={{ textAlign: 'right', fontWeight: '700' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="bold-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{boldStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview pdf-page" style={{
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

                    {/* Header */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="pdf-header">
                            <div className="header-left">
                                {config.showLogo && companyData.logo && (
                                    <div className="company-logo">
                                        <img src={companyData.logo} alt="Logo" />
                                    </div>
                                )}
                                <div className="company-info">
                                    <div className="company-name">{renderEditable(companyData.name, 'companyName')}</div>
                                    <div className="company-details" style={{ fontSize: config.headerInfoFontSize || '0.8rem', color: '#4b5563' }}>
                                        <div>{companyData.address}</div>
                                        <div style={{ marginTop: '0.25em' }}>{companyData.phone}{companyData.email ? ` • ${companyData.email}` : ''}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="header-right">
                                <div className="quote-title">{renderEditable(config.title, 'quoteTitle')}</div>
                                <div className="quote-meta" style={{ fontSize: config.quoteMetaLabelFontSize || '0.8rem', color: '#4b5563', marginTop: '0.6rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <span><strong>{t.date}:</strong> {formatDate(quoteData.date, currentLocale)}</span>
                                        <span><strong>{t.validUntil}:</strong> {formatDate(quoteData.validUntil, currentLocale)}</span>
                                        <span><strong>#</strong>{quoteData.number}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pdf-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `3px solid ${color}` }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: config.headerInfoFontSize || '0.8em', color: '#666' }}>
                                <span><strong>{companyData.name}</strong> - {config.title}</span>
                                <span style={{ fontWeight: '700' }}>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                            </div>
                        </div>
                    ))}

                    {/* Customer Section - Only Page 1 */}
                    {showSection('customer') && pageIndex === 0 && (
                        <div className="customer-section">
                            <div className="customer-box" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <div className="section-title">{t.company}</div>
                                <div className="info-grid">
                                    <div className="info-line">
                                        <span className="info-label">{t.company}:</span>
                                        <span className="info-value"><strong>{renderEditable(companyData.name, 'companyName')}</strong></span>
                                    </div>
                                    <div className="info-line">
                                        <span className="info-label">{t.authorized}:</span>
                                        <span className="info-value">{companyData.authorizedPerson || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="customer-box" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <div className="section-title">{t.customer}</div>
                                <div className="info-grid">
                                    <div className="info-line">
                                        <span className="info-label">{t.company}:</span>
                                        <span className="info-value"><strong>{renderEditable(customerData.company, 'customerCompany')}</strong></span>
                                    </div>
                                    <div className="info-line">
                                        <span className="info-label">{t.authorized}:</span>
                                        <span className="info-value">{renderEditable(customerData.name, 'customerName')}</span>
                                    </div>
                                    <div className="info-line">
                                        <span className="info-label">{t.phone}:</span>
                                        <span className="info-value">{renderEditable(customerData.phone, 'customerPhone')}</span>
                                    </div>
                                    <div className="info-line">
                                        <span className="info-label">{t.email}:</span>
                                        <span className="info-value">{renderEditable(customerData.email, 'customerEmail')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
{showSection('items') && (
                        <div style={{ flex: 1 }}>
                            {renderTable(chunk, pageIndex * itemsPerPage)}
                        </div>
                        )}

                    {/* Summary, Notes, Signatures - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            {(config.showSummary || config.showBankInfo) && (
                                <div className="bottom-section" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    <div className="summary-section">
                                        <div className="section-title" style={{ marginBottom: '1rem' }}>{t.summary}</div>
                                        <div className="summary-row">
                                            <span>{t.subtotal}:</span>
                                            <span style={{ fontWeight: config.summaryValueFontWeight || '600', fontSize: config.summaryValueFontSize || 'inherit' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="summary-row discount">
                                                <span>{t.discount} (%{Math.round((discountAmount / subtotal) * 100)}):</span>
                                                <span>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <div className="summary-row">
                                                <span>{t.vat} (%20):</span>
                                                <span>{formatCurrency(totalTax)}</span>
                                            </div>
                                        )}
                                        <div className="summary-row">
                                            <span>{t.total} {t.vat}:</span>
                                            <span>{formatCurrency(totalTax)}</span>
                                        </div>
                                        <div className="summary-row grand-total">
                                            <span>{t.generalTotal}:</span>
                                            <span style={{ fontSize: 'inherit', fontWeight: 'inherit' }}>{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                    <div className="bank-section">
                                        {config.showBankInfo && (
                                            <div className="bank-info">
                                                <div className="section-title" style={{ marginBottom: '1rem' }}>{t.bankInfo}</div>
                                                <div className="bank-list">
                                                    <div className="bank-row"><strong>{t.bank}:</strong> <span>{bankData.bankName}</span></div>
                                                    <div className="bank-row"><strong>{t.branch}:</strong> <span>{bankData.branch}</span></div>
                                                    <div className="bank-row"><strong>{t.accountNo}:</strong> <span>-</span></div>
                                                    <div className="bank-row"><strong>{t.iban}:</strong> <span>{bankData.iban}</span></div>
                                                    <div className="bank-row"><strong>{t.accountHolder}:</strong> <span>{bankData.accountHolder}</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes & Terms */}
                            {showSection('notes') && (config.showTerms || config.showNotes) && (
                                <>
                                    {quoteData.notes && (
                                        <div className="notes-section">
                                            <div className="notes-title">{t.notes}</div>
                                            <div className="notes-content">{renderEditable(quoteData.notes, 'notes', 'textarea')}</div>
                                        </div>
                                    )}
                                    {config.showTerms && (
                                        <div className="terms-box">
                                            <div className="notes-title" style={{ marginBottom: '0.5rem' }}>{t.terms}</div>
                                            <div className="notes-content">
                                                <div><strong>{t.payment}:</strong> {renderEditable(quoteData.warrantyTerms, 'terms', 'textarea')}</div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="signatures-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                                    <div className="signature-col" style={{ textAlign: 'center' }}>
                                        <div className="signature-line" style={{
                                            height: 'auto',
                                            minHeight: '80px',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center',
                                            paddingBottom: '5px'
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
                                        <div className="signature-label" style={{ paddingTop: '0.5rem' }}>
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
                                            paddingBottom: '5px'
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
                                        <div className="signature-label" style={{ paddingTop: '0.5rem' }}>
                                            {t.companyStamp}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer - Only Last Page */}
                    {showSection('footer') && pageIndex === itemChunks.length - 1 && (
                        <div className="pdf-footer">
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
                                <div style={{ marginBottom: '0.25rem', fontWeight: '700', color: color }}>{t.thankYou}</div>
                                <div style={{ marginBottom: '0.25rem' }}>{t.regards}, {companyData.name}</div>
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

export default BoldTheme;