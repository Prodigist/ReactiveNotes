import { Plugin, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownRenderer, TFile, App, stringifyYaml, Notice, SuggestModal, loadMathJax, PluginSettingTab, Setting } from 'obsidian';
import { createRoot } from 'react-dom/client';
import { transform } from '@babel/standalone';
import * as React from 'react';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import { StorageManager } from 'src/core/storage';
import { useStorage } from 'src/hooks/useStorage';
import { ComponentRegistry } from 'src/components/componentRegistry';
import { ErrorBoundary } from 'src/components/ErrorBoundary';
import {useMathJax} from 'src/hooks/mathJax';
import { read } from 'fs';
import { error } from 'console';

declare global {
    interface Window {
      MathJax: any;
    }
  }
  
class ReactComponentChild extends MarkdownRenderChild {
    private root: ReturnType<typeof createRoot>;
    private storage: StorageManager;
    private static styleSheet: HTMLStyleElement | null = null;
    private static componentStyles = new Set<string>();
    private noteFile: TFile;
    private ctx: MarkdownPostProcessorContext;
    private app: App;
    private settings: ReactiveNotesSettings;
    private processedPaths = new Set<string>();
    
    constructor(containerEl: HTMLElement, plugin: ReactNotesPlugin, ctx: MarkdownPostProcessorContext) {
        super(containerEl);
        this.root = createRoot(containerEl);
        this.storage = new StorageManager(plugin);
        this.ctx = ctx;
        this.app = plugin.app; // Get app from plugin
        this.settings=plugin.settings;
        // Get the source file from context
        if (ctx.sourcePath) {
            const abstractFile = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
            if (abstractFile instanceof TFile) {
                this.noteFile = abstractFile;
            } else {
                // Handle the case where it's not a TFile
                console.warn(`Source path ${ctx.sourcePath} is not a file`);
                throw new Error(`Cannot initialize component: Source path "${ctx.sourcePath}" is not a file.`);
            }
        }
        // Add these classes to the container
        containerEl.classList.add('react-component-container');
        if (document.body.hasClass('theme-dark')) {
            // containerEl.classList.add('theme-dark');
            containerEl.classList.add('dark');
        }else {
            //    containerEl.classList.add('theme-light');
            containerEl.classList.remove('dark');
        }
        
    }
    
    private async getFrontmatter<T>(
        key: string | null = null,
        defaultValue: T | null = null,
        notePath: string | null = null,
        extProp:boolean=false
    ): Promise<T | Record<string, any> | null> {
        try {
            // Get the file - either current note or specified path
            const file = notePath 
            ? this.app.vault.getAbstractFileByPath(notePath) 
            : this.noteFile;
            
            if (!file || !(file instanceof TFile)) {
                const errorMsg=`Invalid file: ${notePath}`;
                console.error(errorMsg);
                new Notice(errorMsg);
                return defaultValue;
            }
            
            const cache = this.app.metadataCache.getFileCache(file);            
            const frontmatter = cache?.frontmatter;
            
            if (!frontmatter) {
                const errorMsg=`File cache not found for ${file.path}`;
                console.error(errorMsg);
                new Notice(errorMsg);
                return defaultValue;
            }
            //console.log('Frontmatter:', frontmatter);
            // Return specific key if requested
            if (key) {
                if(extProp&&!frontmatter[key]&&frontmatter.react_data[key]) new Notice(`Key "${key}" not found in outer frontmatter, But found in react_data. Set extProp to false to access it.`);
                if (!extProp&&frontmatter[key] && !frontmatter.react_data?.[key]) new Notice(`Key "${key}" not found in react_data, but found in frontmatter. Set extProp to true to access it.`);
                if (extProp) return frontmatter[key] ?? defaultValue;
                else return frontmatter.react_data?.[key] ?? defaultValue;
            }
            
            // Otherwise return entire frontmatter
            return extProp?frontmatter:frontmatter.react_data??defaultValue;
        } catch (error) {
            console.error('Error getting frontmatter:', error);
            return defaultValue;
        }
    }

    private async updateFrontmatter<T>(key: string, value: T,notePath:string|null=null,extProp:boolean=false): Promise<void> {
        // Get the file - either current note or specified path
        const file = notePath 
        ? this.app.vault.getAbstractFileByPath(notePath) 
        : this.noteFile;
        if (!file || !(file instanceof TFile)) {console.error(`Invalid file: ${notePath}`);
        const errorMsg = `Cannot save to non-existent file: ${notePath}`;
        console.error(errorMsg);
        new Notice(errorMsg);
        throw new Error(errorMsg); // Throw an error to notify callers
    }
    try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            if (extProp) {
                // Update the specific key at the root level
                frontmatter[key] = value;
            }
            else{
                // Initialize react_data section if it doesn't exist
                if (!frontmatter.react_data) {
                    frontmatter.react_data = {};
                }
                
                // Update the specific key
                frontmatter.react_data[key] = value;
            }
        });
    } catch (error) {
        console.error(`Failed to update frontmatter for key "${key}", External Property: ${extProp}:`, error);
        new Notice(`Failed to save component state: ${error.message}`);
        throw error;
    }
}

    private RenderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const containerRef=this.settings.mathJaxEnabled?useMathJax([children]):null;
        return (
            <ErrorBoundary
            fallback={({ error }) => {
                // The ErrorBoundary will catch the error and display a fallback UI.
                // The console log for "Objects are not valid as a React child" should have been suppressed.
                if (error.message?.includes('Objects are not valid as a React child')) {
                    const objectMatch = error.message.match(/found: object with keys {([^}]+)}/);
                    const keys = objectMatch ? objectMatch[1].split(',').map(k => k.trim()) : ['unknown'];
                    return (
                        <div style={{ padding: '12px', backgroundColor: 'var(--background-modifier-form-field)', borderRadius: '6px', border: '1px solid var(--background-modifier-border)', fontFamily: 'var(--font-monospace)', margin: '1rem 0' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🧩</span> <span>Component Rendered an Object</span>
                        </div>
                        <div style={{ fontSize: '0.9em', opacity: 0.8, marginBottom: '4px' }}>A React component attempted to render a plain JavaScript object. Objects need to be mapped to renderable elements.</div>
                        <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Object keys found:</div>
                        <ul style={{ margin: '8px 0 0 20px', paddingLeft: '0', listStyleType: 'disc' }}>{keys.map(key => <li key={key} style={{fontSize: '0.85em'}}>{key}</li>)}</ul>
                        </div>
                    );
                }
                // Default error display for other types of errors
                return (
                    <div className="react-component-error" style={{ margin: '1rem 0' }}>
                    <p style={{color: 'var(--text-error)', fontWeight: 'bold'}}>Error in component:</p>
                    <pre className="error-message" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: 'var(--background-secondary-alt)', padding: '8px', borderRadius: '4px', color: 'var(--text-error)'}}>{error.message}</pre>
                    {error.stack && <details style={{marginTop: '8px'}}><summary style={{cursor: 'pointer', fontSize: '0.9em'}}>Stack Trace</summary><pre style={{fontSize: '0.8em', maxHeight: '150px', overflowY: 'auto', backgroundColor: 'var(--background-secondary)', padding: '8px', borderRadius: '4px', marginTop: '4px'}}>{error.stack}</pre></details>}
                    </div>
                );
            }}
            >
            <div ref={containerRef}>
            {children}
            </div>
            </ErrorBoundary>
        );
    };

    private needsThree(code: string): boolean {
        // Check if the code contains any Three.js specific imports or usage
        // More comprehensive detection of THREE usage
        const hasThreeImports = /import\s+.*?three['"];?\s*$/gm.test(code) || 
        /import\s*{\s*[^}]*}\s*from\s*['"]three['"];?\s*$/gm.test(code) ||
        /import\s+.*?\s+as\s+(\w+)\s+from\s+['"]three['"];?\s*$/gm.test(code);
        
        // Save any custom import name from "import * as CustomName from 'three'"
        const threeAliasMatch = code.match(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]three['"];?\s*$/m);
        const threeAlias = threeAliasMatch ? threeAliasMatch[1] : null;
        
        // Check for various THREE usage patterns
        let hasThreeUsage = /\bTHREE\.|\bnew\s+THREE\.|\bextends\s+THREE\./.test(code) || // Direct THREE usage
        /\bUtilities\.THREE\.|\bnew\s+Utilities\.THREE\./.test(code) || // Utilities.THREE usage
        /\bComponentRegistry\.Utilities\.THREE\./.test(code); // Full path usage
        
        // If there's a custom alias, check for that too
        if (threeAlias) {
            hasThreeUsage = hasThreeUsage || new RegExp(`\\b${threeAlias}\\.`).test(code);
        }
        
        // Also check for common THREE classes even without the THREE prefix
        const commonThreeClasses = /\b(Scene|PerspectiveCamera|WebGLRenderer|Vector3|BoxGeometry|MeshBasicMaterial|Mesh|Object3D|Group|AmbientLight|DirectionalLight)\b/.test(code);
        
        // Combined check
        return hasThreeImports || hasThreeUsage || commonThreeClasses;
    }

    private async preprocessCode(code: string): Promise<string> {
        
        // Replace CDN imports with script loading
        code = code.replace(
            /import\s+(\w+)\s+from\s+['"]https:\/\/cdnjs\.cloudflare\.com\/([^'"]+)['"]/g,
            (match, importName, cdnPath) => `
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/${cdnPath}';
                document.body.appendChild(script);`);
            // Remove imports carefully
            code = code.replace(/import\s+.*?['"].*$/gm, '');
            code = code.replace(/import\s*{[^}]*}\s*from\s*['"][^'"]*['"].*$/gm, '');
            code = code.replace(/import\s*\([^)]*\).*$/gm, '');
            
            // Handle both JS/TS exports
            code = code.replace(/export\s+default\s+/gm, '');
            code = code.replace(/export\s+const\s+/gm, 'const ');
            code = code.replace(/export\s+function\s+/gm, 'function ');
            code = code.replace(/export\s+class\s+/gm, 'class ');
            
            
            // Remove type annotations
            //code = code.replace(/:\s*[A-Za-z<>[\]]+/g, '');
            //code = code.replace(/<[A-Za-z,\s]+>/g, '');
            
            
            // Find the component name
            const componentMatch = code.match(/^(?![\s]*\/\/).*?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:(?:\([^)]*\)|)\s*=>|function\s*\(|React\.memo\(|React\.forwardRef\(|class\s+extends\s+React\.Component))/m);
            const storeMatch = !componentMatch ?  code.match(/(?:const\s+(\w+)\s*=\s*{|class\s+(\w+)\s*{)/) : null;
            
            if (!componentMatch) {
                // If no component found, look for object literals or other exports
                if (!storeMatch) {
                    throw new Error('No React component found');
                }
            }
            // Set safeName using either match
            const componentName = componentMatch 
            ? (componentMatch[1] || componentMatch[2]) 
            : (storeMatch ? (storeMatch[1]|| storeMatch[2]) : 'EmptyComponent');
            console.log('Found component:', componentName);
            
            // Find component name and rename if it's 'WrappedComponent'
            const safeName = componentName === 'WrappedComponent' ? 'UserComponent' : componentName;
            
            if (componentName === 'WrappedComponent') {
                code = code.replace(/\bWrappedComponent\b/, safeName);
            }
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
            // Combine everything
            // added Component assignment
            code = `
                ${chartWrapper}
                ${code}
                const WrappedComponent = (() => {
                    // Add error handling for component existence
                    if (typeof ${safeName} === 'undefined') {
                        throw new Error(\`Component "${safeName}" was matched but is undefined. Code context: ${code.slice(0, 100).replace(/`/g, '\\`')}...\`);
                    }
                // Simple check - is it a valid React component?
            const isValidComponent = (() => {
                // Class component
                if (${safeName}.prototype?.isReactComponent) return true;
                
                // Function that returns React elements
                if (typeof ${safeName} === 'function') {
                    try {
                        const result = ${safeName}({});
                        return React.isValidElement(result);
                    } catch {
                        // If it throws, check source code
                        return ${safeName}.toString().includes('createElement') || 
                            ${safeName}.toString().includes('<');
                    }
                }
                
                // Direct objects are never valid components
                return false;
            })();
            
            // If not a valid component, treat as a storage block
            if (!isValidComponent) {
                return function StorageBlockWrapper() {
                    // Get the definitions - handle all cases
                    let definitions;
                    
                    if (typeof ${safeName} === 'function') {
                        try {
                            // Try as function
                            definitions = ${safeName}({});
                        } catch (e) {
                            try {
                                // Try as class
                                definitions = new ${safeName}();
                            } catch (e2) {
                                // Last resort
                                definitions = ${safeName};
                            }
                        }
                    } else {
                        // Already an object (like IIFE or object literal)
                        definitions = ${safeName};
                    }
                    
                    // Ensure it's an object
                    if (!definitions || typeof definitions !== 'object') {
                        definitions = { error: "Couldn't extract definitions" };
                    }
                    
                    const keys = Object.keys(definitions);
                    return React.createElement('div', {
                        style: {
                            padding: '12px',
                            backgroundColor: 'var(--background-modifier-form-field)',
                            borderRadius: '6px',
                            border: '1px solid var(--background-modifier-border)',
                            fontFamily: 'var(--font-monospace)'
                        }
                    }, [
                        React.createElement('div', {
                            style: { 
                                fontWeight: 'bold',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }
                        }, [
                            React.createElement('span', null, '📦'),
                            React.createElement('span', null, 'Definitions Storage Container:')
                        ]),
                            React.createElement('div', {
                        style: {
                            padding: '8px',
                            marginBottom: '12px',
                            color: 'var(--text-on-accent)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }
                    }, [
                        React.createElement('code', {
                            style: {
                                padding: '2px 6px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: '3px',
                                fontWeight: 'bold'
                            }
                        }, '${safeName}')
                    ]),
                        React.createElement('div', {
                            style: { fontSize: '0.9em', opacity: 0.8 }
                        }, 'Exported definitions:'),
                        React.createElement('ul', {
                            style: { 
                                margin: '8px 0',
                                paddingLeft: '20px'
                            }
                        }, keys.map(key => 
                            React.createElement('li', { key }, 
                                \`\${key}: \${typeof definitions[key]}\`
                            )
                        ))
                    ]);
                };
            }
                const isChartComponent = ${safeName}.toString().includes('ResponsiveContainer') || 
                                        ${safeName}.toString().includes('svg');
                return isChartComponent ? withChartContainer(${safeName}) : ${safeName};
                })();
        `;
        code = await this.processVaultImports(code);
        // Wrap code in async IIFE to allow for await
        return `
            (async () => {
                ${code}
                return WrappedComponent;
            })()
        `;
    }
    
    // Helper to get THREE.js directly
    private getThreeJs() {
        // Check if THREE exists in window
        if (typeof window !== 'undefined' && 'THREE' in window) {
            return window.THREE;
        }
        
        // Fall back to require - only execute if needed
        try {
            return require('three');
        } catch (error) {
            console.warn('Failed to load THREE.js:', error);
            return undefined;
        }
    }
    
    private async processVaultImports(code: string, depth = 0): Promise<string> {
        if (depth > 10) {
            console.warn('Maximum import depth reached (10)');
            return code;
        }
        const vaultImportRegex = /vaultImport\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\d+))?\s*\)/g;
        
        // Create a map to track processed imports (avoid duplicates)
        const processedImports = new Map<string, string>();
        
        // Find all vaultImport calls
        const matches = [...code.matchAll(vaultImportRegex)];
        
        for (const match of matches) {
            const [fullMatch, path, index = '0'] = match;
            const importKey = `${path}#${index}`;
            
            // Skip if already processed
            if (processedImports.has(importKey)) continue;
            
            try {
                const file = this.app.vault.getAbstractFileByPath(path);
                if (!file  || !(file instanceof TFile)) continue;
                
                const content = await this.app.vault.read(file);
                const blocks = content.match(/```react\n([\s\S]*?)```/g) || [];
                
                if (blocks[parseInt(index)]) {
                    let blockCode = blocks[parseInt(index)]
                    .replace(/```react\n/, '')
                    .replace(/```$/, '');
                    
                    // Check for nested imports
                    const importKey = `${path}#${index}`;
                    if (!this.processedPaths.has(importKey)) {
                        this.processedPaths.add(importKey);
                        // Recursively process nested imports
                        blockCode = await this.processVaultImports(blockCode, depth + 1);
                    }
                    blockCode = blockCode.replace(
                        /import\s+(\w+)\s+from\s+['"]https:\/\/cdnjs\.cloudflare\.com\/([^'"]+)['"]/g,
                        (match, importName, cdnPath) => `
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/${cdnPath}';
                        document.body.appendChild(script);`);
                        blockCode = blockCode.replace(/import\s+.*?['"]\s*;?\s*$/gm, '')
                        .replace(/import\s*{[^}]*}\s*from\s*['"][^'"]*['"];?\s*$/gm, '')
                        .replace(/import\s*\([^)]*\);?\s*$/gm, '');
                        
                        // Strip exports
                        blockCode = blockCode
                        .replace(/export\s+default\s+/gm, '')
                        .replace(/export\s+const\s+/gm, 'const ')
                        .replace(/export\s+function\s+/gm, 'function ')
                        .replace(/export\s+class\s+/gm, 'class ')
                        .replace(/export\s+{[^}]*}\s*;?/gm, '')
                        
                        
                        const importedCode = `\n// Imported from ${path}#${index}\n${blockCode}\n`;
                        processedImports.set(importKey, importedCode);
                    }
                } catch (error) {
                    console.error(`Error importing from ${path}:`, error);
                }
            }
            
            // Append all unique imports
            const appendedCode = Array.from(processedImports.values()).join('\n');
            
            // Remove ALL vaultImport calls in one pass
            const cleanedCode = code.replace(vaultImportRegex, '');
            return  appendedCode+cleanedCode;
    }
        
    async render(code: string) {
            console.time('component-render');
            try {
                
                // Add container classes for styling isolation
                this.containerEl.classList.add('react-component-container');
                
                // Apply theme class for dark mode
                
                if (document.body.classList.contains('theme-dark')) {
                    this.containerEl.classList.add('dark');
                } else {
                    this.containerEl.classList.remove('dark');
                }
                
                //console.log('Original code:', code);
                console.time('preprocess');
                // Preprocess code
                const needsThree=this.needsThree(code);
                const processedCode = await this.preprocessCode(code);
                console.timeEnd('preprocess');
                
                
                console.time('tailwind');
                // Process Tailwind
                //Could potentially generate tailwind css based on specific user code using build:css script defined in config
                // This would let it work with any user defined tailwind classes
                //await this.processTailwind(processedCode);
                //console.timeEnd('tailwind');
                
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
                // Create bound storage hook with frontmatter support
                const boundUseStorage = <T,>(key: string, defaultValue: T, notePath: string | null = null, // Optional: path to another note
                    extProp: boolean = false         // Optional: true to store at root, false for react_data)
                ) => {
                    const [value, setValue] = React.useState<T>(defaultValue);
                    const [error, setError] = React.useState<string | null>(null);
                    React.useEffect(() => {
                        let mounted = true;
                        
                        const loadValue = async () => {
                            try {
                                const result = await this.getFrontmatter(key, defaultValue, notePath, extProp);
                                if (mounted) {
                                    if (result !== null) {
                                        setValue(result as T);
                                    } else {
                                        setValue(defaultValue);
                                    }
                                }
                            } catch (error) {
                                console.error(`Error loading from frontmatter: ${key}, error`);
                                if (mounted) {
                                    // Fall back to default value on error
                                    setValue(defaultValue);
                                }
                                // Fall back to default value
                            }
                        };
                        
                        loadValue();
                        
                        return () => { mounted = false; };
                    }, [key, notePath, extProp]);
                    const updateValue = React.useCallback(
                        async (newValue: T | ((prev: T) => T)) => {
                            try {
                                const actualNewValue = newValue instanceof Function ?
                                newValue(value) : newValue;
                                setValue(actualNewValue);
                                this.updateFrontmatter(key, actualNewValue,notePath, extProp).catch(err => {
                                    console.error("Failed to update frontmatter:", err);
                                    setError(err.message);
                                });
                                setError(null);
                            } catch (err) {
                                console.error("Failed to update frontmatter:", err);
                                setError(err.message);
                            }
                        },
                        [key, value, notePath, extProp]
                    );
                    return [value, updateValue, error] as const;
                };
                // Create scope with all required dependencies
                const scope = {
                    ...ComponentRegistry,
                    useStorage: boundUseStorage,
                    //Not included MarketAnalysis functions
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
                    //lazy load THREE if needed
                    ...needsThree ? this.getThreeJs() : undefined,
                    readFile: async (path = null, extensions = ['txt', 'md', 'json', 'csv']) => {
                        return await this.readFile(this.app, path, extensions);
                    },
                    // Frontmatter access utility
                    //Default extProp to true to access outer frontmatter, maybe more intuitive for users
                    getFrontmatter: async ( key = null, defaultValue = null,notePath = null,extProp=true) => {
                        // Self-protecting implementation
                        return new Promise((resolve) => {
                            // Use setTimeout to prevent UI blocking
                            setTimeout(async () => {
                                try {
                                    const result = await this.getFrontmatter(key, defaultValue, notePath,extProp);
                                    resolve(result);
                                } catch (error) {
                                    console.error("Error in getFrontmatter:", error);
                                    resolve(defaultValue);
                                }
                            }, 0);
                        });
                    },
                    // Defualt extProp to false to access react_data frontmatter, as a precaution to avoid propery conflicts
                    updateFrontmatter: async <T,>(key:string, value:T, notePath = null, extProp = false) => {
                        return new Promise((resolve) => {
                            setTimeout(async () => {
                        return await this.updateFrontmatter(key, value, notePath, extProp);
                            },0);
                        });
                      },
                    Notice: (message:string, timeout = 4000) => new Notice(message, timeout),
                };
                //console.log("MathJax version/config:", window.MathJax?.version, window.MathJax?.config);
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
        
        async readFile(
            app: App, 
            path: string | null = null, 
            extensions: string[] = ['txt', 'md', 'json', 'csv']
        ): Promise<{ path: string; name: string; extension?: string; content: string } | null> {
            return new Promise((resolve) => {
                let isResolved = false;
                let cancelTimeoutHandle: number | undefined = undefined; // To store timeout handle for cancellation
                // Create a SuggestModal subclass that lists vault files
                
                // If a specific path is provided, read that file directly without showing modal
                if (path) {
                    const file = this.app.vault.getAbstractFileByPath(path);
                    if (file && file instanceof TFile) {
                        this.app.vault.cachedRead(file).then(content => {
                            isResolved = true;
                            resolve({
                                path: file.path,
                                name: file.name,
                                content: content
                            });
                        }).catch(err => {
                            console.error("Failed to read file:", err);
                            isResolved = true;
                            resolve(null);
                        });
                    } else {
                        console.error("File not found:", path);
                        isResolved = true;
                        resolve(null);
                    }
                    return;
                }
                class FileSuggestModal extends SuggestModal<TFile> {
                    getSuggestions(query:string) {
                        // Get all files with the right extension
                        const files =  this.app.vault.getFiles()
                        .filter(file => extensions.includes(file.extension));
                        
                        // Filter by query if provided
                        if (query) {
                            return files.filter(file => 
                                file.path.toLowerCase().includes(query.toLowerCase())
                            );
                        }
                        return files;
                    }
                    
                    renderSuggestion(file:TFile, el: HTMLElement) {
                        el.createEl("div", { text: file.name });
                        el.createEl("small", { text: file.path });
                    }
                    
                    onChooseSuggestion(file:TFile, evt: MouseEvent|KeyboardEvent) {
                        //console.log("File content:");
                        if (cancelTimeoutHandle !== undefined) {
                            clearTimeout(cancelTimeoutHandle);
                            cancelTimeoutHandle = undefined;
                        }
                        this.app.vault.cachedRead(file).then(content => {isResolved = true; 
                            resolve({
                                path: file.path,
                                name: file.basename,
                                extension: file.extension,
                                content: content
                            });
                        }).catch(err => {
                            console.error("Failed to read file:", err);
                            resolve(null);});}
                        }
                        
                        // Show the modal
                        const modal = new FileSuggestModal(this.app);
                        modal.setPlaceholder("Select a file");
                        modal.onClose = () => {
                            // We use a setTimeout to yield to the event loop, giving onChooseSuggestion
                            // a chance to run if it was triggered by the same user action that closed the modal.
                            if (cancelTimeoutHandle !== undefined) { // Clear previous timeout if any (e.g. rapid open/close)
                                clearTimeout(cancelTimeoutHandle);
                            }
                            cancelTimeoutHandle = window.setTimeout(() => { // window.setTimeout for NodeJS.Timeout type
                                // After yielding, if the promise hasn't been resolved by onChooseSuggestion
                                // and a suggestion wasn't flagged as chosen, then resolve as null (cancellation).
                                if (!isResolved) {
                                    resolve(null);
                                }
                                // If suggestionChosen IS true here, it means onChooseSuggestion ran,
                                // set the flag, and it's responsible for resolving (or has already).
                                // If promiseResolved IS true, it's already handled.
                            }, 0); // Yield to the event loop.
                        };
                        modal.open();
                        
                    });
                    
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
                private nonBlockingUpdate<T>(
                    operation: () => Promise<T>,
                    onSuccess?: (result: T) => void,
                    onError?: (error: Error) => void,
                    onFinally?: () => void
                ): void {
                    // Don't return anything, so it can't be awaited
                    operation().then(result => {
                        if (onSuccess) onSuccess(result);
                    }).catch(error => {
                        if (onError) onError(error);
                        else console.error('Non-blocking operation error:', error);
                    }).finally(() => {
                        if (onFinally) onFinally();
                    });
                }
}
interface ReactiveNotesSettings {
    mathJaxEnabled: boolean;
    mathJaxMode: 'auto' | 'manual' | 'off';
    forceTheme: 'dark' | 'light' | 'auto';

}

const DEFAULT_SETTINGS: ReactiveNotesSettings = {
    mathJaxEnabled: true,
    mathJaxMode: 'auto',
    forceTheme: 'auto',
};
export default class ReactNotesPlugin extends Plugin {
    private tailwindStyles: HTMLStyleElement | null = null; // Tailwind styles reference
    settings: ReactiveNotesSettings
    
    async onload() {
        try {
            await this.loadSettings();
            await loadMathJax();      
            // Read the CSS file using Obsidian's API
            // - only left here for development purposes,
            // Users wont have this in production, we may use the build:css script to generate and add the css file in future
            const css = await this.app.vault.adapter.read(`${this.manifest.dir}/outStyles.css`);
            
            // Inject the CSS
            const style = document.createElement('style');
            style.id = 'tailwind-styles';
            style.textContent = css;
            document.head.appendChild(style);
            this.tailwindStyles = style;
        } catch (error) {
            console.error("Failed to load CSS file:", error);
        }
        // Listen for theme changes
        this.registerEvent(
            this.app.workspace.on('css-change', () => {
                this.updateTheme();
            })
        );
        // Register markdown processor
        this.registerMarkdownCodeBlockProcessor(
            'react',
            (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
                const child = new ReactComponentChild(el, this, ctx);
                ctx.addChild(child);
                // Set a timeout to detect long-running operations
                const timeoutId = setTimeout(() => {
                    new Notice('React component taking too long to render. Check for expensive operations.');
                }, 3000);
                child.render(source);
                clearTimeout(timeoutId);
            }
        );
        // Register a global Markdown postprocessor for HTML
        this.registerMarkdownPostProcessor((element, context) => {
            // Only process elements that are within ReactiveNotes components
            if (element.closest('.react-component-container')) {
                this.parseMarkdownInHtml(element);
            }
        });
        // Initial theme setup
        this.updateTheme();
    this.addSettingTab(new ReactiveNotesSettingTab(this.app, this));
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    onunload() {
        // Clean up styles
        if (this.tailwindStyles) {
            this.tailwindStyles.remove();
        }
            // Reset MathJax state
        if (window.MathJax) {
            try {
            window.MathJax.typesetClear();
            } catch (e) {
            console.warn("MathJax cleanup error:", e);
            }
        }
    }
    public updateTheme = () => {
        // Update theme class on all react component containers
        document.querySelectorAll('.react-component-container').forEach(el => {
            if (document.body.hasClass('theme-dark')) {
                el.classList.add('theme-dark');
                el.classList.add('dark');
                el.classList.remove('theme-light');
            } else {
                el.classList.add('theme-light');
                el.classList.remove('dark');
                el.classList.remove('theme-dark');
            }
            if (this.settings.forceTheme === 'dark') {
                el.classList.add('theme-dark');
                el.classList.add('dark');
                el.classList.remove('theme-light');
            }
            else if (this.settings.forceTheme === 'light') {
                el.classList.add('theme-light');
                el.classList.remove('dark');
                el.classList.remove('theme-dark');
            }
        });
    };
        

    private async parseMarkdownInHtml(container: HTMLElement) {
        // Query all divs or specific HTML blocks you want to process
        const htmlBlocks = Array.from(container.querySelectorAll('div:not(.markdown-rendered)')) as HTMLDivElement[];
        //console.log('Processing HTML container:', container);
        // Iterate over each div block
        for (const block of htmlBlocks) {
            // Check if it already contains rendered Markdown (to avoid double processing)
            if (block.querySelector('.markdown-rendered')) continue;
            
            // Render Markdown for the inner content of each block
            await MarkdownRenderer.render(
                this.app,
                block.textContent || "", // // Get text content
                block,           // Target container for rendered Markdown
                '',              // Path (optional, current file path if needed)
                this             // Plugin context
            );
            /*
            // Alternative if more control is needed:
            // Create a temporary div to safely extract text
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(block.cloneNode(true));
            const safeContent = tempDiv.textContent || "";
            
            await MarkdownRenderer.renderMarkdown(
            this.app,
            safeContent,
            block,
            '',
            this
            );
            */
            
            // After rendering, mark the block to avoid double processing
            block.classList.add('markdown-rendered');
        }
    }
    
    
}

class ReactiveNotesSettingTab extends PluginSettingTab {
    plugin: ReactNotesPlugin;
    
    constructor(app: App, plugin: ReactNotesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    
    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        new Setting(containerEl)
            .setName('Force Theme')
            .setDesc('Force a specific theme for all components')
            .addDropdown(dropdown => dropdown
                .addOption('auto', 'Auto')
                .addOption('dark', 'Dark')
                .addOption('light', 'Light')
                .setValue(this.plugin.settings.forceTheme)
                .onChange(async (value) => {
                    this.plugin.settings.forceTheme = value as 'dark' | 'light' | 'auto';
                    await this.plugin.saveSettings();
                    this.plugin.updateTheme();
                }));
        new Setting(containerEl)
            .setName('Enable MathJax')
            .setDesc('Process MathJax in React components')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.mathJaxEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.mathJaxEnabled = value;
                    await this.plugin.saveSettings();
                }));
    }
}