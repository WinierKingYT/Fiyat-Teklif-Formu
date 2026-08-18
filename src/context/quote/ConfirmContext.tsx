import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { ConfirmState } from './types';

type ConfirmVariant = 'info' | 'warning' | 'danger';

interface ConfirmActionsValue {
    showConfirm: (title: string, message: string, variant?: ConfirmVariant) => Promise<boolean>;
    handleConfirmResolve: () => void;
    handleConfirmReject: () => void;
}

const ConfirmStateContext = createContext<ConfirmState | null>(null);
const ConfirmActionsContext = createContext<ConfirmActionsValue | null>(null);

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        isOpen: false, title: '', message: '', resolve: null, variant: 'info',
    });
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const showConfirm = useCallback((title: string, message: string, variant: ConfirmVariant = 'info') => {
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
            setConfirmState({ isOpen: true, title, message, resolve, variant });
        });
    }, []);

    const handleConfirmResolve = useCallback(() => {
        resolveRef.current?.(true);
        resolveRef.current = null;
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirmReject = useCallback(() => {
        resolveRef.current?.(false);
        resolveRef.current = null;
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const actionsValue = useMemo<ConfirmActionsValue>(() => ({
        showConfirm, handleConfirmResolve, handleConfirmReject,
    }), [showConfirm, handleConfirmResolve, handleConfirmReject]);

    return (
        <ConfirmStateContext.Provider value={confirmState}>
            <ConfirmActionsContext.Provider value={actionsValue}>
                {children}
                <ConfirmDialog
                    isOpen={confirmState.isOpen}
                    title={confirmState.title}
                    message={confirmState.message}
                    variant={confirmState.variant}
                    confirmText="Evet"
                    cancelText="İptal"
                    onConfirm={handleConfirmResolve}
                    onCancel={handleConfirmReject}
                />
            </ConfirmActionsContext.Provider>
        </ConfirmStateContext.Provider>
    );
};

export const useConfirmState = () => {
    const context = useContext(ConfirmStateContext);
    if (!context) throw new Error('useConfirmState must be used within a ConfirmProvider');
    return context;
};

export const useConfirm = () => {
    const context = useContext(ConfirmActionsContext);
    if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
    return context;
};
