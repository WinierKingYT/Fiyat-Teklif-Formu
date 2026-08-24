import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getDefaultPdfConfig } from '@/context/quote/initialState';
import Logger from '@/utils/logger';
import type { PdfConfig } from '@/context/quote/types';

export interface SavedPdfTemplate {
    id: number;
    name: string;
    config: PdfConfig;
}

export const usePdfTemplates = (
    pdfConfig: PdfConfig,
    setPdfConfig: (config: PdfConfig | ((prev: PdfConfig) => PdfConfig)) => void,
    t: (key: string) => string
) => {
    const [savedTemplates, setSavedTemplates] = useState<SavedPdfTemplate[]>([]);
    const [templateName, setTemplateName] = useState('');

    // Load templates from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('pdfTemplates');
        if (saved) {
            try {
                setSavedTemplates(JSON.parse(saved) as SavedPdfTemplate[]);
            } catch (e) {
                Logger.error('Failed to parse templates', e);
            }
        }
    }, []);

    const saveTemplate = useCallback(() => {
        const trimmed = templateName.trim();
        if (!trimmed) return;
        const existingIndex = savedTemplates.findIndex(t => t.name.toLowerCase() === trimmed.toLowerCase());
        let updatedTemplates: SavedPdfTemplate[];
        if (existingIndex >= 0) {
            updatedTemplates = [...savedTemplates];
            updatedTemplates[existingIndex] = {
                ...updatedTemplates[existingIndex],
                config: pdfConfig
            };
        } else {
            const newTemplate: SavedPdfTemplate = {
                id: Date.now(),
                name: trimmed,
                config: pdfConfig
            };
            updatedTemplates = [...savedTemplates, newTemplate];
        }
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
        setTemplateName('');
        toast.success(t('templateSaved'));
    }, [templateName, pdfConfig, savedTemplates, t]);

    const loadTemplate = useCallback((template: SavedPdfTemplate) => {
        setPdfConfig(prev => ({ ...getDefaultPdfConfig(), ...prev, ...template.config }));
        toast.success(t('templateLoaded'));
    }, [setPdfConfig, t]);

    const deleteTemplate = useCallback((id: number) => {
        const updatedTemplates = savedTemplates.filter(t => t.id !== id);
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
        toast.success(t('templateDeleted'));
    }, [savedTemplates, t]);

    return {
        savedTemplates,
        templateName,
        setTemplateName,
        saveTemplate,
        loadTemplate,
        deleteTemplate
    };
};
