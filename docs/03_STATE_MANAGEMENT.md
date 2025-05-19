# Feature: State Management in ReactiveNotes

ReactiveNotes provides robust mechanisms for managing state within your components, allowing for both transient UI state and persistent data storage that travels with your notes.

## 1. Local Component State (React `useState`)

For temporary UI state that doesn't need to persist across sessions or be saved to the note, you can use React's standard `useState` hook.

```javascript
// Example: A simple counter
const MyCounter = () => {
    const [count, setCount] = React.useState(0);

    return (
        <button onClick={() => setCount(prev => prev + 1)}>
            Clicked {count} times
        </button>
    );
};
export default MyCounter;
```
This state is reset every time the component is unmounted or the note is reloaded.
## 2. Persistent State with `useStorage` (Frontmatter Integration)

For state that you want to save with the note and persist across Obsidian sessions, ReactiveNotes provides the powerful `useStorage` hook. This hook directly interacts with the current note's frontmatter.

### Basic Usage

The `useStorage` hook is the primary way to create persistent state within your components.

```tsx
const [storedValue, setStoredValue, error] = useStorage(
  key,            // String: Property name to store in frontmatter (under `react_data` by default)
  defaultValue,   // Any: Default value if the key doesn't exist in frontmatter
  notePath = null, // Optional String: Path to another note (null = current note)
  extProp = false  // Optional Boolean:
                  //   false (default): Store under `react_data.<key>` in frontmatter
                  //   true: Store directly as `<key>` at the root level of frontmatter
);
```

- **`storedValue`**: The current value from frontmatter, or `defaultValue` if not found.
    
- **`setStoredValue`**: A function to update the value. It automatically saves the new value to the note's frontmatter.
    
- **`error`**: Contains an error message string if loading or saving failed, otherwise `null`.
    

**Example: A Persistent To-Do List Item**

```jsx
const PersistentTask = () => {
    // Uses 'myTask' as the key in frontmatter, defaults to an object if not found.
    const [task, setTask, storageError] = useStorage('myTask', { text: 'Default Task', completed: false });
    const [componentError, setComponentError] = React.useState(null); // Local error for this component example

    const toggleComplete = () => {
        try {
            setTask(prevTask => ({ ...prevTask, completed: !prevTask.completed }));
            setComponentError(null); // Clear local error on success
        } catch (e) {
            // This catch block might not be strictly necessary for setTask errors,
            // as useStorage aims to handle errors internally and expose them via storageError.
            // However, it can be useful for other logic within this function.
            setComponentError("Failed to update task: " + e.message);
        }
    };

    // Display any error from useStorage or local component logic
    if (storageError || componentError) {
        return <div style={{color: 'red'}}>{storageError || componentError}</div>;
    }

    return (
        <div>
            <input
                type="checkbox"
                checked={task.completed}
                onChange={toggleComplete}
                id="taskCheckbox"
            />
            <label htmlFor="taskCheckbox" style={{ textDecoration: task.completed ? 'line-through' : 'none', marginLeft: '8px' }}>
                {task.text}
            </label>
            {/* You could add an input here to change task.text and call setTask with the new object */}
        </div>
    );
};
export default PersistentTask;
```

### Storing at Root Level of Frontmatter

If you want to store data directly at the root of the frontmatter (outside the default `react_data` object), set the `extProp` argument to `true`.

```jsx
// Stores 'draft' under a top-level 'status' key in the current note's frontmatter
const [status, setStatus] = useStorage('status', 'draft', null, true);
```

This can be useful for interacting with frontmatter keys used by other plugins or for general note metadata.

### Cross-Note State Management

You can read and write state to _another_ note's frontmatter by providing the `notePath` argument.

```jsx
// Reads/writes 'tags' array from/to 'Templates/MyProjectTemplate.md' frontmatter (at the root level)
const [tags, setTags] = useStorage('tags', ['react'], 'Templates/MyProjectTemplate.md', true);
```

**Important:** Ensure the target note exists. Writing to a non-existent note path may result in errors or unexpected behavior.

### Deleting Keys from Frontmatter

To remove a key managed by `useStorage` from the frontmatter, set its value to `undefined`.

```jsx
setMyValue(undefined); // This will remove 'myValue' (or react_data.myValue) from the frontmatter
```

## 3. Direct Frontmatter Manipulation (Advanced)

While `useStorage` is the recommended and most convenient way to interact with frontmatter from within React components, ReactiveNotes also provides global helper functions for more direct manipulation. These might be useful in utility scripts or more complex, non-component-based scenarios.

- **`getFrontmatter(key?, defaultValue?, notePath?, extProp?)`**: Asynchronously retrieves values from frontmatter.
    
    - Returns the entire frontmatter object if `key` is null or undefined.
        
- **`updateFrontmatter(key, value, notePath?, extProp?)`**: Asynchronously updates or sets values in frontmatter.
    

```jsx
// Example of using global helpers (less common within typical components)
// This function is NOT a React component.
async function updateGlobalProjectStatus(newStatus) {
    try {
        // Updates the 'projectStatus' key at the root of 'ProjectPlan.md'
        await updateFrontmatter('projectStatus', newStatus, 'ProjectPlan.md', true);
        new Notice('Project status updated in ProjectPlan.md!');
    } catch (e) {
        new Notice('Failed to update project status: ' + e.message, 5000);
        console.error("Error updating frontmatter:", e);
    }
}

// To read the status:
async function readGlobalProjectStatus() {
    try {
        const status = await getFrontmatter('projectStatus', 'unknown', 'ProjectPlan.md', true);
        console.log('Current project status:', status);
        return status;
    } catch (e) {
        console.error("Error reading frontmatter:", e);
        return 'unknown';
    }
}
```

**Note:** These functions are asynchronous. For reactive updates that reflect in your UI, always prefer the `useStorage` hook within your React components.

## 4. Browser `localStorage` (Global, Non-Note-Specific State)

For state that needs to be shared across _all_ notes or persist independently of any specific note (e.g., global UI preferences for your plugin's components that aren't tied to a single file), you can use the browser's standard `localStorage` API.

ReactiveNotes does not provide a specific hook for `localStorage` out-of-the-box (as it's a standard browser feature), but you can easily create a custom hook or use `localStorage` directly.

Example: useLocalStorage Custom Hook

(This is a common pattern for creating a React-friendly localStorage wrapper)

```jsx
const useLocalStorage = (key, defaultValue) => {
  const [state, setState] = React.useState(() => {
    let storedValue;
    try {
      storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};

// Usage in a component:
const GlobalSettingsComponent = () => {
    const [userThemePreference, setUserThemePreference] = useLocalStorage('reactiveNotesUserTheme', 'system');
    // ... component logic using userThemePreference ...
    return (
        <select value={userThemePreference} onChange={e => setUserThemePreference(e.target.value)}>
            <option value="system">System Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    );
};
export default GlobalSettingsComponent;
```

**Key Characteristics of `localStorage`:**

- Data persists across browser/Obsidian sessions (Is not Vault specific).
    
- Shared globally across all notes (not tied to a specific note's frontmatter).
    
- Subject to browser storage limits (typically 5-10MB per domain).
    
- Persists until browser data is explicitly cleared by the user (e.g., through browser settings like "Clear browsing data") or programmatically via JavaScript (localStorage.removeItem('key') or `localStorage.clear