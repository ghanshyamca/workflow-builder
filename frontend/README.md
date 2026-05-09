# Workflow Builder - Frontend

Interactive React-based UI for the Workflow Builder automation platform. Built with React 18, TypeScript, Tailwind CSS, and React Flow.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Workflow/       # Workflow management components
│   │   ├── Canvas/         # Workflow canvas components
│   │   ├── Nodes/          # Node type components
│   │   ├── Monitoring/     # Execution monitoring components
│   │   ├── Auth/           # Authentication components
│   │   └── Common/         # Shared UI components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Redux/State management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── styles/             # Global styles
│   └── App.tsx
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Running backend API on http://localhost:3000

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd workflow-builder/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` if needed (default values point to localhost backend):
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL for real-time updates
- `VITE_APP_NAME` - Application name

## Running the Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:3001` by default.

## Building for Production

```bash
npm run build
```

Output files will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Available Scripts

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript types
npm run test           # Run tests
npm run test:ui        # Run tests with UI
npm run test:coverage  # Run tests with coverage
```

## Technology Stack

### Core
- **React 18** - UI library
- **React Router v6** - Routing
- **TypeScript** - Type safety

### State Management
- **Redux Toolkit** - State management
- **React Redux** - React bindings for Redux
- **Zustand** - Alternative lightweight state management

### UI & Styling
- **Tailwind CSS** - Utility-first CSS
- **React Flow** - Workflow canvas/graph visualization
- **Headless UI** - Unstyled UI components
- **Hero Icons** - SVG icons

### API & Data
- **Axios** - HTTP client
- **Socket.io Client** - Real-time WebSocket communication

### Development
- **Vite** - Build tool and dev server
- **TypeScript** - Type checking
- **ESLint** - Code linting
- **Vitest** - Unit testing
- **React Testing Library** - Component testing

## Key Features (To Be Implemented)

### Workflow Builder
- [ ] Interactive canvas with drag-and-drop interface
- [ ] Visual node connections
- [ ] Zoom and pan controls
- [ ] Auto-layout functionality
- [ ] Undo/redo support

### Node Types
- [ ] HTTP Request node UI
- [ ] Condition evaluation node UI
- [ ] Delay node configuration
- [ ] Notification node setup

### Workflow Management
- [ ] Create, edit, delete workflows
- [ ] Draft/Publish state management
- [ ] Version history and rollback
- [ ] Workflow templates
- [ ] Import/Export workflows

### Execution Monitoring
- [ ] Real-time execution tracking
- [ ] Execution history and filtering
- [ ] Detailed node-level logs
- [ ] Error tracking and debugging
- [ ] WebSocket live updates

### User Interface
- [ ] Dashboard overview
- [ ] Workflow list with search/filter
- [ ] Execution timeline
- [ ] Settings and preferences
- [ ] Mobile responsive design
- [ ] Dark mode support

### Authentication
- [ ] Login/Register pages
- [ ] JWT token management
- [ ] Protected routes
- [ ] User profile management

## API Integration

The frontend communicates with the backend API at endpoints like:

```
/api/workflows          - Workflow management
/api/triggers           - Trigger configuration
/api/executions         - Workflow execution history
/api/auth              - Authentication
```

See backend README for full API documentation.

## State Management

### Redux Store Structure
```
store/
├── workflow.slice.ts   - Workflows state
├── execution.slice.ts  - Executions state
└── auth.slice.ts       - Authentication state
```

### Redux Selectors & Actions
```typescript
// Example usage
import { useAppDispatch, useAppSelector } from '@/hooks'
import { selectWorkflows } from '@/store/workflow.slice'

const MyComponent = () => {
  const workflows = useAppSelector(selectWorkflows)
  const dispatch = useAppDispatch()
  // ...
}
```

## Custom Hooks

### Available Hooks
- `useAuth()` - Authentication state
- `useWorkflow()` - Workflow operations
- `useExecution()` - Execution monitoring
- `useFetch()` - Generic data fetching

## Testing

### Run Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Test Organization
```
src/
├── components/__tests__/
├── pages/__tests__/
├── services/__tests__/
└── utils/__tests__/
```

## Type Safety

Full TypeScript support with types for:
- API responses
- Component props
- Redux state
- Custom hooks
- Form data

## Code Quality

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **React Testing Library** - Component testing

## Performance Optimizations

- Code splitting with route-based lazy loading
- Component memoization for expensive renders
- API response caching
- Image optimization
- CSS-in-JS optimization with Tailwind

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Development Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Run tests: `npm test`
4. Push to branch: `git push origin feature/feature-name`
5. Create Pull Request

## Deployment

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Deploy to AWS S3 + CloudFront
```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name
```

## Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.ts
# Or kill process on port 3001
```

### CORS Issues
- Ensure backend is running
- Check CORS_ORIGIN in backend .env
- Update VITE_API_BASE_URL if needed

### Build Errors
```bash
npm install --force
npm run build
```

## Contributing

Please follow the existing code style and conventions:
- Use TypeScript for new files
- Write tests for new features
- Use meaningful commit messages
- Update documentation

## Resources

- [React Documentation](https://react.dev)
- [React Flow Docs](https://reactflow.dev)
- [Redux Toolkit Docs](https://redux-toolkit.js.org)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Vite Docs](https://vitejs.dev)

## License

MIT

## Support

For issues and questions, please create an issue in the GitHub repository.
