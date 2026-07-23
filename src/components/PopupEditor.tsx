import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';

const PopupEditor = ({ isOpen, onClose, onSave, initialValue, title, type = 'text', options = [] }) => {
    const [value, setValue] = useState(initialValue || '');
    const inputRef = useRef(null);

    useEffect(() => { setValue(initialValue || ''); }, [initialValue, isOpen]);
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => { inputRef.current.focus(); if (type !== 'select') inputRef.current.select(); }, 100);
        }
    }, [isOpen, type]);

    const handleSubmit = (e) => { e.preventDefault(); onSave(value); onClose(); };
    if (!isOpen) return null;

    const inputClass = "w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-card)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-muted)] transition-all";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] shadow-lg w-full max-w-md border border-[var(--color-border)] animate-scaleIn">
                <div className="flex justify-between items-center p-4 border-b border-[var(--color-border)]">
                    <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2 text-sm">
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-[var(--radius)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5">
                    <div className="mb-5">
                        {type === 'textarea' ? (
                            <textarea ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} className={inputClass + " min-h-[120px] resize-y"} placeholder="Değer giriniz..." />
                        ) : type === 'select' ? (
                            <select ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
                                {options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                        ) : (
                            <input ref={inputRef} type={type} value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} placeholder="Değer giriniz..." />
                        )}
                        <p className="text-xs text-[var(--color-text-muted)] mt-2">Düzenlemeyi bitirmek için Kaydet'e basın veya Enter tuşunu kullanın.</p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost">İptal</button>
                        <button type="submit" className="btn btn-primary flex items-center gap-2">
                            <Save size={15} /> Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PopupEditor;
