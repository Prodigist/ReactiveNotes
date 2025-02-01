// src/core/scope.ts
import React from 'react';
import { App } from 'obsidian';

interface ScopeOptions {
    app?: App;
    parentScope?: ComponentScope;
    isGlobal?: boolean;
}

export class ComponentScope {
    private static instances = new Map<string, ComponentScope>();
    private static globalScope: ComponentScope | null = null;
    
    private variables = new Map<string, any>();
    private children = new Set<ComponentScope>();
    private readonly defaultScope: Record<string, any>;

    constructor(
        private readonly id: string,
        private readonly options: ScopeOptions = {}
    ) {
        // Initialize default React scope
        this.defaultScope = {
            React,
            useState: React.useState,
            useEffect: React.useEffect,
            useRef: React.useRef,
            useMemo: React.useMemo,
            useCallback: React.useCallback,
            useContext: React.useContext,
            // Add Obsidian app if available
            app: options.app,
        };

        if (options.isGlobal) {
            ComponentScope.globalScope = this;
        } else if (options.parentScope) {
            options.parentScope.addChild(this);
        }

        ComponentScope.instances.set(id, this);
    }

    // Get a value from scope
    get(name: string): any {
        // Check local variables first
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }

        // Check default scope
        if (name in this.defaultScope) {
            return this.defaultScope[name];
        }

        // Check parent scope
        if (this.options.parentScope) {
            return this.options.parentScope.get(name);
        }

        // Check global scope as last resort
        if (!this.options.isGlobal && ComponentScope.globalScope) {
            return ComponentScope.globalScope.get(name);
        }

        return undefined;
    }

    // Set a value in scope
    set(name: string, value: any): void {
        this.variables.set(name, value);
    }

    // Remove a value from scope
    delete(name: string): boolean {
        return this.variables.delete(name);
    }

    // Check if scope has a variable
    has(name: string): boolean {
        return (
            this.variables.has(name) ||
            name in this.defaultScope ||
            (this.options.parentScope?.has(name) ?? false) ||
            (!this.options.isGlobal && (ComponentScope.globalScope?.has(name) ?? false))
        );
    }

    // Add a child scope
    private addChild(scope: ComponentScope): void {
        this.children.add(scope);
    }

    // Remove a child scope
    private removeChild(scope: ComponentScope): void {
        this.children.delete(scope);
    }

    // Clear all variables in this scope
    clear(): void {
        this.variables.clear();
    }

    // Dispose of this scope
    dispose(): void {
        if (this.options.parentScope) {
            this.options.parentScope.removeChild(this);
        }
        ComponentScope.instances.delete(this.id);
        this.clear();
        
        // Dispose of all children
        this.children.forEach(child => child.dispose());
        this.children.clear();
    }

    // Get all variables in this scope (including inherited)
    getAllVariables(): Record<string, any> {
        const variables: Record<string, any> = {
            ...this.defaultScope,
            ...Object.fromEntries(this.variables)
        };

        if (this.options.parentScope) {
            return {
                ...this.options.parentScope.getAllVariables(),
                ...variables
            };
        }

        return variables;
    }

    // Static methods for scope management
    static getScope(id: string): ComponentScope | undefined {
        return this.instances.get(id);
    }

    static createScope(id: string, options: ScopeOptions = {}): ComponentScope {
        if (this.instances.has(id)) {
            throw new Error(`Scope with id "${id}" already exists`);
        }
        return new ComponentScope(id, options);
    }

    static getOrCreateScope(id: string, options: ScopeOptions = {}): ComponentScope {
        return this.instances.get(id) || new ComponentScope(id, options);
    }

    static disposeScope(id: string): void {
        const scope = this.instances.get(id);
        if (scope) {
            scope.dispose();
        }
    }

    // Create a hook for React components to access scope
    static createScopeHook(scopeId: string) {
        return function useScopeValue(name: string) {
            const scope = ComponentScope.getScope(scopeId);
            if (!scope) {
                throw new Error(`Scope "${scopeId}" not found`);
            }
            return scope.get(name);
        };
    }
}

// Helper function to create a new component scope
export function createComponentScope(
    id: string,
    app?: App,
    parentScope?: ComponentScope
): ComponentScope {
    return new ComponentScope(id, { app, parentScope });
}

// React hook for accessing scope
export function useComponentScope(scopeId: string) {
    return React.useMemo(() => {
        const scope = ComponentScope.getScope(scopeId);
        if (!scope) {
            throw new Error(`Scope "${scopeId}" not found`);
        }
        return scope;
    }, [scopeId]);
}

// Example usage:
/*
// Create a global scope
const globalScope = new ComponentScope('global', { isGlobal: true });
globalScope.set('sharedValue', 42);

// Create a component scope
const componentScope = createComponentScope('component-1', app);
componentScope.set('localValue', 'hello');

// In a React component:
function MyComponent() {
    const scope = useComponentScope('component-1');
    const localValue = scope.get('localValue');
    const sharedValue = scope.get('sharedValue');
    
    return (
        <div>
            Local: {localValue}, Shared: {sharedValue}
        </div>
    );
}
*/