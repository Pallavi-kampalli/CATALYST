/**
 * useSymptoms — IndexedDB-backed hook for symptom log CRUD operations
 */
import { useState, useEffect, useCallback } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'recovery-companion';
const STORE_NAME = 'entries';
const DB_VERSION = 1;

async function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('timestamp', 'timestamp');
            }
        },
    });
}

export function useSymptoms() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadEntries = useCallback(async () => {
        try {
            const db = await getDB();
            const all = await db.getAllFromIndex(STORE_NAME, 'timestamp');
            // Reverse to get newest first
            setEntries(all.reverse());
        } catch (err) {
            console.error('Failed to load entries from IndexedDB:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const addEntry = useCallback(
        async (symptomData) => {
            try {
                const db = await getDB();
                const entry = {
                    ...symptomData,
                    timestamp: Date.now(),
                    date: new Date().toISOString().split('T')[0],
                };
                await db.add(STORE_NAME, entry);
                await loadEntries();
                return true;
            } catch (err) {
                console.error('Failed to save entry:', err);
                return false;
            }
        },
        [loadEntries]
    );

    const getRecentEntries = useCallback(async (days = 14) => {
        try {
            const db = await getDB();
            const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
            const all = await db.getAllFromIndex(STORE_NAME, 'timestamp');
            return all.filter((e) => e.timestamp >= cutoff).reverse();
        } catch (err) {
            console.error('Failed to get recent entries:', err);
            return [];
        }
    }, []);

    const clearOldEntries = useCallback(async (daysToKeep = 30) => {
        try {
            const db = await getDB();
            const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
            const all = await db.getAllFromIndex(STORE_NAME, 'timestamp');
            const old = all.filter((e) => e.timestamp < cutoff);
            const tx = db.transaction(STORE_NAME, 'readwrite');
            await Promise.all(old.map((e) => tx.store.delete(e.id)));
            await tx.done;
        } catch (err) {
            console.error('Failed to clear old entries:', err);
        }
    }, []);

    return { entries, loading, addEntry, getRecentEntries, clearOldEntries, refresh: loadEntries };
}
