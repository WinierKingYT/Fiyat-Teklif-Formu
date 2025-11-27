import React from 'react';
import { Circle, Save } from 'lucide-react';

const StatusBar = ({ lastSaved, status = 'Yeni' }) => {
    return (
        <div className="status-bar">
            <div className="status-item">
                <Circle size={12} className="text-success fill-current" />
                <span>Çevrimiçi</span>
            </div>
            <div className="status-item">
                <Save size={14} />
                <span>{lastSaved || 'Henüz kaydedilmedi'}</span>
            </div>
            <div className="status-item">
                <span>Durum: </span>
                <span className="status-badge">{status}</span>
            </div>
        </div>
    );
};

export default StatusBar;
