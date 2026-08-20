import React, { useMemo } from 'react';
import { numberToWordsTurkish } from '@/utils/numberToWordsTurkish';
import type { PdfThemeProps, QuoteItem } from '@/context/quote/types';

export const InvoiceTheme: React.FC<PdfThemeProps> = ({
    id,
    containerStyles,
    config,
    color = '#1e293b',
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
    const showSection = (sectionId: string) => {
        if (!activeLayout) return true;
        const item = activeLayout.find(i => i.id === sectionId);
        return item ? item.enabled : true;
    };

    const renderEditable = (content: React.ReactNode, fieldKey: string, type = 'text') => {
        if (!onEdit) return content;
        return (
            <span
                onClick={() => onEdit(fieldKey, content, type)}
                className="cursor-pointer hover:bg-black/5 hover:outline-dashed hover:outline-1 hover:outline-black/30 rounded px-0.5 transition-all inline-block"
                title="Düzenlemek için tıkla"
            >
                {content}
            </span>
        );
    };

    const invoiceStyles = useMemo(() => `
        .invoice-theme-container {
            color: #0f172a;
            background: #ffffff;
            font-family: ${config.fontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            box-sizing: border-box;
        }

        .invoice-theme-container * {
            box-sizing: border-box;
        }

        .invoice-theme-container .pdf-page {
            padding: 32px 36px;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .invoice-header-bar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid ${color};
            padding-bottom: 20px;
            margin-bottom: 24px;
        }

        .invoice-title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
            color: ${color};
            margin: 0;
            text-transform: uppercase;
        }

        .invoice-meta-badge {
            text-align: right;
            font-size: 11px;
            color: #64748b;
        }

        .invoice-meta-badge strong {
            color: #0f172a;
            font-size: 13px;
        }

        .invoice-parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            margin-bottom: 24px;
        }

        .invoice-party-card {
            background: #f8fafc;
            border-left: 3px solid ${color};
            border-radius: 0 6px 6px 0;
            padding: 12px 16px;
        }

        .invoice-party-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 6px;
        }

        .invoice-party-name {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
        }

        .invoice-party-details {
            font-size: 11px;
            color: #475569;
            line-height: 1.45;
        }

        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 20px;
        }

        .invoice-table th {
            background-color: ${color};
            color: #ffffff;
            font-weight: 600;
            text-align: left;
            padding: 8px 10px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .invoice-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: top;
        }

        .invoice-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        .invoice-summary-wrap {
            margin-top: auto;
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 24px;
            padding-top: 12px;
        }

        .invoice-summary-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 16px;
            font-size: 11px;
        }

        .invoice-summary-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            color: #475569;
        }

        .invoice-summary-total {
            border-top: 2px solid ${color};
            margin-top: 6px;
            padding-top: 6px;
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
        }

        .invoice-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-top: 24px;
            padding-top: 12px;
        }

        .invoice-sig-box {
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            text-align: center;
            font-size: 10px;
            color: #64748b;
            min-height: 60px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
        }
    `, [color, config.fontFamily]);

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

    const renderTable = (chunkItems: QuoteItem[], startIndex: number) => (
        <table className="invoice-table">
            <thead>
                <tr>
                    <th style={{ width: '32px' }}>#</th>
                    <th>{config.textItem || t.item}</th>
                    {config.showTableUnit && <th style={{ width: '60px' }}>{config.textUnit || t.unit}</th>}
                    <th style={{ width: '50px', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                    {hasLineItemDiscounts && <th style={{ width: '60px', textAlign: 'center' }}>{t.discount}</th>}
                    {config.showTableTax && <th style={{ width: '60px', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                    <th style={{ width: '90px', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                </tr>
            </thead>
            <tbody>
                {chunkItems.map((item, idx) => (
                    <tr key={startIndex + idx}>
                        <td>{startIndex + idx + 1}</td>
                        <td>
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            {item.description && <div className="text-[10px] text-slate-500">{item.description}</div>}
                            {item.note && <div className="text-[9px] text-amber-700 italic mt-0.5">ℹ️ {item.note}</div>}
                        </td>
                        {config.showTableUnit && <td>{item.unit || 'Adet'}</td>}
                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(Number(item.price))}</td>
                        {hasLineItemDiscounts && (
                            <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                                {Number(item.discountRate || 0) > 0 ? `%${item.discountRate}` : '-'}
                            </td>
                        )}
                        {config.showTableTax && (
                            <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                                {Number(item.taxRate || 0) > 0 ? `%${item.taxRate}` : '-'}
                            </td>
                        )}
                        <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(Number(item.total != null ? item.total : Number(item.quantity) * Number(item.price)))}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div id={id} className="invoice-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
            <style>{invoiceStyles}</style>

            {itemChunks.map((chunk, pageIndex) => (
                <div
                    key={pageIndex}
                    className="pdf-preview pdf-page"
                    style={{
                        position: 'relative',
                        minHeight: containerStyles?.pageMinHeight || '290mm',
                        pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto'
                    }}
                >
                    {/* Header */}
                    {showSection('header') && (pageIndex === 0 ? (
                        <div className="invoice-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${color}`, paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                            <div className="flex items-center gap-3">
                                {config.showLogo && companyData.logo && (
                                    <img
                                        src={companyData.logo}
                                        alt="Logo"
                                        style={{ maxHeight: `${config.logoMaxHeight || 44}px`, objectFit: 'contain' }}
                                    />
                                )}
                                <div>
                                    <h1 className="invoice-title" style={{ fontSize: '1.25rem', fontWeight: '800', color: color, textTransform: 'uppercase' }}>{renderEditable(config.title || t.quoteTitle, 'quoteTitle')}</h1>
                                    <div className="text-xs text-slate-500 font-medium">{renderEditable(companyData.name, 'companyName')}</div>
                                    {companyData.address && <div className="text-[11px] text-slate-400">{companyData.address}</div>}
                                </div>
                            </div>
                            <div className="invoice-meta-badge" style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.5rem', fontSize: '0.75rem', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontWeight: '700', color: '#0f172a' }}>#{quoteData.number}</span>
                                    <span>•</span>
                                    <span>{t.date}: {formatDate(quoteData.date, currentLocale)}</span>
                                    <span>•</span>
                                    <span>{t.validUntil}: {formatDate(quoteData.validUntil, currentLocale)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center text-xs text-slate-500 pb-2 mb-4 border-b border-slate-200">
                            <span>#{quoteData.number} — {companyData.name}</span>
                            <span>{formatDate(quoteData.date, currentLocale)}</span>
                        </div>
                    ))}

                    {/* Customer Section - Single Card */}
                    {showSection('customer') && pageIndex === 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div className="invoice-party-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                                <div className="invoice-party-label" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem' }}>{t.customer} / {t.to}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem 1.5rem', alignItems: 'center' }}>
                                    {(customerData.company || customerData.name) && (
                                        <div style={{ gridColumn: '1 / -1', fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>
                                            {renderEditable(customerData.company || customerData.name, 'customerCompany')}
                                        </div>
                                    )}
                                    {customerData.name && customerData.company && (
                                        <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.authorized}: </span>
                                            <span>{renderEditable(customerData.name, 'customerName')}</span>
                                        </div>
                                    )}
                                    {customerData.phone && (
                                        <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.phone}: </span>
                                            <span>{renderEditable(customerData.phone, 'customerPhone')}</span>
                                        </div>
                                    )}
                                    {customerData.email && (
                                        <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>{t.email}: </span>
                                            <span>{renderEditable(customerData.email, 'customerEmail')}</span>
                                        </div>
                                    )}
                                    {customerData.address && (
                                        <div style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: '#64748b' }}>
                                            <span>{customerData.address}</span>
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

                    {/* Summary & Footer on Last Page */}
                    {pageIndex === itemChunks.length - 1 && (
                        <div style={{ marginTop: 'auto' }}>
                            <div className="invoice-summary-wrap" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                                {/* Left Side: Bank / Notes / Terms */}
                                <div>
                                    {config.showBankInfo && (bankData.bankName || bankData.iban) && (
                                        <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.6', marginBottom: '0.5rem' }}>
                                            <div style={{ fontWeight: '700', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.2rem' }}>{t.bankInfo}</div>
                                            {bankData.bankName && <div><strong>{bankData.bankName}</strong> {bankData.branch && `(${bankData.branch})`}</div>}
                                            {bankData.iban && <div>IBAN: <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>{bankData.iban}</span></div>}
                                            {bankData.accountHolder && <div>{bankData.accountHolder}</div>}
                                        </div>
                                    )}
                                    {showSection('notes') && quoteData.notes && (
                                        <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.5rem' }}>
                                            <div style={{ fontWeight: '700', color: '#64748b', fontSize: '0.75rem' }}>{t.notes}</div>
                                            <div style={{ whiteSpace: 'pre-wrap' }}>{renderEditable(quoteData.notes, 'notes', 'textarea')}</div>
                                        </div>
                                    )}
                                    {config.showTerms && (quoteData.deliveryTerms || quoteData.terms) && (
                                        <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.5' }}>
                                            {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</div>}
                                            {quoteData.terms && <div><strong>{t.payment}:</strong> {renderEditable(quoteData.terms, 'terms', 'textarea')}</div>}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Totals */}
                                {config.showSummary && (
                                    <div className="invoice-summary-box">
                                        <div className="invoice-summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                                            <span>{t.subtotal}:</span>
                                            <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="invoice-summary-row text-rose-600" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem' }}>
                                                <span>{t.discount} (%{Math.round((discountAmount / subtotal) * 100)}):</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        {config.showTableTax && (
                                            <div className="invoice-summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem', color: '#475569' }}>
                                                <span>{t.vat}:</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{formatCurrency(totalTax)}</span>
                                            </div>
                                        )}
                                        <div className="invoice-summary-row invoice-summary-total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: `2px solid ${color}`, marginTop: '0.35rem', paddingTop: '0.35rem', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                                            <span>{t.generalTotal}:</span>
                                            <span style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(total)}</span>
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '4px', textAlign: 'right' }}>
                                            {numberToWordsTurkish(total, quoteData.currency || 'TRY')}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Signatures */}
                            {showSection('signatures') && config.showSignatures && (
                                <div className="invoice-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                                    <div className="invoice-sig-box" style={{ textAlign: 'center' }}>
                                        <div style={{ minHeight: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '1rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                                            {(signature || companyData.signature) && (
                                                <img
                                                    src={(signature || companyData.signature) as string}
                                                    alt="Signature"
                                                    className="max-h-12 max-w-[120px] object-contain"
                                                />
                                            )}
                                            {companyData.stamp && (
                                                <img
                                                    src={companyData.stamp}
                                                    alt="Stamp"
                                                    className="max-h-12 max-w-[90px] object-contain opacity-85"
                                                />
                                            )}
                                        </div>
                                        <div style={{ paddingTop: '0.3rem', fontSize: '0.78rem', fontWeight: '700', color: '#0f172a' }}>{t.seller} (Kaşe & İmza)</div>
                                    </div>
                                    <div className="invoice-sig-box" style={{ textAlign: 'center' }}>
                                        <div style={{ minHeight: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                                        </div>
                                        <div style={{ paddingTop: '0.3rem', fontSize: '0.78rem', fontWeight: '700', color: '#0f172a' }}>{t.customer} (Onay / İmza)</div>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            {showSection('footer') && (
                                <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[10px] text-slate-500">
                                    {config.customFooter || (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                            <span><strong>{companyData.name}</strong></span>
                                            {companyData.phone && <span>• {companyData.phone}</span>}
                                            {companyData.email && <span>• {companyData.email}</span>}
                                            {companyData.website && <span>• {companyData.website}</span>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Page Number */}
                    {config.showPageNumbers && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                            <span>{quoteData.number ? `#${quoteData.number}` : ''}</span>
                            <span>{t.page} {pageIndex + 1} / {itemChunks.length}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default InvoiceTheme;
