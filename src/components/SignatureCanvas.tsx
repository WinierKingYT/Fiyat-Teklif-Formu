import { Eraser, Upload } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import ImageOptimizer from '@/utils/imageOptimizer';

interface SignatureCanvasProps {
    onSave: (dataUrl: string) => void;
    onClear?: () => void;
    savedSignature?: string;
    language?: string;
}

const SignatureCanvas = ({ onSave, onClear, savedSignature, language = 'tr' }: SignatureCanvasProps) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastSavedUrlRef = useRef<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [lineWidth, setLineWidth] = useState(2);

    // Initialize canvas dimensions on mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth || 300;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#000000';
            }
        }
    }, []);

    // Update stroke style and line width dynamically
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = lineWidth;
            }
        }
    }, [lineWidth]);

    // Redraw external saved signature only when changed from outside
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Skip redraw if this is the signature we just generated from user drawing
        if (savedSignature && savedSignature === lastSavedUrlRef.current) {
            return;
        }

        if (savedSignature) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const scale = Math.min(
                    canvas.width / img.width,
                    canvas.height / img.height
                ) * 0.8;
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (canvas.width - w) / 2;
                const y = (canvas.height - h) / 2;
                ctx.drawImage(img, x, y, w, h);
                setHasSignature(true);
            };
            img.src = savedSignature;
        } else if (!savedSignature && lastSavedUrlRef.current) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
            lastSavedUrlRef.current = null;
        }
    }, [savedSignature]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
        const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        e.preventDefault(); // Prevent scrolling on touch

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
        const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            handleSave();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
            lastSavedUrlRef.current = null;
            onClear?.();
        }
    };

    const trimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement | null => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const l = pixels.data.length;
        const bound: { top: number | null; left: number | null; right: number | null; bottom: number | null } = {
            top: null,
            left: null,
            right: null,
            bottom: null
        };
        let x: number, y: number;

        for (let i = 0; i < l; i += 4) {
            if (pixels.data[i + 3] !== 0) {
                x = (i / 4) % canvas.width;
                y = Math.floor((i / 4) / canvas.width);

                if (bound.top === null) bound.top = y;
                if (bound.left === null) bound.left = x;
                else if (x < bound.left) bound.left = x;
                if (bound.right === null) bound.right = x;
                else if (bound.right < x) bound.right = x;
                if (bound.bottom === null) bound.bottom = y;
                else if (bound.bottom < y) bound.bottom = y;
            }
        }

        if (bound.top === null || bound.bottom === null || bound.left === null || bound.right === null) return null;

        const trimHeight = bound.bottom - bound.top + 1;
        const trimWidth = bound.right - bound.left + 1;

        // Add some padding
        const padding = 10;
        const trimmed = document.createElement('canvas');
        trimmed.width = trimWidth + padding * 2;
        trimmed.height = trimHeight + padding * 2;
        const trimmedCtx = trimmed.getContext('2d');
        if (!trimmedCtx) return null;

        trimmedCtx.drawImage(
            canvas,
            bound.left, bound.top, trimWidth, trimHeight,
            padding, padding, trimWidth, trimHeight
        );

        return trimmed;
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const trimmedCanvas = trimCanvas(canvas);
            if (trimmedCanvas) {
                const dataUrl = trimmedCanvas.toDataURL('image/png');
                lastSavedUrlRef.current = dataUrl;
                onSave(dataUrl);
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const optimizer = new ImageOptimizer();
            await optimizer.validateImage(file);
            const optimizedDataUrl = await optimizer.optimizeImage(file, true);

            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const scale = Math.min(
                    canvas.width / img.width,
                    canvas.height / img.height
                ) * 0.8;

                const w = img.width * scale;
                const h = img.height * scale;
                const x = (canvas.width - w) / 2;
                const y = (canvas.height - h) / 2;

                ctx.drawImage(img, x, y, w, h);
                setHasSignature(true);
                handleSave();
            };
            img.src = optimizedDataUrl;
        } catch {
            // fallback if optimizer fails
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const scale = Math.min(
                        canvas.width / img.width,
                        canvas.height / img.height
                    ) * 0.8;

                    const w = img.width * scale;
                    const h = img.height * scale;
                    const x = (canvas.width - w) / 2;
                    const y = (canvas.height - h) / 2;

                    ctx.drawImage(img, x, y, w, h);
                    setHasSignature(true);
                    handleSave();
                };
                img.src = (event.target as FileReader).result as string;
            };
            reader.readAsDataURL(file);
        } finally {
            e.target.value = '';
        }
    };

    return (
        <div className="signature-canvas-container">
            <div className="mb-2 flex justify-between items-center">
                <label className="text-sm font-medium text-[var(--color-text)]">
                    {t('drawOrUploadSignature')}
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={clearCanvas}
                        className="p-1 text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
                        title={t('clear')}
                        aria-label={t('clearSignature')}
                    >
                        <Eraser size={16} />
                    </button>
                    <label className="p-1 text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] rounded cursor-pointer transition-colors" title={t('uploadSignatureImage')}>
                        <Upload size={16} />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            aria-label={t('uploadSignatureImage')}
                        />
                    </label>
                </div>
            </div>

            <div className="relative border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] overflow-hidden">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ touchAction: 'none' }}
                    className="w-full h-[200px] cursor-crosshair touch-none"
                />
                {!hasSignature && !savedSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[var(--color-text-muted)] text-sm">
                        {t('signHere')}
                    </div>
                )}
            </div>

            <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)]">{t('penWidth')}:</span>
                <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-[var(--color-bg-muted)] rounded-lg appearance-none cursor-pointer"
                    aria-label={t('penWidth')}
                />
            </div>
        </div>
    );
};

export default SignatureCanvas;
