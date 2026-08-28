import React, { useMemo } from 'react';
import { formatTaxOfficeDisplay, formatPdfTitle, formatIban } from '@/utils/themeHelpers';
import { PdfWatermark, PdfPageNumber, PdfCustomFields } from './common';
import { usePdfTheme } from './hooks/usePdfTheme';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const ModernTheme: React.FC<PdfThemeProps> = (props) => {
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

    const modernStyles = useMemo(() => `
        .modern-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.35'};
            color: ${config.globalFontColor || '#1e293b'} !important;
            background: var(--pdf-page-bg, #ffffff) !important;
            font-size: ${typeof config.fontSize === 'number' ? config.fontSize + 'px' : (config.fontSize || '11px')};
            position: relative;
            box-sizing: border-box;
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
            height: 3px;
            background: linear-gradient(90deg, ${color}, #e2e8f0);
            z-index: 10;
        }

        .modern-theme-container, .modern-theme-container * {
            box-sizing: border-box;
        }

        [data-theme="dark"] .modern-theme-container,
        .modern-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#1e293b'} !important;
        }

        [data-theme="dark"] .modern-theme-container .customer-box,
        [data-theme="dark"] .modern-theme-container .quote-info-box,
        [data-theme="dark"] .modern-theme-container .term-card,
        [data-theme="dark"] .modern-theme-container .totals-section,
        .modern-theme-container .customer-box,
        .modern-theme-container .quote-info-box,
        .modern-theme-container .term-card,
        .modern-theme-container .totals-section {
            background-color: #f8fafc !important;
            color: #1e293b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        /* HEADER */
        .modern-theme-container .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.85rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #e2e8f0;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .modern-theme-container .header-left {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            flex: 1;
            padding-right: 1rem;
        }

        .modern-theme-container .company-logo-box {
            max-width: 140px;
            max-height: 60px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin-bottom: 0.35rem;
            overflow: hidden;
        }

        .modern-theme-container .company-logo-box img {
            max-width: 140px;
            max-height: 60px;
            object-fit: contain;
        }

        .modern-theme-container .company-info-box {
            width: 100%;
            font-size: 7.2pt;
            color: #475569;
            line-height: 1.35;
        }

        .modern-theme-container .company-title {
            font-size: ${config.headerTitleFontSize || '1rem'};
            font-weight: ${config.headerTitleFontWeight || '700'};
            color: #1e293b;
            margin-bottom: 0.2rem;
        }

        .modern-theme-container .quote-info-box {
            text-align: right;
            background: #f8fafc;
            padding: 0.65rem 0.85rem;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            border-left: 3px solid ${color};
            min-width: 190px;
            flex-shrink: 0;
        }

        .modern-theme-container .quote-title {
            font-size: ${config.titleFontSize || '0.95rem'};
            font-weight: ${config.titleFontWeight || '700'};
            color: #1e293b;
            margin-bottom: 0.35rem;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .modern-theme-container .quote-meta-line {
            font-size: 7.2pt;
            color: #64748b;
            margin-bottom: 0.15rem;
        }

        /* CUSTOMER SECTION */
        .modern-theme-container .customer-section {
            margin-bottom: 0.75rem;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .modern-theme-container .customer-box {
            background: #f8fafc;
            border-radius: 6px;
            padding: 0.6rem 0.8rem;
            border: 1px solid #e2e8f0;
        }

        .modern-theme-container .section-title {
            font-size: 7.5pt;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.35rem;
            display: flex;
            align-items: center;
            gap: 0.35rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .modern-theme-container .customer-box .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 0.25rem 1rem;
            font-size: 7.2pt;
        }

        .modern-theme-container .info-line {
            display: flex;
            align-items: baseline;
        }

        .modern-theme-container .info-label {
            font-weight: 500;
            color: #64748b;
            min-width: 55px;
        }

        .modern-theme-container .info-value {
            color: #1e293b;
            flex: 1;
            word-break: break-word;
        }

        /* TABLE */
        .modern-theme-container .pdf-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0.75rem;
            font-size: 7.5pt;
            background: #ffffff;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }

        .modern-theme-container .pdf-items-table th {
            background: ${config.tableHeaderBg || '#f1f5f9'};
            padding: ${config.tableHeaderPadding || '5px 6px'};
            text-align: left;
            font-weight: ${config.tableHeaderFontWeight || '600'};
            color: ${config.tableHeaderColor || '#475569'};
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '7pt')} !important;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid #e2e8f0;
        }

        .modern-theme-container .pdf-items-table td {
            padding: ${config.tableCellPadding || '4px 6px'};
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
            font-size: ${config.tableBodyFontSize || '7.5pt'};
            color: #1e293b;
        }

        .modern-theme-container .pdf-items-table tr:last-child td {
            border-bottom: none;
        }

        ${config.tableStriped ? `
        .modern-theme-container .pdf-items-table tbody tr:nth-child(even) td {
            background-color: ${config.tableStripedColor || '#f8fafc'};
        }` : ''}

        ${config.tableShowVerticalLines ? `
        .modern-theme-container .pdf-items-table th,
        .modern-theme-container .pdf-items-table td {
            border-left: 1px solid ${config.tableBorderColor || '#e2e8f0'};
        }
        .modern-theme-container .pdf-items-table th:first-child,
        .modern-theme-container .pdf-items-table td:first-child {
            border-left: none;
        }` : ''}

        .modern-theme-container .item-image {
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            overflow: hidden;
            margin: 0 auto;
        }

        .modern-theme-container .item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .modern-theme-container .item-name {
            font-weight: 600;
            color: #1e293b;
        }

        .modern-theme-container .item-desc {
            font-size: 6.8pt;
            color: #64748b;
            margin-top: 1px;
            line-height: 1.25;
            white-space: pre-wrap;
            word-break: break-word;
        }

        /* SUMMARY & PAYMENT SECTION */
        .modern-theme-container .pdf-summary-grid {
            background: #f8fafc;
            border-radius: 6px;
            padding: 0.65rem 0.8rem;
            margin-bottom: 0.65rem;
            border: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.85rem;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .modern-theme-container .totals-section {
            background: #ffffff;
            border-radius: 6px;
            padding: 0.6rem 0.75rem;
            border: 1px solid #e2e8f0;
        }

        .modern-theme-container .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 0.2rem 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: ${config.summaryLabelFontSize || '7.2pt'};
            color: #475569;
        }

        .modern-theme-container .summary-row.grand-total {
            font-weight: 700;
            font-size: ${config.summaryTotalFontSize || '8.5pt'};
            color: #1e293b;
            padding-top: 0.35rem;
            margin-top: 0.2rem;
            border-top: 2px solid #e2e8f0;
            border-bottom: none;
        }

        .modern-theme-container .payment-info-box {
            font-size: 7.2pt;
        }

        .modern-theme-container .payment-info-box .section-title {
            margin-bottom: 0.35rem;
        }

        /* SIGNATURE SECTION */
        .modern-theme-container .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.85rem;
            margin-bottom: 0.65rem;
            padding-top: 0.4rem;
            border-top: 1px solid #e2e8f0;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .modern-theme-container .signature-box {
            text-align: center;
            padding: 0.5rem;
        }

        .modern-theme-container .signature-area {
            height: 52px;
            border-bottom: 1px solid #cbd5e1;
            margin-bottom: 0.35rem;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            position: relative;
            padding-bottom: 2px;
        }

        .modern-theme-container .stamp-area {
            height: 52px;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            font-size: 6.5pt;
            margin-bottom: 0.35rem;
            background: #f8fafc;
            overflow: hidden;
        }

        .modern-theme-container .signature-label {
            font-size: 6.8pt;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
        }

        /* TERMS SECTION */
        .modern-theme-container .terms-section {
            margin-bottom: 0.65rem;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .modern-theme-container .terms-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.85rem;
        }

        .modern-theme-container .term-card {
            background: #f8fafc;
            border-radius: 6px;
            padding: 0.55rem 0.75rem;
            border: 1px solid #e2e8f0;
        }

        .modern-theme-container .term-card h3 {
            font-size: 7pt;
            font-weight: 700;
            color: #475569;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .modern-theme-container .term-content {
            font-size: 6.8pt;
            line-height: 1.35;
            color: #475569;
            white-space: pre-wrap;
        }

        /* FOOTER */
        .modern-theme-container .pdf-footer {
            margin-top: auto;
            padding-top: 0.65rem;
            border-top: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.85rem;
            font-size: 6.8pt;
            color: #64748b;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .modern-theme-container .footer-thanks {
            text-align: right;
        }

        .modern-theme-container .thanks-text {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.15rem;
        }
    `, [color, config]);

    const showImageCol = config.showTableImages && hasAnyImage;

    const currencySymbol = quoteData.currency === 'USD' ? '$' : quoteData.currency === 'EUR' ? '€' : quoteData.currency === 'GBP' ? '£' : '₺';

    const renderTable = (tableItems: QuoteItem[], startIndex: number) => (
        <table className="pdf-items-table">
            <thead>
                <tr>
                    <th style={{ width: '28px', textAlign: 'center' }}>#</th>
                    {showImageCol && <th style={{ width: '45px', textAlign: 'center' }}>{t.image || 'Görsel'}</th>}
                    <th>{config.textItem ?? t.item ?? 'Ürün/Hizmet Açıklaması'}</th>
                    {config.showTableUnit && <th style={{ width: '48px', textAlign: 'center' }}>{config.textUnit ?? t.unit ?? 'Birim'}</th>}
                    <th style={{ width: '42px', textAlign: 'center' }}>{config.textQuantity ?? t.quantity ?? 'Miktar'}</th>
                    <th style={{ width: '85px', textAlign: 'right' }}>{config.textUnitPrice ?? (t.unitPrice ? `${t.unitPrice} (${currencySymbol})` : `Birim Fiyat (${currencySymbol})`)}</th>
                    {hasLineItemDiscounts && <th style={{ width: '48px', textAlign: 'center' }}>{config.textDiscount ?? t.discount ?? 'İndirim'}</th>}
                    {config.showTableTax && <th style={{ width: '45px', textAlign: 'center' }}>{config.textVat ?? t.tax ?? 'KDV'}</th>}
                    <th style={{ width: '90px', textAlign: 'right' }}>{config.textTotal ?? (t.total ? `${t.total} (${currencySymbol})` : `Toplam (${currencySymbol})`)}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => {
                    const isFixedDiscount = item.discountType === 'fixed';
                    const discountVal = Number(item.discountRate) || 0;
                    const discountDisplay = discountVal > 0 ? (isFixedDiscount ? formatCurrency(discountVal) : `%${discountVal}`) : '-';
                    const baseTotal = (item.quantity || 0) * (item.price || 0);
                    const lineTotal = (typeof item.total === 'number' && item.total > 0) ? item.total : (isFixedDiscount ? Math.max(0, baseTotal - discountVal) : baseTotal * (1 - discountVal / 100));

                    return (
                        <tr key={startIndex + index} style={config.tableStriped && (startIndex + index) % 2 === 1 ? { backgroundColor: typeof config.tableStripedColor === 'string' && config.tableStripedColor ? config.tableStripedColor : '#f8fafc' } : undefined}>
                            <td style={{ textAlign: 'center', color: '#64748b' }}>{startIndex + index + 1}</td>
                            {showImageCol && (
                                <td>
                                    <div className="item-image">
                                        {item.image ? (
                                            <img src={item.image} alt="" />
                                        ) : (
                                            <span style={{ fontSize: '7px', color: '#94a3b8' }}>-</span>
                                        )}
                                    </div>
                                </td>
                            )}
                            <td>
                                <div className="item-name">{item.name}</div>
                                {item.description && <div className="item-desc">{item.description}</div>}
                            </td>
                            {config.showTableUnit && <td style={{ textAlign: 'center', color: '#64748b' }}>{item.unit}</td>}
                            <td style={{ textAlign: 'center', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                            {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{discountDisplay}</td>}
                            {config.showTableTax && <td style={{ textAlign: 'center', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{(quoteData.language === 'en' || quoteData.language === 'de') ? `${Number(item.taxRate) || 0}%` : `%${Number(item.taxRate) || 0}`}</td>}
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(lineTotal)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div id={id} className={`modern-theme-container w-full max-w-[210mm] mx-auto ${config.margins === 'compact' ? 'pdf-compact-mode' : ''}`} style={containerStyles}>
            <style>{modernStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview pdf-page" style={{
                    position: 'relative',
                    minHeight: containerStyles?.pageMinHeight || '284mm',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto',
                    background: '#ffffff'
                }}>
                    {/* Watermark */}
                    <PdfWatermark config={config} />

                    {/* Header */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="pdf-header">
                            <div className="header-left">
                                {config.showLogo && companyData.logo && (
                                    <div className="company-logo-box">
                                        <img src={companyData.logo} alt="Logo" />
                                    </div>
                                )}
                                {(companyData.name || companyData.authorized || companyData.phone || companyData.address || companyData.email || companyData.website || companyData.taxOffice || companyData.taxNumber) && (
                                    <div className="company-info-box">
                                        {companyData.name && <div className="company-title">{renderEditable(companyData.name, 'companyName')}</div>}
                                        {companyData.authorized && <div><strong>{t.authorized || 'Yetkili'}:</strong> {companyData.authorized}</div>}
                                        {companyData.phone && <div><strong>{t.phone || 'Tel'}:</strong> {companyData.phone}</div>}
                                        {companyData.address && <div><strong>{t.address || 'Adres'}:</strong> {companyData.address}</div>}
                                        {companyData.email && <div><strong>{t.email || 'E-posta'}:</strong> {companyData.email}</div>}
                                        {companyData.website && <div><strong>{t.website || 'Web'}:</strong> {companyData.website}</div>}
                                        {(companyData.taxOffice || companyData.taxNumber) && (
                                            <div>
                                                <strong>{t.taxOffice || 'Vergi'}:</strong> {companyData.taxOffice ? `${formatTaxOfficeDisplay(companyData.taxOffice, t.taxOffice || 'V.D.')} ` : ''}{companyData.taxNumber ? `No: ${companyData.taxNumber}` : ''}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="quote-info-box">
                                <div className="quote-title">{renderEditable(formatPdfTitle(quoteData.title || config.title || t.quoteTitle, quoteData.language), 'quoteTitle')}</div>
                                {quoteData.number && (
                                    <div className="quote-meta-line"><strong>{t.quoteNumber || 'Teklif No'}:</strong> <span style={{ fontWeight: 600, color: color }}>#{quoteData.number}</span></div>
                                )}
                                {quoteData.date && (
                                    <div className="quote-meta-line"><strong>{t.date || 'Tarih'}:</strong> <span>{formatDate(quoteData.date, currentLocale)}</span></div>
                                )}
                                {quoteData.validUntil && (
                                    <div className="quote-meta-line"><strong>{t.validUntil || 'Geçerlilik'}:</strong> <span>{formatDate(quoteData.validUntil, currentLocale)}</span></div>
                                )}
                                {quoteData.terms && (
                                    <div className="quote-meta-line"><strong>{t.payment || 'Ödeme'}:</strong> <span>{quoteData.terms}</span></div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="pdf-header" style={{ marginBottom: '0.65rem', paddingBottom: '0.35rem', borderBottom: `1px solid ${color}` }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: config.headerInfoFontSize || '7.5pt', color: '#64748b' }}>
                                <span><strong>{companyData.name ? `${companyData.name} - ` : ''}</strong>{formatPdfTitle(quoteData.title || config.title || t.quoteTitle, quoteData.language)}{quoteData.number ? ` (#${quoteData.number})` : ''}</span>
                                {config.showPageNumbers !== false && (
                                    <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Customer Section - Only Page 1 and only if customer has data */}
                    {showSection('customer') && pageIndex === 0 && (
                        (customerData.name && customerData.name.trim().length > 0) ||
                        (customerData.company && customerData.company.trim().length > 0) ||
                        (customerData.phone && customerData.phone.trim().length > 0) ||
                        (customerData.email && customerData.email.trim().length > 0) ||
                        (customerData.address && customerData.address.trim().length > 0) ||
                        (customerData.taxOffice && customerData.taxOffice.trim().length > 0) ||
                        (customerData.taxNumber && customerData.taxNumber.trim().length > 0) ||
                        (quoteData.customFields && quoteData.customFields.length > 0)
                    ) && (
                        <div className="customer-section">
                            <div className="customer-box">
                                <div className="section-title">
                                    <span>👤</span> <span>{t.customer || 'MÜŞTERİ'}</span>
                                </div>
                                <div className="info-grid">
                                    {customerData.company && (
                                        <div className="info-line">
                                            <span className="info-label">{t.company || 'Firma'}:</span>
                                            <span className="info-value"><strong>{renderEditable(customerData.company, 'customerCompany')}</strong></span>
                                        </div>
                                    )}
                                    {customerData.name && (
                                        <div className="info-line">
                                            <span className="info-label">{t.authorized || 'Yetkili'}:</span>
                                            <span className="info-value">{renderEditable(customerData.name, 'customerName')}</span>
                                        </div>
                                    )}
                                    {customerData.phone && (
                                        <div className="info-line">
                                            <span className="info-label">{t.phone || 'Tel'}:</span>
                                            <span className="info-value">{renderEditable(customerData.phone, 'customerPhone')}</span>
                                        </div>
                                    )}
                                    {customerData.email && (
                                        <div className="info-line">
                                            <span className="info-label">{t.email || 'E-posta'}:</span>
                                            <span className="info-value">{renderEditable(customerData.email, 'customerEmail')}</span>
                                        </div>
                                    )}
                                    {customerData.address && (
                                        <div className="info-line" style={{ gridColumn: '1 / -1' }}>
                                            <span className="info-label">{t.address || 'Adres'}:</span>
                                            <span className="info-value">{renderEditable(customerData.address, 'customerAddress')}</span>
                                        </div>
                                    )}
                                    {(customerData.taxOffice || customerData.taxNumber) && (
                                        <div className="info-line">
                                            <span className="info-label">{t.taxOffice || 'Vergi'}:</span>
                                            <span className="info-value">
                                                {customerData.taxOffice && <span>{formatTaxOfficeDisplay(customerData.taxOffice, t.taxOffice || 'V.D.')} </span>}
                                                {customerData.taxNumber && <span>No: {customerData.taxNumber}</span>}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <PdfCustomFields customFields={quoteData.customFields} themeColor={color} />
                        </div>
                    )}

                    {/* Items Table */}
                    {showSection('items') && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {renderTable(chunk, itemChunks.slice(0, pageIndex).reduce((acc, c) => acc + c.length, 0))}
                        {pageIndex < itemChunks.length - 1 && (
                            <div style={{ marginTop: '0.6rem', paddingTop: '0.4rem', paddingBottom: '0.2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '7pt', color: '#64748b', fontStyle: 'italic' }}>
                                <span>{t.continuedOnNextPage || 'Teklif devamı sonraki sayfadadır ➔'}</span>
                            </div>
                        )}
                    </div>
                    )}

                    {/* Bottom Section - Only on Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: '1.25rem', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            {config.showSummary && (
                                <div className="pdf-summary-grid" style={!(config.showBankInfo && (bankData.bankName || bankData.iban || bankData.accountNumber)) ? { display: 'flex', justifyContent: 'flex-end' } : undefined}>
                                    <div className="totals-section" style={!(config.showBankInfo && (bankData.bankName || bankData.iban || bankData.accountNumber)) ? { width: '100%', maxWidth: '340px' } : undefined}>
                                        <div className="section-title">
                                            <span>🧮</span> <span>{t.summary || 'ÖZET'}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>{t.subtotal || 'Ara Toplam'}:</span>
                                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="summary-row" style={{ color: '#dc2626' }}>
                                                <span>{t.discount || 'İndirim'}{props.discount?.type !== 'fixed' ? props.discount?.value ? ` (%${props.discount.value})` : ` (%${subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0})` : ''}:</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <>
                                                {Object.keys(vatBreakdown).length > 1 ? (
                                                    Object.entries(vatBreakdown)
                                                        .filter(([_, data]) => data.taxable > 0)
                                                        .map(([rate, data]) => (
                                                            <div key={rate} className="summary-row">
                                                                <span>{t.vat || t.tax || 'KDV'} ({(currentLocale || 'tr').startsWith('tr') ? `%${rate}` : `${rate}%`}):</span>
                                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(data.tax)}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="summary-row">
                                                        <span>{t.vat || t.tax || 'KDV'}:</span>
                                                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(totalTax)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="summary-row grand-total">
                                            <span>{t.generalTotal || 'GENEL TOPLAM'}:</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        {amountInWords && (
                                            <div style={{ fontSize: '6.8pt', color: '#64748b', fontStyle: 'italic', marginTop: '4px', textAlign: 'right', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                {amountInWords}
                                            </div>
                                        )}
                                    </div>

                                    {config.showBankInfo && (bankData.bankName || bankData.iban || bankData.accountNumber) && (
                                        <div className="payment-info-box">
                                            <div className="section-title">
                                                {t.bankInfo || 'ÖDEME BİLGİLERİ'}
                                            </div>
                                            <div className="info-grid">
                                                {bankData.bankName && (
                                                    <div className="info-line">
                                                        <span className="info-label">{t.bank || 'Banka'}:</span>
                                                        <span className="info-value"><strong>{bankData.bankName}</strong> {bankData.branch && <span>({bankData.branch})</span>}</span>
                                                    </div>
                                                )}
                                                {bankData.accountNumber && (
                                                    <div className="info-line">
                                                        <span className="info-label">{t.accountNo || 'Hesap No'}:</span>
                                                        <span className="info-value">{bankData.accountNumber}</span>
                                                    </div>
                                                )}
                                                {bankData.iban && (
                                                    <div className="info-line">
                                                        <span className="info-label">{t.iban || 'IBAN'}:</span>
                                                        <span className="info-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatIban(bankData.iban)}</span>
                                                    </div>
                                                )}
                                                {bankData.accountHolder && (
                                                    <div className="info-line">
                                                        <span className="info-label">{t.accountHolder || 'Hesap Sahibi'}:</span>
                                                        <span className="info-value">{bankData.accountHolder}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && (
                                <div className="signature-section" style={!config.showCustomerSignature ? { gridTemplateColumns: '1fr', maxWidth: '280px', margin: '0 auto 0.65rem auto' } : undefined}>
                                    <div className="signature-box">
                                        <div className="signature-area">
                                            {(() => {
                                                const effectiveSig = (signature === null || signature === '') ? null : (signature || companyData.signature);
                                                return effectiveSig ? <img src={effectiveSig as string} alt={t.signature || 'İmza'} style={{ maxHeight: '42px', maxWidth: '110px', objectFit: 'contain' }} /> : <span style={{ color: '#94a3b8', fontSize: '7pt' }}>{t.signature || 'İmza'}</span>;
                                            })()}
                                            {companyData.stamp && <img src={companyData.stamp as string} alt={t.companyStamp || 'Kaşe'} style={{ maxHeight: '42px', maxWidth: '90px', objectFit: 'contain', opacity: 0.85, marginLeft: '6px' }} />}
                                        </div>
                                        <div className="signature-label">{t.seller || 'SATICI'} ({t.deliveredBy || 'Yetkili Kaşe / İmza'})</div>
                                    </div>
                                    {config.showCustomerSignature && (
                                        <div className="signature-box">
                                            <div className="stamp-area">
                                                <span style={{ color: '#94a3b8' }}>{t.customerStamp || 'KAŞE / MÜHÜR'}</span>
                                            </div>
                                            <div className="signature-label">{t.customer || 'FİRMA MÜHÜRÜ'} ({t.customerApproval || 'Müşteri Onayı'})</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Terms Section */}
                            {(showSection('terms') || showSection('notes')) && (quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.notes) && (
                                <div className="terms-section">
                                    <div className="terms-grid">
                                        {quoteData.deliveryTerms && (
                                            <div className="term-card">
                                                <h3>{t.deliveryConditions || t.delivery || 'Teslimat Koşulları'}</h3>
                                                <div className="term-content">
                                                    {quoteData.deliveryTerms}
                                                </div>
                                            </div>
                                        )}
                                        {quoteData.warrantyTerms && (
                                            <div className="term-card">
                                                <h3>{t.warrantyConditions || t.warranty || 'Garanti Koşulları'}</h3>
                                                <div className="term-content">
                                                    {quoteData.warrantyTerms}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            {showSection('footer') && (companyData.name || companyData.address || companyData.phone || companyData.email) && (
                                <div className="pdf-footer">
                                    <div>
                                        {companyData.name && <div><strong>{companyData.name}</strong></div>}
                                        {companyData.address && <div>{companyData.address}</div>}
                                        {companyData.phone && <div><strong>{t.phone || 'Tel'}:</strong> {companyData.phone}</div>}
                                        {companyData.email && <div><strong>{t.email || 'E-posta'}:</strong> {companyData.email}</div>}
                                    </div>
                                    <div className="footer-thanks">
                                        <div className="thanks-text">{t.thankYou || 'Teşekkür ederiz!'}</div>
                                        <div>{t.thankYouMessage || 'Bizimle çalışmayı tercih ettiğiniz için teşekkür ederiz.'}</div>
                                    </div>
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

export default ModernTheme;

