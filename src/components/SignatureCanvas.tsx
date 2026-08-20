import { Eraser, Check, Upload, X } from 'lucide-react';
import React from 'react';
import { useRef, useState, useEffect } from 'react';

interface SignatureCanvasProps {
    onSave: (dataUrl: string) => void;
    onClear?: () => void;
    savedSignature?: string;
}

const SignatureCanvas = ({ onSave, onClear, savedSignature }: SignatureCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [lineWidth, setLineWidth] = useState(2);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = lineWidth;

            // Set canvas size based on parent
            const resizeCanvas = () => {
                const parent = canvas.parentElement;
                if (parent) {
                    canvas.width = parent.clientWidth;
                    canvas.height = 200; // Fixed height
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = lineWidth;

                    // Redraw saved signature if exists
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
                        };
                        img.src = savedSignature;
                    }
                }
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            return () => window.removeEventListener('resize', resizeCanvas);
        }
    }, [lineWidth, savedSignature]);

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
                onSave(trimmedCanvas.toDataURL('image/png'));
            }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    // Clear canvas first
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Calculate scaling to fit image within canvas while maintaining aspect ratio
                    const scale = Math.min(
                        canvas.width / img.width,
                        canvas.height / img.height
                    ) * 0.8; // Use 80% of space

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
        }
    };

    return (
        <div className="signature-canvas-container">
            <div className="mb-2 flex justify-between items-center">
                <label className="text-sm font-medium text-[var(--color-text)]">
                    İmza Çizin veya Yükleyin
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={clearCanvas}
                        className="p-1 text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
                        title="Temizle"
                        aria-label="Temizle"
                    >
                        <Eraser size={16} />
                    </button>
                    <label className="p-1 text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] rounded cursor-pointer transition-colors" title="Resim Yükle">
                        <Upload size={16} />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            aria-label="Resim Yükle"
                            onChange={handleImageUpload}
                        />
                    </label>
                </div>
            </div>

            <div className="relative border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-card)] overflow-hidden touch-none">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[200px] cursor-crosshair"
                />
                {!hasSignature && !savedSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[var(--color-text-muted)] text-sm">
                        Buraya imza atın
                    </div>
                )}
            </div>

            <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)]">Kalem Kalınlığı:</span>
                <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-[var(--color-bg-muted)] rounded-lg appearance-none cursor-pointer"
                    aria-label="Kalem Kalınlığı"
                />
            </div>
        </div>
    );
};

export default SignatureCanvas;
