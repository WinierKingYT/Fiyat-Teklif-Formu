import React, { createContext, useContext, useState } from 'react';
import type { SaveStatus } from '@/context/quote/types';

type SetSaveStatus = React.Dispatch<React.SetStateAction<SaveStatus>>;

const SaveStatusValueContext = createContext<SaveStatus | null>(null);
const SaveStatusSetterContext = createContext<SetSaveStatus | null>(null);

export const SaveStatusProvider = ({ children }: { children: React.ReactNode }) => {
    const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle', lastSaved: null });

    return (
        <SaveStatusValueContext.Provider value={saveStatus}>
            <SaveStatusSetterContext.Provider value={setSaveStatus}>
                {children}
            </SaveStatusSetterContext.Provider>
        </SaveStatusValueContext.Provider>
    );
};

export const useSaveStatus = () => {
    const context = useContext(SaveStatusValueContext);
    if (!context) throw new Error('useSaveStatus must be used within a SaveStatusProvider');
    return context;
};

export const useSaveStatusSetter = () => {
    const context = useContext(SaveStatusSetterContext);
    if (!context) throw new Error('useSaveStatusSetter must be used within a SaveStatusProvider');
    return context;
};
