import { describe, it, expect } from 'vitest';
import {
  getInitialQuoteData,
  getInitialCustomerData,
  getInitialCompanyData,
  getInitialBankData,
  getInitialItems,
  getInitialDiscount,
  getInitialTabData,
  getDefaultTabs,
  getDefaultPdfConfig,
  getDefaultPdfLayout,
} from '@/context/quote/initialState';

describe('getInitialQuoteData', () => {
  it('should return default quote data', () => {
    const data = getInitialQuoteData();
    expect(data.currency).toBe('TRY');
    expect(data.language).toBe('tr');
    expect(data.validUntilDays).toBe('10');
    expect(data.date).toBeTruthy();
  });
});

describe('getInitialCustomerData', () => {
  it('should return empty customer data', () => {
    const data = getInitialCustomerData();
    expect(data.name).toBe('');
    expect(data.company).toBe('');
    expect(data.email).toBe('');
  });
});

describe('getInitialCompanyData', () => {
  it('should return empty company data with null image fields', () => {
    const data = getInitialCompanyData();
    expect(data.logo).toBeNull();
    expect(data.signature).toBeNull();
    expect(data.stamp).toBeNull();
  });
});

describe('getInitialBankData', () => {
  it('should return empty bank data', () => {
    const data = getInitialBankData();
    expect(data.bankName).toBe('');
    expect(data.iban).toBe('');
  });
});

describe('getInitialItems', () => {
  it('should return empty array', () => {
    expect(getInitialItems()).toEqual([]);
  });
});

describe('getInitialDiscount', () => {
  it('should return zero percentage discount', () => {
    const discount = getInitialDiscount();
    expect(discount.type).toBe('percentage');
    expect(discount.value).toBe(0);
  });
});

describe('getInitialTabData', () => {
  it('should compose default data without company defaults', () => {
    const data = getInitialTabData();
    expect(data.quoteData).toBeTruthy();
    expect(data.customerData).toBeTruthy();
    expect(data.companyData).toBeTruthy();
    expect(data.items).toEqual([]);
    expect(data.discount.type).toBe('percentage');
  });

  it('should use provided company defaults', () => {
    const customCompany = { name: 'Test A.Ş.' };
    const data = getInitialTabData(customCompany);
    expect(data.companyData.name).toBe('Test A.Ş.');
    expect(data.companyData.phone).toBe('');
  });
});

describe('getDefaultTabs', () => {
  it('should return one tab with default id', () => {
    const tabs = getDefaultTabs();
    expect(tabs).toHaveLength(1);
    expect(tabs[0].id).toBe('default-tab');
    expect(tabs[0].title).toBe('Yeni Teklif');
    expect(tabs[0].savedQuoteId).toBeNull();
  });

  it('should pass company defaults to tab data', () => {
    const customCompany = { name: 'Custom Co.' };
    const tabs = getDefaultTabs(customCompany);
    expect(tabs[0].data.companyData.name).toBe('Custom Co.');
  });
});

describe('getDefaultPdfConfig', () => {
  it('should return complete pdf config', () => {
    const config = getDefaultPdfConfig();
    expect(config.showLogo).toBe(true);
    expect(config.pageOrientation).toBe('portrait');
    expect(config.theme).toBe('modern');
    expect(config.fontFamily).toBe('Inter');
    expect(config.itemsPerPage).toBe(20);
  });

  it('should have all font size properties', () => {
    const config = getDefaultPdfConfig();
    expect(config.headerTitleFontSize).toBeTruthy();
    expect(config.tableBodyFontSize).toBeTruthy();
    expect(config.footerFontSize).toBeTruthy();
  });
});

describe('getDefaultPdfLayout', () => {
  it('should return 6 layout items', () => {
    const layout = getDefaultPdfLayout();
    expect(layout).toHaveLength(6);
  });

  it('should have all enabled by default', () => {
    const layout = getDefaultPdfLayout();
    layout.forEach(item => {
      expect(item.enabled).toBe(true);
    });
  });

  it('should have required section ids', () => {
    const layout = getDefaultPdfLayout();
    const ids = layout.map(item => item.id);
    expect(ids).toContain('header');
    expect(ids).toContain('customer');
    expect(ids).toContain('items');
    expect(ids).toContain('notes');
    expect(ids).toContain('signatures');
    expect(ids).toContain('footer');
  });
});
