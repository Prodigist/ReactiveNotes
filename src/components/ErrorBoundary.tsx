// src/components/ErrorBoundary.tsx
import React from 'react';
import { RefreshCw } from 'lucide-react'; // Assuming you're using lucide-react for icons

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.setState({
            error,
            errorInfo
        });
        
        // Log error to console for debugging
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error!} />;
            }

            // Default error UI
            return (
                <div className="react-component-error p-4 rounded-md border border-red-500 bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-red-700 dark:text-red-400 font-medium">
                            Component Error
                        </h4>
                        <button
                            onClick={this.handleRetry}
                            className="flex items-center gap-1 px-2 py-1 text-sm rounded 
                                     bg-red-100 dark:bg-red-800/30 
                                     hover:bg-red-200 dark:hover:bg-red-800/50 
                                     text-red-700 dark:text-red-400
                                     transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                    
                    <div className="text-sm text-red-600 dark:text-red-300">
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                        <details className="mt-2">
                            <summary className="text-sm text-red-500 dark:text-red-400 cursor-pointer">
                                Stack trace
                            </summary>
                            <pre className="mt-2 p-2 text-xs overflow-auto bg-red-100/50 dark:bg-red-950/50 rounded">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return (
            <div className="relative">
                {this.props.children}
            </div>
        );
    }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ComponentType<{ error: Error }>
): React.FC<P> {
    return function WrappedComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

// Example usage of custom fallback:
/*
const CustomFallback: React.FC<{ error: Error }> = ({ error }) => (
    <div className="custom-error">
        <h4>Something went wrong</h4>
        <p>{error.message}</p>
    </div>
);

// Use with custom fallback
<ErrorBoundary fallback={CustomFallback}>
    <YourComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(YourComponent, CustomFallback);
*/