import Logger from './logger';

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 60 * 60 * 1000;

const RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/TRY';

export const getExchangeRates = async () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    const response = await fetch(RATE_API_URL);
    if (!response.ok) throw new Error('Failed to fetch rates');

    const data = await response.json();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data.rates, timestamp: Date.now() }));
    return data.rates;
  } catch (error: any) {
    Logger.error('Exchange rate fetch failed:', error);
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      return data;
    }
    return null;
  }
};

export const convertCurrency = async (amount: number, from: string, to: string) => {
  if (from === to) return amount;

  const rates = await getExchangeRates();
  if (!rates) return null;

  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate) return null;

  const amountInTRY = amount / fromRate;
  return amountInTRY * toRate;
};

export const CURRENCIES = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  { code: 'USD', name: 'ABD Doları', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£' },
  { code: 'CHF', name: 'İsviçre Frangı', symbol: 'Fr' },
  { code: 'JPY', name: 'Japon Yeni', symbol: '¥' },
  { code: 'CNY', name: 'Çin Yuanı', symbol: '¥' },
  { code: 'RUB', name: 'Rus Rublesi', symbol: '₽' },
];
