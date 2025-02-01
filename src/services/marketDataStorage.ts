// src/services/marketDataStorage.ts
import { TFile, Vault } from 'obsidian';
import { MarketData, CacheEntry, CacheMetadata, IntervalType } from './marketDataService';

export class MarketDataStorage {
    private vault: Vault;
    private noteFile: TFile;
    private basePath: string;

    constructor(vault: Vault, noteFile: TFile) {
        this.vault = vault;
        this.noteFile = noteFile;

     // Determine the appropriate base path
     this.basePath = this.determineBasePath();
    }
    private determineBasePath(): string {
        // Check if note exists and is a markdown file
        if (!this.noteFile || this.noteFile.extension !== 'md') {
            throw new Error('Invalid note file');
        }

        // Get the parent folder path, defaulting to root if none
        const parentPath = this.noteFile.parent?.path ?? '';

        // If at root, store in vault root
        if (!parentPath) {
            return '.market-data';
        }

        // Store in parent folder
        return `${parentPath}/.market-data`;
    }
    getBasePath(): string {
        return this.basePath;
    }
    private async ensureDirectory(path: string) {
        try {
            if (!(await this.vault.adapter.exists(path))) {
                await this.vault.adapter.mkdir(path);
            }
        } catch (error) {
            console.error(`Failed to create directory ${path}:`, error);
            throw new Error(`Failed to create market data directory: ${error.message}`);
        }
    }

    async initialize() {
        try {
            // Ensure base directory exists
            await this.ensureDirectory(this.basePath);

            // Create metadata file if it doesn't exist
            const metadataPath = `${this.basePath}/metadata.json`;
            if (!(await this.vault.adapter.exists(metadataPath))) {
                await this.vault.adapter.write(
                    metadataPath, 
                    JSON.stringify({ 
                        created: Date.now(),
                        noteSource: this.noteFile.path 
                    })
                );
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize market data storage:', error);
            throw error;
        }
    }
 // Helper method to get absolute path in vault
 getAbsolutePath(relativePath: string): string {
    return `${this.basePath}/${relativePath}`;
}

// Method to check if storage is properly initialized
async isInitialized(): Promise<boolean> {
    try {
        return await this.vault.adapter.exists(this.basePath);
    } catch {
        return false;
    }
}

// Method to get storage location info
async getStorageInfo(): Promise<{
    basePath: string;
    isInitialized: boolean;
    parentFolder: string;
    noteFile: string;
}> {
    return {
        basePath: this.basePath,
        isInitialized: await this.isInitialized(),
        parentFolder: this.noteFile.parent?.path ?? '(root)',
        noteFile: this.noteFile.path
    };
}
    private getSymbolPath(symbol: string) {
        return `${this.basePath}/${symbol}`;
    }

    private getDataPath(symbol: string, interval: IntervalType) {
        return `${this.getSymbolPath(symbol)}/${interval}.json`;
    }

    async saveMarketData(symbol: string, cacheEntry: CacheEntry): Promise<void> {
        await this.initialize();
        
        // Ensure symbol directory exists
        const symbolPath = this.getSymbolPath(symbol);
        await this.ensureDirectory(symbolPath);

        // Save data file
        const dataPath = this.getDataPath(symbol, cacheEntry.interval);
        await this.vault.adapter.write(
            dataPath,
            JSON.stringify(cacheEntry, null, 2)
        );

        // Update metadata
        await this.updateMetadata(symbol, cacheEntry);
    }

    async getMarketData(symbol: string, interval: IntervalType): Promise<CacheEntry[]> {
        const dataPath = this.getDataPath(symbol, interval);
        
        if (await this.vault.adapter.exists(dataPath)) {
            const content = await this.vault.adapter.read(dataPath);
            const parsed = JSON.parse(content);
            // Ensure we always return an array
        return Array.isArray(parsed) ? parsed : [parsed];
        }
        
        return [];
    }

    private async updateMetadata(symbol: string, cacheEntry: CacheEntry) {
        const metadataPath = `${this.basePath}/metadata.json`;
        let metadata: CacheMetadata = {};
        try{
        if (await this.vault.adapter.exists(metadataPath)) {
            const content = await this.vault.adapter.read(metadataPath);
            metadata = JSON.parse(content);
        }

        // Update metadata for this symbol
        metadata[symbol] = metadata[symbol] || {};
        if (!metadata[symbol][cacheEntry.interval]) {
            metadata[symbol][cacheEntry.interval] = [];
        }

        // Add new cache entry info
        const cacheList = metadata[symbol][cacheEntry.interval];
        if (cacheList) {
            cacheList.push({
                timestamp: cacheEntry.timestamp,
                startTime: cacheEntry.startTime,
                endTime: cacheEntry.endTime,
                interval: cacheEntry.interval,
                data: [], // Don't store actual data in metadata
                timezone: cacheEntry.timezone
            });

            // Keep only last 5 entries
            if (cacheList.length > 5) {
                cacheList.shift();
            }
        }

        await this.vault.adapter.write(
            metadataPath,
            JSON.stringify(metadata, null, 2)
        );
    }catch (error) {
            console.error(`Failed to update metadata for ${symbol}:`, error);
            throw new Error(`Failed to update metadata: ${error.message}`);
        }
    }

    async getCacheStats(): Promise<{
        totalSize: number;
        symbolCount: number;
        fileCount: number;
        symbols: Record<string, {
            intervals: IntervalType[];
            lastUpdated: number;
        }>;
    }> {
        let totalSize = 0;
        let fileCount = 0;
        const symbols: Record<string, {
            intervals: IntervalType[];
            lastUpdated: number;
        }> = {};
try{
        if (await this.vault.adapter.exists(this.basePath)) {
            const files = await this.vault.adapter.list(this.basePath);
            
            for (const file of files.files) {
                if (file.endsWith('.json')) {
                    const stat = await this.vault.adapter.stat(file);
                    if (!stat) continue;  // Skip if stat is null
                    totalSize += stat.size;
                    fileCount++;

                    // Parse symbol and interval info
                    const pathParts = file.split('/');
                    if (pathParts.length >= 2) {
                    const symbol = pathParts[pathParts.length - 2];
                    const interval = pathParts[pathParts.length - 1].replace('.json', '') as IntervalType;

                    if (!symbols[symbol]) {
                        symbols[symbol] = {
                            intervals: [],
                            lastUpdated: stat.mtime
                        };
                    }
                    symbols[symbol].intervals.push(interval);
                    symbols[symbol].lastUpdated = Math.max(symbols[symbol].lastUpdated, stat.mtime);
                }
                }
            }
        }

        return {
            totalSize,
            symbolCount: Object.keys(symbols).length,
            fileCount,
            symbols
        };
    } catch (error) {
        console.error('Failed to get cache stats:', error);
        return {
            totalSize: 0,
            symbolCount: 0,
            fileCount: 0,
            symbols: {}
        };
    }
    }

    async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000) { // Default 7 days
        const stats = await this.getCacheStats();
        const now = Date.now();

        for (const [symbol, info] of Object.entries(stats.symbols)) {
            if (now - info.lastUpdated > maxAge) {
                // Remove old symbol data
                const symbolPath = this.getSymbolPath(symbol);
                if (await this.vault.adapter.exists(symbolPath)) {
                    await this.vault.adapter.rmdir(symbolPath, true);
                }
            }
        }
    }
}