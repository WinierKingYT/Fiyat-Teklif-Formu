// Form yönetimi modülü
class FormManager {
    constructor(app) {
        this.app = app;
    }

    collectFormData() {
        const getValue = id => {
            const element = document.getElementById(id);
            return element ? element.value : '';
        };
        
        const getImage = id => {
            const img = document.getElementById(id);
            return img && img.style.display !== 'none' ? img.src : null;
        };

        return {
            quote: {
                title: getValue('quoteTitle'),
                number: getValue('quoteNumber'),
                date: getValue('quoteDate'),
                validUntil: getValue('validUntil'),
                description: getValue('quoteDescription')
            },
            customer: {
                name: getValue('customerName'),
                company: getValue('customerCompany'),
                email: getValue('customerEmail'),
                phone: getValue('customerPhone'),
                address: getValue('customerAddress')
            },
            company: {
                name: getValue('companyName'),
                address: getValue('companyAddress'),
                phone: getValue('companyPhone'),
                email: getValue('companyEmail'),
                website: getValue('companyWebsite'),
                authorized: getValue('companyAuthorized'),
                logo: getImage('companyLogo')
            },
            bank: {
                bankName: getValue('bankName'),
                bankBranch: getValue('bankBranch'),
                accountNumber: getValue('accountNumber'),
                iban: getValue('iban'),
                accountHolder: getValue('accountHolder')
            },
            terms: {
                payment: getValue('terms'),
                delivery: getValue('deliveryTerms'),
                warranty: getValue('warrantyTerms'),
                notes: getValue('notes')
            },
            signatures: {
                seller: getImage('sellerSignature'),
                stamp: getImage('stampImage')
            }
        };
    }

    populateForm(formData) {
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        };

        if (formData.quote) {
            setValue('quoteTitle', formData.quote.title);
            setValue('quoteNumber', formData.quote.number);
            setValue('quoteDate', formData.quote.date);
            setValue('validUntil', formData.quote.validUntil);
            setValue('quoteDescription', formData.quote.description);
        }

        if (formData.customer) {
            setValue('customerName', formData.customer.name);
            setValue('customerCompany', formData.customer.company);
            setValue('customerEmail', formData.customer.email);
            setValue('customerPhone', formData.customer.phone);
            setValue('customerAddress', formData.customer.address);
        }

        if (formData.company) {
            setValue('companyName', formData.company.name);
            setValue('companyAddress', formData.company.address);
            setValue('companyPhone', formData.company.phone);
            setValue('companyEmail', formData.company.email);
            setValue('companyWebsite', formData.company.website);
            setValue('companyAuthorized', formData.company.authorized);
            
            if (formData.company.logo) {
                const logo = document.getElementById('companyLogo');
                const placeholder = document.querySelector('#logoPreview .logo-placeholder');
                if (logo && placeholder) {
                    placeholder.style.display = 'none';
                    logo.src = formData.company.logo;
                    logo.style.display = 'block';
                    logo.addEventListener('error', () => {
                        logo.style.display = 'none';
                        placeholder.style.display = 'flex';
                    });
                }
            }
        }

        if (formData.bank) {
            setValue('bankName', formData.bank.bankName);
            setValue('bankBranch', formData.bank.bankBranch);
            setValue('accountNumber', formData.bank.accountNumber);
            setValue('iban', formData.bank.iban);
            setValue('accountHolder', formData.bank.accountHolder);
        }

        if (formData.terms) {
            setValue('terms', formData.terms.payment);
            setValue('deliveryTerms', formData.terms.delivery);
            setValue('warrantyTerms', formData.terms.warranty);
            setValue('notes', formData.terms.notes);
        }

        if (formData.signatures) {
            if (formData.signatures.seller) {
                const signatureImg = document.getElementById('sellerSignature');
                const placeholder = document.querySelector('#sellerSignaturePreview .signature-placeholder');
                if (signatureImg && placeholder) {
                    placeholder.style.display = 'none';
                    signatureImg.src = formData.signatures.seller;
                    signatureImg.style.display = 'block';
                    signatureImg.addEventListener('error', () => {
                        signatureImg.style.display = 'none';
                        placeholder.style.display = 'flex';
                    });
                }
            }

            if (formData.signatures.stamp) {
                const stampImg = document.getElementById('stampImage');
                const placeholder = document.querySelector('#stampPreview .signature-placeholder');
                if (stampImg && placeholder) {
                    placeholder.style.display = 'none';
                    stampImg.src = formData.signatures.stamp;
                    stampImg.style.display = 'block';
                    stampImg.addEventListener('error', () => {
                        stampImg.style.display = 'none';
                        placeholder.style.display = 'flex';
                    });
                }
            }
        }
    }

    setupFormEventListeners() {
        const quoteForm = document.getElementById('quoteForm');
        if (quoteForm) {
            quoteForm.addEventListener('submit', (e) => this.app.handleFormSubmit(e));
        }

        document.addEventListener('input', (e) => {
            if (e.target.matches('.item-quantity, .item-price, .item-tax, .item-unit')) {
                this.app.updateItemTotal(e.target);
                this.app.updateTotals();
            }
            
            if (e.target.matches('#discountType, #discountValue')) {
                this.app.updateDiscount();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('#discountType')) {
                this.app.updateDiscountLabel();
                this.app.updateDiscount();
            }
        });
    }
}