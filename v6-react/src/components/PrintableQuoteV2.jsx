import React from 'react';
import { translations } from '../utils/translations';
import { calculateQuoteTotals } from '../utils/calculations';

// Helper functions defined outside component to avoid recreation


const formatDate = (dateString, locale = 'tr-TR') => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale);
};

const PrintableQuote = ({
    id,
    theme = 'modern',
    color = '#000000',
    quoteData: _quoteData,
    customerData: _customerData,
    companyData: _companyData,
    bankData: _bankData,
    items: _items,
    discount: _discount,
    config: _config,
    layout,
    signature
}) => {
    const quoteData = React.useMemo(() => _quoteData || {}, [_quoteData]);
    const customerData = React.useMemo(() => _customerData || {}, [_customerData]);
    const companyData = React.useMemo(() => _companyData || {}, [_companyData]);
    const bankData = React.useMemo(() => _bankData || {}, [_bankData]);
    const items = React.useMemo(() => _items || [], [_items]);
    const discount = React.useMemo(() => _discount || {}, [_discount]);
    const hasLineItemDiscounts = React.useMemo(() => items.some(item => (item.discountRate || 0) > 0), [items]);

    const language = quoteData.language || 'tr';
    const t = translations[language] || translations['tr'];

    const localeMap = {
        'tr': 'tr-TR',
        'en': 'en-US',
        'de': 'de-DE'
    };
    const currentLocale = localeMap[language] || 'tr-TR';
    const formatCurrency = React.useCallback((amount) => {
        const currency = quoteData.currency || 'TRY';
        return new Intl.NumberFormat(currentLocale, { style: 'currency', currency: currency }).format(amount);
    }, [quoteData.currency, currentLocale]);

    // Calculate totals
    const { subtotal, totalTax, total, taxBreakdown, discountAmount } = React.useMemo(() => {
        return calculateQuoteTotals(items, discount);
    }, [items, discount]);

    // Default configuration
    const config = React.useMemo(() => ({
        // Standard Options
        showLogo: true,
        showBankInfo: true,
        showSignatures: true,
        showTerms: true,
        showNotes: true,
        showSummary: true,
        title: 'FİYAT TEKLİFİ',
        fontFamily: 'Inter',
        fontSize: 'medium',
        margins: 'normal',
        showTableImages: false,
        showTableUnit: true,
        showTableTax: true,
        showQRCode: false,
        qrCodeUrl: '',
        showWatermark: false,
        watermarkText: 'TASLAK',
        watermarkOpacity: 0.1,
        watermarkColor: '#000000',
        watermarkFontSize: 120,
        watermarkRotation: -45,
        customFooter: '',
        logoPosition: 'left',

        // --- Typography (Advanced) ---
        globalFontFamily: undefined,
        globalFontColor: undefined,

        // Titles (Quote Title)
        titleFontFamily: undefined,
        titleFontSize: undefined,
        titleFontWeight: undefined,
        titleColor: undefined,
        titleLetterSpacing: undefined,
        titleTransform: undefined,

        // Section Headers (Customer, Details, etc.)
        headerFontFamily: undefined,
        headerFontSize: undefined,
        headerFontWeight: undefined,
        headerColor: undefined,
        headerTransform: undefined,

        // Body Text
        bodyFontFamily: undefined,
        bodyFontSize: undefined,
        bodyColor: undefined,
        bodyLineHeight: undefined,

        // Small Text (Labels, Meta)
        labelFontFamily: undefined,
        labelFontSize: undefined,
        labelColor: undefined,
        labelFontWeight: undefined,

        // --- Granular Section Typography ---
        // Header
        headerTitleFontSize: undefined,
        headerTitleFontWeight: undefined,
        headerInfoFontSize: undefined,

        // Customer/Seller
        customerTitleFontSize: undefined,
        customerTitleFontWeight: undefined,
        customerBodyFontSize: undefined,
        customerBodyFontWeight: undefined,
        customerLabelFontSize: undefined,
        customerLabelFontWeight: undefined,
        customerValueFontSize: undefined,
        customerValueFontWeight: undefined,

        // Quote Meta (Right Header)
        quoteMetaLabelFontSize: undefined,
        quoteMetaLabelFontWeight: undefined,
        quoteMetaValueFontSize: undefined,
        quoteMetaValueFontWeight: undefined,

        // Summary Section
        summaryLabelFontSize: undefined,
        summaryLabelFontWeight: undefined,
        summaryValueFontSize: undefined,
        summaryValueFontWeight: undefined,
        summaryTotalFontSize: undefined,
        summaryTotalFontWeight: undefined,

        // Products Table
        tableBodyFontSize: undefined,
        tableBodyFontWeight: undefined,

        // Footer
        footerFontSize: undefined,
        footerFontWeight: undefined,

        // --- Tables (Granular) ---
        // Header
        tableHeaderBg: undefined,
        tableHeaderColor: undefined,
        tableHeaderFontSize: undefined,
        tableHeaderFontWeight: undefined,
        tableHeaderPadding: undefined,
        tableHeaderBorderColor: undefined,
        tableHeaderTransform: undefined,

        // Rows
        tableRowHeight: undefined,
        tableCellPadding: undefined,
        tableBorderColor: undefined,
        tableStriped: undefined,
        tableStripedColor: undefined,

        // Grid
        tableShowVerticalLines: undefined,
        tableShowHorizontalLines: undefined,

        // --- Borders & Shapes ---
        borderRadius: undefined,
        boxBorderWidth: undefined,
        boxBorderColor: undefined,
        boxBorderStyle: undefined,

        // --- Layout & Spacing ---
        pageMargin: 'normal', // Keep this as it has logic
        sectionSpacing: undefined,
        boxPadding: undefined,

        // --- Visual Effects ---
        enableShadows: undefined,
        shadowIntensity: undefined,

        ...(_config || {})
    }), [_config]);

    const proStyles = React.useMemo(() => `
        .pro-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.4'};
            color: ${config.globalFontColor || '#1e293b'};
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
            margin-bottom: ${config.sectionSpacing || '1rem'};
            padding-bottom: 1rem;
            border-bottom: ${config.boxBorderWidth || '1px'} ${config.boxBorderStyle || 'solid'} ${config.boxBorderColor || '#e2e8f0'};
        }

        .pro-theme-container .header-left {
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
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
            font-size: 0.6rem;
            text-align: center;
            padding: 0.5rem;
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
            font-size: ${config.headerTitleFontSize || '1rem'} !important;
            font-weight: ${config.headerTitleFontWeight || '700'} !important;
            color: ${config.headerColor || '#1e293b'};
            margin-bottom: 0.25rem;
            font-family: ${config.headerFontFamily || 'inherit'};
        }

        .pro-theme-container .company-details {
            font-size: ${config.headerInfoFontSize || '0.7rem'} !important;
            color: ${config.bodyColor || '#000000'};
            line-height: 1.3;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .pro-theme-container .quote-info {
            text-align: right;
            background: #f8fafc;
            padding: 0.8rem;
            border-radius: ${config.borderRadius || 6}px;
            border-left: 3px solid ${color};
            min-width: 200px;
        }

        .pro-theme-container .quote-title {
            font-family: ${config.titleFontFamily || 'inherit'};
            font-size: ${config.titleFontSize || '0.9rem'};
            font-weight: ${config.titleFontWeight || '700'};
            color: ${config.titleColor || '#1e293b'};
            letter-spacing: ${config.titleLetterSpacing || 'normal'};
            text-transform: ${config.titleTransform || 'none'};
            margin-bottom: 0.5rem;
        }

        .pro-theme-container .quote-meta {
            font-size: ${config.labelFontSize || '0.7rem'};
            color: ${config.labelColor || '#64748b'};
            font-family: ${config.labelFontFamily || 'inherit'};
        }

        .pro-theme-container .quote-meta div {
            margin-bottom: 0.125rem;
        }

        .pro-theme-container .quote-number {
            font-weight: 600;
            color: #000000;
        }

        .pro-theme-container .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: ${config.sectionSpacing || '1rem'};
        }

        .pro-theme-container .customer-box {
            background: #f8fafc;
            border-radius: ${config.borderRadius || 6}px;
            padding: ${config.boxPadding || '0.8rem'};
            border: ${config.boxBorderWidth || '1px'} ${config.boxBorderStyle || 'solid'} ${config.boxBorderColor || '#e2e8f0'};
        }

        .pro-theme-container .section-title {
            font-family: ${config.headerFontFamily || 'inherit'};
            font-size: ${config.customerTitleFontSize || '0.8rem'} !important;
            font-weight: ${config.customerTitleFontWeight || '600'} !important;
            color: ${config.headerColor || '#1e293b'};
            text-transform: ${config.headerTransform || 'none'};
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.375rem;
        }

        .pro-theme-container .info-grid {
            display: grid;
            color: #475569;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .pro-theme-container .info-label {
            font-family: ${config.labelFontFamily || 'inherit'};
            font-size: ${config.customerLabelFontSize || 'inherit'} !important;
            font-weight: ${config.customerLabelFontWeight || 'normal'} !important;
        }

        .pro-theme-container .info-value {
            font-family: ${config.bodyFontFamily || 'inherit'};
            font-size: ${config.customerValueFontSize || 'inherit'} !important;
            font-weight: ${config.customerValueFontWeight || 'normal'} !important;
        }

        .pro-theme-container .term-content {
            font-size: 0.7rem;
            line-height: 1.3;
            color: #475569;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .pro-theme-container .pdf-items-table th {
            font-size: ${config.tableHeaderFontSize || '0.75rem'} !important;
            font-weight: ${config.tableHeaderFontWeight || '600'} !important;
            color: ${config.tableHeaderColor || '#475569'};
            background: ${config.tableHeaderBg || '#f8fafc'};
            padding: ${config.tableHeaderPadding || '0.75rem 1rem'};
            text-transform: ${config.tableHeaderTransform || 'uppercase'};
        }

        .pro-theme-container .pdf-items-table td {
            font-size: ${config.tableBodyFontSize || 'inherit'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
            padding: ${config.tableCellPadding || '1rem'};
        }

        .pro-theme-container .summary-row span:first-child {
            font-size: ${config.summaryLabelFontSize || 'inherit'} !important;
            font-weight: ${config.summaryLabelFontWeight || 'normal'} !important;
        }

        .pro-theme-container .summary-row span:last-child {
            font-size: ${config.summaryValueFontSize || 'inherit'} !important;
            font-weight: ${config.summaryValueFontWeight || '600'} !important;
        }

        .pro-theme-container .grand-total span {
            font-size: ${config.summaryTotalFontSize || '1.1rem'} !important;
            font-weight: ${config.summaryTotalFontWeight || '800'} !important;
        }

        .pro-theme-container .pdf-footer {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            font-size: ${config.footerFontSize || '0.7rem'} !important;
            font-weight: ${config.footerFontWeight || 'normal'} !important;
            color: ${config.footerColor || '#64748b'};
        }

        .pro-theme-container .footer-contact div {
            margin-bottom: 0.125rem;
        }

        .pro-theme-container .footer-thanks {
            text-align: right;
        }

        .pro-theme-container .footer-thanks .thanks-text {
            font-weight: 500;
            color: #1e293b;
            margin-bottom: 0.25rem;
        }
    `, [color, config]);

    const modernStyles = React.useMemo(() => `
        .modern-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
            line-height: ${config.bodyLineHeight || '1.4'};
            color: ${config.globalFontColor || '#1e293b'};
            background: #fff !important;
            font-size: ${config.fontSize || 12}px;
            position: relative;
            overflow: hidden;
            border-radius: ${config.borderRadius || 6}px;
            box-shadow: ${config.enableShadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};
        }

        .modern-theme-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, ${color}, #ededed);
        }

        .modern-theme-container, .modern-theme-container * {
            box-sizing: border-box;
        }
        
        .modern-theme-container .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: ${config.logoPosition === 'center' ? 'center' : 'flex-start'};
            flex-direction: ${config.logoPosition === 'center' ? 'column' : 'row'};
            margin-bottom: ${config.sectionSpacing || '1rem'};
            padding-bottom: 1rem;
            border-bottom: 1px solid #e2e8f0;
            text-align: ${config.logoPosition === 'center' ? 'center' : 'left'};
        }
        
        .modern-theme-container .header-left {
            display: flex;
            align-items: ${config.logoPosition === 'center' ? 'center' : 'flex-start'};
            flex-direction: ${config.logoPosition === 'center' ? 'column' : config.logoPosition === 'right' ? 'row-reverse' : 'row'};
            gap: 1.5rem;
            flex: 1;
            width: ${config.logoPosition === 'center' ? '100%' : 'auto'};
            text-align: ${config.logoPosition === 'right' ? 'right' : config.logoPosition === 'center' ? 'center' : 'left'};
        }
        
        .modern-theme-container .company-logo {
            width: 120px;
            height: 60px;
            border: 1px solid #e2e8f0;
            border-radius: ${config.borderRadius || 6}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: ${color};
            font-size: 0.6rem;
            text-align: center;
            padding: 0.5rem;
            overflow: hidden;
        }
        
        .modern-theme-container .company-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .modern-theme-container .company-info {
            flex: 1;
        }
        
        .modern-theme-container .company-name {
            font-size: ${config.headerTitleFontSize || '1rem'};
            font-weight: ${config.headerTitleFontWeight || '700'};
            color: ${color};
            margin-bottom: 0.25rem;
            font-family: ${config.titleFontFamily || 'inherit'};
        }
        
        .modern-theme-container .company-details {
            font-size: ${config.headerInfoFontSize || '0.7rem'};
            color: #000000;
            line-height: 1.3;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .modern-theme-container .header-info-grid {
            display: grid;
            gap: 0.125rem;
        }

        .modern-theme-container .header-info-line {
            display: flex;
        }

        .modern-theme-container .header-info-label {
            font-weight: 600;
            min-width: 60px;
            color: #475569;
            font-family: ${config.labelFontFamily || 'inherit'};
        }
        
        .modern-theme-container .quote-info {
            text-align: ${config.logoPosition === 'right' ? 'left' : config.logoPosition === 'center' ? 'center' : 'right'};
            background: #f8fafc;
            padding: 0.8rem;
            border-radius: ${config.borderRadius || 6}px;
            border-left: ${config.logoPosition === 'right' ? 'none' : `3px solid ${color}`};
            border-right: ${config.logoPosition === 'right' ? `3px solid ${color}` : 'none'};
            border-top: ${config.logoPosition === 'center' ? `3px solid ${color}` : 'none'};
            min-width: 200px;
            margin-top: ${config.logoPosition === 'center' ? '1rem' : '0'};
            width: ${config.logoPosition === 'center' ? '100%' : 'auto'};
            box-shadow: ${config.enableShadows ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'};
        }
        
        .modern-theme-container .quote-title {
            font-size: ${config.headerTitleFontSize || '0.9rem'};
            font-weight: ${config.headerTitleFontWeight || '700'};
            color: ${color};
            margin-bottom: 0.5rem;
            font-family: ${config.titleFontFamily || 'inherit'};
            text-transform: ${config.titleTransform || 'none'};
        }
        
        .modern-theme-container .quote-meta {
            font-size: ${config.quoteMetaLabelFontSize || '0.7rem'} !important;
            font-weight: ${config.quoteMetaLabelFontWeight || 'normal'} !important;
            color: #64748b;
            font-family: ${config.labelFontFamily || 'inherit'};
        }
        
        .modern-theme-container .quote-meta div {
            margin-bottom: 0.125rem;
        }

        .modern-theme-container .quote-meta strong {
            font-size: ${config.quoteMetaLabelFontSize || 'inherit'} !important;
            font-weight: ${config.quoteMetaLabelFontWeight || 'bold'} !important;
        }

        .modern-theme-container .quote-meta span {
            font-size: ${config.quoteMetaValueFontSize || 'inherit'} !important;
            font-weight: ${config.quoteMetaValueFontWeight || 'normal'} !important;
        }
        
        .modern-theme-container .quote-number {
            font-size: ${config.quoteMetaValueFontSize || 'inherit'} !important;
            font-weight: ${config.quoteMetaValueFontWeight || '600'} !important;
            color: #000000;
        }
        
        .modern-theme-container .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: ${config.sectionSpacing || '1rem'};
        }
        
        .modern-theme-container .customer-box {
            background: #f8fafc;
            border-radius: ${config.borderRadius || 6}px;
            padding: 0.8rem;
            border: 1px solid #e2e8f0;
            box-shadow: ${config.enableShadows ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'};
        }
        
        .modern-theme-container .section-title {
            font-size: ${config.customerTitleFontSize || '0.8rem'};
            font-weight: ${config.customerTitleFontWeight || config.titleFontWeight || '600'};
            color: ${color};
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-family: ${config.titleFontFamily || 'inherit'};
            text-transform: ${config.titleTransform || 'none'};
        }
        
        .modern-theme-container .section-title i {
            color: ${color};
            font-size: 0.7rem;
        }
        
        .modern-theme-container .info-grid {
            display: grid;
            gap: 0.3rem;
        }
        
        .modern-theme-container .info-line {
            display: flex;
            font-size: ${config.customerBodyFontSize || '0.7rem'};
            font-weight: ${config.customerBodyFontWeight || 'normal'};
        }
        
        .modern-theme-container .info-label {
            font-size: ${config.customerLabelFontSize || 'inherit'} !important;
            font-weight: ${config.customerLabelFontWeight || '500'} !important;
            color: #475569;
            min-width: 60px;
            font-family: ${config.labelFontFamily || 'inherit'};
        }
        
        .modern-theme-container .info-value {
            font-size: ${config.customerValueFontSize || 'inherit'} !important;
            font-weight: ${config.customerValueFontWeight || 'normal'} !important;
            color: #1e293b;
            flex: 1;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }
        
        .modern-theme-container .pdf-items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            font-size: ${config.tableBodyFontSize || '0.7rem'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
            background: white;
            border-radius: ${config.borderRadius || 6}px;
            overflow: hidden;
            box-shadow: ${config.enableShadows ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none'};
            border-bottom: 1px solid ${config.tableBorderColor || '#e2e8f0'};
        }
        
        .modern-theme-container .pdf-items-table th {
            background: ${config.tableHeaderBg || '#f1f5f9'};
            padding: 0.5rem 0.3rem;
            text-align: left;
            font-weight: ${config.tableHeaderFontWeight || '600'};
            color: ${config.tableHeaderColor || '#475569'};
            font-size: ${config.tableHeaderFontSize || '0.65rem'};
            text-transform: ${config.tableHeaderTransform || 'uppercase'};
            letter-spacing: 0.05em;
            border-bottom: 1px solid ${config.tableBorderColor || '#e2e8f0'};
        }

        .pdf-items-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }

        .pdf-items-table td img {
            max-width: 100%;
            height: auto;
            display: block;
        }
        
        .modern-theme-container .pdf-items-table td {
            padding: 0.4rem 0.3rem;
            border-bottom: 1px solid ${config.tableBorderColor || '#f1f5f9'};
            vertical-align: top;
        }
        
        .modern-theme-container .pdf-items-table tr:last-child td {
            border-bottom: none;
        }
        
        .modern-theme-container .pdf-items-table tr:hover {
            background: #f8fafc;
        }
        
        ${config.tableStriped ? `
        .modern-theme-container .pdf-items-table tr:nth-child(even) {
            background: ${config.tableStripedColor || '#f8fafc'};
        }
        ` : ''}

        .modern-theme-container .item-image {
            width: 40px;
            height: 40px;
            border-radius: 4px;
            object-fit: cover;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            font-size: 0.5rem;
            text-align: center;
            overflow: hidden;
        }

        .modern-theme-container .item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
        }
        
        .modern-theme-container .item-description {
            font-weight: ${config.tableBodyFontWeight || '500'} !important;
            font-size: ${config.tableBodyFontSize || 'inherit'} !important;
            color: #1e293b;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }
        
        .modern-theme-container .item-details {
            font-size: 0.6rem;
            color: #64748b;
            margin-top: 0.2rem;
            line-height: 1.2;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }
        
        .modern-theme-container .item-price, .modern-theme-container .item-total {
            font-weight: 500;
            color: #1e293b;
            text-align: right;
        }
        
        .modern-theme-container .item-quantity, .modern-theme-container .item-tax, .modern-theme-container .item-unit {
            color: #64748b;
            text-align: center;
        }

        .modern-theme-container .pdf-summary {
            background: #f8fafc;
            border-radius: ${config.borderRadius || 6}px;
            padding: 0.8rem;
            margin: 1rem 0;
            border: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .modern-theme-container .totals-section {
            background: white;
            border-radius: ${config.borderRadius || 6}px;
            padding: 0.8rem;
            border: 1px solid #e2e8f0;
        }

        .modern-theme-container .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 0.3rem 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: ${config.summaryLabelFontSize || '0.7rem'} !important;
        }

        .modern-theme-container .summary-row span:first-child {
            font-size: ${config.summaryLabelFontSize || 'inherit'} !important;
            font-weight: ${config.summaryLabelFontWeight || 'normal'} !important;
        }

        .modern-theme-container .summary-row span:last-child {
            font-size: ${config.summaryValueFontSize || 'inherit'} !important;
            font-weight: ${config.summaryValueFontWeight || 'medium'} !important;
        }

        .modern-theme-container .summary-row:last-child {
            border-bottom: none;
        }

        .modern-theme-container .summary-row.grand-total {
            font-weight: ${config.summaryTotalFontWeight || '700'} !important;
            font-size: ${config.summaryTotalFontSize || '0.8rem'} !important;
            color: #1e293b;
            padding-top: 0.5rem;
            margin-top: 0.25rem;
            border-top: 2px solid #e2e8f0;
        }

        .modern-theme-container .payment-info {
            font-size: 0.7rem;
        }

        .modern-theme-container .payment-info h3 {
            font-size: 0.8rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }

        .modern-theme-container .bank-info {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
        }

        .modern-theme-container .bank-info h3 {
            font-size: 0.8rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }

        .modern-theme-container .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin: 1rem 0;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
        }

        .modern-theme-container .signature-box {
            text-align: center;
            padding: 0.8rem;
        }

        .modern-theme-container .signature-area {
            height: 60px;
            border-bottom: 1px solid #cbd5e1;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            position: relative;
        }

        .modern-theme-container .stamp-area {
            height: 60px;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            font-size: 0.6rem;
            margin-bottom: 0.5rem;
            background: #f8fafc;
            overflow: hidden;
        }

        .modern-theme-container .stamp-area img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .modern-theme-container .signature-label {
            font-size: 0.7rem;
            color: #64748b;
            font-weight: 500;
        }

        .modern-theme-container .terms-section {
            margin: 1rem 0;
        }

        .modern-theme-container .terms-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.8rem;
        }

        .modern-theme-container .term-card {
            background: #f8fafc;
            border-radius: ${config.borderRadius || 6}px;
            padding: 0.8rem;
            border: 1px solid #e2e8f0;
        }

        .modern-theme-container .term-card h3 {
            font-size: 0.7rem;
            font-weight: 600;
            color: #475569;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .modern-theme-container .term-content {
            font-size: 0.7rem;
            line-height: 1.3;
            color: #475569;
            font-family: ${config.bodyFontFamily || 'inherit'};
        }

        .modern-theme-container .pdf-footer {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            font-size: ${config.footerFontSize || '0.7rem'} !important;
            font-weight: ${config.footerFontWeight || 'normal'} !important;
            color: #64748b;
        }

        .modern-theme-container .footer-contact div {
            margin-bottom: 0.125rem;
        }

        .modern-theme-container .footer-thanks {
            text-align: right;
        }

        .modern-theme-container .footer-thanks .thanks-text {
            font-weight: 500;
            color: ${color};
            margin-bottom: 0.25rem;
        }

        /* PDF Optimizasyon Stilleri */
        .pdf-compact-mode .pdf-items-table {
            font-size: 6px !important;
        }

        .pdf-compact-mode .pdf-items-table th {
            padding: 3px 2px !important;
            line-height: 1.1 !important;
            font-size: 8px !important;
            text-align: center !important;
            height: 35px !important;
            vertical-align: middle !important;
        }

        .pdf-compact-mode .pdf-items-table td {
            padding: 2px 1px !important;
            line-height: 1 !important;
            vertical-align: middle !important;
        }

        .pdf-compact-mode .item-price,
        .pdf-compact-mode .item-total,
        .pdf-compact-mode .item-quantity,
        .pdf-compact-mode .item-tax,
        .pdf-compact-mode .item-unit {
            text-align: center !important;
        }

        .pdf-compact-mode .item-image {
            width: 25px !important;
            height: 25px !important;
        }

        .pdf-compact-mode .section-title {
            font-size: 7px !important;
            margin-bottom: 3px !important;
        }

        .pdf-compact-mode body {
            font-size: 8px !important;
            line-height: 1.1 !important;
        }

        /* Ultra kompakt mod */
        .pdf-ultra-compact .pdf-items-table {
            font-size: 5px !important;
        }

        .pdf-ultra-compact .pdf-items-table td,
        .pdf-ultra-compact .pdf-items-table th {
            padding: 1px 0.5px !important;
            line-height: 0.9 !important;
        }

        .pdf-ultra-compact .item-image {
            width: 20px !important;
            height: 20px !important;
        }

        /* Sayfa sonu optimizasyonu */
        .page-break-avoid {
            page-break-inside: avoid;
        }

        .keep-together {
            page-break-inside: avoid;
        }

        /* PDF Sayfa Düzeni Optimizasyonları */
        .pdf-items-table-compact {
            font-size: 9px !important;
            line-height: 1.1 !important;
        }

        .pdf-items-table-compact th,
        .pdf-items-table-compact td {
            padding: 3px 2px !important;
            line-height: 1.1 !important;
        }

        .pdf-items-table-compact th {
            font-size: 8px !important;
            padding: 4px 2px !important;
        }

        .item-image-compact {
            width: 25px !important;
            height: 25px !important;
            min-width: 25px !important;
            min-height: 25px !important;
        }

        .item-image-compact img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
        }

        /* Tablo başlığını her sayfada tekrarla */
        .pdf-items-table thead {
            display: table-header-group;
        }
    `, [color, config]);

    const classicStyles = React.useMemo(() => `
        .classic-theme-container {
            font-family: ${config.globalFontFamily || "'Times New Roman', Times, serif"};
            line-height: ${config.bodyLineHeight || '1.2'};
            color: ${config.globalFontColor || '#000'};
            background: #fff !important;
            font-size: ${config.fontSize || 12}px;
        }
        .classic-theme-container .header-title {
            font-size: ${config.headerTitleFontSize || '24px'} !important;
            font-weight: ${config.headerTitleFontWeight || 'bold'} !important;
        }
        .classic-theme-container .company-name {
             font-size: ${config.headerTitleFontSize || '20px'} !important; /* Fallback to header size if not specific */
             font-weight: bold;
        }
        .classic-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .classic-table th, .classic-table td {
            border: 1px solid ${config.tableBorderColor || '#000'};
            padding: ${config.tableCellPadding || '4px 8px'};
            font-size: ${config.tableBodyFontSize || '10pt'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
            color: #000 !important;
        }
        .classic-table th {
            background-color: ${config.tableHeaderBg || '#e0e0e0'} !important;
            text-align: center;
            font-weight: ${config.tableHeaderFontWeight || 'bold'};
            color: ${config.tableHeaderColor || '#000'} !important;
            text-transform: ${config.tableHeaderTransform || 'none'};
            font-family: ${config.labelFontFamily || 'inherit'};
            font-size: ${config.tableHeaderFontSize || '10pt'} !important;
        }
        .classic-theme-container .customer-section h3, 
        .classic-theme-container .company-section h3 {
            font-size: ${config.customerTitleFontSize || '14px'} !important;
            font-weight: ${config.customerTitleFontWeight || 'bold'} !important;
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
        }
        .classic-theme-container .info-row {
            margin-bottom: 2px;
        }
        .classic-theme-container .info-label {
            font-weight: ${config.customerLabelFontWeight || 'bold'} !important;
            font-size: ${config.customerLabelFontSize || 'inherit'} !important;
        }
        .classic-theme-container .info-value {
            font-weight: ${config.customerValueFontWeight || 'normal'} !important;
            font-size: ${config.customerValueFontSize || 'inherit'} !important;
        }
        .classic-theme-container .summary-section {
            margin-top: 20px;
            text-align: right;
        }
        .classic-theme-container .summary-row {
            margin-bottom: 4px;
        }
        .classic-theme-container .summary-label {
            font-weight: ${config.summaryLabelFontWeight || 'bold'} !important;
            font-size: ${config.summaryLabelFontSize || 'inherit'} !important;
            margin-right: 10px;
        }
        .classic-theme-container .summary-value {
            font-weight: ${config.summaryValueFontWeight || 'normal'} !important;
            font-size: ${config.summaryValueFontSize || 'inherit'} !important;
            display: inline-block;
            min-width: 100px;
        }
        .classic-theme-container .summary-total {
            font-size: ${config.summaryTotalFontSize || '14px'} !important;
            font-weight: ${config.summaryTotalFontWeight || 'bold'} !important;
            border-top: 1px solid #000;
            padding-top: 4px;
            margin-top: 4px;
        }
        .classic-theme-container .footer {
            text-align: center;
            margin-top: 4rem;
            font-size: ${config.footerFontSize || '0.8rem'} !important;
            font-weight: ${config.footerFontWeight || 'normal'} !important;
            border-top: 1px solid #000;
            padding-top: 1rem;
            font-style: italic;
        }
    `, [config]);

    const minimalStyles = React.useMemo(() => `
        .minimal-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"};
            color: ${config.globalFontColor || '#000'} !important;
            background: #fff !important;
            line-height: ${config.bodyLineHeight || '1.4'};
            font-size: ${config.fontSize || 12}px;
        }
        .minimal-header {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
            font-weight: ${config.headerTitleFontWeight || '600'} !important;
            color: #111;
            text-transform: uppercase;
            font-size: ${config.headerTitleFontSize || '0.75rem'} !important;
            letter-spacing: 0.05em;
            font-family: ${config.labelFontFamily || 'inherit'};
        }
        .minimal-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        .minimal-table th {
            text-align: left;
            padding: ${config.tableHeaderPadding || '0.75rem 0.5rem'};
            border-bottom: 1px solid ${config.tableHeaderBorderColor || '#000'};
            font-weight: ${config.tableHeaderFontWeight || '600'};
            color: ${config.tableHeaderColor || '#000'};
            text-transform: ${config.tableHeaderTransform || 'uppercase'};
            font-size: ${config.tableHeaderFontSize || '0.7rem'};
            background: ${config.tableHeaderBg || 'transparent'};
            font-family: ${config.labelFontFamily || 'inherit'};
        }
        .minimal-table td {
            padding: ${config.tableCellPadding || '0.75rem 0.5rem'};
            border-bottom: 1px solid ${config.tableBorderColor || '#f3f4f6'};
            color: #374151;
            font-size: ${config.tableBodyFontSize || 'inherit'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
        }
        ${config.tableStriped ? `
        .minimal-table tr:nth-child(even) {
            background: ${config.tableStripedColor || '#f9fafb'};
        }
        ` : ''}
        .minimal-theme-container .customer-section h3,
        .minimal-theme-container .company-section h3 {
             font-size: ${config.customerTitleFontSize || '0.8rem'} !important;
             font-weight: ${config.customerTitleFontWeight || '600'} !important;
             text-transform: uppercase;
             letter-spacing: 0.05em;
             margin-bottom: 0.5rem;
        }
        .minimal-theme-container .info-label {
            font-size: ${config.customerLabelFontSize || '0.7rem'} !important;
            font-weight: ${config.customerLabelFontWeight || '500'} !important;
            color: #6b7280;
        }
        .minimal-theme-container .info-value {
            font-size: ${config.customerValueFontSize || 'inherit'} !important;
            font-weight: ${config.customerValueFontWeight || 'normal'} !important;
        }
        .minimal-theme-container .summary-label {
            font-size: ${config.summaryLabelFontSize || '0.75rem'} !important;
            font-weight: ${config.summaryLabelFontWeight || 'normal'} !important;
        }
        .minimal-theme-container .summary-value {
            font-size: ${config.summaryValueFontSize || 'inherit'} !important;
            font-weight: ${config.summaryValueFontWeight || '500'} !important;
        }
        .minimal-theme-container .summary-total {
             font-size: ${config.summaryTotalFontSize || '0.9rem'} !important;
             font-weight: ${config.summaryTotalFontWeight || '700'} !important;
        }
        .minimal-theme-container .footer {
            font-size: ${config.footerFontSize || '0.7rem'} !important;
            font-weight: ${config.footerFontWeight || 'normal'} !important;
            color: #9ca3af;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #f3f4f6;
        }
    `, [config]);

    const corporateStyles = React.useMemo(() => `
        .corporate-theme-container {
            font-family: ${config.globalFontFamily || "'Inter', 'Roboto', sans-serif"};
            line-height: ${config.bodyLineHeight || '1.5'};
            color: ${config.globalFontColor || '#1f2937'};
            background: white;
            font-size: ${config.fontSize || 12}px;
            position: relative;
        }
        .corporate-header {
            background: linear-gradient(135deg, ${color}, ${color}dd);
            color: white;
            padding: 3rem;
            clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
            margin-bottom: 2rem;
        }
        .corporate-header .company-name {
            font-size: ${config.headerTitleFontSize || '2rem'} !important;
            font-weight: ${config.headerTitleFontWeight || 'bold'} !important;
        }
        .corporate-header .header-info {
             font-size: ${config.headerInfoFontSize || 'inherit'} !important;
        }
        .corporate-table-container {
            padding: 0 3rem;
            margin-bottom: 2rem;
        }
        .corporate-table {
            width: 100%;
            border-collapse: collapse;
        }
        .corporate-table th {
            text-align: left;
            padding: ${config.tableHeaderPadding || '1rem'};
            font-size: ${config.tableHeaderFontSize || '0.75rem'};
            text-transform: ${config.tableHeaderTransform || 'uppercase'};
            letter-spacing: 0.05em;
            color: ${config.tableHeaderColor || '#6b7280'};
            font-weight: ${config.tableHeaderFontWeight || '700'};
            border-bottom: 2px solid ${config.tableHeaderBorderColor || '#e5e7eb'};
            background: ${config.tableHeaderBg || 'transparent'};
            font-family: ${config.labelFontFamily || 'inherit'};
        }
        .corporate-table td {
            padding: ${config.tableCellPadding || '1rem'};
            border-bottom: 1px solid ${config.tableBorderColor || '#f3f4f6'};
            color: #374151;
            font-size: ${config.tableBodyFontSize || 'inherit'} !important;
            font-weight: ${config.tableBodyFontWeight || 'normal'} !important;
        }
        ${config.tableStriped ? `
        .corporate-table tr:nth-child(even) {
            background: ${config.tableStripedColor || '#f9fafb'};
        }
        ` : ''}
        .corporate-theme-container .customer-section h3,
        .corporate-theme-container .company-section h3 {
             font-size: ${config.customerTitleFontSize || '0.9rem'} !important;
             font-weight: ${config.customerTitleFontWeight || '700'} !important;
             color: ${color};
             margin-bottom: 0.5rem;
        }
        .corporate-theme-container .info-label {
            font-size: ${config.customerLabelFontSize || '0.75rem'} !important;
            font-weight: ${config.customerLabelFontWeight || '600'} !important;
            color: #4b5563;
        }
        .corporate-theme-container .info-value {
            font-size: ${config.customerValueFontSize || 'inherit'} !important;
            font-weight: ${config.customerValueFontWeight || 'normal'} !important;
        }
        .corporate-summary {
            padding: 0 3rem;
            display: flex;
            justify-content: flex-end;
            margin-top: 2rem;
        }
        .corporate-summary-box {
            margin-top: 4rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            font-size: 0.9rem;
        }
        .corporate-theme-container .summary-label {
            font-size: ${config.summaryLabelFontSize || 'inherit'} !important;
            font-weight: ${config.summaryLabelFontWeight || '500'} !important;
            color: #6b7280;
        }
        .corporate-theme-container .summary-value {
            font-size: ${config.summaryValueFontSize || 'inherit'} !important;
            font-weight: ${config.summaryValueFontWeight || '600'} !important;
            color: #111827;
        }
        .corporate-theme-container .summary-total {
             font-size: ${config.summaryTotalFontSize || '1.2rem'} !important;
             font-weight: ${config.summaryTotalFontWeight || '800'} !important;
             color: ${color};
        }
        .corporate-footer-title {
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
            color: #9ca3af;
            font-size: 0.8rem;
        }
        .corporate-theme-container .footer {
            font-size: ${config.footerFontSize || '0.75rem'} !important;
            font-weight: ${config.footerFontWeight || 'normal'} !important;
            color: #6b7280;
        }
    `, [color, config]);

    const getContainerStyles = () => {
        const baseStyles = {
            minHeight: 'auto',
            fontFamily: config.fontFamily === 'Playfair Display' ? "'Playfair Display', serif" :
                config.fontFamily === 'Roboto' ? "'Roboto', sans-serif" :
                    "'Inter', sans-serif",
            fontSize: `${config.fontSize || 12}px`
        };

        // Margins (Padding)
        const marginMap = {
            compact: '1.5rem', // ~6mm
            normal: '1.5rem',  // ~10mm (Adjusted to match preview.html which uses 1.5rem)
            wide: '4rem'       // ~16mm
        };
        const padding = marginMap[config.margins] || '1.5rem';

        return { ...baseStyles, padding };
    };

    const containerStyles = getContainerStyles();







    const defaultLayout = [
        { id: 'header', visible: true },
        { id: 'customer', visible: true },
        { id: 'table', visible: true },
        { id: 'notes', visible: true },
        { id: 'signatures', visible: true },
        { id: 'footer', visible: true }
    ];

    const activeLayout = layout || defaultLayout;

    const renderSection = (sectionId) => {
        switch (sectionId) {
            case 'header':
                return (
                    <div className="pdf-header">
                        <div className="header-left">
                            {config.showLogo && companyData.logo && (
                                <div className="company-logo">
                                    <img src={companyData.logo} alt="Logo" />
                                </div>
                            )}
                            <div className="company-info">
                                <div className="company-name">{companyData.name}</div>
                                <div className="company-details">
                                    {companyData.address}
                                </div>
                            </div>
                        </div>
                        <div className="quote-info">
                            <div className="quote-title">{config.title}</div>
                            <div className="quote-meta">
                                <div>
                                    <span className="font-semibold">{t.date}:</span> {formatDate(quoteData.date, currentLocale)}
                                </div>
                                <div>
                                    <span className="font-semibold">{t.validUntil}:</span> {formatDate(quoteData.validUntil, currentLocale)}
                                </div>
                                <div className="quote-number">#{quoteData.number}</div>
                            </div>
                        </div>
                    </div>
                );

            case 'customer':
                return (
                    <div className="customer-section">
                        <div className="customer-box">
                            <div className="section-title">
                                <i className="fas fa-building"></i> {t.company}
                            </div>
                            <div className="info-grid">
                                <div className="info-line">
                                    <span className="info-label">{t.company}:</span>
                                    <span className="info-value">{companyData.name}</span>
                                </div>
                                <div className="info-line">
                                    <span className="info-label">{t.authorized}:</span>
                                    <span className="info-value">{companyData.authorized}</span>
                                </div>
                            </div>
                        </div>


                        <div className="customer-box">
                            <div className="section-title">
                                <i className="fas fa-user"></i> {t.customer}
                            </div>
                            <div className="info-grid">
                                <div className="info-line">
                                    <span className="info-label">{t.company}:</span>
                                    <span className="info-value">{customerData.company}</span>
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
                                {customerData.taxOffice && (
                                    <div className="info-line">
                                        <span className="info-label">{t.tax}:</span>
                                        <span className="info-value">{customerData.taxOffice} / {customerData.taxNo}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div >
                );

            case 'table':
                return (
                    <>
                        <table className="pdf-items-table">
                            <thead>
                                <tr>
                                    <th width="25" style={{ textAlign: 'center' }}>#</th>
                                    {config.showTableImages && <th width="45" style={{ textAlign: 'center' }}>{t.image}</th>}
                                    <th style={{ textAlign: 'left' }}>{config.textItem || t.item} / {config.textDescription || t.description}</th>
                                    {config.showTableUnit && <th width="60" style={{ textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                                    <th width="60" style={{ textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                                    <th width="90" style={{ textAlign: 'center' }}>{config.textUnitPrice || t.unitPrice}</th>
                                    {config.showTableTax && <th width="50" style={{ textAlign: 'center' }}>{config.textVat || t.vat}</th>}
                                    <th width="90" style={{ textAlign: 'center' }}>{config.textTotal || t.total}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                        {config.showTableImages && (
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="item-image">
                                                    {item.image ? (
                                                        <img src={item.image} alt="" />
                                                    ) : (
                                                        '-'
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td>
                                            <div className="item-description">{item.name}</div>
                                            {item.description && (
                                                <div className="item-details">
                                                    {item.description}
                                                </div>
                                            )}
                                        </td>
                                        {config.showTableUnit && <td className="item-unit">{item.unit}</td>}
                                        <td className="item-quantity">{item.quantity}</td>
                                        <td className="item-price">{formatCurrency(item.price)}</td>
                                        {config.showTableTax && <td className="item-tax">%{item.taxRate}</td>}
                                        <td className="item-total">
                                            {formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="pdf-summary">
                            {config.showSummary && (
                                <div className="summary-box">
                                    <div className="summary-title">
                                        <i className="fas fa-calculator"></i> {t.summary}
                                    </div>
                                    <div className="summary-row">
                                        <span className="text-slate-500">{t.subtotal}:</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="summary-row">
                                            <span className="text-red-500">{t.discount} {discount?.type === 'percentage' ? `(% ${discount.value})` : ''}:</span>
                                            <span className="font-medium text-red-500">-{formatCurrency(discountAmount)}</span>
                                        </div>
                                    )}
                                    {config.showTableTax && (
                                        <>
                                            {Object.entries(taxBreakdown).map(([rate, amount]) => (
                                                <div key={rate} className="summary-row">
                                                    <span className="text-slate-500">{t.vat} (%{rate}):</span>
                                                    <span className="font-medium text-slate-900">{formatCurrency(amount)}</span>
                                                </div>
                                            ))}
                                            {Object.keys(taxBreakdown).length === 0 && totalTax > 0 && (
                                                <div className="summary-row">
                                                    <span className="text-slate-500">{t.vat}:</span>
                                                    <span className="font-medium text-slate-900">{formatCurrency(totalTax)}</span>
                                                </div>
                                            )}
                                            <div className="summary-row">
                                                <span className="font-semibold text-slate-700">{t.total} {t.vat}:</span>
                                                <span className="font-semibold text-slate-900">{formatCurrency(totalTax)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="summary-row grand-total">
                                        <span>{t.generalTotal}:</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                {config.showBankInfo && (
                                    <div className="summary-box" style={{ marginBottom: config.showNotes ? '1rem' : 0 }}>
                                        <div className="summary-title">
                                            {t.bankInfo}
                                        </div>
                                        <div className="info-grid">
                                            <div className="info-line">
                                                <span className="info-label">{t.bank}:</span>
                                                <span className="info-value">{bankData.bankName || '-'}</span>
                                            </div>
                                            <div className="info-line">
                                                <span className="info-label">{t.branch}:</span>
                                                <span className="info-value">{bankData.branch || '-'}</span>
                                            </div>
                                            <div className="info-line">
                                                <span className="info-label">{t.accountNo}:</span>
                                                <span className="info-value">{bankData.accountNo || '-'}</span>
                                            </div>
                                            <div className="info-line">
                                                <span className="info-label">{t.iban}:</span>
                                                <span className="info-value" style={{ fontFamily: 'monospace' }}>{bankData.iban || '-'}</span>
                                            </div>
                                            <div className="info-line">
                                                <span className="info-label">{t.accountHolder}:</span>
                                                <span className="info-value">{bankData.accountHolder || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );

            case 'notes':
                return (
                    <>
                        {config.showNotes && quoteData.notes && (
                            <div className="summary-box" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <div className="summary-title">{t.notes}</div>
                                <div style={{ color: '#475569', lineHeight: 1.3, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>{quoteData.notes}</div>
                            </div>
                        )}
                        {config.showTerms && (
                            <div className="terms-section">
                                <div className="terms-grid">
                                    {(quoteData.validUntil || quoteData.terms) && (
                                        <div className="term-card">
                                            <h3>{t.terms}</h3>
                                            <div className="term-content">
                                                {quoteData.validUntil && (
                                                    <div className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>
                                                        <strong>{t.validUntil}:</strong> {formatDate(quoteData.validUntil, currentLocale)} {t.validUntilDate}.
                                                    </div>
                                                )}
                                                {quoteData.terms && (
                                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                                        <strong>{t.payment}:</strong> {quoteData.terms}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {(quoteData.deliveryTerms || quoteData.warrantyTerms) && (
                                        <div className="term-card">
                                            <h3>{t.deliveryWarranty}</h3>
                                            <div className="term-content">
                                                {quoteData.deliveryTerms && (
                                                    <div className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>
                                                        <strong>{t.delivery}:</strong> {quoteData.deliveryTerms}
                                                    </div>
                                                )}
                                                {quoteData.warrantyTerms && (
                                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                                        <strong>{t.warranty}:</strong> {quoteData.warrantyTerms}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                );

            case 'signatures':
                return config.showSignatures ? (
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
                            <div className="signature-label">{t.deliveredBy}</div>
                        </div>
                        <div className="signature-box">
                            <div className="stamp-area" style={companyData.stamp ? { border: 'none', background: 'transparent' } : {}}>
                                {companyData.stamp ? (
                                    <img src={companyData.stamp} alt="Kaşe" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>{t.stamp} / {t.signature}</span>
                                )}
                            </div>
                            <div className="signature-label">{t.receivedBy}</div>
                        </div>
                    </div>
                ) : null;

            case 'footer':
                return (
                    <>
                        <div className="pdf-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: 'auto' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>{companyData.address}</div>
                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                                {companyData.phone && <span><i className="fas fa-phone-alt mr-1"></i> {companyData.phone}</span>}
                                {companyData.email && <span><i className="fas fa-envelope mr-1"></i> {companyData.email}</span>}
                                {companyData.website && <span><i className="fas fa-globe mr-1"></i> {companyData.website}</span>}
                            </div>
                        </div>
                        {config.customFooter && (
                            <div style={{
                                marginTop: '1rem',
                                paddingTop: '0.5rem',
                                borderTop: '1px solid #e2e8f0',
                                textAlign: 'center',
                                fontSize: '0.65rem',
                                color: '#94a3b8'
                            }}>
                                {config.customFooter}
                            </div>
                        )}
                    </>
                );

            default:
                return null;
        }
    };

    // Modern Theme Render
    if (theme === 'modern') {
        return (
            <>
                <div id={id} className="modern-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
                    <style>{modernStyles}</style>

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

                    {activeLayout.map(section => {
                        if (!section.enabled) return null;
                        return (
                            <React.Fragment key={section.id}>
                                {renderSection(section.id)}
                            </React.Fragment>
                        );
                    })}
                </div>
            </>
        );
    }

    // Classic Theme Render (Excel-like)
    if (theme === 'classic') {


        return (
            <div id={id} className="classic-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
                <style>{classicStyles}</style>

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
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 200px', border: '1px solid #000', marginBottom: '10px' }}>
                    {/* Logo Area */}
                    <div style={{ borderRight: '1px solid #000', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {config.showLogo && companyData.logo ? (
                            <img src={companyData.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: '14pt', fontWeight: 'bold' }}>LOGO</span>
                        )}
                    </div>

                    {/* Company Info */}
                    <div style={{ borderRight: '1px solid #000', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                        <div style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase' }}>{companyData.name}</div>
                        <div style={{ fontSize: '10pt', marginTop: '5px' }}>{companyData.address}</div>
                        <div style={{ fontSize: '10pt' }}>{companyData.phone} | {companyData.email}</div>
                        <div style={{ fontSize: '10pt' }}>{companyData.website}</div>
                    </div>

                    {/* Document Info */}
                    <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#e0e0e0', borderBottom: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>
                            {t.quoteNo}
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14pt', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
                            #{quoteData.number}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
                            <div style={{ borderRight: '1px solid #000', padding: '2px', fontSize: '8pt', textAlign: 'center', background: '#f9f9f9' }}>
                                {t.date}
                            </div>
                            <div style={{ padding: '2px', fontSize: '8pt', textAlign: 'center', background: '#f9f9f9' }}>
                                {t.validUntil}
                            </div>
                            <div style={{ borderRight: '1px solid #000', borderTop: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: '9pt' }}>
                                {formatDate(quoteData.date, currentLocale)}
                            </div>
                            <div style={{ borderTop: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: '9pt' }}>
                                {formatDate(quoteData.validUntil, currentLocale)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer & Details Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    {/* Customer Box */}
                    <div style={{ border: '1px solid #000' }}>
                        <div style={{ background: '#e0e0e0', padding: '5px 10px', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
                            {t.customer} / {t.to}
                        </div>
                        <div style={{ padding: '10px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{customerData.company}</div>
                            <div>{t.authorized}: {customerData.name}</div>
                            <div>{t.phone}: {customerData.phone}</div>
                            <div>{t.email}: {customerData.email}</div>
                        </div>
                    </div>

                    {/* Quote Details Box */}
                    <div style={{ border: '1px solid #000' }}>
                        <div style={{ background: '#e0e0e0', padding: '5px 10px', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
                            {t.details}
                        </div>
                        <div style={{ padding: '10px' }}>
                            <div style={{ fontWeight: 'bold' }}>{config.title}</div>
                            {config.showNotes && quoteData.notes && (
                                <div style={{ marginTop: '5px', fontSize: '9pt', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                    {quoteData.notes}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table - Excel Style */}
                <table className="classic-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>#</th>
                            {config.showTableImages && <th style={{ width: '50px' }}>{t.image}</th>}
                            <th style={{ textAlign: 'left' }}>{config.textItem || t.item}</th>
                            {config.showTableUnit && <th style={{ width: '60px' }}>{config.textUnit || t.unit}</th>}
                            <th style={{ width: '80px' }}>{config.textQuantity || t.quantity}</th>
                            <th style={{ width: '100px', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                            {config.showTableTax && <th style={{ width: '60px' }}>{config.textVat || t.tax}</th>}
                            <th style={{ width: '120px', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                {config.showTableImages && (
                                    <td style={{ textAlign: 'center' }}>
                                        {item.image && <img src={item.image} alt="" style={{ height: '30px', objectFit: 'contain' }} />}
                                    </td>
                                )}
                                <td>
                                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                    <div style={{ fontSize: '9pt', color: '#444' }}>{item.description}</div>
                                </td>
                                {config.showTableUnit && <td style={{ textAlign: 'center' }}>{item.unit}</td>}
                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                                {config.showTableTax && <td style={{ textAlign: 'center' }}>%{item.taxRate}</td>}
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                            </tr>
                        ))}
                        {/* Empty rows to fill space if needed, or just a bottom border */}
                    </tbody>
                </table>

                {/* Totals & Notes */}
                <div style={{ display: 'flex', marginTop: '10px' }}>
                    {/* Left Side: Bank & Notes */}
                    <div style={{ flex: 1, paddingRight: '10px' }}>
                        {config.showBankInfo && (
                            <div style={{ border: '1px solid #000', marginBottom: '10px' }}>
                                <div style={{ background: '#e0e0e0', padding: '4px 8px', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '9pt' }}>
                                    {t.bankInfo}
                                </div>
                                <div style={{ padding: '8px', fontSize: '9pt' }}>
                                    <div><strong>{bankData.bankName}</strong></div>
                                    <div>TR {bankData.iban}</div>
                                    <div>{bankData.accountHolder}</div>
                                </div>
                            </div>
                        )}
                        {config.showTerms && (
                            <div style={{ border: '1px solid #000' }}>
                                <div style={{ background: '#e0e0e0', padding: '4px 8px', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '9pt' }}>
                                    {t.deliveryConditions}
                                </div>
                                <div style={{ padding: '8px', fontSize: '9pt', whiteSpace: 'pre-wrap' }}>
                                    {quoteData.deliveryTerms}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Totals */}
                    <div style={{ width: '300px' }}>
                        {config.showSummary && (
                            <table className="classic-table" style={{ marginTop: 0 }}>
                                <tbody>
                                    <tr>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#f9f9f9' }}>{t.subtotal}:</td>
                                        <td style={{ textAlign: 'right', width: '120px' }}>{formatCurrency(subtotal)}</td>
                                    </tr>
                                    {discountAmount > 0 && (
                                        <tr>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#f9f9f9' }}>{t.discount}:</td>
                                            <td style={{ textAlign: 'right', color: 'red' }}>-{formatCurrency(discountAmount)}</td>
                                        </tr>
                                    )}
                                    {config.showTableTax && (
                                        <tr>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#f9f9f9' }}>{t.tax}:</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(totalTax)}</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#e0e0e0', fontSize: '12pt' }}>{t.generalTotal}:</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#e0e0e0', fontSize: '12pt' }}>{formatCurrency(total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Signatures */}
                {config.showSignatures && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
                        <div style={{ border: '1px solid #000', height: '120px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#e0e0e0', padding: '4px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '9pt' }}>
                                {t.deliveredBy}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: '25px' }}>
                                {signature ? (
                                    <img src={signature} alt="Signature" style={{ maxHeight: '80px', maxWidth: '100%' }} />
                                ) : (
                                    <span style={{ color: '#ccc' }}>{t.signature}</span>
                                )}
                            </div>
                        </div>
                        <div style={{ border: '1px solid #000', height: '120px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#e0e0e0', padding: '4px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '9pt' }}>
                                {t.receivedBy}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: '25px' }}>
                                {companyData.stamp ? (
                                    <img src={companyData.stamp} alt="Stamp" style={{ maxHeight: '80px', maxWidth: '100%' }} />
                                ) : (
                                    <span style={{ color: '#ccc' }}>{t.stamp} / {t.signature}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Footer */}
                {config.customFooter && (
                    <div className="footer" style={{ marginTop: '2rem', borderTop: 'none', fontStyle: 'normal' }}>
                        {config.customFooter}
                    </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '8pt', borderTop: '1px solid #000', paddingTop: '5px' }}>
                    {companyData.name} - {companyData.address} - {companyData.website}
                </div>
            </div>
        );
    }

    // Minimal Theme Render (Flat Grid)
    if (theme === 'minimal') {


        return (
            <div id={id} className="minimal-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
                <style>{minimalStyles}</style>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {config.showLogo && companyData.logo ? (
                            <img src={companyData.logo} alt="Logo" style={{ height: '40px', objectFit: 'contain', marginBottom: '1rem', alignSelf: 'flex-start' }} />
                        ) : (
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{companyData.name}</div>
                        )}
                        <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>{companyData.address}</div>
                        <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>{companyData.phone} &bull; {companyData.email}</div>
                        <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>{companyData.website}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '300', lineHeight: '1', marginBottom: '0.5rem' }}>{t.quote}</div>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>#{quoteData.number}</div>
                        <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem' }}>
                                <div>
                                    <div className="minimal-label">{t.date}</div>
                                    <div className="minimal-value">{formatDate(quoteData.date, currentLocale)}</div>
                                </div>
                                <div>
                                    <div className="minimal-label">{t.validUntil}</div>
                                    <div className="minimal-value">{formatDate(quoteData.validUntil, currentLocale)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
                    <div>
                        <div className="minimal-header">{t.customer}</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{customerData.company}</div>
                        <div style={{ fontSize: '0.9rem', color: '#374151' }}>{customerData.name}</div>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            <div>{customerData.phone}</div>
                            <div>{customerData.email}</div>
                        </div>
                    </div>
                    <div>
                        <div className="minimal-header">{t.details}</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{config.title}</div>
                        {config.showNotes && quoteData.notes && (
                            <div style={{ fontSize: '0.9rem', color: '#6b7280', fontStyle: 'italic', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                {quoteData.notes}
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <table className="minimal-table" style={{ marginBottom: '2rem' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>#</th>
                            {config.showTableImages && <th style={{ width: '10%' }}>{t.image}</th>}
                            <th style={{ width: '45%' }}>{config.textItem || t.item}</th>
                            {config.showTableUnit && <th style={{ width: '10%', textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                            <th style={{ width: '10%', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                            <th style={{ width: '15%', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                            {config.showTableTax && <th style={{ width: '10%', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                            <th style={{ width: '15%', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td style={{ color: '#9ca3af' }}>{index + 1}</td>
                                {config.showTableImages && (
                                    <td>
                                        {item.image && <img src={item.image} alt="" style={{ width: '30px', height: '30px', objectFit: 'contain', borderRadius: '4px' }} />}
                                    </td>
                                )}
                                <td>
                                    <div style={{ fontWeight: '500', color: '#111' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.1rem' }}>{item.description}</div>
                                </td>
                                {config.showTableUnit && <td style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>{item.unit}</td>}
                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(item.price)}</td>
                                {config.showTableTax && <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>%{item.taxRate}</td>}
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals Section */}
                {config.showSummary && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #000', paddingTop: '1.5rem' }}>
                        <div style={{ width: '250px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span style={{ color: '#6b7280' }}>{t.subtotal}</span>
                                <span style={{ fontFamily: 'monospace' }}>{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ef4444' }}>
                                    <span>{t.discount}</span>
                                    <span style={{ fontFamily: 'monospace' }}>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {config.showTableTax && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#6b7280' }}>{t.tax}</span>
                                    <span style={{ fontFamily: 'monospace' }}>{formatCurrency(totalTax)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', color: '#000' }}>
                                <span>{t.generalTotal}</span>
                                <span style={{ fontFamily: 'monospace' }}>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer / Bank / Signatures */}
                <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                    <div>
                        {config.showBankInfo && (
                            <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                                <div className="minimal-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '0.25rem', color: '#9ca3af' }}>{t.bankInfo}</div>
                                <div style={{ fontWeight: '600', color: '#111' }}>{bankData.bankName}</div>
                                <div style={{ fontFamily: 'monospace' }}>TR {bankData.iban}</div>
                            </div>
                        )}
                    </div>

                    {config.showSignatures && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '80px' }}>
                                {signature && <img src={signature} alt="" style={{ maxHeight: '60px', objectFit: 'contain', alignSelf: 'center', marginBottom: 'auto' }} />}
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>{t.deliveredBy}</div>
                            </div>
                            <div style={{ flex: 1, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '80px' }}>
                                {companyData.stamp && <img src={companyData.stamp} alt="" style={{ maxHeight: '60px', objectFit: 'contain', alignSelf: 'center', marginBottom: 'auto' }} />}
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>{t.receivedBy}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Terms */}
                {config.showTerms && (
                    <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'pre-wrap' }}>
                        {quoteData.deliveryTerms && <div><strong>{t.delivery}:</strong> {quoteData.deliveryTerms}</div>}
                        {quoteData.terms && <div><strong>{t.payment}:</strong> {quoteData.terms}</div>}
                    </div>
                )}

                {/* Custom Footer */}
                {config.customFooter && (
                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                        {config.customFooter}
                    </div>
                )}
            </div>

        );
    }

    // Corporate Theme Render (Premium Executive)
    if (theme === 'corporate') {


        return (
            <div id={id} className="corporate-theme-container w-full max-w-[210mm] mx-auto" style={containerStyles}>
                <style>{corporateStyles}</style>

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

                <div className="corporate-header">
                    <div className="corporate-header-content">
                        <div>
                            {config.showLogo && companyData.logo && (
                                <div className="corporate-logo-box">
                                    <img src={companyData.logo} alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
                                </div>
                            )}
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{companyData.name}</div>
                            <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>{companyData.website}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h1 className="corporate-title">{config.title}</h1>
                            <div className="corporate-subtitle">#{quoteData.number}</div>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', justifyContent: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>{t.date}</div>
                                    <div style={{ fontWeight: '600' }}>{formatDate(quoteData.date, currentLocale)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase' }}>{t.validUntil}</div>
                                    <div style={{ fontWeight: '600' }}>{formatDate(quoteData.validUntil, currentLocale)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="corporate-grid">
                    <div className="corporate-card">
                        <div className="corporate-card-title">
                            <i className="fas fa-building"></i> {t.company}
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#111' }}>{companyData.name}</div>
                        <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>
                            <div>{companyData.address}</div>
                            <div style={{ marginTop: '0.5rem' }}>{companyData.phone}</div>
                            <div>{companyData.email}</div>
                        </div>
                    </div>

                    <div className="corporate-card">
                        <div className="corporate-card-title">
                            <i className="fas fa-user"></i> {t.customer}
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#111' }}>{customerData.company}</div>
                        <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>
                            <div>{customerData.name}</div>
                            <div style={{ marginTop: '0.5rem' }}>{customerData.phone}</div>
                            <div>{customerData.email}</div>
                            {customerData.taxOffice && <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>{customerData.taxOffice} / {customerData.taxNo}</div>}
                        </div>
                    </div>
                </div>

                <div className="corporate-table-container">
                    <table className="corporate-table">
                        <thead>
                            <tr>
                                <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                                {config.showTableImages && <th style={{ width: '10%' }}>{t.image}</th>}
                                <th style={{ width: '45%' }}>{config.textItem || t.item}</th>
                                {config.showTableUnit && <th style={{ width: '10%', textAlign: 'center' }}>{config.textUnit || t.unit}</th>}
                                <th style={{ width: '10%', textAlign: 'center' }}>{config.textQuantity || t.quantity}</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>{config.textUnitPrice || t.unitPrice}</th>
                                {config.showTableTax && <th style={{ width: '10%', textAlign: 'center' }}>{config.textVat || t.tax}</th>}
                                <th style={{ width: '15%', textAlign: 'right' }}>{config.textTotal || t.total}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ textAlign: 'center', color: '#9ca3af', fontWeight: '500' }}>{index + 1}</td>
                                    {config.showTableImages && (
                                        <td>
                                            {item.image && <img src={item.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />}
                                        </td>
                                    )}
                                    <td>
                                        <div style={{ fontWeight: '600', color: '#111' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.1rem' }}>{item.description}</div>
                                    </td>
                                    {config.showTableUnit && <td style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>{item.unit}</td>}
                                    <td style={{ textAlign: 'center', fontWeight: '500' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '500' }}>{formatCurrency(item.price)}</td>
                                    {config.showTableTax && <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>%{item.taxRate}</td>}
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', color: '#111' }}>{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {config.showSummary && (
                    <div className="corporate-summary">
                        <div className="corporate-summary-box">
                            <div className="corporate-summary-row">
                                <span>{t.subtotal}</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="corporate-summary-row" style={{ color: '#ef4444' }}>
                                    <span>{t.discount}</span>
                                    <span style={{ fontFamily: 'monospace' }}>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {config.showTableTax && (
                                <div className="corporate-summary-row">
                                    <span>{t.tax}</span>
                                    <span style={{ fontFamily: 'monospace' }}>{formatCurrency(totalTax)}</span>
                                </div>
                            )}
                            <div className="corporate-total">
                                <span>{t.generalTotal}</span>
                                <span style={{ color: color }}>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {config.showNotes && quoteData.notes && (
                    <div style={{ padding: '0 3rem', marginTop: '2rem' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.8rem', color: '#4b5563', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t.notes}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#374151', background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #f3f4f6', whiteSpace: 'pre-wrap' }}>
                            {quoteData.notes}
                        </div>
                    </div>
                )}

                {/* Signatures */}
                {config.showSignatures && (
                    <div style={{ padding: '0 3rem', marginTop: '4rem', display: 'flex', justifyContent: 'space-between', gap: '4rem' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ height: '80px', borderBottom: '2px solid #e5e7eb', marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '1rem' }}>
                                {signature && <img src={signature} alt="" style={{ maxHeight: '60px' }} />}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.deliveredBy}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ height: '80px', borderBottom: '2px solid #e5e7eb', marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '1rem' }}>
                                {companyData.stamp && <img src={companyData.stamp} alt="" style={{ maxHeight: '60px' }} />}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.receivedBy}</div>
                        </div>
                    </div>
                )}

                <div className="corporate-footer">
                    <div>
                        <div className="corporate-footer-title">{t.bankInfo}</div>
                        {config.showBankInfo && (
                            <div style={{ opacity: 0.8 }}>
                                <div style={{ fontWeight: '600', color: 'white' }}>{bankData.bankName}</div>
                                <div style={{ fontFamily: 'monospace', marginTop: '0.25rem' }}>TR {bankData.iban}</div>
                                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{bankData.accountHolder}</div>
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {config.showTerms && (
                            <>
                                <div className="corporate-footer-title">{t.terms}</div>
                                <div style={{ opacity: 0.8, whiteSpace: 'pre-wrap' }}>
                                    {quoteData.deliveryTerms && <div>{t.delivery}: {quoteData.deliveryTerms}</div>}
                                    {quoteData.terms && <div>{t.payment}: {quoteData.terms}</div>}
                                </div>
                            </>
                        )}
                        <div style={{ marginTop: '1rem', fontStyle: 'italic', opacity: 0.6 }}>
                            {companyData.name} &copy; {new Date().getFullYear()}
                        </div>
                        {config.customFooter && (
                            <div style={{ marginTop: '1rem', opacity: 0.8 }}>{config.customFooter}</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Pro Theme Render
    if (theme === 'pro') {
        return (
            <div id={id} className={`pro-theme-container w-full max-w-[210mm] mx-auto ${config.tableDensity === 'compact' ? 'pdf-compact-mode' :
                config.tableDensity === 'ultra-compact' ? 'pdf-ultra-compact' : ''
                } `} style={containerStyles}>
                <style>{proStyles}</style>

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

                <div className="pdf-preview">
                    {/* Header */}
                    <div className="pdf-header">
                        <div className="header-left">
                            {config.showLogo && companyData.logo && (
                                <div className="company-logo">
                                    <img src={companyData.logo} alt="Logo" />
                                </div>
                            )}
                            <div className="company-info">
                                <div className="company-name">{companyData.name}</div>
                                <div className="company-details">
                                    <div>{companyData.address}</div>
                                    <div>{companyData.phone} | {companyData.email}</div>
                                    <div>{companyData.website}</div>
                                </div>
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

                    {/* Customer Section */}
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
                                <div className="info-line">
                                    <span className="info-label">{t.email}:</span>
                                    <span className="info-value">{customerData.email}</span>
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
                                <div className="info-line">
                                    <span className="info-label">{t.phone}:</span>
                                    <span className="info-value">{companyData.phone}</span>
                                </div>
                                <div className="info-line">
                                    <span className="info-label">{t.email}:</span>
                                    <span className="info-value">{companyData.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="pdf-items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                {config.showTableImages && <th>{t.image}</th>}
                                <th>{config.textItem || t.item}</th>
                                {config.showTableUnit && <th>{config.textUnit || t.unit}</th>}
                                <th>{config.textQuantity || t.quantity}</th>
                                <th>{config.textUnitPrice || t.unitPrice}</th>
                                {config.showTableTax && <th>{config.textVat || t.tax}</th>}
                                <th>{config.textTotal || t.total}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    {config.showTableImages && (
                                        <td>
                                            <div className="item-image">
                                                {item.image ? (
                                                    <img src={item.image} alt="" />
                                                ) : (
                                                    <span style={{ fontSize: '8px' }}>No IMG</span>
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
                                    {config.showTableTax && <td className="item-tax">%{item.taxRate}</td>}
                                    <td className="item-total">{formatCurrency((item.quantity || 0) * (item.price || 0) * (1 - (item.discountRate || 0) / 100))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Summary */}
                    {config.showSummary && (
                        <div className="pdf-summary">
                            <div className="payment-info">
                                {config.showBankInfo && (
                                    <div className="bank-info" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                                        <h3>{t.bankInfo}</h3>
                                        <div><strong>{bankData.bankName}</strong></div>
                                        <div>TR {bankData.iban}</div>
                                        <div>{bankData.accountHolder}</div>
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
                                {discount > 0 && (
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
                                <div className="signature-label">{t.deliveredBy}</div>
                            </div>
                            <div className="signature-box">
                                <div className="stamp-area" style={companyData.stamp ? { border: 'none', background: 'transparent' } : {}}>
                                    {companyData.stamp ? (
                                        <img src={companyData.stamp} alt="Kaşe" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>{t.stamp} / {t.signature}</span>
                                    )}
                                </div>
                                <div className="signature-label">{t.receivedBy}</div>
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

                    <div className="pdf-footer">
                        <div className="footer-contact">
                            <div>{companyData.address}</div>
                            <div>{companyData.phone} | {companyData.email}</div>
                            <div>{companyData.website}</div>
                        </div>
                        <div className="footer-thanks">
                            <div className="thanks-text">Teşekkür Ederiz</div>
                            <div>Saygılarımızla, {companyData.name}</div>
                        </div>
                    </div>
                    {config.customFooter && (
                        <div style={{
                            marginTop: '1rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid #e2e8f0',
                            textAlign: 'center',
                            fontSize: '0.65rem',
                            color: '#94a3b8'
                        }}>
                            {config.customFooter}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default PrintableQuote;
