```javascript
import React from 'react';

const PrintableQuote = ({ 
    id, 
    theme = 'modern', 
    color = '#2563eb', 
    quoteData: _quoteData, 
    customerData: _customerData, 
    companyData: _companyData, 
    bankData: _bankData, 
    items: _items, 
    discount: _discount 
}) => {
    
    const quoteData = _quoteData || {};
    const customerData = _customerData || {};
    const companyData = _companyData || {};
    const bankData = _bankData || {};
    const items = _items || [];
    const discount = _discount || {};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;
        
        items.forEach(item => {
            const total = (item.quantity || 0) * (item.price || 0);
            subtotal += total;
            totalTax += total * ((item.taxRate || 0) / 100);
        });

        let discountAmount = 0;
        if (discount?.type === 'percentage') {
            discountAmount = subtotal * ((discount.value || 0) / 100);
        } else if (discount?.type === 'fixed') {
            discountAmount = Number(discount.value) || 0;
        }

        const total = subtotal - discountAmount + totalTax;

        return { subtotal, discountAmount, totalTax, total };
    };

    const { subtotal, discountAmount, totalTax, total } = calculateTotals();

    return (
        <div id={id} className="w-full max-w-[210mm] mx-auto bg-white p-8 text-slate-800 font-sans text-xs leading-relaxed" style={{ minHeight: '297mm' }}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-200">
                <div className="flex gap-6 items-start flex-1">
                    {/* Logo Box */}
                    <div className="w-[120px] h-[60px] border border-slate-200 rounded-md flex items-center justify-center bg-slate-50 overflow-hidden">
                        {companyData.logo ? (
                            <img src={companyData.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <span className="text-xs text-slate-400">LOGO</span>
                        )}
                    </div>
                    
                    {/* Company Info */}
                    <div className="flex-1">
                        <h1 className="text-base font-bold text-slate-800 mb-1">{companyData.name}</h1>
                        <div className="text-[10px] text-slate-600 space-y-0.5">
                            <div><strong>Tel:</strong> {companyData.phone}</div>
                            <div>{companyData.address}</div>
                            <div><strong>E-posta:</strong> {companyData.email}</div>
                            <div><strong>Web:</strong> {companyData.website || '-'}</div>
                            <div><strong>Yetkili:</strong> {companyData.authorizedPerson}</div>
                        </div>
                    </div>
                </div>

                {/* Quote Info Box */}
                <div className="text-right bg-slate-50 p-3 rounded-md border-l-4 min-w-[200px]" style={{ borderColor: color }}>
                    <div className="text-sm font-bold text-slate-800 mb-2">FİYAT TEKLİFİ</div>
                    <div className="text-[10px] text-slate-600 space-y-1">
                        <div><strong>Teklif No:</strong> <span className="font-semibold text-black">{quoteData.number}</span></div>
                        <div><strong>Tarih:</strong> {formatDate(quoteData.date)}</div>
                        <div><strong>Geçerlilik:</strong> {formatDate(quoteData.validUntil)}</div>
                    </div>
                </div>
            </div>

            {/* Customer & Seller Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Seller Box */}
                <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> SATICI
                    </div>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex"><span className="font-medium text-slate-600 w-16">Firma:</span> <span className="flex-1 text-slate-800">{companyData.name}</span></div>
                        <div className="flex"><span className="font-medium text-slate-600 w-16">Yetkili:</span> <span className="flex-1 text-slate-800">{companyData.authorizedPerson}</span></div>
                        <div className="flex"><span className="font-medium text-slate-600 w-16">Telefon:</span> <span className="flex-1 text-slate-800">{companyData.phone}</span></div>
                        <div className="flex"><span className="font-medium text-slate-600 w-16">E-posta:</span> <span className="flex-1 text-slate-800">{companyData.email}</span></div>
                    </div>
                </div>

                {/* Customer Box */}
                <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> SAYIN (MÜŞTERİ)
                    </div>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex"><span className="font-medium text-slate-600 w-16">Firma:</span> <span className="flex-1 text-slate-800">{customerData.company}</span></div>
                        <div className="flex"><span className="font-medium text-slate-600 w-16">Yetkili:</span> <span className="flex-1 text-slate-800">{customerData.name}</span></div>
                        <div className="flex"><span className="font-medium text-slate-600 w-16">Telefon:</span> <span className="flex-1 text-slate-800">{customerData.phone}</span></div>
                        <div className="flex"><span className="font-medium text-slate-600 w-16">E-posta:</span> <span className="flex-1 text-slate-800">{customerData.email}</span></div>
                        {customerData.taxOffice && (
                            <div className="flex"><span className="font-medium text-slate-600 w-16">Vergi:</span> <span className="flex-1 text-slate-800">{customerData.taxOffice} / {customerData.taxNo}</span></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6 border-collapse text-[10px] bg-white rounded-md overflow-hidden shadow-sm border border-slate-200">
                <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="py-2 px-3 text-left font-semibold text-slate-600 uppercase tracking-wider w-12">No</th>
                        <th className="py-2 px-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Ürün / Hizmet</th>
                        <th className="py-2 px-3 text-center font-semibold text-slate-600 uppercase tracking-wider w-20">Miktar</th>
                        <th className="py-2 px-3 text-right font-semibold text-slate-600 uppercase tracking-wider w-24">Birim Fiyat</th>
                        <th className="py-2 px-3 text-center font-semibold text-slate-600 uppercase tracking-wider w-16">KDV</th>
                        <th className="py-2 px-3 text-right font-semibold text-slate-600 uppercase tracking-wider w-24">Toplam</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 text-slate-500 text-center">{index + 1}</td>
                            <td className="py-2 px-3">
                                <div className="font-medium text-slate-800">{item.name}</div>
                                {item.description && <div className="text-slate-500 text-[9px] mt-0.5">{item.description}</div>}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-600">{item.quantity} {item.unit}</td>
                            <td className="py-2 px-3 text-right text-slate-800 font-medium">{formatCurrency(item.price)}</td>
                            <td className="py-2 px-3 text-center text-slate-500">%{item.taxRate}</td>
                            <td className="py-2 px-3 text-right text-slate-800 font-medium">
                                {formatCurrency((item.quantity || 0) * (item.price || 0))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Summary & Notes Section */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Left: Notes */}
                <div className="space-y-4">
                    {quoteData.description && (
                        <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                            <h3 className="text-[10px] font-semibold text-slate-700 mb-1 uppercase">Açıklama</h3>
                            <p className="text-[10px] text-slate-600">{quoteData.description}</p>
                        </div>
                    )}
                    {quoteData.notes && (
                        <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                            <h3 className="text-[10px] font-semibold text-slate-700 mb-1 uppercase">Notlar</h3>
                            <p className="text-[10px] text-slate-600 whitespace-pre-line">{quoteData.notes}</p>
                        </div>
                    )}
                </div>

                {/* Right: Totals */}
                <div className="bg-white p-4 rounded-md border border-slate-200 h-fit">
                    <div className="space-y-2 text-[10px]">
                        <div className="flex justify-between text-slate-600 border-b border-slate-50 pb-1">
                            <span>Ara Toplam</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600 border-b border-slate-50 pb-1">
                                <span>İndirim</span>
                                <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-600 border-b border-slate-50 pb-1">
                            <span>KDV Toplam</span>
                            <span>{formatCurrency(totalTax)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200 mt-1">
                            <span>GENEL TOPLAM</span>
                            <span style={{ color: color }}>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terms Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {quoteData.terms && (
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                        <h3 className="text-[10px] font-semibold text-slate-700 mb-1 uppercase border-b border-slate-200 pb-1">Ödeme Koşulları</h3>
                        <p className="text-[10px] text-slate-600 whitespace-pre-line mt-1">{quoteData.terms}</p>
                    </div>
                )}
                {quoteData.deliveryTerms && (
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                        <h3 className="text-[10px] font-semibold text-slate-700 mb-1 uppercase border-b border-slate-200 pb-1">Teslimat Koşulları</h3>
                        <p className="text-[10px] text-slate-600 whitespace-pre-line mt-1">{quoteData.deliveryTerms}</p>
                    </div>
                )}
                {quoteData.warrantyTerms && (
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                        <h3 className="text-[10px] font-semibold text-slate-700 mb-1 uppercase border-b border-slate-200 pb-1">Garanti Koşulları</h3>
                        <p className="text-[10px] text-slate-600 whitespace-pre-line mt-1">{quoteData.warrantyTerms}</p>
                    </div>
                )}
            </div>

            {/* Footer: Bank & Signature */}
            <div className="border-t border-slate-200 pt-6 mt-auto">
                <div className="grid grid-cols-2 gap-8">
                    {/* Bank Info */}
                    <div className="text-[10px]">
                        {bankData && bankData.iban && (
                            <>
                                <h3 className="font-bold text-slate-800 mb-2 uppercase">Banka Bilgileri</h3>
                                <div className="space-y-0.5 text-slate-600">
                                    <div className="font-medium text-slate-800">{bankData.bankName}</div>
                                    <div>{bankData.branch}</div>
                                    <div className="font-mono bg-slate-50 inline-block px-1 rounded border border-slate-100 mt-0.5">TR{bankData.iban}</div>
                                    <div>{bankData.accountHolder}</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Signature */}
                    <div className="text-center">
                        <div className="h-16 border-b border-slate-300 mb-2 flex items-end justify-center relative">
                            {companyData.signature && (
                                <img src={companyData.signature} alt="İmza" className="h-14 object-contain mb-1" />
                            )}
                            {companyData.stamp && (
                                <img src={companyData.stamp} alt="Kaşe" className="h-14 object-contain absolute bottom-1 opacity-80 mix-blend-multiply" />
                            )}
                        </div>
                        <div className="font-bold text-slate-800 text-xs">{companyData.authorizedPerson}</div>
                        <div className="text-[9px] text-slate-500">İmza / Kaşe</div>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-[9px] text-slate-400">
                    <div>Bu belge {new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</div>
                    <div>TeklifMaster Pro ile oluşturuldu</div>
                </div>
            </div>
        </div>
    );
};

export default PrintableQuote;
```
