// Kalem yönetimi modülü
class ItemManager {
    constructor(app) {
        this.app = app;
    }

    generateItemRowHTML(itemId, itemData, hasImage, imageUrl) {
        const description = itemData.description || '';
        const notes = itemData.notes || '';
        const quantity = itemData.quantity || 1;
        const price = itemData.price || 0;
        const taxRate = itemData.taxRate || 20;
        const unit = itemData.unit || 'Adet';
        const total = this.app.calculateItemTotal({ quantity, price, taxRate });
        
        return `
            <td>
                <div class="item-image-container">
                    <div class="item-image-placeholder" style="${hasImage ? 'display: none;' : ''}">
                        <i class="fas fa-image"></i>
                        <div>Görsel Ekle</div>
                    </div>
                    <img class="item-image" src="${hasImage ? imageUrl : ''}" 
                         style="${hasImage ? 'display: block;' : 'display: none;'}" 
                         alt="Ürün görseli"
                         onerror="this.style.display='none'; this.parentElement.querySelector('.item-image-placeholder').style.display='flex';">
                    <div class="item-image-actions">
                        <button type="button" class="btn btn-outline btn-sm" onclick="app.triggerImageUpload(${itemId})">
                            <i class="fas fa-upload"></i> ${hasImage ? 'Değiştir' : 'Ekle'}
                        </button>
                        ${hasImage ? `
                        <button type="button" class="btn btn-danger btn-sm" onclick="app.removeItemImage(${itemId})">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                    <input type="file" id="itemImage${itemId}" class="item-image-upload" 
                           accept="image/*" style="display: none;">
                </div>
            </td>
            <td>
                <input type="text" class="item-description form-control" 
                       placeholder="Ürün/Hizmet adı" value="${description}">
                <textarea class="item-notes form-control" 
                         placeholder="Detaylı açıklama" rows="2">${notes}</textarea>
            </td>
            <td>
                <input type="number" class="item-quantity form-control" 
                       value="${quantity}" min="1" step="1">
            </td>
            <td>
                <select class="item-unit form-control">
                    <option value="Adet" ${unit === 'Adet' ? 'selected' : ''}>Adet</option>
                    <option value="Metre" ${unit === 'Metre' ? 'selected' : ''}>Metre</option>
                    <option value="Kg" ${unit === 'Kg' ? 'selected' : ''}>Kg</option>
                    <option value="Litre" ${unit === 'Litre' ? 'selected' : ''}>Litre</option>
                    <option value="Saat" ${unit === 'Saat' ? 'selected' : ''}>Saat</option>
                    <option value="Gün" ${unit === 'Gün' ? 'selected' : ''}>Gün</option>
                    <option value="Ay" ${unit === 'Ay' ? 'selected' : ''}>Ay</option>
                    <option value="Paket" ${unit === 'Paket' ? 'selected' : ''}>Paket</option>
                    <option value="Koli" ${unit === 'Koli' ? 'selected' : ''}>Koli</option>
                    <option value="Takım" ${unit === 'Takım' ? 'selected' : ''}>Takım</option>
                    <option value="Set" ${unit === 'Set' ? 'selected' : ''}>Set</option>
                </select>
            </td>
            <td>
                <input type="number" class="item-price form-control" 
                       value="${price}" min="0" step="0.01">
            </td>
            <td>
                <select class="item-tax form-control">
                    ${[20, 18, 8, 1, 0].map(rate => 
                        `<option value="${rate}" ${taxRate == rate ? 'selected' : ''}>%${rate}</option>`
                    ).join('')}
                </select>
            </td>
            <td>
                <span class="item-total">${total}</span> ₺
            </td>
            <td class="item-actions">
                <button type="button" class="btn btn-danger btn-sm" title="Sil" onclick="app.removeItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
                <button type="button" class="btn btn-outline btn-sm" title="Çoğalt" onclick="app.duplicateItem(this)">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        `;
    }

    bindRowEvents(row) {
        try {
            row.querySelectorAll('.item-quantity, .item-price, .item-tax, .item-unit').forEach(input => {
                input.addEventListener('input', () => {
                    this.app.updateItemTotal(input);
                    this.app.updateTotals();
                    if (!this.app.isRestoringState) {
                        this.app.saveDebouncer.debounce(() => this.app.optimizedSaveFormState())();
                    }
                });
            });

            const fileInput = row.querySelector('.item-image-upload');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const itemId = Array.from(row.parentNode.children).indexOf(row);
                    this.app.handleImageUpload(e.target, itemId);
                });
            }
        } catch (error) {
            Logger.error('bindRowEvents error:', error);
        }
    }

    updateItemTotal(inputElement) {
        try {
            const row = inputElement.closest('tr');
            if (!row) return;
            
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const taxRate = parseFloat(row.querySelector('.item-tax').value) || 0;
            
            const subtotal = quantity * price;
            const total = subtotal + (subtotal * (taxRate / 100));
            
            const totalElement = row.querySelector('.item-total');
            if (totalElement) totalElement.textContent = total.toFixed(2);
        } catch (error) {
            Logger.error('updateItemTotal error:', error);
        }
    }
}