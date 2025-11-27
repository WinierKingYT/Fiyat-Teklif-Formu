import { useState, useEffect } from 'react';
import indexedDBManager from '../utils/indexedDBManager';
import Logger from '../utils/logger';

export function useIndexedDB() {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initDB = async () => {
            try {
                await indexedDBManager.initialize();
                setIsReady(true);
            } catch (err) {
                Logger.error('Failed to initialize IndexedDB hook:', err);
                setError(err);
            }
        };

        initDB();
    }, []);

    return {
        db: indexedDBManager,
        isReady,
        error
    };
}
