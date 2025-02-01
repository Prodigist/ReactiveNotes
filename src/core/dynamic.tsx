// src/core/dynamic.tsx
import React, { 
    useEffect, 
    useState, 
    ComponentType, 
    FC, 
    ComponentProps, 
    ReactElement 
} from 'react';

interface DynamicOptions {
    loading?: ComponentType;
    error?: ComponentType<{ error: Error }>;
}

type ImportFunction<T> = () => Promise<{ default: T }>;

const DefaultError: FC<{ error: Error }> = ({ error }): ReactElement => {
    return (
        <div className="dynamic-import-error">
            Error loading component: {error.message}
        </div>
    );
};

const DefaultLoading: FC = (): ReactElement => {
    return <div className="dynamic-loading">Loading...</div>;
};

export function dynamic<T extends ComponentType<any>>(
    importFn: ImportFunction<T>,
    options: DynamicOptions = {}
): FC<ComponentProps<T>> {
    const LoadingComponent: ComponentType = options.loading || DefaultLoading;
    const ErrorComponent: ComponentType<{ error: Error }> = options.error || DefaultError;

    const DynamicComponent: FC<ComponentProps<T>> = (props): ReactElement => {
        const [Component, setComponent] = useState<T | null>(null);
        const [error, setError] = useState<Error | null>(null);

        useEffect(() => {
            let mounted = true;

            const loadComponent = async (): Promise<void> => {
                try {
                    const module = await importFn();
                    if (mounted) {
                        setComponent(() => module.default);
                    }
                } catch (err) {
                    if (mounted) {
                        setError(err instanceof Error ? err : new Error('Failed to load component'));
                    }
                }
            };

            loadComponent();
            return () => { mounted = false; };
        }, []);

        if (error) {
            return <ErrorComponent error={error} />;
        }

        if (!Component) {
            return <LoadingComponent />;
        }

        return <Component {...props} />;
    };

    return DynamicComponent;
}

// Version for named exports
export function dynamicNamed<T extends ComponentType<any>>(
    importFn: () => Promise<T>,
    options: DynamicOptions = {}
): FC<ComponentProps<T>> {
    return dynamic(
        async () => ({ default: await importFn() }),
        options
    );
}