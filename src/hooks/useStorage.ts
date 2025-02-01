// src/hooks/useStorage.tsx
import { useState, useEffect } from 'react';
import { TFile } from 'obsidian';
import { StorageManager } from '../core/storage';

export function useStorage<T>(
    key: string,
    defaultValue: T,
    storage: StorageManager,
    noteFile: TFile
): [T, (value: T | ((prev: T) => T)) => Promise<void>] {
    const [value, setValue] = useState<T>(defaultValue);

    // Load initial value
    useEffect(() => {
        storage.get(key, defaultValue, noteFile).then(setValue);
    }, [key, defaultValue, noteFile]);

    // Update function
    const updateValue = async (newValue: T | ((prev: T) => T)) => {
        const actualNewValue = newValue instanceof Function ? newValue(value) : newValue;
        setValue(actualNewValue);
        await storage.set(key, actualNewValue, noteFile);
    };

    return [value, updateValue];
}