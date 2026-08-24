import React from 'react';
import type { PdfConfig } from '@/context/quote/types';

interface PdfWatermarkProps {
    config: PdfConfig;
    className?: string;
}

export const PdfWatermark: React.FC<PdfWatermarkProps> = ({ config, className }) => {
    if (!config.showWatermark) return null;
    return (
        <div className={className || ''} style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 0, transform: `rotate(${config.watermarkRotation ?? -30}deg)`,
            opacity: config.watermarkOpacity, fontSize: `${config.watermarkFontSize || 96}px`,
            fontWeight: 'bold', color: config.watermarkColor || '#000000', whiteSpace: 'nowrap'
        }}>
            {config.watermarkText}
        </div>
    );
};
