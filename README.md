# ReactiveNotes - Dynamic React Components in Obsidian

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22reactive-notes%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

ReactiveNotes transforms your Obsidian notes into interactive documents by enabling full React component capabilities directly within your markdown files.

## Core Capabilities

### 1. Interactive Components
- Write and use React components directly in markdown
- Full React 18 feature support including Hooks
- Real-time component updates
- TypeScript support
- Hot reloading during development

### 2. Data Visualization
Built-in libraries:
- **Recharts**: Full suite of chart components
  - Line, Bar, Area, Pie charts
  - Custom tooltips and legends
  - Responsive containers
- **Lightweight Charts**: Professional-grade financial charts
  - Candlestick charts
  - Technical indicators
  - Custom overlays

### 3. Canvas Manipulation
- Direct canvas access for custom drawing
- Real-time canvas updates
- Image processing capabilities
- Custom overlays and annotations
- Interactive drawing tools

### 4. Data Processing
- Real-time data manipulation
- CSV/Excel file processing
- Data transformation utilities
- Pattern recognition
- Statistical analysis

### 5. State Management
- Persistent storage between sessions
- State synchronization across components
- Frontmatter integration
- Cross-note state management

### 6. UI Components
Ready-to-use components from shadcn/ui:
- Cards
- Tabs
- Dialogs
- Forms
- Buttons
- Alerts

## Integration Features

### 1. File System Integration
```javascript
// Access and manipulate files
const fileContent = await window.fs.readFile('example.csv');
const jsonData = await window.fs.readFile('data.json', { encoding: 'utf8' });
```

### 2. Theme Integration
```javascript
// Automatic theme detection
const theme = getTheme(); // 'dark' or 'light'

// Theme-aware styling
const styles = {
  background: theme === 'dark' ? '#1a1b1e' : '#ffffff',
  color: theme === 'dark' ? '#ffffff' : '#000000'
};
```

### 3. Data Persistence
```javascript
// Persistent storage hook
const [value, setValue] = useStorage('key', defaultValue);

// Automatic state persistence
const [count, setCount] = useStorage('counter', 0);
```

## Component Types

### 1. Visualization Components
```react
// Interactive data visualization
const DataVisualization = () => {
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" />
        <Tooltip />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### 2. Canvas Components
```react
// Interactive canvas usage
const CanvasComponent = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    // Custom drawing and animations
  }, []);

  return <canvas ref={canvasRef} />;
};
```

### 3. Network Visualizations
```react
// Force-directed graphs
const NetworkGraph = () => {
  return (
    <ForceGraph
      nodes={nodes}
      links={links}
      onNodeClick={handleClick}
    />
  );
};
```

## Technical Features

### 1. React Integration
- Full React 18 support
- Hooks support
- Error Boundaries
- Suspense support
- TypeScript enabled

### 2. Performance
- Efficient re-rendering
- Automatic cleanup
- Memory leak prevention
- Resource management
- Lazy loading support

### 3. Development Tools
- Hot reloading
- Error reporting
- Debug mode
- Performance monitoring

## API Access

### 1. Available Libraries
- React + Hooks
- Recharts
- Lightweight Charts
- d3-force
- Lucide icons
- shadcn/ui components

### 2. Utility Functions
- File system operations
- Data processing
- Theme detection
- State persistence
- Math operations

### 3. Component Registry
- Custom component registration
- Component sharing
- Dynamic loading
- Type safety

## Best Practices

### 1. Component Design
```react
const ResponsiveComponent = () => {
  // Use relative units
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        {/* Component content */}
      </ResponsiveContainer>
    </div>
  );
};
```

### 2. State Management
```react
const StatefulComponent = () => {
  // Use persistent storage for important state
  const [data, setData] = useStorage('data-key', initialData);
  
  // Use local state for UI-only state
  const [isOpen, setIsOpen] = useState(false);
};
```

### 3. Error Handling
```react
const SafeComponent = () => {
  return (
    <ErrorBoundary fallback={<ErrorDisplay />}>
      {/* Component content */}
    </ErrorBoundary>
  );
};
```

## Limitations

- No external package imports (use provided libraries)
- Limited to frontend functionality
- Storage is note-specific through frontmatter
- Component code must be self-contained

## Future Plans

- Additional visualization libraries
- Enhanced state management
- Component sharing mechanism
- Template system
- Enhanced debugging tools

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## Support

- Report bugs through [GitHub Issues](https://github.com/YourUsername/ReactiveNotes/issues)
- Request features in [Discussions](https://github.com/YourUsername/ReactiveNotes/discussions)
- Join our [Discord community](your-discord-link)

## License

MIT License - see [LICENSE](LICENSE) for details

---

<p align="center">Built with ❤️ for the Obsidian community</p>