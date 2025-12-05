import React from 'react';
import { translations } from '../utils/translations';
import { calculateQuoteTotals } from '../utils/calculations';
import ModernTheme from './pdf-themes/ModernTheme';
import ClassicTheme from './pdf-themes/ClassicTheme';
import ProTheme from './pdf-themes/ProTheme';
import MinimalTheme from './pdf-themes/MinimalTheme';
import CorporateTheme from './pdf-themes/CorporateTheme';

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
    const { subtotal, totalTax, total, discountAmount } = React.useMemo(() => {
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

    const getContainerStyles = () => {
        const baseStyles = {
            minHeight: 'auto',
            fontFamily: config.fontFamily === 'Playfair Display' ? "'Playfair Display', serif" :
                config.fontFamily === 'Roboto' ? "'Roboto', sans-serif" :
                    config.fontFamily === 'Open Sans' ? "'Open Sans', sans-serif" :
                        config.fontFamily === 'Lato' ? "'Lato', sans-serif" :
                            config.fontFamily === 'Montserrat' ? "'Montserrat', sans-serif" :
                                "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: config.fontSize === 'small' ? '12px' : config.fontSize === 'large' ? '16px' : '14px',
            padding: config.margins === 'compact' ? '20px' : config.margins === 'wide' ? '60px' : '40px',
            backgroundColor: 'white',
            color: '#000000',
            position: 'relative',
            boxSizing: 'border-box'
        };

        return baseStyles;
    };

    const containerStyles = getContainerStyles();

    // Default layout if none provided (for Modern Theme)
    const defaultLayout = [
        { id: 'header', enabled: true, order: 0 },
        { id: 'customer', enabled: true, order: 1 },
        { id: 'items', enabled: true, order: 2 },
        { id: 'summary', enabled: true, order: 3 },
        { id: 'signatures', enabled: true, order: 4 },
        { id: 'terms', enabled: true, order: 5 },
        { id: 'footer', enabled: true, order: 6 }
    ];

    const activeLayout = React.useMemo(() => {
        return (layout || defaultLayout).sort((a, b) => a.order - b.order);
    }, [layout]);



    const hasLineItemDiscounts = React.useMemo(() => {
        return items.some(item => item.discountRate > 0);
    }, [items]);

    const commonProps = {
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
    };

    if (theme === 'modern') {
        return <ModernTheme {...commonProps} activeLayout={activeLayout} />;
    }

    if (theme === 'classic') {
        return <ClassicTheme {...commonProps} />;
    }

    if (theme === 'minimal') {
        return <MinimalTheme {...commonProps} />;
    }

    if (theme === 'corporate') {
        return <CorporateTheme {...commonProps} />;
    }

    if (theme === 'pro') {
        return <ProTheme {...commonProps} discount={discount} />;
    }

    // Fallback to modern if theme not found
    return <ModernTheme {...commonProps} activeLayout={activeLayout} renderSection={renderSection} />;
};

export default PrintableQuote;
