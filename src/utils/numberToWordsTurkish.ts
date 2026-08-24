/**
 * Converts a financial amount into Turkish words.
 * e.g., 24500.50 with TRY -> "Yalnız #Yirmi Dört Bin Beş Yüz Türk Lirası Elli Kuruştur#"
 */

const ONES = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'];
const TENS = ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'];
const SCALES = ['', 'Bin', 'Milyon', 'Milyar', 'Trilyon', 'Katrilyon', 'Kentilyon'];

const CURRENCY_NAMES: Record<string, { main: string; sub: string }> = {
  TRY: { main: 'Türk Lirası', sub: 'Kuruş' },
  USD: { main: 'Amerikan Doları', sub: 'Cent' },
  EUR: { main: 'Euro', sub: 'Cent' },
  GBP: { main: 'İngiliz Sterlini', sub: 'Pence' },
  CHF: { main: 'İsviçre Frangı', sub: 'Rappen' },
  JPY: { main: 'Japon Yeni', sub: 'Sen' },
};

function convertGroupToWords(n: number): string {
  let result = '';
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const tens = Math.floor(remainder / 10);
  const ones = remainder % 10;

  if (hundreds > 0) {
    if (hundreds === 1) {
      result += 'Yüz ';
    } else {
      result += ONES[hundreds] + ' Yüz ';
    }
  }

  if (tens > 0) {
    result += TENS[tens] + ' ';
  }

  if (ones > 0) {
    result += ONES[ones] + ' ';
  }

  return result.trim();
}

function integerToWords(num: number): string {
  if (num === 0) return 'Sıfır';
  if (num < 0) return 'Eksi ' + integerToWords(Math.abs(num));

  let remaining = Math.floor(num);
  let scaleIndex = 0;
  const parts: string[] = [];

  while (remaining > 0) {
    const group = remaining % 1000;
    if (group > 0) {
      const groupWords = convertGroupToWords(group);
      if (scaleIndex === 1 && group === 1) {
        // Turkish grammar: 1000 is "Bin", not "Bir Bin"
        parts.unshift('Bin');
      } else {
        // Safety: clamp scaleIndex to SCALES length
        const safeIndex = Math.min(scaleIndex, SCALES.length - 1);
        const scale = SCALES[safeIndex];
        parts.unshift(scale ? `${groupWords} ${scale}` : groupWords);
      }
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }

  return parts.join(' ').trim();
}

function getTurkishCopulaSuffix(text: string): string {
  const clean = text.trim().toLowerCase();
  if (!clean) return 'dır';
  const lastChar = clean[clean.length - 1];
  const vowels = clean.match(/[aeıioöuü]/g);
  const lastVowel = vowels ? vowels[vowels.length - 1] : 'a';

  const isHardConsonant = ['f', 's', 't', 'k', 'ç', 'ş', 'h', 'p'].includes(lastChar);
  const dOrT = isHardConsonant ? 't' : 'd';

  let vowelSuffix = 'ır';
  if (['a', 'ı'].includes(lastVowel)) vowelSuffix = 'ır';
  else if (['e', 'i'].includes(lastVowel)) vowelSuffix = 'ir';
  else if (['o', 'u'].includes(lastVowel)) vowelSuffix = 'ur';
  else if (['ö', 'ü'].includes(lastVowel)) vowelSuffix = 'ür';

  return `${dOrT}${vowelSuffix}`;
}

// English & German word maps
const EN_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const EN_TEENS = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const EN_SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion'];

const EN_CURRENCIES: Record<string, { main: string; sub: string }> = {
  TRY: { main: 'Turkish Liras', sub: 'Kurus' },
  USD: { main: 'US Dollars', sub: 'Cents' },
  EUR: { main: 'Euros', sub: 'Cents' },
  GBP: { main: 'British Pounds', sub: 'Pence' },
  CHF: { main: 'Swiss Francs', sub: 'Rappen' },
  JPY: { main: 'Japanese Yen', sub: 'Sen' },
};

function convertGroupEn(n: number): string {
  let res = '';
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundreds > 0) res += EN_ONES[hundreds] + ' Hundred ';
  if (remainder >= 10 && remainder < 20) {
    res += EN_TEENS[remainder - 10] + ' ';
  } else {
    const tens = Math.floor(remainder / 10);
    const ones = remainder % 10;
    if (tens > 0) res += EN_TENS[tens] + ' ';
    if (ones > 0) res += EN_ONES[ones] + ' ';
  }
  return res.trim();
}

function integerToWordsEn(num: number): string {
  if (num === 0) return 'Zero';
  let remaining = Math.floor(num);
  let scaleIndex = 0;
  const parts: string[] = [];
  while (remaining > 0) {
    const group = remaining % 1000;
    if (group > 0) {
      const gWords = convertGroupEn(group);
      const scale = EN_SCALES[Math.min(scaleIndex, EN_SCALES.length - 1)];
      parts.unshift(scale ? `${gWords} ${scale}` : gWords);
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }
  return parts.join(' ').trim();
}

export function numberToWordsEnglish(amount: number, currency: string = 'USD'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '';
  const rounded = Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
  const intPart = Math.floor(rounded);
  const fracPart = Math.round((rounded - intPart) * 100);
  const curr = EN_CURRENCIES[currency.toUpperCase()] || { main: currency, sub: 'Cents' };
  let res = `${integerToWordsEn(intPart)} ${curr.main}`;
  if (fracPart > 0) {
    res += ` and ${integerToWordsEn(fracPart)} ${curr.sub}`;
  }
  return `Only #${amount < 0 ? 'Minus ' : ''}${res}#`;
}

const DE_ONES = ['', 'Eins', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun'];
const DE_TEENS = ['Zehn', 'Elf', 'Zwölf', 'Dreizehn', 'Vierzehn', 'Fünfzehn', 'Sechzehn', 'Siebzehn', 'Achtzehn', 'Neunzehn'];
const DE_TENS = ['', '', 'Zwanzig', 'Dreißig', 'Vierzig', 'Fünfzig', 'Sechzig', 'Siebzig', 'Achtzig', 'Neunzig'];

const DE_CURRENCIES: Record<string, { main: string; sub: string }> = {
  EUR: { main: 'Euro', sub: 'Cent' },
  USD: { main: 'US-Dollar', sub: 'Cent' },
  TRY: { main: 'Türkische Lira', sub: 'Kurus' },
  GBP: { main: 'Britisches Pfund', sub: 'Pence' },
  CHF: { main: 'Schweizer Franken', sub: 'Rappen' },
  JPY: { main: 'Japanische Yen', sub: 'Sen' },
};

function convertGroupDe(n: number): string {
  let res = '';
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundreds > 0) {
    res += (hundreds === 1 ? 'Ein' : DE_ONES[hundreds]) + 'hundert';
  }
  if (remainder > 0) {
    if (remainder < 10) {
      res += remainder === 1 ? 'ein' : DE_ONES[remainder];
    } else if (remainder < 20) {
      res += DE_TEENS[remainder - 10];
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      if (ones > 0) {
        res += (ones === 1 ? 'ein' : DE_ONES[ones]) + 'und' + DE_TENS[tens];
      } else {
        res += DE_TENS[tens];
      }
    }
  }
  return res;
}

function integerToWordsDe(num: number): string {
  if (num === 0) return 'Null';
  if (num === 1) return 'Ein';
  let remaining = Math.floor(num);
  const parts: string[] = [];
  const trillions = Math.floor(remaining / 1000000000000);
  remaining %= 1000000000000;
  const billions = Math.floor(remaining / 1000000000);
  remaining %= 1000000000;
  const millions = Math.floor(remaining / 1000000);
  remaining %= 1000000;
  const thousands = Math.floor(remaining / 1000);
  const hundreds = remaining % 1000;

  if (trillions > 0) parts.push(trillions === 1 ? 'Eine Billion' : `${convertGroupDe(trillions)} Billionen`);
  if (billions > 0) parts.push(billions === 1 ? 'Eine Milliarde' : `${convertGroupDe(billions)} Milliarden`);
  if (millions > 0) parts.push(millions === 1 ? 'Eine Million' : `${convertGroupDe(millions)} Millionen`);
  if (thousands > 0) parts.push(thousands === 1 ? 'Eintausend' : `${convertGroupDe(thousands)}tausend`);
  if (hundreds > 0) parts.push(convertGroupDe(hundreds));

  return parts.join(' ').trim();
}

export function numberToWordsGerman(amount: number, currency: string = 'EUR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '';
  const rounded = Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
  const intPart = Math.floor(rounded);
  const fracPart = Math.round((rounded - intPart) * 100);
  const curr = DE_CURRENCIES[currency.toUpperCase()] || { main: currency, sub: 'Cent' };
  let res = `${integerToWordsDe(intPart)} ${curr.main}`;
  if (fracPart > 0) {
    res += ` und ${integerToWordsDe(fracPart)} ${curr.sub}`;
  }
  return `Nur #${amount < 0 ? 'Minus ' : ''}${res}#`;
}

export function numberToWords(amount: number, currency: string = 'TRY', language: string = 'tr'): string {
  const lang = (language || 'tr').toLowerCase();
  if (lang.startsWith('en')) {
    return numberToWordsEnglish(amount, currency);
  }
  if (lang.startsWith('de')) {
    return numberToWordsGerman(amount, currency);
  }
  return numberToWordsTurkish(amount, currency);
}

export function numberToWordsTurkish(amount: number, currency: string = 'TRY'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '';
  // Faz5: Number.MAX_SAFE_INTEGER clamp – JS unsafe integer koruması
  const MAX_SAFE_AMOUNT = Number.MAX_SAFE_INTEGER;
  if (Math.abs(amount) >= MAX_SAFE_AMOUNT) {
    amount = Math.sign(amount) * (MAX_SAFE_AMOUNT - 1);
  }

  const rounded = Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
  const isNegative = amount < 0 && rounded > 0;
  const integerPart = Math.floor(rounded);
  const fractionalPart = Math.round((rounded - integerPart) * 100);

  const currInfo = CURRENCY_NAMES[currency.toUpperCase()] || { main: currency, sub: 'Cent' };

  const intWords = integerToWords(integerPart);
  let result = `${intWords} ${currInfo.main}`;

  if (fractionalPart > 0) {
    const fracWords = integerToWords(fractionalPart);
    result += ` ${fracWords} ${currInfo.sub}`;
  }

  const suffix = getTurkishCopulaSuffix(result);
  const prefix = isNegative ? 'Eksi ' : '';
  return `Yalnız #${prefix}${result}${suffix}#`.replace(/\s+/g, ' ');
}

export default numberToWordsTurkish;

