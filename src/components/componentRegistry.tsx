// src/config/componentRegistry.tsx
import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    ComposedChart, BarChart, XAxis, YAxis, Bar, Line, Area,
    ReferenceLine, LineChart, CartesianGrid, Treemap,
    ScatterChart, Scatter, // For plotting points
RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, // For radar charts
AreaChart, // Dedicated area chart
RadialBarChart, RadialBar, // For radial/circular progress
} from 'recharts';
import { createChart } from 'lightweight-charts';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import {
    Upload, Activity, AlertCircle, TrendingUp, TrendingDown, Home, BarChart2, BarChart3, Code, Settings, Moon, Sun, ChevronLeft, ChevronRight, Heart, ExternalLink,
    Play, Image as ImageIcon, Check, X, Plus, Minus, ArrowRightCircle, ArrowLeftCircle, ArrowUpCircle, ArrowDownCircle,
    ChevronUp, ChevronDown, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, PlusCircle, MinusCircle, XCircle, CheckCircle,
    Info, Search, Trash, Edit, Save, Share, Copy, Pause, Undo, Redo, ZoomIn, ZoomOut, PlayCircle, PauseCircle, Circle, Clock, Calendar,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
    Card, CardHeader, CardTitle, CardContent, CardFooter,
    Tabs, TabsContent, TabsList, TabsTrigger,
    Switch, CardDescription,
} from 'src/components/ui/';

//Data Processing Libraries
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { parse, stringify } from 'csv/sync';
import * as mathjs from 'mathjs';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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
    CartesianGrid,
    Treemap, ScatterChart, Scatter,

RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
AreaChart, 
RadialBarChart, RadialBar,
    
    // UI Components
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    CardDescription,
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
    Home,
    BarChart3,
    Code,
    Settings,
    Moon,
    Sun,
    ChevronLeft,
    ChevronRight,
    Heart,
    ExternalLink, BarChart2,
    Play, ImageIcon, Check, X, Plus, Minus, ArrowRightCircle, ArrowLeftCircle, ArrowUpCircle, ArrowDownCircle,
    ChevronUp, ChevronDown, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, PlusCircle, MinusCircle, XCircle, CheckCircle,
    Info, Search, Trash, Edit, Save, Share, Copy, Pause, Undo, Redo, ZoomIn, ZoomOut, PlayCircle, PauseCircle, Circle, Clock, Calendar,
    LucideIcons,
        //data processing utilities
        dateFns: { format, addDays, differenceInDays, parseISO },
        csv: { parse, stringify },
        math: mathjs,
        XLSX,
        Papa,
} as const;


// Utilities that aren't React components
export const Utilities = {
    createChart,
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
} as const;



// All exports combined
export const ComponentRegistry = {
    ...ReactUtils,
    ...Components,
    ...Utilities,
} as const;



// Optional Type guard for checking if a component exists
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

// Optional Type-safe hook usage
type Hook<T> = (...args: any[]) => T;
export const getHook = <T>(name: keyof typeof ReactUtils): Hook<T> | undefined => {
    const hook = ReactUtils[name];
    return typeof hook === 'function' ? hook as Hook<T> : undefined;
};*/