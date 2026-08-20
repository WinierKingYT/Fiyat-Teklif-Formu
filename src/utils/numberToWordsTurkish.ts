/**
 * Converts a financial amount into Turkish words.
 * e.g., 24500.50 with TRY -> "Yalnız #Yirmi Dört Bin Beş Yüz Türk Lirası Elli Kuruştur#"
 */

const ONES = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'];
const TENS = ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'];
const SCALES = ['', 'Bin', 'Milyon', 'Milyar', 'Trilyon'];

const CURRENCY_NAMES: Record<string, { main: string; sub: string }> = {
  TRY: { main: 'Türk Lirası', sub: 'Kuruş' },
  USD: { main: 'Amerikan Doları', sub: 'Cent' },
  EUR: { main: 'Euro', sub: 'Cent' },
  GBP: { main: 'İngiliz Sterlini', sub: 'Pence' },
  CHF: { main: 'İsviçre Frangı', sub: 'Rappen' },
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
        const scale = SCALES[scaleIndex];
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

export function numberToWordsTurkish(amount: number, currency: string = 'TRY'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '';

  const rounded = Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
  const integerPart = Math.floor(rounded);
  const fractionalPart = Math.round((rounded - integerPart) * 100);

  const currInfo = CURRENCY_NAMES[currency.toUpperCase()] || { main: currency, sub: 'Kuruş' };

  const intWords = integerToWords(integerPart);
  let result = `${intWords} ${currInfo.main}`;

  if (fractionalPart > 0) {
    const fracWords = integerToWords(fractionalPart);
    result += ` ${fracWords} ${currInfo.sub}`;
  }

  const suffix = getTurkishCopulaSuffix(result);
  return `Yalnız #${result}${suffix}#`.replace(/\s+/g, ' ');
}

export default numberToWordsTurkish;
