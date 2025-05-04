// src/core/storage.tsx
import { Plugin, TFile, App, parseYaml,stringifyYaml, Notice } from 'obsidian';
export class StorageManager {
    private plugin: Plugin;
    private cache: Map<string, any>;
    private app: App; // Replace with the actual type of your app if available
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.cache = new Map();
        this.app = plugin.app;
    }

    private getCacheKey(noteFile: TFile, key: string): string {
        return `${noteFile.path}:${key}`;
    }

    private async getFrontmatter(noteFile: TFile) {
        const metadata = this.plugin.app.metadataCache.getFileCache(noteFile)?.frontmatter;
        return metadata?.react_data || {};
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

        try {
            await this.app.fileManager.processFrontMatter(noteFile, (frontmatter) => {
                // Initialize react_data if it doesn't exist
                if (!frontmatter.react_data) {
                    frontmatter.react_data = {};
                }
                
                // Update the specific key
                frontmatter.react_data[key] = value;
            });
        } catch (error) {
            console.error(`Failed to save data for key "${key}":`, error);
            new Notice(`Failed to save component state: ${error.message}`);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}