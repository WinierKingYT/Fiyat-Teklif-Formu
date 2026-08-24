import Logger from '@/utils/logger';

export interface ShareQuoteOptions {
  title?: string;
  text?: string;
}

export const shareQuote = async (pdfBlob: Blob, filename: string, options?: ShareQuoteOptions) => {
  if (!navigator.share) {
    throw new Error('Paylaşım özelliği bu tarayıcıda desteklenmiyor. PDF\'i indirip manuel olarak gönderebilirsiniz.');
  }

  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  if (navigator.canShare && !navigator.canShare({ files: [file] })) {
    throw new Error('Bu tarayıcı dosya paylaşımını desteklemiyor. PDF\'i cihazınıza indirip paylaşabilirsiniz.');
  }

  try {
    await navigator.share({
      title: options?.title || 'Fiyat Teklifi',
      text: options?.text || 'Fiyat teklifi ekte sunulmuştur.',
      files: [file],
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    Logger.error('Share failed:', error);
    throw error;
  }
};
