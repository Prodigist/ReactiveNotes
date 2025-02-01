// src/components/ComponentRenderer.tsx
import React, { useState, useEffect } from 'react';
import { transform } from '@babel/standalone';
import { ErrorBoundary } from './ErrorBoundary';
import { App } from 'obsidian';
import { useStorage } from '../hooks/useStorage';
import { ComponentRegistry } from '../core/registry';
import { StorageManager } from '../core/storage';

interface ComponentRendererProps {
    code: string;
    scopeId: string;
    inline?: boolean;
    storage: StorageManager;  // Add storage prop
    children?: React.ReactNode;
}

interface TransformError {
    message: string;
    line?: number;
    column?: number;
}

const ErrorDisplay: React.FC<{ error: TransformError }> = ({ error }) => {
    return (
        <div className="react-component-error">
            <p>Error in component:</p>
            <pre className="error-message">
                {error.message}
                {error.line && error.column && 
                    `\nAt line ${error.line}, column ${error.column}`
                }
            </pre>
        </div>
    );
};

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
    code,
    scopeId,
    storage,  // Get storage from props
    inline = false
}) => {
    const [Component, setComponent] = useState<React.ComponentType | null>(null);
    const [error, setError] = useState<TransformError | null>(null);

    useEffect(() => {
        const createComponent = async () => {
            try {
                const transformedCode = transform(code, {
                    presets: ['env','react'],
                    plugins: [
                        '@babel/plugin-syntax-jsx', // Add JSX syntax plugin explicitly
                        '@babel/plugin-transform-react-jsx', // Transforms JSX into JS
                        '@babel/plugin-proposal-class-properties', // Handles class properties
                        '@babel/plugin-proposal-object-rest-spread', // Handles object spread syntax
                    ],
                    filename: `component-${scopeId}`,
                    sourceType: 'module',
                    configFile: false,
                    babelrc: false
                }).code;
                console.log('Transformed Code:', transformedCode);
                // Create storage hook bound to this storage instance
                const boundUseStorage = <T,>(key: string, defaultValue: T) => 
                    useStorage(key, defaultValue, storage);

                // Enhanced scope with registry and storage
                const scope = {
                    React,
                    useState: React.useState,
                    useEffect: React.useEffect,
                    useRef: React.useRef,
                    useStorage: boundUseStorage, // Add bound storage hook
                    ...ComponentRegistry,
                };

                const componentFn = new Function(
                    ...Object.keys(scope),
                    `try {
                        ${transformedCode}
                        return Component;
                    } catch (err) {
                        console.error('Error in component execution:', err);
                        throw err;
                    }`
                );

                const ComponentType = componentFn(...Object.values(scope));
                setComponent(() => ComponentType);
                setError(null);
            } catch (err) {
                console.error('Component transformation failed:', err);
                setError({
                    message: err instanceof Error ? err.message : 'Unknown error',
                    line: (err as any).loc?.line,
                    column: (err as any).loc?.column
                });
                setComponent(null);
            }
        };

        createComponent();
    }, [code, scopeId, storage]); // Add storage to dependencies

    const Wrapper: React.FC<{ children: React.ReactNode }> = 
        inline ? ({ children }) => (
            <span className="inline-component">{children}</span>
        ) : ({ children }) => (
            <div className="block-component">{children}</div>
        );

    if (error) {
        return <ErrorDisplay error={error} />;
    }

    if (!Component) {
        return null;
    }

    return (
        <Wrapper>
            <div 
                className="component-sandbox"
                onClick={e => e.stopPropagation()}
            >
                <ErrorBoundary>
                    <Component />
                </ErrorBoundary>
            </div>
        </Wrapper>
    );
};