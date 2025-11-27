// Modal yönetimi modülü
class ModalManager {
    constructor(app) {
        this.app = app;
    }

    openModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        } catch (error) {
            Logger.error('openModal error:', error);
            this.app.showNotification('Modal açılırken hata oluştu', 'error');
        }
    }

    closeModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            
            if (modalId === 'signatureModal' && this.app.signaturePad) {
                this.app.signaturePad.clear();
                window.removeEventListener('resize', this.app.resizeSignatureCanvas.bind(this.app));
            }
        } catch (error) {
            Logger.error('closeModal error:', error);
        }
    }

    setupSignaturePad() {
        try {
            const modal = document.getElementById('signatureModal');
            const canvas = document.getElementById('signatureCanvas');
            
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = 200;
            
            this.app.signaturePad = new SignaturePad(canvas, {
                backgroundColor: 'rgba(255, 255, 255, 0)',
                penColor: 'rgb(0, 0, 0)',
                minWidth: 1,
                maxWidth: 3,
                throttle: 16
            });
            
            modal.style.display = 'flex';
            
            window.addEventListener('resize', this.app.resizeSignatureCanvas.bind(this.app));
        } catch (error) {
            Logger.error('openSignatureModal error:', error);
            this.app.showNotification('İmza modalı açılırken hata oluştu', 'error');
        }
    }
}