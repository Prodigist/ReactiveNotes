// src/hooks/useMarketData.tsx
import { useState, useEffect } from 'react';
import { TFile } from 'obsidian';
import { StorageManager } from '../core/storage';
import { MarketDataService } from 'src/services/marketDataService';
import { MarketData, MarketDataCache } from '../services/marketDataService';

interface UseMarketDataResult {
    data: MarketData[];
    loading: boolean;
    error: Error | null;
}
export function useMarketData(
    symbol: string,
    interval: string,
    range: string,
    storage: StorageManager,
    noteFile: TFile
) {
    const [data, setData] = useState<MarketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const marketData = await storage.getMarketData(
                    symbol, 
                    interval, 
                    range, 
                    noteFile
                );
                setData(marketData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbol, interval, range, noteFile, storage]);

    return { data, loading, error };
}
export function createMarketDataHook(storage: StorageManager, noteFile: TFile) {
    return function useMarketData(
        symbol: string,
        interval: string,
        range: string
    ): UseMarketDataResult {
        const [data, setData] = useState<MarketData[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<Error | null>(null);

        useEffect(() => {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const cacheKey = `market-data-${symbol}-${interval}-${range}`;
                    
                    // Try to get from storage first
                    const cached = await storage.get<MarketDataCache | null>(
                        cacheKey,
                        null,
                        noteFile
                    );

                    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
                        setData(cached.data);
                        return;
                    }

                    // Fetch fresh data
                    const {data:freshData} = await MarketDataService.fetchHistoricalData(symbol);
                    
                    // Cache the new data
                    await storage.set(
                        cacheKey,
                        { data: freshData, timestamp: Date.now() },
                        noteFile
                    );

                    setData(freshData);
                } catch (err) {
                    setError(err instanceof Error ? err : new Error('Unknown error'));
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [symbol, interval, range]);

        return { data, loading, error };
    };
}