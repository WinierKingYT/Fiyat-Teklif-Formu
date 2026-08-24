import React from 'react';
import type { PdfConfig } from '@/context/quote/types';

interface PdfWatermarkProps {
    config: PdfConfig;
    className?: string;
}

export const PdfWatermark: React.FC<PdfWatermarkProps> = ({ config, className }) => {
    if (!config.showWatermark || !config.watermarkText) return null;
    return (
        <div
            className={`pdf-watermark-container ${className || ''}`}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    transform: `rotate(${config.watermarkRotation ?? -30}deg)`,
                    transformOrigin: 'center center',
                    opacity: typeof config.watermarkOpacity === 'number' ? config.watermarkOpacity : 0.1,
                    fontSize: `${config.watermarkFontSize || 96}px`,
                    fontWeight: 'bold',
                    color: config.watermarkColor || '#000000',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    letterSpacing: '0.05em'
                }}
            >
                {config.watermarkText}
            </div>
        </div>
    );
};
