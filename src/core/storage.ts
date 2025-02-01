// src/core/storage.tsx
import { MarketDataService, MarketData } from '../services/marketDataService';
import { Plugin, TFile,parseYaml,stringifyYaml } from 'obsidian';
export class StorageManager {
    private plugin: Plugin;
    private cache: Map<string, any>;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.cache = new Map();
    }

    private getCacheKey(noteFile: TFile, key: string): string {
        return `${noteFile.path}:${key}`;
    }

    private async getFrontmatter(noteFile: TFile) {
        const metadata = this.plugin.app.metadataCache.getFileCache(noteFile)?.frontmatter;
        return metadata?.react_data || {};
    }
    async getMarketData(symbol: string, interval: string, range: string, noteFile: TFile): Promise<MarketData[]> {
        const cacheKey = `market-data-${symbol}-${interval}-${range}`;
        
        // Get from frontmatter
        const frontmatter = await this.getFrontmatter(noteFile);
        const cached = frontmatter[cacheKey];
        
        // Check if we have cached data and if it's still fresh (24 hours)
        if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
            return cached.data;
        }

        // Fetch new data
        const data = (await MarketDataService.fetchHistoricalData(symbol)).data;
        
        // Cache the data using existing set method
        await this.set(cacheKey, {
            data,
            timestamp: Date.now()
        }, noteFile);

        return data;
    }
    async get<T>(key: string, defaultValue: T, noteFile: TFile): Promise<T> {
        const cacheKey = this.getCacheKey(noteFile, key);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Get from frontmatter
        const frontmatter = await this.getFrontmatter(noteFile);
        const value = frontmatter[key] ?? defaultValue;
        
        // Update cache
        this.cache.set(cacheKey, value);
        return value;
    }

    async set<T>(key: string, value: T, noteFile: TFile): Promise<void> {
        const cacheKey = this.getCacheKey(noteFile, key);
        this.cache.set(cacheKey, value);

        const content = await this.plugin.app.vault.read(noteFile);
        const frontmatter = await this.getFrontmatter(noteFile);
        
        // Prepare new frontmatter
        const newFrontmatter = {
            ...frontmatter,
            [key]: value
        };

        // Update the file with new frontmatter
        const updatedContent = this.updateFrontmatter(content, newFrontmatter);
        await this.plugin.app.vault.modify(noteFile, updatedContent);
    }

    private updateFrontmatter(content: string, newData: any): string {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const frontmatterMatch = content.match(frontmatterRegex);

        if (frontmatterMatch) {
            // Update existing frontmatter
            let frontmatter;
            try {
                frontmatter = parseYaml(frontmatterMatch[1]);
            } catch (e) {
                frontmatter = {};
            }

            frontmatter.react_data = {
                ...frontmatter.react_data,
                ...newData
            };

            const newFrontmatter = stringifyYaml(frontmatter);
            return content.replace(frontmatterRegex, `---\n${newFrontmatter}---`);
        } else {
            // Create new frontmatter
            const newFrontmatter = stringifyYaml({ react_data: newData });
            return `---\n${newFrontmatter}---\n\n${content}`;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}