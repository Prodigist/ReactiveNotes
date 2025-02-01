// src/types/babel-standalone.d.ts
declare module '@babel/standalone' {
    export interface TransformOptions {
        filename?: string;
        presets?: (string | [string, object])[]; //Also allow tuple
        plugins?: any[];
        configFile?: boolean | string;
        babelrc?: boolean;
        sourceType?: 'script' | 'module' | 'unambiguous';
        sourceMaps?: boolean;
        sourceFileName?: string;
        code?: boolean;
        ast?: boolean;
        minified?: boolean;
    }

    export interface TransformResult {
        code: string;
        map?: any;
        ast?: any;
        metadata?: any;
    }

    export function transform(
        code: string,
        options?: TransformOptions
    ): TransformResult;

    export const availablePresets: { [key: string]: any };
    export const availablePlugins: { [key: string]: any };
}