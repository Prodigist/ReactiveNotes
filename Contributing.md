# Contributing to ReactiveNotes

> ⚡️ Help us advance the Obsidian powerhouse

First off, thank you for considering contributing to ReactiveNotes! It's people like you who make ReactiveNotes an amazing tool for the Obsidian community.

## 🗺️ Development Roadmap

Before diving in, check our current focus areas:

- 📱 Mobile support optimization
- 🎨 Enhanced visualization capabilities
- 🔄 State management improvements
- 🧪 Testing infrastructure
- 📚 Documentation enhancements

## 🔧 Development Setup

### Prerequisites

- Node.js (v16.0.0 or higher)
- npm or yarn
- Git
- Obsidian (v1.4.0 or higher)

### Local Development Environment

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/ReactiveNotes.git
cd ReactiveNotes
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a development vault:
```bash
mkdir TestVault
cd TestVault
mkdir .obsidian/plugins/reactive-notes
```

4. Link your development build:
```bash
# From project root
npm run dev
# This will watch for changes and rebuild
```

5. Enable the plugin in Obsidian:
- Open Obsidian settings
- Go to Community Plugins
- Enable ReactiveNotes

## 🏗️ Project Structure

```
ReactiveNotes/
├── src/
│   ├── config/               # Configuration and registry
│   │   └── componentRegistry.ts
│   ├── components/          # React components
│   │   ├── core/
│   │   └── ui/
│   ├── services/           # Core services
│   │   ├── storage.ts
│   │   └── marketData.ts
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── main.tsx          # Plugin entry point
├── styles/               # CSS and Tailwind configs
├── tests/               # Test files
└── types/              # TypeScript definitions
```

## 🧪 Testing Guidelines

### Unit Tests

```bash
npm run test
```

Tests should be placed in the `tests` directory, mirroring the source structure:

```typescript
// tests/components/MyComponent.test.ts
describe('MyComponent', () => {
    it('should render correctly', () => {
        // Test code
    });
});
```

### Integration Tests

```bash
npm run test:integration
```

Integration tests should focus on:
- Component interactions
- Plugin initialization
- File system operations
- State persistence

### Manual Testing Checklist

- [ ] Test in both light and dark themes
- [ ] Verify mobile responsiveness
- [ ] Check memory usage
- [ ] Validate error handling
- [ ] Test with different vault configurations
## 📝 Code Style Guidelines

### TypeScript Standards

```typescript
// Use explicit typing
interface ComponentProps {
    data: DataType[];
    onUpdate: (newData: DataType) => void;
}

// Prefer functional components
const MyComponent: React.FC<ComponentProps> = ({ data, onUpdate }) => {
    // Implementation
};

// Use proper type guards
function isValidData(data: unknown): data is DataType {
    return (
        typeof data === 'object' &&
        data !== null &&
        'id' in data
    );
}
```

### React Best Practices

1. **Hooks Organization**
```typescript
const MyComponent: React.FC = () => {
    // 1. State hooks
    const [data, setData] = useState<DataType[]>([]);
    
    // 2. Ref hooks
    const containerRef = useRef<HTMLDivElement>(null);
    
    // 3. Memoization
    const processedData = useMemo(() => 
        data.map(processItem), 
        [data]
    );
    
    // 4. Effects
    useEffect(() => {
        // Effect logic
        return () => {
            // Cleanup
        };
    }, [dependencies]);
    
    // 5. Event handlers
    const handleUpdate = useCallback(() => {
        // Handler logic
    }, [dependencies]);
    
    // 6. Render
    return <div />;
};
```

2. **Component Structure**
- One component per file
- Clear prop interfaces
- Proper error boundaries
- Effective memo usage

### Documentation Requirements

1. **Component Documentation**
```typescript
/**
 * Visualizes data using an interactive chart.
 * 
 * @component
 * @example
 * ```jsx
 * <DataVisualizer
 *   data={[1, 2, 3]}
 *   title="My Chart"
 * />
 * ```
 * 
 * @param {Object} props
 * @param {number[]} props.data - Data points to visualize
 * @param {string} props.title - Chart title
 */
```

2. **README Updates**
- Document new features
- Update API references
- Add usage examples
- Note breaking changes

## 🔄 Pull Request Process

### 1. Branch Naming
```bash
feature/description-of-feature
bugfix/issue-being-fixed
docs/documentation-updates
test/testing-improvements
```

### 2. Commit Messages
```bash
# Format
<type>(<scope>): <description>

# Examples
feat(components): add new visualization component
fix(storage): resolve persistence issue
docs(readme): update installation instructions
test(core): add unit tests for storage service
```

### 3. PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Screenshots
If applicable

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] All tests passing
```

## 📋 Review Process

### Code Review Checklist

1. **Functionality**
   - [ ] Meets requirements
   - [ ] Handles edge cases
   - [ ] Error handling implemented
   - [ ] Performance considered

2. **Code Quality**
   - [ ] Follows style guide
   - [ ] Properly typed
   - [ ] No unnecessary complexity
   - [ ] Clean architecture

3. **Testing**
   - [ ] Unit tests added
   - [ ] Integration tests updated
   - [ ] Edge cases covered
   - [ ] Performance tested

4. **Documentation**
   - [ ] API docs updated
   - [ ] Examples provided
   - [ ] Breaking changes noted
   - [ ] Migration guide if needed

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- MAJOR.MINOR.PATCH
- Breaking.Feature.Fix

### Release Checklist

1. **Pre-release**
   - [ ] All tests passing
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated
   - [ ] Version bumped
   - [ ] Build artifacts verified

2. **Release**
   - [ ] GitHub release created
   - [ ] Tags pushed
   - [ ] NPM package published
   - [ ] Release notes completed

3. **Post-release**
   - [ ] Documentation deployed
   - [ ] Community notified
   - [ ] Version bumped to next dev version

## 🤝 Community Guidelines

### Communication
- Be respectful and inclusive
- Keep discussions technical
- Provide context with questions
- Use appropriate channels

### Support
- Check existing issues first
- Provide minimal reproduction
- Include environment details
- Follow issue templates

### Recognition
Contributors are recognized in:
- CONTRIBUTORS.md
- Release notes
- Community spotlights

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.