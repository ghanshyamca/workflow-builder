# Workflow Builder - Backend API

A Node.js/Express-based workflow automation platform backend that enables users to design, execute, and monitor workflows connecting multiple services (similar to n8n and Make).

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   └── validators/      # Input validation
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── workers/             # Background workers
│   ├── utils/               # Utilities (logger, helpers)
│   ├── config/              # Configuration files
│   └── app.js              # Express app
├── database/
│   ├── schema.sql          # Database schema
│   └── init.js             # Database initialization
├── package.json
├── .env.example
└── README.md
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 12
- Redis >= 6.0 (optional, for job queuing)

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd workflow-builder/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database credentials
- JWT secrets
- Port settings
- etc.

### 4. Initialize Database

First, ensure PostgreSQL is running, then:

```bash
npm run migrate
```

This will:
- Create the `workflow_builder` database
- Create all tables and indexes
- Set up relations and constraints

## Running the Server

### Development Mode
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production Mode
```bash
npm start
```

## API Endpoints Overview

### Health Check
- `GET /health` - Server health status
- `GET /api/version` - API version info

### Authentication (to be implemented)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Workflows (to be implemented)
- `GET /api/workflows` - List user's workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/:id` - Get workflow details
- `PUT /api/workflows/:id` - Update workflow (draft only)
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/publish` - Publish workflow
- `POST /api/workflows/:id/execute` - Execute workflow

### Triggers (to be implemented)
- `GET /api/triggers` - List workflow triggers
- `POST /api/triggers` - Create trigger
- `PUT /api/triggers/:id` - Update trigger
- `DELETE /api/triggers/:id` - Delete trigger

### Executions (to be implemented)
- `GET /api/executions` - List workflow runs
- `GET /api/executions/:id` - Get run details
- `POST /api/executions/:id/pause` - Pause execution
- `POST /api/executions/:id/resume` - Resume execution
- `POST /api/executions/:id/stop` - Stop execution

## Database Schema

### Main Tables
- **users** - User accounts
- **workflows** - Workflow definitions
- **workflow_versions** - Version history
- **triggers** - Webhook and schedule triggers
- **workflow_runs** - Execution instances
- **node_executions** - Node-level execution logs
- **audit_logs** - Action tracking
- **api_keys** - API key management
- **user_rate_limits** - Usage quotas

## Available Scripts

```bash
npm run dev              # Start in development mode
npm start               # Start in production mode
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run migrate         # Initialize database
npm run lint            # Run ESLint
npm run seed            # Seed database with sample data
```

## Key Features (Phase 1 Implementation)

### Implemented
- ✅ Express server setup
- ✅ Database schema and migrations
- ✅ Error handling middleware
- ✅ Authentication middleware (JWT support)
- ✅ CORS and security headers (Helmet)
- ✅ Request logging
- ✅ Rate limiting
- ✅ Structured logging (Winston)

### To Be Implemented
- [ ] User authentication (registration, login, token refresh)
- [ ] Workflow management APIs
- [ ] Trigger system (webhooks, cron)
- [ ] Workflow execution engine
- [ ] Node executors (HTTP, Condition, Delay, Notify)
- [ ] Execution monitoring and logs
- [ ] Error handling and retries
- [ ] API tests
- [ ] Integration tests

## Development Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Run tests: `npm test`
4. Push to branch: `git push origin feature/feature-name`
5. Create Pull Request

## Error Handling

The API uses consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "details": []
}
```

Common status codes:
- 400 - Bad Request (validation error)
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 409 - Conflict (duplicate entry)
- 500 - Internal Server Error

## Configuration

Key environment variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database
- `JWT_SECRET` - JWT signing secret
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `CORS_ORIGIN` - CORS allowed origin
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

## Logging

Logs are written to:
- Console (development)
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

Log levels: error, warn, info, http, debug

## Security Considerations

- ✅ Input validation with Joi
- ✅ Password hashing (bcryptjs)
- ✅ JWT token authentication
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ SQL injection prevention (parameterized queries)
- ✅ HTTPS ready

## Performance Optimizations

- Connection pooling (PostgreSQL)
- Query indexing
- Response compression
- Request caching ready
- Async/await for non-blocking I/O

## Next Steps

1. Implement Phase 2: Authentication System
2. Implement Phase 3: Workflow Management APIs
3. Implement Phase 4: Trigger System
4. Continue with remaining phases...

## Contributing

Please follow the existing code style and conventions:
- Use async/await for asynchronous operations
- Use meaningful commit messages
- Write tests for new features
- Update documentation

## License

MIT

## Support

For issues and questions, please create an issue in the GitHub repository.
