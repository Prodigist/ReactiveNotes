// src/config/componentRegistry.ts
import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    ComposedChart, BarChart, XAxis, YAxis, Bar, Line, Area,
    ReferenceLine, LineChart
} from 'recharts';
import { createChart } from 'lightweight-charts';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import {
    Upload, Activity, AlertCircle, TrendingUp, TrendingDown,
    // Add other icons as needed
} from 'lucide-react';
import {
    Card, CardHeader, CardTitle, CardContent,
    Tabs, TabsContent, TabsList, TabsTrigger,
    Switch,
} from 'src/components/ui/';

// Core React hooks wrapper
// Type for React utilities (non-component exports)
export const ReactUtils = {
    React,
    useState: React.useState,
    useEffect: React.useEffect,
    useRef: React.useRef,
    useMemo: React.useMemo,
    useCallback: React.useCallback,
} as const;

// Only actual components
export const Components = {
    // Chart Components
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    ComposedChart,
    BarChart,
    XAxis,
    YAxis,
    Bar,
    Line,
    Area,
    ReferenceLine,
    LineChart,
    
    // UI Components
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Switch,

    // Icons
    Upload,
    Activity,
    AlertCircle,
    TrendingUp,
    TrendingDown,
} as const;

// Utilities that aren't React components
export const Utilities = {
    createChart,
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    THREE: (window as any).THREE || require('three'), // Use global THREE if available
} as const;



// All exports combined
export const ComponentRegistry = {
    ...ReactUtils,
    ...Components,
    ...Utilities,
} as const;



// Optional: Type guard for checking if a component exists
export const hasComponent = (name: string): name is keyof typeof ComponentRegistry => {
    return name in ComponentRegistry;
};

// main.tsx can now be simplified to:
// import { ComponentRegistry } from './config/componentRegistry';
// const scope = ComponentRegistry;


/* Optionol stuff
// Type for actual components only
type ComponentsOnly = {
    [K in keyof typeof Components]: typeof Components[K];
};

// Type for props of actual components
export type ComponentProps = {
    [K in keyof ComponentsOnly]: ComponentsOnly[K] extends ComponentType<infer P> ? P : never;
};

// Type guard for checking if something is a component
export const isComponent = (name: keyof typeof ComponentRegistry): name is keyof ComponentsOnly => {
    return name in Components;
};

// Type guard for checking if something is a utility
export const isUtility = (name: keyof typeof ComponentRegistry): name is keyof typeof Utilities => {
    return name in Utilities;
};

// Helper to get component safely
export function getComponent<K extends keyof ComponentsOnly>(name: K): ComponentsOnly[K] {
    return Components[name];
}

// Optional: Type-safe hook usage
type Hook<T> = (...args: any[]) => T;
export const getHook = <T>(name: keyof typeof ReactUtils): Hook<T> | undefined => {
    const hook = ReactUtils[name];
    return typeof hook === 'function' ? hook as Hook<T> : undefined;
};*/