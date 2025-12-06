import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';

const PopupEditor = ({ isOpen, onClose, onSave, initialValue, title, type = 'text', options = [] }) => {
    const [value, setValue] = useState(initialValue || '');
    const inputRef = useRef(null);

    useEffect(() => {
        setValue(initialValue || '');
    }, [initialValue, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
                if (type === 'text' || type === 'textarea') {
                    inputRef.current.select();
                }
            }, 100);
        }
    }, [isOpen, type]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(value);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 transform transition-all scale-100 animate-slide-up">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5">
                    <div className="mb-6">
                        {type === 'textarea' ? (
                            <textarea
                                ref={inputRef}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white min-h-[120px] resize-y"
                                placeholder="Değer giriniz..."
                            />
                        ) : type === 'select' ? (
                            <select
                                ref={inputRef}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            >
                                {options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                ref={inputRef}
                                type={type}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="Değer giriniz..."
                            />
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                            Düzenlemeyi bitirmek için Kaydet'e basın veya Enter tuşunu kullanın.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Save size={16} />
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PopupEditor;
