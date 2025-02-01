// src/core/registry.tsx
import React, { FC, ComponentProps } from 'react';
import { dynamic, dynamicNamed } from './dynamic';

interface Registry {
    PieChart: FC<ComponentProps<any>>;
    Chart: FC<ComponentProps<any>>;
    ForceGraph2D: FC<ComponentProps<any>>;
    [key: string]: FC<ComponentProps<any>>;  // Add index signature
    Pie: FC<ComponentProps<any>>;
    Cell: FC<ComponentProps<any>>;
    ResponsiveContainer: FC<ComponentProps<any>>;
    Tooltip: FC<ComponentProps<any>>;
    Legend: FC<ComponentProps<any>>;
}

export const ComponentRegistry: Registry = {
    // For named exports from recharts, use dynamicNamed
    PieChart: dynamicNamed(() => 
        import('recharts').then(mod => mod.PieChart)
    ),
    Pie: dynamicNamed(() => 
        import('recharts').then(mod => mod.Pie)
    ),
    Cell: dynamicNamed(() => 
        import('recharts').then(mod => mod.Cell)
    ),
    ResponsiveContainer: dynamicNamed(() => 
        import('recharts').then(mod => mod.ResponsiveContainer)
    ),
    Tooltip: dynamicNamed(() => 
        import('recharts').then(mod => mod.Tooltip)
    ),
    Legend: dynamicNamed(() => 
        import('recharts').then(mod => mod.Legend)
    ),
    
    // For components with default exports, use dynamic
    Chart: dynamic(() => import('react-apexcharts')),
    ForceGraph2D: dynamicNamed(() => 
        import('react-force-graph').then(mod => mod.ForceGraph2D)
    )
};

export const getRegisteredComponent = (name: string): FC<ComponentProps<any>> | null => {
    return ComponentRegistry[name] || null;
};