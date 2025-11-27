import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Upload, X } from 'lucide-react';

const SignatureCanvas = ({ onSave, onClear, savedSignature }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [lineWidth, setLineWidth] = useState(2);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
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
                }
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            return () => window.removeEventListener('resize', resizeCanvas);
        }
    }, [lineWidth]);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        e.preventDefault(); // Prevent scrolling on touch

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

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
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
            onClear();
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');

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
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="signature-canvas-container">
            <div className="mb-2 flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    İmza Çizin veya Yükleyin
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={clearCanvas}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Temizle"
                    >
                        <Eraser size={16} />
                    </button>
                    <label className="p-1 text-blue-500 hover:bg-blue-50 rounded cursor-pointer transition-colors" title="Resim Yükle">
                        <Upload size={16} />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </label>
                </div>
            </div>

            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 overflow-hidden touch-none">
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
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm">
                        Buraya imza atın
                    </div>
                )}
            </div>

            <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500">Kalem Kalınlığı:</span>
                <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        </div>
    );
};

export default SignatureCanvas;
