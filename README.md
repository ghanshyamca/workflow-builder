# Workflow Builder - Full Stack Automation Platform

A comprehensive workflow automation platform (similar to n8n and Make) that allows users to design, execute, and monitor workflows connecting multiple services.

## Project Overview

**Workflow Builder** is a full-stack application consisting of:
- **Backend**: Node.js/Express REST API with PostgreSQL database
- **Frontend**: React-based visual workflow builder and monitoring dashboard

## 🎯 Key Features

### Workflow Management
- Visual workflow builder with drag-and-drop interface
- Draft and publish workflow states
- Version history and rollback
- Workflow templates
- Import/Export workflows

### Triggers
- Webhook triggers with security (HMAC validation)
- Schedule triggers (cron expressions)
- Timezone support

### Node Types
- HTTP Request (GET/POST with headers, auth)
- Condition (JSON field evaluation with branching)
- Delay (pause execution)
- Notify (Email, Slack, etc.)
- Extensible node system

### Execution Engine
- DAG-based workflow execution
- Real-time execution monitoring
- Detailed node-level logs
- Error tracking and notifications
- Automatic retries with exponential backoff

### Monitoring & Logs
- Execution history and filtering
- Real-time status updates (WebSocket)
- Node execution details
- Error stack traces
- Performance metrics

### Security & Rate Limiting
- JWT-based authentication
- API key management
- Rate limiting per user
- Input validation and sanitization
- CORS configuration

## 📁 Project Structure

```
workflow-builder/
├── backend/              # Node.js/Express API
│   ├── src/
│   ├── database/         # Schema and migrations
│   ├── package.json
│   └── README.md
├── frontend/             # React TypeScript UI
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── PROJECT_PLAN.md       # Development roadmap
└── README.md
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

**Prerequisites**
- Docker >= 20.10
- Docker Compose >= 2.0

**Installation**
```bash
git clone <repository-url>
cd workflow-builder
cp .env.docker .env
docker-compose up --build
```

Access:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

See [DOCKER.md](./DOCKER.md) for detailed Docker guide.

### Option 2: Local Setup

**Prerequisites**
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 12
- Redis >= 6.0 (optional)

**Installation**

#### 1. Clone Repository
```bash
git clone <repository-url>
cd workflow-builder
```

#### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run migrate        # Initialize database
npm run dev           # Start server (http://localhost:3000)
```

#### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev           # Start app (http://localhost:3001)
```

## 📖 Documentation

- [Backend README](./backend/README.md) - API documentation and setup
- [Frontend README](./frontend/README.md) - UI setup and component guide
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Development roadmap and implementation phases

## 🛠 Technology Stack

### Backend
- **Node.js** + Express - REST API
- **PostgreSQL** - Primary database
- **Redis** + Bull - Job queuing
- **JWT** - Authentication
- **Winston** - Logging

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **React Flow** - Workflow canvas
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## 🔄 Workflow Execution Flow

```
1. User creates workflow in visual builder
2. Publish workflow (frozen state)
3. Trigger fires (webhook or schedule)
4. Workflow queued for execution
5. Execution engine:
   - Parse DAG structure
   - Execute nodes in order
   - Pass output → input between nodes
   - Handle conditions and branching
   - Retry on failures
6. Store execution logs
7. Real-time update to UI
8. User can view detailed logs and metrics
```

## 📊 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token

### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `POST /api/workflows/:id/publish` - Publish workflow
- `POST /api/workflows/:id/execute` - Execute workflow

### Triggers
- `GET /api/triggers` - List triggers
- `POST /api/triggers` - Create trigger
- `PUT /api/triggers/:id` - Update trigger

### Executions
- `GET /api/executions` - List runs
- `GET /api/executions/:id` - Get run details
- `POST /api/executions/:id/pause` - Pause execution
- `POST /api/executions/:id/resume` - Resume execution

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                # Run all tests
npm run test:coverage   # With coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                # Run all tests
npm run test:coverage   # With coverage report
npm run test:ui         # With UI
```

## 📦 Deployment

### Backend Deployment
```bash
cd backend
npm run build           # Build if needed
docker build -t workflow-builder-api .
```

### Frontend Deployment
```bash
cd frontend
npm run build           # Build production bundle
# Deploy dist/ folder to your hosting
```

### Docker Compose (Optional)
```bash
docker-compose up       # Runs both backend and frontend
```

## 📈 Development Roadmap

### Phase 1-5: Backend Core (Weeks 1-3)
- ✅ Project setup and architecture
- Auth system
- Workflow management APIs
- Trigger system
- Node implementations

### Phase 6-12: Backend Advanced (Weeks 4-7)
- Execution engine
- Monitoring and logging
- Error handling
- Testing and deployment

### Phase 13-21: Frontend (Weeks 8-13)
- Project setup
- Workflow canvas
- Workflow list and management
- Execution monitoring
- Node configuration UI

### Phase 22-24: Integration & Demo (Weeks 14-15)
- Full-stack testing
- Deployment
- Documentation
- Demonstration video

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed roadmap.

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit
3. Run tests: `npm test`
4. Push and create Pull Request

## 📝 Code Style

- Use TypeScript for type safety
- Follow existing code conventions
- Write meaningful commit messages
- Include tests for new features
- Update documentation

## 🔒 Security

- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration
- JWT token authentication
- Secret key encryption
- Rate limiting
- HTTPS ready

## ⚡ Performance

- Connection pooling
- Database indexing
- Response compression
- Code splitting
- Caching strategies
- Asset optimization

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL is running
# Verify .env configuration
# Check port 3000 is available
```

### Frontend build fails
```bash
npm install --force
npm run build
```

### API connection issues
- Ensure backend is running on http://localhost:3000
- Check CORS_ORIGIN in backend .env
- Verify VITE_API_BASE_URL in frontend .env

## 📞 Support

For issues and questions:
1. Check existing issues on GitHub
2. Review documentation in README files
3. Create new issue with details

## 📄 License

MIT License

## 👥 Authors

- Created for Airtribe Backend Engineering Launchpad

## 🎓 Learning Resources

- [n8n - Open Source Alternative](https://n8n.io)
- [Express.js Guide](https://expressjs.com)
- [React Documentation](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

---

**Status**: 🚧 In Development

**Last Updated**: May 4, 2026
