# ReactiveNotes - Dynamic React Components in Obsidian




[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22reactive-notes%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-%23FFDD00?style=flat&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/prodigist)

Transform your Obsidian vault into a reactive computational environment. ReactiveNotes seamlessly integrates React's component ecosystem with Obsidian's powerful note-taking capabilities, enabling dynamic, interactive documents that evolve with your thoughts.
> ⚠️ **Mobile Support**: Currently optimized for desktop use. Mobile support is under development.

## Why ReactiveNotes?

- **Native Integration**: Built from the ground up for Obsidian
- **Powerful Yet Simple**: Write React components directly in your notes
- **Dynamic & Interactive**: Turn static notes into living documents
- **Extensible Foundation**: Build your own tools and visualizations
## Compatibility

- Obsidian v1.4.0 or higher
- React v18.2.0
- Libraries:
  - Recharts v2.10.0
  - Lightweight Charts v4.1.0
  - d3-force v3.0.0
  - lucide-react v0.263.1
  - shadcn/ui (latest components)



## 🚀 Quick Start

### Installation
1. Open Obsidian Settings → Community Plugins
2. Disable Safe Mode if necessary
3. Search for "ReactiveNotes"
4. Click Install and Enable

For manual installation:
1. Download release from GitHub
2. Extract to your vault's `.obsidian/plugins` folder
3. Enable in Community Plugins settings

### Basic Usage

Create a React component in any note:
````markdown
```react
const Greeting = () => {
    const [name, setName] = useState("World");
    return <h1>Hello, {name}!</h1>;
};

export default Greeting;
```
````

**Component Requirements:**
- Must include a default export
- Must be self-contained in one code block
- Component name should match default export

### Component Structure

A typical component structure follows this basic structure:
````
```react
// Optional: CDN imports at the top
import ExternalLib from 'https://cdnjs.cloudflare.com/...';

// Component definition
const MyComponent = () => {
    // 1. Hooks
    const [state, setState] = useState(null);
    const componentRef = useRef(null);
    
    // 2. Effects & Lifecycle
    useEffect(() => {
        // Setup code
        return () => {
            // Cleanup code
        };
    }, []);
    
    // 3. Helper functions
    const handleEvent = () => {
        // Event handling logic
    };
    
    // 4. Render
    return (
        <div>
            {/* Your JSX here */}
        </div>
    );
};

// Required: Default export
export default MyComponent;
```
````
**Key Structure Points**:
1. Imports always at the top
2. Component name matches default export
3. Hooks before effects
4. Helper functions before render
5. Single default export at bottom



## 📚  Built-in Libraries & Components

### React Core & Hooks
```javascript
import React, { useState, useEffect, useRef, useMemo } from react';
```
### UI Components from shadcn/ui
```javascript
import { 
    Card, CardHeader, CardTitle, CardContent,
    Tabs, TabsList, TabsTrigger,
    Button, Dialog, Form
} from '@/components/ui';
```
### Visualization Libraries
```javascript
//Include Responsive containers
// Recharts for data visualization
import { 
    LineChart, BarChart, PieChart,
    Line, Bar, Pie, 
    Tooltip, Legend 
} from 'recharts';

// Lightweight Charts for financial charts
import { createChart } from 'lightweight-charts';

// D3-force for network graphs
import { 
    forceSimulation, 
    forceLink 
} from 'd3-force';
```
### Icons
```javascript
import { 
    Upload, Activity, AlertCircle,
    TrendingUp, TrendingDown 
} from 'lucide-react';
```
## 💻 Core Features

### 1. Component Systems
- Write React components directly in notes
- Full TypeScript and React 18 support
- Hot reloading during development
- Error Boundaries and Suspense
- Resource cleanup and lifecycle management
- Custom component registration
- Real-time component updates
- Error reporting

### 3. Canvas Manipulation
- Direct canvas access for custom drawing
- Real-time canvas updates
- Image processing capabilities
- Custom overlays and annotations
- Interactive drawing tools



### 5. Performance
- Efficient re-rendering
- Memory leak prevention
- Lazy loading support

### 2. State Management
```javascript
// Local state with React
const [local, setLocal] = useState(0);

// Persistent state in note frontmatter
const [stored, setStored] = useStorage('key', defaultValue);
```
- Persistent storage between sessions
- State synchronization across components
- Frontmatter integration
- Cross-note state management

### Note-Specific Data Persistence
- Each note maintains independent state through frontmatter
- Component states persist across sessions
- Data automatically travels with notes when shared
- Multiple instances of same component can have different states
- Perfect for creating reusable interactive templates

Example:

```javascript
// In Note1.md - counter starts at 0
const Counter = () => {
    const [count1, setCount1] = useStorage('counter', 0);
    return <button onClick={() => setCount1(count1 + 1)}>Count: {count1}</button>;
};

// In Note2.md - same component, independent state
const Counter = () => {
    const [count2, setCount2] = useStorage('counter', 0);
    return <button onClick={() => setCount2(count2 + 1)}>Count: {count2}</button>;
};
```

### 3. File System Integration
```javascript
// Read files with encoding
const text = await window.fs.readFile('data.txt', { 
    encoding: 'utf8' 
});

// Read binary files
const binary = await window.fs.readFile('data.xlsx');
```

### 4. CDN Library Support
Import additional libraries from cdnjs:
```javascript
import Chart from 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
```

Requirements:
- HTTPS URLs from cdnjs.cloudflare.com only
- Imports at component top
- Browser-compatible libraries only

### 5. Theme Integration
```javascript
const theme = getTheme(); // Returns 'dark' or 'light'

const styles = {
    background: theme === 'dark' ? 'var(--background-primary)' : 'white',
    color: theme === 'dark' ? 'var(--text-normal)' : 'black'
};
```


### File System Access
```javascript
// Read files
const csv = await window.fs.readFile('data.csv', { encoding: 'utf8' });
const binary = await window.fs.readFile('data.xlsx');
```

## 🎨 Component Examples

### Interactive Data Visualization
````
```react
const DataChart = () => {
    const data = [
        { month: 'Jan', value: 100 },
        { month: 'Feb', value: 150 },
        { month: 'Mar', value: 120 }
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <XAxis dataKey="month" />
                <YAxis />
                <Line type="monotone" dataKey="value" />
                <Tooltip />
            </LineChart>
        </ResponsiveContainer>
    );
};
```
````
![alt text](assets/ResponsiveDatavis.gif)
### Canvas Manipulation
````
const DrawingCanvas = () => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = getTheme() === 'dark' ? '#fff' : '#000';
        
        // Your drawing code
        
        return () => {
            // Cleanup
        };
    }, []);

    return <canvas ref={canvasRef} className="w-full h-64" />;
};
````
### Persistent State Component
````
```react
const NoteTracker = () => {
    const [notes, setNotes] = useStorage('notes', []);
    
    const addNote = (text) => {
        setNotes(prev => [...prev, {
            id: Date.now(),
            text,
            created: new Date()
        }]);
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Notes</CardTitle>
            </CardHeader>
            <CardContent>
                {notes.map(note => (
                    <div key={note.id}>{note.text}</div>
                ))}
                <Button onClick={() => addNote("New Note")}>
                    Add Note
                </Button>
            </CardContent>
        </Card>
    );
};
```
````

### Network Visualization
````
```react
const NetworkGraph = () => {
    const [nodes] = useState([
        { id: 1, label: 'Node 1' },
        { id: 2, label: 'Node 2' }
    ]);
    
    const [links] = useState([
        { source: 1, target: 2 }
    ]);

    return (
        <ForceGraph
            graphData={{ nodes, links }}
            nodeAutoColorBy="label"
            nodeLabel="label"
        />
    );
};
```
````
![alt text](assets/graphVis.gif)
### Other Demonstrated Examples
**Simulator** (Use within reason for performance)
![alt text](assets/Simulator.gif)

**File Upload**
![alt text](assets/FileUpload.gif)

**3D Animation**
![alt text](assets/Three_js.gif)

**Tabbed UI**
![alt text](assets/TabbedUI.gif)

## 🛠️Development Guide
### Component Structure
```react
// Basic component template
const MyComponent = () => {
    // 1. Hooks and state
    const [data, setData] = useState(null);
    const componentRef = useRef(null);
    
    // 2. Effects and lifecycle
    useEffect(() => {
        // Setup code
        return () => {
            // Cleanup code
        };
    }, []);
    
    // 3. Event handlers
    const handleUpdate = useCallback(() => {
        // Handler code
    }, []);
    
    // 4. Render
    return (
        <div>
            {/* Component JSX */}
        </div>
    );
};

export default MyComponent;
```

### Best Practices

1. **Component Design**
   ```react
   const ResponsiveComponent = () => {
       return (
           <div className="w-full">
               <ResponsiveContainer width="100%" height={400}>
                   {/* Content adapts to container */}
               </ResponsiveContainer>
           </div>
       );
   };
   ```

2. **State Management**
   ```react
   const DataComponent = () => {
       // Persistent data
       const [savedData, setSavedData] = useStorage('data-key', []);
       
       // Temporary UI state
       const [isLoading, setIsLoading] = useState(false);
       
       // Computed values
       const processedData = useMemo(() => {
           return savedData.map(item => /* process */);
       }, [savedData]);
   };
   ```

3. **Error Handling**
   ```react
   const SafeComponent = () => {
       return (
           <ErrorBoundary
               fallback={({ error }) => (
                   <div className="text-red-500">
                       Error: {error.message}
                   </div>
               )}
           >
               {/* Protected content */}
           </ErrorBoundary>
       );
   };
   ```
1. **Error Checking**:
   - Check browser console for errors
   - Verify imports are working
   - Ensure all required exports are present

2. **Performance**:
   - Keep components focused and minimal
   - Use CDN imports sparingly
   - Clean up resources in useEffect

3. **Testing**:
   - Test in both light and dark themes
   - Verify mobile responsiveness (Hasn't been tested for mobile yet)
   - Check CDN imports load correctly

## 🔧 Troubleshooting

### Common Issues
1. **Component not rendering**
   - Verify default export is present
   - Check console for React errors
   - Ensure all imports are available and supported
   - Validate JSX syntax

2. **CDN imports not working**
   - Verify HTTPS URL
   - Check library compatibility
   - Confirm import syntax

3. **State persistence issues**
   - Check frontmatter permissions
   - Verify storage key uniqueness
   - Validate data serialization
   - Monitor storage size limits

4. **Performance Problems**
   - Use React DevTools for profiling
   - Implement proper cleanup in useEffect
   - Optimize re-renders with useMemo/useCallback
   - Monitor memory usage with large datasets

## ⚠️ Important Notes

### Mobile Compatibility
- Currently optimized for desktop use
- Mobile support is under development
- Test thoroughly on mobile devices

### Performance and Resource Management
Best practices for optimal performance:

- Clean up subscriptions and intervals
- Dispose of chart instances
- Release canvas resources
- Free up WebGL contexts
- Use persistent storage thoughtfully

### Security Considerations
- CDN imports are restricted to cdnjs.cloudflare.com
- File system access is limited to vault
- Component code runs in sandbox
- No external network requests

## 📋 Technical Reference
### Available APIs

1. **File System**
   ```javascript
   // File operations
   await window.fs.readFile(path, options);
   const text = await window.fs.readFile(path, { encoding: 'utf8' });
   ```

2. **Theme Management**
   ```javascript
   // Theme utilities
   const theme = getTheme();
   const isDark = theme === 'dark';
   ```

3. **Storage**
   ```javascript
   // Storage hooks
   const [value, setValue] = useStorage(key, defaultValue);
   const stored = useStorage(key, null, storage);
   ```


## Limitations

1. **Environment Constraints**
   - CDN imports limited to cdnjs.cloudflare.com
   - Components must be self-contained in one code block
   - Network requests follow Obsidian's security policies

2. **Performance Considerations**
   - Large datasets may impact performance
   - Heavy animations should be optimized
   - Memory usage needs monitoring
   - Mobile performance varies

3. **Work in Progress**
   - Mobile support still under development
   - Some touch interactions need optimization
   - Advanced debugging tools coming soon

## 🔮 Future Plans

### Upcoming Features
1. Advanced Visualization
   - More chart types
   - Enhanced animations
   - 3D visualization support
   - Custom chart templates

2. Developer Experience
   - Component templates
   - Debug tools
   - Performance monitoring
   - Testing utilities

3. Mobile Support
   - Touch optimization
   - Responsive layouts
   - Performance improvements
   - Mobile-specific components

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 💬 Support

- Report bugs through [GitHub Issues](https://github.com/Prodigist/ReactiveNotes/issues)
- Request features in [Discussions](https://github.com/Prodigist/ReactiveNotes/discussions)
- Join our [Discord community](# "Discord link to be added")

## License

MIT License - see [LICENSE](# "LICENSE") for details

---

<p align="center">⚡️Built to advance the Obsidian powerhouse</p>



[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/prodigist)