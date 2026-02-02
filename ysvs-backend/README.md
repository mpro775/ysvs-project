# YSVS Backend API

الجمعية اليمنية لجراحة الأوعية الدموية - Yemeni Vascular Surgery Society

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with RBAC (Super Admin, Admin, Member, Public)
- **Events Management**: Dynamic conference system with custom registration forms
- **Certificate System**: PDF generation with QR codes and public verification
- **Content Management**: Articles, categories, and board members
- **Live Streaming**: WebSocket-based real-time streaming status
- **Media Management**: File uploads with image optimization (WebP)

## 📋 Prerequisites

- Node.js 20+
- MongoDB 7+
- Redis (optional, for caching)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

## 🏃 Running the Application

### Development

```bash
# Start MongoDB and Redis with Docker
docker-compose -f docker-compose.dev.yml up -d

# Run in development mode
npm run start:dev
```

### Production

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api
```

## 📚 API Documentation

Once the server is running, access Swagger documentation at:
- Development: http://localhost:3000/api/docs
- Production: https://api.ysvs.org/api/docs

## 🔑 API Endpoints Summary

### Authentication (`/auth`)
- `POST /register` - Register new member
- `POST /login` - Login
- `POST /logout` - Logout
- `POST /refresh` - Refresh token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `GET /me` - Get current user
- `PATCH /change-password` - Change password

### Events (`/events`)
- `GET /` - List published events
- `GET /upcoming` - Get next upcoming event (for countdown)
- `GET /:slug` - Get event by slug
- `POST /` - Create event (Admin)
- `PATCH /:id` - Update event (Admin)
- `PATCH /:id/form-schema` - Update registration form (Admin)
- `POST /:id/register` - Register for event (Member)
- `GET /:id/registrations` - Get registrations (Admin)

### Certificates (`/certificates`)
- `POST /generate/:registrationId` - Generate certificate (Admin)
- `POST /generate-bulk/:eventId` - Bulk generate (Admin)
- `GET /verify/:serial` - Verify certificate (Public)
- `GET /my-certificates` - Get user certificates
- `GET /download/:id` - Download PDF

### Content (`/content`)
- `GET /articles` - List published articles
- `GET /articles/:slug` - Get article by slug
- `POST /articles` - Create article (Admin)
- `GET /categories` - List categories

### Board (`/board`)
- `GET /members` - List board members
- `POST /members` - Add member (Admin)
- `PATCH /members/reorder` - Reorder members (Admin)

### Streaming (`/streaming`)
- `GET /status` - Get stream status (Public)
- `POST /start/:configId` - Start stream (Admin)
- `POST /stop` - Stop stream (Admin)

## 🔒 Roles & Permissions

| Role | Description |
|------|-------------|
| `super_admin` | Full access including admin management |
| `admin` | Manage content, events, certificates |
| `member` | Register for events, download certificates |
| `public` | Read-only access, verify certificates |

## 📁 Project Structure

```
src/
├── common/           # Shared utilities
│   ├── decorators/   # Custom decorators
│   ├── filters/      # Exception filters
│   ├── guards/       # Auth guards
│   └── interceptors/ # Response interceptors
├── config/           # Configuration files
├── modules/          # Feature modules
│   ├── auth/         # Authentication
│   ├── users/        # User management
│   ├── events/       # Events & registrations
│   ├── certificates/ # Certificate system
│   ├── content/      # Articles & categories
│   ├── board/        # Board members
│   ├── streaming/    # Live streaming
│   └── media/        # File uploads
└── providers/        # External services
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `FRONTEND_URL` | Frontend URL for CORS | - |

## 📄 License

MIT License - YSVS © 2026
