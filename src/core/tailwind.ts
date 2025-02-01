// src/core/tailwind.ts
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export class TailwindProcessor {
    private config: any;
    
    constructor() {
        this.config = {
            content: ['./src/**/*.{ts,tsx}'],
            theme: {
                extend: {},
            },
            // Disable preflight to avoid conflicts with Obsidian
            corePlugins: {
                preflight: false
            }
        };
    }

    // Process Tailwind CSS
    async process(css: string): Promise<string> {
        const result = await postcss([
            tailwindcss(this.config),
            autoprefixer
        ]).process(css, { 
            from: undefined 
        });

        return result.css;
    }
}

