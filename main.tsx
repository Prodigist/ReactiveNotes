import { Plugin, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownRenderer, TFile, App, stringifyYaml } from 'obsidian';
import { createRoot } from 'react-dom/client';
import { transform } from '@babel/standalone';
import * as React from 'react';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { StorageManager } from 'src/core/storage';
import { useStorage } from 'src/hooks/useStorage';
import { ComponentRegistry } from 'src/components/componentRegistry';
import { ErrorBoundary } from 'src/components/ErrorBoundary';

//Optional niche market analysis tools
import { useMarketData } from 'src/core/useMarketData';
import { createMarketDataHook } from 'src/core/useMarketData';
import { MarketDataService } from 'src/services/marketDataService';
import { OrderBlockAnalysisService } from 'src/services/OrderBlockAnalysis';
import { MarketDataStorage } from 'src/services/marketDataStorage';

class ReactComponentChild extends MarkdownRenderChild {
    private root: ReturnType<typeof createRoot>;
    private storage: StorageManager;
    private static styleSheet: HTMLStyleElement | null = null;
    private static componentStyles = new Set<string>();
    private noteFile: TFile;
    private ctx: MarkdownPostProcessorContext;
    private app: App;

    constructor(containerEl: HTMLElement, plugin: Plugin, ctx: MarkdownPostProcessorContext) {
        super(containerEl);
        this.root = createRoot(containerEl);
        this.storage = new StorageManager(plugin);
        this.ctx = ctx;
        this.app = plugin.app; // Get app from plugin
        // Get the source file from context
        if (ctx.sourcePath) {
            this.noteFile = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath) as TFile;
        }
        // Add these classes to the container
        containerEl.classList.add('react-component-container');
        if (document.body.hasClass('theme-dark')) {
            containerEl.classList.add('theme-dark');
        }else {
            containerEl.classList.add('theme-light');
        }
    }

    private async getFrontmatterData<T>(key: string, defaultValue: T): Promise<T> {
        if (!this.noteFile) return defaultValue;

        const cache = this.app.metadataCache.getFileCache(this.noteFile);
        const frontmatter = cache?.frontmatter;
        return frontmatter?.react_data?.[key] ?? defaultValue;
    }

    private async updateFrontmatterData<T>(key: string, value: T): Promise<void> {
        if (!this.noteFile) return;

        const content = await this.app.vault.read(this.noteFile);
        const cache = this.app.metadataCache.getFileCache(this.noteFile);
        const frontmatter = cache?.frontmatter || {};

        const newFrontmatter = {
            ...frontmatter,
            react_data: {
                ...(frontmatter.react_data || {}),
                [key]: value
            }
        };

        const yamlRegex = /^---\n([\s\S]*?)\n---/;
        const yamlMatch = content.match(yamlRegex);

        let newContent;
        if (yamlMatch) {
            newContent = content.replace(yamlRegex, `---\n${stringifyYaml(newFrontmatter)}---`);
        } else {
            newContent = `---\n${stringifyYaml(newFrontmatter)}---\n\n${content}`;
        }

        await this.app.vault.modify(this.noteFile, newContent);
    }

    // Add wrapper component for error boundary
    private RenderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        return (
            <ErrorBoundary
                fallback={({ error }) => (
                    <div className="react-component-error">
                        <p>Error in component:</p>
                        <pre className="error-message">
                            {error.message}
                        </pre>
                    </div>
                )}
            >
                {children}
            </ErrorBoundary>
        );
    };
    private preprocessCode(code: string): string {

        // Replace CDN imports with script loading
        code = code.replace(
        /import\s+(\w+)\s+from\s+['"]https:\/\/cdnjs\.cloudflare\.com\/([^'"]+)['"]/g,
        (match, importName, cdnPath) => `
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/${cdnPath}';
            document.body.appendChild(script);`);
        // Remove imports more carefully
        code = code.replace(/import\s+.*?['"]\s*;?\s*$/gm, '');
        code = code.replace(/import\s*{[^}]*}\s*from\s*['"][^'"]*['"];?\s*$/gm, '');
        code = code.replace(/import\s*\([^)]*\);?\s*$/gm, '');

        // Handle both JS/TS exports
        code = code.replace(/export\s+default\s+/, '');
        code = code.replace(/export\s+const\s+/, 'const ');
        code = code.replace(/export\s+function\s+/, 'function ');
        code = code.replace(/export\s+class\s+/, 'class ');
        

        // Remove type annotations
        //code = code.replace(/:\s*[A-Za-z<>[\]]+/g, '');
        //code = code.replace(/<[A-Za-z,\s]+>/g, '');
        // Create a HOC wrapper for chart components
        const chartWrapper = `
     const withChartContainer = (WrappedComponent) => {
         return function ChartContainer(props) {
             const [mounted, setMounted] = React.useState(false);
             
             React.useEffect(() => {
                 const timer = setTimeout(() => setMounted(true), 100);
                 return () => clearTimeout(timer);
             }, []);
 
             return React.createElement(
                 'div',
                 { style: { width: '100%', minHeight: '400px' } },
                 mounted ? React.createElement(WrappedComponent, props) : null
             );
         };
     };
     `;

        // Find the component name
        const componentMatch = code.match(/(?:const|function|class)\s+(\w+)\s*=\s*(?:(?:\([^)]*\)|)\s*=>|function\s*\(|React\.memo\(|React\.forwardRef\(|class\s+extends\s+React\.Component)/);
        const componentName = componentMatch ? componentMatch[1] : 'EmptyComponent';
        console.log('Found component:', componentName); // Debug info
        if (!componentMatch) {
            throw new Error('No React component found');
        }
        
            // Find component name and rename if it's 'Component'
    const safeName = componentName === 'WrappedComponent' ? 'UserComponent' : componentName;
    
    if (componentName === 'WrappedComponent') {
        code = code.replace(/\bComponent\b/, safeName);
    }
        // Combine everything
    // added Component assignment
    code = `
            ${chartWrapper}
            ${code}
            const WrappedComponent = (() => {
                // Add error handling for component existence
                if (typeof ${safeName} === 'undefined') {
                    throw new Error(\`Component "${safeName}" was matched but is undefined. Code context: ${code.slice(0, 100)}...\`);
                }
                const isChartComponent = ${safeName}.toString().includes('ResponsiveContainer') || 
                                       ${safeName}.toString().includes('svg');
                return isChartComponent ? withChartContainer(${safeName}) : ${safeName};
            })();
    `;

        // Wrap code in async IIFE to allow for await
        return `
            (async () => {
                ${code}
                return WrappedComponent;
            })()
        `;
    }

    async render(code: string) {
        console.time('component-render');
        try {
            //console.log('Original code:', code);
            console.time('preprocess');
            // Preprocess code
            const processedCode = this.preprocessCode(code);
            //console.log('Processed code:', processedCode);
            console.timeEnd('preprocess');

            console.time('tailwind');
            // Process Tailwind
            //await this.processTailwind(processedCode);
            console.timeEnd('tailwind');

            console.time('babel');
            const isTypeScript = code.includes(':') || code.includes('interface') || code.includes('<');

            const presets: (string | [string, object])[] = isTypeScript ?
                ['react', ['typescript', { isTSX: true, allExtensions: true }]] :
                ['react'];
            // Transform with Babel
            const transformedCode = transform(processedCode, {
                presets,
                sourceType: 'module',
                filename: isTypeScript ? 'dynamic-component.tsx' : 'dynamic-component.jsx',
                configFile: false,
                babelrc: false,
            }).code;
            console.timeEnd('babel');
            //console.log('Transformed code:', transformedCode);

            // Create bound storage hook
            // Create bound storage hook with frontmatter support
            const boundUseStorage = <T,>(key: string, defaultValue: T) => {
                const [value, setValue] = React.useState<T>(defaultValue);

                React.useEffect(() => {
                    this.getFrontmatterData(key, defaultValue).then(setValue);
                }, [key]);

                const updateValue = React.useCallback(
                    async (newValue: T | ((prev: T) => T)) => {
                        const actualNewValue = newValue instanceof Function ?
                            newValue(value) : newValue;
                        setValue(actualNewValue);
                        await this.updateFrontmatterData(key, actualNewValue);
                    },
                    [key, value]
                );

                return [value, updateValue] as const;
            };
            // Create scoped market data hook
            const useMarketData = createMarketDataHook(this.storage, this.noteFile);
            // Create scope with all required dependencies
            const scope = {
                ...ComponentRegistry,
                useStorage: boundUseStorage,
                useMarketData,
                MarketDataStorage,
                OrderBlockAnalysisService,
                MarketDataService,
                getTheme: () => document.body.hasClass('theme-dark') ? 'dark' : 'light',
                // Add note context
                noteContext: {
                    path: this.noteFile?.path,
                    basename: this.noteFile?.basename,
                    frontmatter: this.app.metadataCache.getFileCache(this.noteFile)?.frontmatter
                },
                // Add useful chart utilities
                getChartTheme: () => document.body.hasClass('theme-dark') ? 'dark' : 'light',
                getChartDefaults: () => ({
                    margin: { top: 10, right: 30, left: 0, bottom: 0 },
                    style: {
                        backgroundColor: document.body.hasClass('theme-dark') ? '#1a1b1e' : '#ffffff',
                        color: document.body.hasClass('theme-dark') ? '#ffffff' : '#000000'
                    }
                }),
            };

            // Execute the code and get the component
            const Component = await new Function(
                ...Object.keys(scope),
                `return ${transformedCode}`
            )(...Object.values(scope));

            // Wrap the rendered component in ErrorBoundary
            this.root.render(
                <this.RenderWrapper>
                    <Component />
                </this.RenderWrapper>
            );
        } catch (error) {
            console.error('Rendering error:', error);
            this.renderError(error instanceof Error ? error : new Error('Unknown error'));
        }
        console.timeEnd('component-render');
    }

    onunload() {
        this.root.unmount();
    }

    renderError(error: Error) {
        this.root.render(
            React.createElement('div', {
                style: {
                    color: 'red',
                    padding: '1rem',
                    border: '1px solid red',
                    borderRadius: '4px',
                    margin: '1rem 0'
                }
            }, `Error: ${error.message}`)
        );
    }

    getStorage() {
        return this.storage;
    }
}

export default class ReactNotesPlugin extends Plugin {
    async onload() {
        // Listen for theme changes
        this.registerEvent(
            this.app.workspace.on('css-change', this.updateTheme)
        );
        // Register markdown processor
        this.registerMarkdownCodeBlockProcessor(
            'react',
            (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
                const child = new ReactComponentChild(el, this, ctx);
                ctx.addChild(child);
                child.render(source);
            }
        );
        // Register a global Markdown postprocessor for HTML
        this.registerMarkdownPostProcessor((element, context) => {
            this.parseMarkdownInHtml(element);
        });
                // Initial theme setup
                this.updateTheme();
    }
    private updateTheme = () => {
        // Update theme class on all react component containers
        document.querySelectorAll('.react-component-container').forEach(el => {
            if (document.body.hasClass('theme-dark')) {
                el.classList.add('theme-dark');
                el.classList.remove('theme-light');
            } else {
                el.classList.add('theme-light');
                el.classList.remove('theme-dark');
            }
        });
    };
    private async parseMarkdownInHtml(container: HTMLElement) {
        // Query all divs or specific HTML blocks you want to process
        const htmlBlocks = Array.from(container.querySelectorAll('div')) as HTMLDivElement[];

        // Iterate over each div block
        for (const block of htmlBlocks) {
            // Check if it already contains rendered Markdown (to avoid double processing)
            if (block.querySelector('.markdown-rendered')) continue;

            // Render Markdown for the inner content of each block
            await MarkdownRenderer.renderMarkdown(
                block.innerHTML, // Raw HTML content
                block,           // Target container for rendered Markdown
                '',              // Path (optional, current file path if needed)
                this             // Plugin context
            );

            // After rendering, mark the block to avoid double processing
            block.classList.add('markdown-rendered');
        }
    }


}