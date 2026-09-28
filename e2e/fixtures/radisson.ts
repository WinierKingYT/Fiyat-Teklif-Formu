/**
 * §7 Radisson Blu Hotel production regression fixture (text-only, 16 items).
 *
 * Mirrors the real broken PDF: long Turkish quote title, no product images,
 * realistic safety-equipment quantities and pricing.
 */
export const RADISSON_TITLE = 'KURTARMA SERVİSİ MALZEME VE TEÇHİZAT FİYAT TEKLİFİ';

export interface RadissonItem {
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    price: number;
    taxRate: number;
}

export const RADISSON_16: RadissonItem[] = [
    { name: 'Malzeme Dolabı', description: 'Galvaniz 4 raflı, kilitli', quantity: 2, unit: 'Adet', price: 4850, taxRate: 20 },
    { name: 'Yangın Köşe Seti', description: 'Hortumlu, 6 metre, CE belgeli', quantity: 4, unit: 'Adet', price: 2150, taxRate: 20 },
    { name: 'İş Elbisesi', description: 'Antistatik, pamuklu, 2 adet', quantity: 25, unit: 'Adet', price: 640, taxRate: 20 },
    { name: 'Baltalı Kazma', description: 'Fiberglas saplı, 2.5 kg', quantity: 4, unit: 'Adet', price: 1280, taxRate: 20 },
    { name: 'İzci İpi', description: '12 mm, 50 metre koh', quantity: 3, unit: 'Koh', price: 1850, taxRate: 20 },
    { name: 'İzci Çakısı', description: 'Paslanmaz, 18 cm', quantity: 6, unit: 'Adet', price: 320, taxRate: 20 },
    { name: 'Çift Kauçuk Eldiven', description: 'Bilekli, kimyasal dayanımlı', quantity: 40, unit: 'Çift', price: 245, taxRate: 20 },
    { name: 'Malzeme Torbası', description: 'Bez, 50 kg taşıma kapasiteli', quantity: 20, unit: 'Adet', price: 190, taxRate: 20 },
    { name: 'İlk Yardım Torbası', description: 'Tip 1, dolu kutu', quantity: 5, unit: 'Adet', price: 1450, taxRate: 20 },
    { name: 'Arka Çantası', description: 'Yangın söndürme tipi, 20 litre', quantity: 6, unit: 'Adet', price: 895, taxRate: 20 },
    { name: 'Geçme Merdiven', description: 'Alüminyum, katlanır, 4 metre', quantity: 2, unit: 'Adet', price: 4200, taxRate: 20 },
    { name: 'Varyoz', description: 'Çelik, 1500 mm, tokmaklı', quantity: 3, unit: 'Adet', price: 1650, taxRate: 20 },
    { name: 'Kürek', description: 'Ahşap saplı, büyük ağızlı', quantity: 6, unit: 'Adet', price: 380, taxRate: 20 },
    { name: 'Küskü', description: 'Çelik, sivri uçlu', quantity: 4, unit: 'Adet', price: 520, taxRate: 20 },
    { name: 'Küskü Demiri', description: 'Sürekli iş demiri, 1 metre', quantity: 8, unit: 'Adet', price: 265, taxRate: 20 },
    { name: 'Dozimetre', description: 'Kişisel dozimetre, 3 aylık', quantity: 10, unit: 'Adet', price: 1750, taxRate: 20 },
];
