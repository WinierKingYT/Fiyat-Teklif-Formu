import React from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const Header = () => {
  const { t } = useTranslation();
  return (
    <header className="app-header" style={{ display: 'none' }}>
      <div className="header-content">
        <div className="flex items-center gap-2 p-2">
          <FileText size={18} />
          <span className="text-sm font-bold">{t('appName')}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
