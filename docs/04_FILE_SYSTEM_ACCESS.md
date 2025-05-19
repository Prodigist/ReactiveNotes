# Feature: File Reading Utility

ReactiveNotes provides a convenient `readFile` utility that allows your components to interactively select and read files from your Obsidian vault, or to read a specific file by its path.

This utility is essential for components that need to process data from various file types, such as text files, Markdown notes, CSV data, JSON configurations, and more.

## How to Use

The `readFile` function is available in the scope of your React components. You can call it using `await` as it returns a Promise.

**Basic Syntax:**

```javascript
async function loadAndProcessFile() {
    const fileData = await readFile(path, extensions);

    if (fileData) {
        // Process fileData.content, fileData.name, etc.
        console.log(`Successfully read: ${fileData.name}`);
        console.log(`Content snippet: ${fileData.content.substring(0, 100)}`);
    } else {
        // Handle cancellation or file not found/read error
        console.log('File selection was cancelled or file could not be read.');
    }
}
```
## Parameters

The `readFile` function accepts two optional parameters:

1. **`path`** (optional):
    
    - Type: `string | null`
        
    - Default: `null`
        
    - Description: If you provide a string representing the full path to a specific file within your vault (e.g., `'data/mydata.csv'` or `'Templates/My Template.md'`), the utility will attempt to read that file directly without showing the interactive file selection modal.
        
    - If `null` or not provided, the utility will open a suggestion modal allowing the user to search and select a file from the vault.
        
2. **`extensions`** (optional):
    
    - Type: `string[]`
        
    - Default: `['txt',` 'md', 'json', 'csv']
        
    - Description: An array of file extensions (without the leading dot) to filter the files shown in the suggestion modal. This helps users quickly find relevant files. This parameter is ignored if a direct `path` is provided.
        

## Return Value

The `readFile` function returns a `Promise` that resolves to either:

- **An object** containing file details if a file is successfully selected and read:
    
    - `path`: (string) The full path to the file in the vault (e.g., `folder/My File.md`).
        
    - `name`: (string) The base name of the file without the extension (e.g., `My File`).
        
    - `extension`: (string) The file extension without the leading dot (e.g., `md`).
        
    - `content`: (string) The raw text content of the file.
        
- **`null`**: If:
    
    - The user cancels the file selection modal (e.g., by pressing Escape or closing it).
        
    - A direct `path` is provided but the file is not found or cannot be read.
        
    - An unexpected error occurs during the file reading process.
        

Your component should always check if the return value is `null` to handle these cases gracefully.
## Use Cases

The `readFile` utility is versatile and can be used for:

- Loading datasets for charts and visualizations (CSV, JSON).
    
- Importing configurations or settings for components.
    
- Displaying content from other notes or text files.
    
- Building simple knowledge base explorers.
    
- Creating components that process or analyze text from files.

## Examples

### 1. Interactive File Selection (Default Behavior)

This will open a modal for the user to choose a file. By default, it filters for `.txt`, `.md`, `.json`, and `.csv` files.

```jsx
const MyDataProcessor = () => {
    const [fileContent, setFileContent] = React.useState('');
    const [fileName, setFileName] = React.useState('');

    const handleLoadFile = async () => {
        const fileData = await readFile(); // Uses default extensions
        if (fileData) {
            setFileName(fileData.name);
            setFileContent(fileData.content);
            // For CSV, you might parse it here:
            // if (fileData.extension === 'csv') {
            //     const parsedData = Papa.parse(fileData.content, { header: true });
            //     console.log(parsedData.data);
            // }
        } else {
            new Notice('File selection cancelled.');
        }
    };

    return (
        <div>
            <button onClick={handleLoadFile}>Load File</button>
            {fileName && <h4>Displaying: {fileName}</h4>}
            {fileContent && <pre style={{maxHeight: '200px', overflowY: 'auto'}}>{fileContent}</pre>}
        </div>
    );
};
export default MyDataProcessor;
```

### 2. Interactive Selection with Custom Extension Filters

This will open a modal filtering for only Markdown (`.md`) and text (`.txt`) files.

```
const loadMarkdownOrTextFile = async () => {
    const fileData = await readFile(null, ['md', 'txt']);
    if (fileData) {
        console.log(`Content of ${fileData.path}:`, fileData.content);
    }
};
```

### 3. Direct File Access by Path

This will attempt to read `path/to/my/config.json` directly without showing a modal.

```
const loadSpecificConfig = async () => {
    const filePath = 'configs/settings.json'; // Relative to vault root
    const fileData = await readFile(filePath);

    if (fileData && fileData.extension === 'json') {
        try {
            const config = JSON.parse(fileData.content);
            console.log('Configuration loaded:', config);
            // Use the config object
        } catch (e) {
            new Notice(`Error parsing JSON from ${filePath}: ${e.message}`);
            console.error("JSON parsing error:", e);
        }
    } else if (fileData) {
        new Notice(`Expected a JSON file but got .${fileData.extension}`);
    } else {
        new Notice(`Could not read file: ${filePath}. Ensure it exists.`);
    }
};
```

### 4. Reading CSV Data for Charts

```
// (Assuming you have a chart component that takes data)
const CSVChartLoader = () => {
    const [chartData, setChartData] = React.useState(null);

    const loadCSV = async () => {
        const fileData = await readFile(null, ['csv']);
        if (fileData && fileData.extension === 'csv') {
            // Assuming PapaParse is available in scope
            const parsed = Papa.parse(fileData.content, { header: true, dynamicTyping: true });
            if (parsed.errors.length > 0) {
                new Notice("Errors found while parsing CSV: " + parsed.errors[0].message);
                return;
            }
            setChartData(parsed.data);
            new Notice(`Loaded ${parsed.data.length} rows from ${fileData.name}`);
        } else if (fileData) {
            new Notice(`Selected file was not a CSV: ${fileData.name}`);
        }
    };

    return (
        <div>
            <button onClick={loadCSV}>Load CSV for Chart</button>
            {/* {chartData && <MyChartComponent data={chartData} />} */}
            {chartData && <pre>Data Loaded: {JSON.stringify(chartData.slice(0,2))}...</pre>}
        </div>
    );
};
export default CSVChartLoader;
```    

By providing both interactive selection and direct path access, `readFile` offers flexibility for various component needs within ReactiveNotes.