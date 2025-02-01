// src/core/styles.ts
export const componentStyles = {
    // Base component styles
    reactComponent: `
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    `,
    
    // Button styles
    reactComponentButton: `
        padding: 0.5rem 1rem;
        color: var(--text-on-accent);
        background-color: var(--interactive-accent);
        border-radius: 0.25rem;
        
        &:hover {
            background-color: var(--interactive-accent-hover);
        }
    `,

    // Chart-specific styles
    chartContainer: (theme: 'dark' | 'light') => `
        background: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
        color: ${theme === 'dark' ? '#94a3b8' : '#475569'};
        border: 1px solid var(--background-modifier-border);
        border-radius: 0.5rem;
        min-height: 400px;
    `,

    // List styles
    listContent: `
        margin: 0;
        padding-left: 1.5rem;
        list-style-type: none;
        
        li {
            margin-bottom: 0.5rem;
            color: var(--text-normal);
        }
    `,
};

// Common utility classes that don't need runtime processing
export const utilityClasses = {
    layout: {
        'w-full': 'width: 100%;',
        'grid': 'display: grid;',
        'grid-cols-2': 'grid-template-columns: repeat(2, minmax(0, 1fr));',
        'gap-4': 'gap: 1rem;',
    },
    spacing: {
        'mt-4': 'margin-top: 1rem;',
        'mb-2': 'margin-bottom: 0.5rem;',
        'p-4': 'padding: 1rem;',
    },
    colors: {
        'text-green-500': 'color: var(--color-green);',
        'text-red-500': 'color: var(--color-red);',
        'text-blue-500': 'color: var(--interactive-accent);',
    }
};

// Theme-aware chart configuration
export const getChartConfig = (theme: 'dark' | 'light') => ({
    layout: {
        background: { 
            color: theme === 'dark' ? '#1e293b' : '#ffffff' 
        },
        textColor: theme === 'dark' ? '#94a3b8' : '#475569',
    },
    grid: {
        vertLines: { 
            color: theme === 'dark' ? '#334155' : '#e2e8f0' 
        },
        horzLines: { 
            color: theme === 'dark' ? '#334155' : '#e2e8f0' 
        },
    }
});