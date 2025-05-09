import { Plugin, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownRenderer, TFile, App, stringifyYaml, Notice, SuggestModal } from 'obsidian';
import { createRoot } from 'react-dom/client';
import { transform } from '@babel/standalone';
import * as React from 'react';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import { StorageManager } from 'src/core/storage';
import { useStorage } from 'src/hooks/useStorage';
import { ComponentRegistry } from 'src/components/componentRegistry';
import { ErrorBoundary } from 'src/components/ErrorBoundary';



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

    private async getFrontmatterData<T>(key: string, defaultValue: T): Promise<T> {
        if (!this.noteFile) return defaultValue;

        const cache = this.app.metadataCache.getFileCache(this.noteFile);
        const frontmatter = cache?.frontmatter;
        return frontmatter?.react_data?.[key] ?? defaultValue;
    }

    private async updateFrontmatterData<T>(key: string, value: T): Promise<void> {
        if (!this.noteFile) return;

        try {
            await this.app.fileManager.processFrontMatter(this.noteFile, (frontmatter) => {
                // Initialize react_data section if it doesn't exist
                if (!frontmatter.react_data) {
                    frontmatter.react_data = {};
                }
                
                // Update the specific key
                frontmatter.react_data[key] = value;
            });
        } catch (error) {
            console.error(`Failed to update frontmatter for key "${key}":`, error);
            new Notice(`Failed to save component state: ${error.message}`);
            throw error;
        }
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
        const componentMatch = code.match(/(?:function\s+(\w+)|(?:const|class)\s+(\w+)\s*=\s*(?:(?:\([^)]*\)|)\s*=>|function\s*\(|React\.memo\(|React\.forwardRef\(|class\s+extends\s+React\.Component))/);
        const componentName = componentMatch ?  (componentMatch[1] || componentMatch[2]) : 'EmptyComponent';
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

    async render(code: string) {
        console.time('component-render');
        try {

                // Add container classes for styling isolation
    this.containerEl.classList.add('react-component-container');
    
    // Apply theme class for dark mode
    /*
    if (document.body.classList.contains('theme-dark')) {
      this.containerEl.classList.add('dark');
    } else {
      this.containerEl.classList.remove('dark');
    }*/

            //console.log('Original code:', code);
            console.time('preprocess');
            // Preprocess code
            const needsThree=this.needsThree(code);
            const processedCode = this.preprocessCode(code);
            //console.log('Processed code:', processedCode);
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
            // Create scope with all required dependencies
            const scope = {
                ...ComponentRegistry,
                useStorage: boundUseStorage,
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
readFile: async (path=null, extensions = ['txt', 'md', 'json','csv']) => {
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
            console.log("File content:");
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
            // If onClose is called, and a suggestion hasn't ALREADY been chosen and processed,
            // this implies a cancellation or an edge case where onClose fires very quickly.
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
    private tailwindStyles: HTMLStyleElement | null = null; // Tailwind styles reference
    async onload() {
  try {
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
                child.render(source);
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
    }

    onunload() {
          // Clean up styles
  if (this.tailwindStyles) {
    this.tailwindStyles.remove();
  }
    }
    private updateTheme = () => {
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