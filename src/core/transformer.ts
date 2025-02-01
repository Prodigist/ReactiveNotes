// src/core/transformer.ts
import { transform as babelTransform } from '@babel/standalone';

interface TransformOptions {
    scope?: Record<string, any>;
    filename?: string;
    isTypeScript?: boolean;
    isInline?: boolean;
}

interface TransformResult {
    code: string;
    component: React.ComponentType;
    error?: Error;
}

export class ComponentTransformer {
    private static defaultScope = {
        React: window.React,
        useState: window.React.useState,
        useEffect: window.React.useEffect,
        useRef: window.React.useRef,
        useMemo: window.React.useMemo,
        useCallback: window.React.useCallback,
    };

    static async transform(code: string, options: TransformOptions = {}): Promise<TransformResult> {
        try {
            // Prepare the code
            const processedCode = this.preprocessCode(code, options);

            // Transform the code using Babel
            const transformed = await this.babelTransform(processedCode, options);

            // Create the component
            const component = await this.createComponent(transformed, options);

            return {
                code: transformed,
                component
            };
        } catch (error) {
            console.error('Transformation error:', error);
            throw this.enhanceError(error);
        }
    }

    private static preprocessCode(code: string, options: TransformOptions): string {
        // Remove imports and exports first
        code = code.replace(/import\s+.*?['"];?\s*$/gm, '');
        code = code.replace(/import\s*{[^}]*}\s*from\s*['"][^'"]*['"];?\s*$/gm, '');
        code = code.replace(/import\s*\([^)]*\);?\s*$/gm, '');
        code = code.replace(/export\s+default\s+/, '');
        code = code.replace(/export\s+const\s+/, 'const ');
        code = code.replace(/export\s+function\s+/, 'function ');
        code = code.replace(/export\s+class\s+/, 'class ');

        // Handle any named component/function conversion to Component
        const namedComponentMatch = code.match(/const\s+(\w+)\s*=\s*\(\)\s*=>/);
        if (namedComponentMatch) {
            code = code.replace(
                `const ${namedComponentMatch[1]} = () =>`,
                'const Component = () =>'
            );
        } else if (!code.includes('const Component =') && !code.includes('function Component')) {
            code = `const Component = () => ${code}`;
        }

        return `
            try {
                ${code}
            } catch (error) {
                console.error('Error in component code:', error);
                throw error;
            }
        `;
    }

    private static async babelTransform(code: string, options: TransformOptions): Promise<string> {
        const transformed = babelTransform(code, {
            presets: [
                'react',
                ...(options.isTypeScript ? ['typescript'] : [])
            ] as string[],
            filename: options.filename || 'component.jsx',
            sourceType: 'module',
            configFile: false,
            babelrc: false,
            plugins: [
                // Add any custom plugins here
                this.createScopePlugin(options.scope)
            ]
        });

        return transformed.code;
    }

    private static async createComponent(code: string, options: TransformOptions): Promise<React.ComponentType> {
        // Create the scope with defaults and custom additions
        const scope = {
            ...this.defaultScope,
            ...options.scope
        };

        // Create the component function
        const componentFn = new Function(
            ...Object.keys(scope),
            `
            ${code}
            return typeof Component !== 'undefined' 
                ? Component 
                : () => null;
            `
        );

        try {
            // Execute with scope
            return componentFn(...Object.values(scope));
        } catch (error) {
            throw new Error(`Error creating component: ${error.message}`);
        }
    }

    private static createScopePlugin(customScope: Record<string, any> = {}) {
        // Custom babel plugin to handle scope
        return {
            visitor: {
                Identifier(path: any) {
                    const name = path.node.name;
                    if (
                        path.scope.hasBinding(name) || 
                        this.defaultScope.hasOwnProperty(name) ||
                        customScope.hasOwnProperty(name)
                    ) {
                        return;
                    }
                    
                    // Replace unknown identifiers with scoped access
                    path.replaceWith(
                        path.scope.buildUndefinedNode()
                    );
                }
            }
        };
    }

    private static getImports(): string {
        return `
            // Add any necessary imports here
            const { useState, useEffect, useRef, useMemo, useCallback } = React;
        `;
    }

    private static getExports(): string {
        return `
            if (typeof Component === 'undefined') {
                throw new Error('No component defined');
            }
        `;
    }

    private static stripTypeAnnotations(code: string): string {
        // Basic TypeScript stripping - in a real implementation,
        // you might want to use a proper TS transformer
        return code
            .replace(/:\s*[A-Za-z<>[\]]+/g, '')
            .replace(/<[A-Za-z,\s]+>/g, '');
    }

    private static enhanceError(error: Error): Error {
        // Enhance error messages for better debugging
        if (error.message.includes('Component')) {
            return new Error(`Component Error: ${error.message}`);
        }
        if (error.message.includes('React')) {
            return new Error(`React Error: ${error.message}`);
        }
        return error;
    }

    // Utility method for checking if code is TypeScript
    static isTypeScript(code: string): boolean {
        return /:\s*[A-Za-z]+/.test(code) || /<[A-Za-z,\s]+>/.test(code);
    }
}

// Example usage:
/*
const code = `
    const [count, setCount] = useState(0);
    return (
        <button onClick={() => setCount(c => c + 1)}>
            Count: {count}
        </button>
    );
`;

const { component: Counter } = await ComponentTransformer.transform(code, {
    scope: {
        // Additional scope variables
        customVar: 'value'
    },
    isInline: true
});
*/