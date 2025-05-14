# ReactiveNotes Component Reference

This document provides a reference guide to the libraries, components, and utilities available in ReactiveNotes. All of these are automatically available in your React components without requiring explicit import statements.
> Note: Need a library that's not listed here? You can use CDN imports from cdnjs.cloudflare.com for additional libraries. For permanent additions to the core library set, please open an issue on GitHub with your request.
## Table of Contents
- [React Core](#react-core)
- [UI Components](#ui-components)
- [Data Visualization](#data-visualization)
- [Icons](#icons)
- [Data Processing](#data-processing)
- [File System](#file-system)
- [Utilities](#utilities)

## React Core

```jsx
// React hooks
useState, useEffect, useRef, useMemo, useCallback

// Core React object
React.createElement, React.Fragment
```

Basic usage:
```jsx
const MyComponent = () => {
  const [count, setCount] = useState(0);
  
  return <div>Count: {count}</div>;
};
```

## UI Components

### shadcn/ui Components

ReactiveNotes includes some components from [shadcn/ui](https://ui.shadcn.com/):

**Available Components:**
- **Card:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Navigation:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- **Controls:** `Switch`

Basic usage:
```jsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Main content goes here</CardContent>
</Card>

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">First Tab</TabsTrigger>
    <TabsTrigger value="tab2">Second Tab</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Tab 1 content</TabsContent>
  <TabsContent value="tab2">Tab 2 content</TabsContent>
</Tabs>
```

## Data Visualization

### Recharts

ReactiveNotes includes the full [Recharts](https://recharts.org/) library:

**Available Components:**
- **Chart types:** `LineChart`, `BarChart`, `PieChart`, `AreaChart`, `ScatterChart`, `RadarChart`, `RadialBarChart`, `ComposedChart`, `Treemap`, `ScatterChart`, `RadarChart`
- **Chart elements:** `Line`, `Bar`, `Pie`, `Area`, `Scatter`, `Radar`, `RadialBar`
- **Axes & Grid:** `XAxis`, `YAxis`, `CartesianGrid`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`
- **Utilities:** `ResponsiveContainer`, `Tooltip`, `Legend`, `Cell`, `ReferenceLine`

Basic usage:
```jsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="name" />
    <YAxis />
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
    <Tooltip />
  </LineChart>
</ResponsiveContainer>
```

### Lightweight Charts

For financial charting, ReactiveNotes includes [Lightweight Charts](https://www.tradingview.com/lightweight-charts/):

**Available Methods:**
- `createChart()` - Create a new chart instance
- Chart instance methods: `addAreaSeries()`, `addBarSeries()`, `addCandlestickSeries()`, `addHistogramSeries()`, `addLineSeries()`

Basic usage:
```jsx
useEffect(() => {
  const chart = createChart(container, options);
  const series = chart.addCandlestickSeries();
  series.setData(data);
  
  return () => chart.remove();
}, []);
```

## Icons

ReactiveNotes includes a large collection of [Lucide Icons](https://lucide.dev/):
A good portion are accessible directly while the complete collection can be accessed via LucideIcons.<IconName> at runtime
**Available Icon Categories:**
- **Interface:** `Home`, `Settings`, `Search`, `ChevronLeft/Right/Up/Down`, `ArrowLeft/Right/Up/Down`, etc.
- **Media:** `Play`, `Pause`, `Image`
- **Data:** `BarChart2`, `BarChart3`, `TrendingUp`, `Activity`
- **Actions:** `Plus`, `Minus`, `Check`, `X`, `Edit`, `Save`, `Trash`
- **Themes:** `Sun`, `Moon`

Basic usage:
```jsx
<TrendingUp className="h-6 w-6 text-green-500" />
<Activity className="h-6 w-6 text-blue-500" />
<Settings className="h-6 w-6" />
```

## Data Processing

### CSV Parsing (Papa Parse)

**Key Functions:**
- `Papa.parse()` - Parse CSV text into arrays/objects
- `Papa.unparse()` - Convert arrays/objects to CSV

Basic usage:
```jsx
Papa.parse(csvString, {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  complete: (results) => console.log(results.data)
});
```

### Excel Files (SheetJS)

**Key Functions:**
- `XLSX.read()` - Read spreadsheet data from various formats
- `XLSX.utils.sheet_to_json()` - Convert worksheet to array of objects

Basic usage:
```jsx
const workbook = XLSX.read(data, { type: 'binary' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet);
```

### Date Handling (date-fns)

**Available Functions:**
- `format` - Format dates
- `addDays` - Add days to a date
- `differenceInDays` - Get day difference
- `parseISO` - Parse ISO date strings
Available through the dateFns object:

Basic usage:
```jsx
const formattedDate = format(new Date(), 'MMMM d, yyyy');
const nextWeek = addDays(new Date(), 7);
```

### Math (mathjs)

**Key Features:**
- Basic arithmetic and algebra
- Statistical functions
- Matrix operations
- Symbolic math

Basic usage:
```jsx
const sum = math.add(2, 3);
const mean = math.mean([1, 2, 3, 4, 5]);
const derivative = math.derivative('x^2', 'x');
```
## CSV Processing
**Available through the csv object:**
```jsx
const parsed = csv.parse(csvString, options);
const csvOutput = csv.stringify(dataArray);
```

## File System

ReactiveNotes provides file access within Obsidian via the `readFile` function:

**Parameters:**
- `path` (optional) - Direct path to file (skips file picker if provided)
- `extensions` (optional) - Array of file extensions to filter by


**Return Value:**
An object containing:
- `path` - Full file path
- `name` - File name without extension
- `extension` - File extension
- `content` - File content as string

Basic usage:
```jsx
// With file picker
const file = await readFile(['md', 'txt']);
if (file) console.log(file.content);

// Direct path access
const configFile = await readFile(null, 'path/to/config.json');
if (configFile) {
  const config = JSON.parse(configFile.content);
}
```
## State Management
**useStorage Hook**
The `useStorage` hook provides persistent state storage in note frontmatter:
```jsx
const [value, setValue, error] = useStorage(
  key,            // Storage key
  defaultValue,   // Default value if key doesn't exist 
  notePath,       // Optional: path to another note (null for current note)
  extProp         // Optional: true to store at root level, false for react_data (default: false)
);
```
**Parameters:**

`key` (string) - The storage key
`defaultValue` (any) - Default value if not found
`notePath` (string, optional) - Path to another note, null for current note
`extProp` (boolean, optional) - When true, stores at frontmatter root level instead of under react_data

Return Value:

`[0]` (any) - Current stored value
`[1]`(function) - Setter function to update value
`[2]` (string) - Error message if update failed, otherwise null

### Frontmatter Functions

#### getFrontmatter

Access frontmatter data in the current note or any note:
```jsx
const data = await getFrontmatter(
  key,        // Optional: specific key to retrieve
  defaultValue, // Optional: default value if key not found
  notePath,   // Optional: path to another note
  extProp     // Optional: true for root frontmatter, false for react_data, Default: true
);
```

**Parameters:**

- `key` (string, optional) - Specific key to retrieve, null for entire frontmatter
- `defaultValue` (any, optional) - Default value if key not found
- `notePath` (string, optional) - Path to another note, null for current note
- `extProp` (boolean, optional) - When true, accesses root frontmatter, defaults to true

#### updateFrontmatter

Update frontmatter in the current note or any note:


```jsx
await updateFrontmatter(
  key,        // Key to update
  value,      // New value
  notePath,   // Optional: path to another note
  extProp     // Optional: true for root frontmatter, false for react_data, Default: false
);
```

**Parameters:**

- `key` (string) - Key to update
- `value` (any) - New value to set
- `notePath` (string, optional) - Path to another note, null for current note
- `extProp` (boolean, optional) - When true, updates root frontmatter, defaults to false


## Utilities

### Network Graphs (d3-force)

**Available Functions:**
- `forceSimulation()` - Create force simulation
- `forceLink()` - Create link forces
- `forceManyBody()` - Create charge forces
- `forceCenter()` - Create centering force

Basic usage:
```jsx
const simulation = forceSimulation(nodes)
  .force('link', forceLink(links).id(d => d.id))
  .force('charge', forceManyBody().strength(-200))
  .force('center', forceCenter(width/2, height/2));
```

### Theme Integration

ReactiveNotes provides a `getTheme()` function to detect Obsidian's current theme:

```jsx
const theme = getTheme(); // Returns 'dark' or 'light'

// In JSX with conditional styling
<div className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
  Content adapts to theme
</div>
```
### User Notifications
Display notifications to users:
```jsx
Notice(message, timeout);
```

### Note Context
Access information about the current note:
```jsx
// Available note information
noteContext.path      // Full path to current note
noteContext.basename  // Filename without extension
noteContext.frontmatter  // All frontmatter properties
```
---

## Further Resources

For detailed documentation on the included libraries:

- [Recharts Documentation](https://recharts.org/en-US/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Lucide Icons Gallery](https://lucide.dev/icons/)
- [Papa Parse Documentation](https://www.papaparse.com/docs)
- [SheetJS Documentation](https://docs.sheetjs.com/)
- [date-fns Documentation](https://date-fns.org/docs/Getting-Started)
- [mathjs Documentation](https://mathjs.org/docs/index.html)
- [d3-force Documentation](https://github.com/d3/d3-force)