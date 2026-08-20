import React, { useMemo } from 'react';
import { numberToWordsTurkish } from '@/utils/numberToWordsTurkish';
import type { QuoteItem, PdfThemeProps } from '@/context/quote/types';

const ProTheme: React.FC<PdfThemeProps> = ({
    id,
    containerStyles,
    config,
    color = '#4f46e5',
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
        const map: Record<string, boolean> = {};
        (activeLayout || []).forEach((l) => { map[l.id] = l.enabled !== false; });
        return map;
    }, [activeLayout]);
    const showSection = (sectionId: string) => layoutMap[sectionId] !== false;

    const renderEditable = (value: unknown, fieldKey: string, type = 'text', className = '') => {
        if (!onEdit) return <span className={className}>{String(value ?? '')}</span>;

        return (
            <span
                className={`editable-field group relative cursor-pointer hover:bg-[var(--color-primary-muted)] hover:ring-2 hover:ring-[var(--color-primary-ring)] rounded px-1 -mx-1 transition-all ${className}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(fieldKey, value, type);
                }}
                title={t.clickToEdit}
            >
                {String(value || '') || <span className="italic text-[var(--color-text-muted)]">{t.edit}</span>}
            </span>
        );
    };

    const proStyles = useMemo(() => `
        .pro-theme-container {
            font-family: ${config.globalFontFamily || "'Plus Jakarta Sans', 'Inter', sans-serif"};
            line-height: ${config.bodyLineHeight || '1.35'};
            color: ${config.globalFontColor || '#1e293b'};
            font-size: ${config.fontSize || 11}px;
            background-color: var(--pdf-page-bg, #ffffff) !important;
            position: relative;
            box-sizing: border-box;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        [data-theme="dark"] .pro-theme-container {
            background-color: var(--pdf-page-bg, #ffffff) !important;
            color: ${config.globalFontColor || '#1e293b'} !important;
        }

        [data-theme="dark"] .pro-party-card,
        [data-theme="dark"] .pro-summary-section,
        [data-theme="dark"] .pro-table td {
            background-color: #ffffff !important;
            color: #1e293b !important;
        }

        .pro-theme-container * {
            box-sizing: border-box;
        }

        .pro-top-accent {
            height: 4px;
            background: linear-gradient(90deg, ${color}, #06b6d4);
            margin-bottom: 12px;
            border-radius: 2px;
        }

        .pro-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 10px;
            margin-bottom: 12px;
            border-bottom: 1.5px solid #e2e8f0;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .pro-parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .pro-party-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-top: 3px solid ${color};
            border-radius: 6px;
            padding: 8px 12px;
        }

        .pro-party-label {
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: ${color};
            margin-bottom: 4px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 2px;
        }

        .pro-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .pro-table th {
            background: ${config.tableHeaderBg || '#f8fafc'};
            color: ${config.tableHeaderColor || '#0f172a'};
            padding: ${config.tableHeaderPadding || '6px 8px'};
            text-align: left;
            font-weight: 700;
            font-size: ${typeof config.tableHeaderFontSize === 'number' ? config.tableHeaderFontSize + 'px' : (config.tableHeaderFontSize || '8.5pt')};
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-top: 1.5px solid #e2e8f0;
            border-bottom: 1.5px solid #cbd5e1;
        }

        .pro-table td {
            padding: ${config.tableCellPadding || '6px 8px'};
            border-bottom: 1px solid #f1f5f9;
            font-size: ${config.tableBodyFontSize || '9pt'};
            color: #1e293b;
            vertical-align: middle;
        }

        .pro-table tbody tr:nth-child(even) td {
            background-color: ${config.tableStripedColor || '#f8fafc'};
        }

        .pro-summary-section {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 12px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .pro-grand-total {
            display: flex;
            justify-content: space-between;
            border-top: 2px solid ${color};
            margin-top: 4px;
            padding-top: 4px;
            font-size: 10.5pt;
            font-weight: 800;
            color: #0f172a;
        }

        .pro-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 8px;
            margin-bottom: 6px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .pro-sig-box {
            text-align: center;
        }

        .pro-sig-area {
            min-height: 44px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            border-bottom: 1.5px solid #94a3b8;
            padding-bottom: 4px;
            gap: 10px;
        }

        .pro-sig-label {
            padding-top: 3px;
            font-size: 7.5pt;
            font-weight: 700;
            color: #0f172a;
        }
    `, [color, config]);

    const itemsPerPage = config.itemsPerPage || 14;
    const itemChunks = useMemo(() => {
        const chunks: QuoteItem[][] = [];
        if (items.length === 0) {
            chunks.push([]);
        } else {
            for (let i = 0; i < items.length; i += itemsPerPage) {
                chunks.push(items.slice(i, i + itemsPerPage));
            }
        }
        return chunks;
    }, [items, itemsPerPage]);

    const vatBreakdown = useMemo(() => {
        const map: Record<number, { taxable: number; tax: number }> = {};
        items.forEach((item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const discRate = Number(item.discountRate) || 0;
            const rate = Number(item.taxRate) || 0;
            const lineTotal = qty * price * (1 - discRate / 100);
            const lineTax = (lineTotal * rate) / 100;
            if (!map[rate]) {
                map[rate] = { taxable: 0, tax: 0 };
            }
            map[rate].taxable += lineTotal;
            map[rate].tax += lineTax;
        });
        return map;
    }, [items]);

    const renderTable = (tableItems: QuoteItem[], startIndex: number) => (
        <table className="pro-table">
            <thead>
                <tr>
                    <th style={{ width: '35px', textAlign: 'center' }}>#</th>
                    {config.showTableImages && <th style={{ width: '45px', textAlign: 'center' }}>{t.image}</th>}
                    <th style={{ textAlign: 'left' }}>{config.textItem || t.item}</th>
                    {config.showTableUnit && <th style={{ width: '50px', textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                    <th style={{ width: '55px', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                    <th style={{ width: '85px', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '50px', textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '50px', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ width: '100px', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {tableItems.map((item, index) => (
                    <tr key={startIndex + index}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{startIndex + index + 1}</td>
                        {config.showTableImages && (
                            <td>
                                <div style={{ width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', overflow: 'hidden' }}>
                                    {item.image ? (
                                        <img src={item.image} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                                    ) : (
                                        <span style={{ fontSize: '9px', color: '#94a3af' }}>-</span>
                                    )}
                                </div>
                            </td>
                        )}
                        <td>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '1px', lineHeight: '1.2' }}>{item.description}</div>}
                        </td>
                        {config.showTableUnit && <td style={{ textAlign: 'center', color: '#475569' }}>{item.unit}</td>}
                        <td style={{ textAlign: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price)}</td>
                        {hasLineItemDiscounts && <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.discountRate ? `%${item.discountRate}` : '-'}</td>}
                        {config.showTableTax && <td style={{ textAlign: 'center', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>%{item.taxRate}</td>}
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="pro-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{proStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="pdf-preview pdf-page" style={{
                    position: 'relative',
                    minHeight: containerStyles?.pageMinHeight || '284mm',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                }}>
                    <div className="pro-top-accent" />

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
                                fontSize: `${config.watermarkFontSize || 48}px`,
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
                        <div className="pro-header">
                            <div style={{ flex: 1, paddingRight: '12px' }}>
                                {config.showLogo && companyData.logo && (
                                    <div style={{ display: 'flex', justifyContent: config.logoPosition === 'center' ? 'center' : config.logoPosition === 'right' ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                                        <img src={companyData.logo} alt="Logo" style={{ maxHeight: `${config.logoMaxHeight || 48}px`, maxWidth: '140px', objectFit: 'contain', borderRadius: config.logoStyle === 'circle' ? '50%' : config.logoStyle === 'rounded' ? '6px' : '0' }} />
                                    </div>
                                )}
                                <div style={{ fontSize: config.headerTitleFontSize || '1.2rem', fontWeight: '800', color: color }}>{renderEditable(companyData.name, 'companyName')}</div>
                                <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px', lineHeight: '1.35' }}>
                                    {companyData.address && <div>{companyData.address}</div>}
                                    <div>{companyData.phone} | {companyData.email}</div>
                                    {(companyData.taxOffice || companyData.taxNumber) && (
                                        <div style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: '1px' }}>
                                            {companyData.taxOffice && <span>{companyData.taxOffice} V.D. </span>}
                                            {companyData.taxNumber && <span>No: {companyData.taxNumber}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a' }}>{renderEditable(config.title, 'quoteTitle')}</div>
                                <div style={{ marginTop: '4px', display: 'inline-flex', gap: '8px', fontSize: '8pt', background: '#f8fafc', padding: '3px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontWeight: '700', color: '#0f172a' }}>#{quoteData.number}</span>
                                    <span>•</span>
                                    <span>{t.date}: {formatDate(quoteData.date, currentLocale)}</span>
                                    <span>•</span>
                                    <span>{t.validUntil}: {formatDate(quoteData.validUntil, currentLocale)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '8px', paddingBottom: '4px', borderBottom: `1.5px solid ${color}`, display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#64748b' }}>
                            <span><strong>{companyData.name}</strong> - {config.title} (#{quoteData.number})</span>
                            <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                        </div>
                    ))}

                    {/* Customer & Details Cards */}
                    {showSection('customer') && pageIndex === 0 && (
                        <div className="pro-parties-grid">
                            {/* Customer Box */}
                            <div className="pro-party-card">
                                <div className="pro-party-label">{t.customer} / {t.to}</div>
                                {customerData.company && (
                                    <div style={{ fontSize: '9.5pt', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                                        {renderEditable(customerData.company, 'customerCompany')}
                                    </div>
                                )}
                                <div style={{ fontSize: '8pt', color: '#334155', lineHeight: '1.35' }}>
                                    {customerData.name && (
                                        <div><span style={{ color: '#64748b', fontWeight: 600 }}>{t.authorized}: </span>{renderEditable(customerData.name, 'customerName')}</div>
                                    )}
                                    {customerData.phone && (
                                        <div><span style={{ color: '#64748b', fontWeight: 600 }}>{t.phone}: </span>{renderEditable(customerData.phone, 'customerPhone')}</div>
                                    )}
                                    {customerData.email && (
                                        <div><span style={{ color: '#64748b', fontWeight: 600 }}>{t.email}: </span>{renderEditable(customerData.email, 'customerEmail')}</div>
                                    )}
                                    {customerData.address && <div>{customerData.address}</div>}
                                    {(customerData.taxOffice || customerData.taxNumber) && (
                                        <div style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: '2px' }}>
                                            {customerData.taxOffice && <span>{customerData.taxOffice} V.D. </span>}
                                            {customerData.taxNumber && <span>No: {customerData.taxNumber}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quote Info Card */}
                            <div className="pro-party-card">
                                <div className="pro-party-label">{t.details}</div>
                                <div style={{ fontSize: '8.5pt', color: '#334155', lineHeight: '1.4' }}>
                                    <div><strong>{t.quoteNo}:</strong> #{quoteData.number}</div>
                                    <div><strong>{t.date}:</strong> {formatDate(quoteData.date, currentLocale)}</div>
                                    <div><strong>{t.validUntil}:</strong> {formatDate(quoteData.validUntil, currentLocale)}</div>
                                    {config.showNotes && quoteData.notes && (
                                        <div style={{ marginTop: '3px', fontSize: '8pt', color: '#64748b', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                            {renderEditable(quoteData.notes, 'notes', 'textarea')}
                                        </div>
                                    )}
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

                    {/* Summary, Signatures, Terms - Only Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            {config.showSummary && (
                                <div className="pro-summary-section">
                                    <div>
                                        {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                            <div>
                                                <div style={{ color: color, fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px', borderBottom: '1px solid #f1f5f9', paddingBottom: '2px' }}>
                                                    {t.bankInfo}
                                                </div>
                                                <div style={{ fontSize: '8pt', color: '#475569', lineHeight: '1.4' }}>
                                                    {bankData.bankName && <div><strong>{bankData.bankName}</strong> {bankData.branch && <span>({bankData.branch})</span>}</div>}
                                                    {bankData.iban && <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>TR {bankData.iban}</span></div>}
                                                    {bankData.accountHolder && <div style={{ color: '#64748b' }}>{bankData.accountHolder}</div>}
                                                </div>
                                            </div>
                                        )}
                                        {showSection('notes') && config.showTerms && (quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.terms) && (
                                            <div style={{ fontSize: '7.5pt', color: '#475569', lineHeight: '1.35', marginTop: '4px' }}>
                                                {quoteData.deliveryTerms && <div><strong>{t.deliveryConditions}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                                {(quoteData.warrantyTerms || quoteData.terms) && <div><strong>{t.warrantyConditions}:</strong> {renderEditable(quoteData.warrantyTerms || quoteData.terms, 'terms', 'textarea')}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '8pt', color: '#475569' }}>
                                            <span>{t.subtotal}</span>
                                            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '8pt', color: '#dc2626' }}>
                                                <span>{t.discount} (%{Math.round((discountAmount / subtotal) * 100)})</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <>
                                                {Object.keys(vatBreakdown).length > 1 ? (
                                                    Object.entries(vatBreakdown)
                                                        .filter(([_, data]) => data.tax > 0)
                                                        .map(([rate, data]) => (
                                                            <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '7.5pt', color: '#475569' }}>
                                                                <span>{t.tax} (%{rate})</span>
                                                                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(data.tax)}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '8pt', color: '#475569' }}>
                                                        <span>{t.tax}</span>
                                                        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="pro-grand-total">
                                            <span>{t.generalTotal}</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '7pt', color: '#64748b', fontStyle: 'italic', marginTop: '3px', textAlign: 'right' }}>
                                            {numberToWordsTurkish(total, quoteData.currency || 'TRY')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="pro-signatures">
                                    <div className="pro-sig-box">
                                        <div className="pro-sig-area">
                                            {(signature || companyData.signature) && (
                                                <img src={(signature || companyData.signature) as string} alt={t.signature} style={{ maxHeight: '38px', maxWidth: '110px', objectFit: 'contain' }} />
                                            )}
                                            {companyData.stamp && (
                                                <img src={companyData.stamp} alt={t.companyStamp} style={{ maxHeight: '38px', maxWidth: '80px', objectFit: 'contain', opacity: 0.85 }} />
                                            )}
                                        </div>
                                        <div className="pro-sig-label">{t.seller} ({t.deliveredBy})</div>
                                    </div>
                                    <div className="pro-sig-box">
                                        <div className="pro-sig-area">
                                        </div>
                                        <div className="pro-sig-label">{t.customer} ({t.receivedBy})</div>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            {showSection('footer') && (
                                <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '7.5pt', color: '#64748b' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        <span><strong style={{ color: '#0f172a' }}>{companyData.name}</strong></span>
                                        {companyData.phone && <span>• {companyData.phone}</span>}
                                        {companyData.email && <span>• {companyData.email}</span>}
                                        {companyData.website && <span>• {companyData.website}</span>}
                                    </div>
                                    <div style={{ marginTop: '2px', fontSize: '7pt', color: '#94a3b8' }}>
                                        {t.thankYou} • {t.regards}
                                    </div>
                                </div>
                            )}
                            {config.customFooter && (
                                <div style={{ marginTop: '2px', textAlign: 'center', fontSize: '6.5pt', color: '#64748b' }}>
                                    {config.customFooter}
                                </div>
                            )}

                            {/* Page Number */}
                            {config.showPageNumbers && (
                                <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '2px' }}>
                                    <span>{quoteData.number ? `#${quoteData.number}` : ''}</span>
                                    <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ProTheme;
