import Logger from './logger';

export const shareQuote = async (pdfBlob: any, filename: string) => {
  if (!navigator.share) {
    throw new Error('Paylaşım özelliği bu tarayıcıda desteklenmiyor. PDF\'i indirip manuel olarak gönderebilirsiniz.');
  }

  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  try {
    await navigator.share({
      title: 'Fiyat Teklifi',
      text: 'Fiyat teklifi ekte sunulmuştur.',
      files: [file],
    });
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      Logger.error('Share failed:', error);
      throw error;
    }
  }
};
