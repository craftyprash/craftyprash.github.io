---
title: BRMSContribution
date: 2025-04-01T00:00:00.000Z
tags:
  - go
  - brms
description: BRMS Contribution guide for go programmers
---

# BRMS (Business Rules Management System)

A robust Business Rules Management System built with Go, featuring a clean architecture, PostgreSQL database integration, and JWT authentication.

## Features

- 🔐 JWT-based authentication system
- 👥 Multi-client support
- 📝 Dynamic rule management (JDM - JSON Decision Models)
- 🚀 High-performance rule evaluation engine
- 🔍 Rule simulation capabilities
- 📊 Execution logging and tracing
- 🔒 Role-based access control
- 🏗️ Clean and modular architecture

## Architecture

The project follows a clean architecture pattern with the following key components:

```
brms/
├── handlers/      # HTTP request handlers
├── middleware/    # Custom middleware functions
├── models/        # Data models and DTOs
├── routes/        # Route definitions
├── storage/       # Database interaction layer
├── responses/     # Standardized API responses
└── db/           # Database migrations and queries
```

## Prerequisites

- Go 1.16 or later
- PostgreSQL 12 or later
- Docker (optional)

## Environment Variables

```env
DB_URL=postgresql://postgres:password@localhost:5432/brms?sslmode=disable
JWT_SECRET=your-secret-key
PORT=8080
```

## Setup and Installation

1. Clone the repository:

```bash
git clone https://github.com/mintifi-tech/brms
```

2. Start the development database:

```bash
docker-compose -f docker-compose.yml up -d
```

3. Set up the database:

```bash
# Create database and run migrations
psql -h localhost -U postgres -c "CREATE DATABASE brms"
psql -h localhost -U postgres -d brms -f db/schema/schema.sql
psql -h localhost -U postgres -d brms_test -f db/schema/schema.sql
```

Or

```bash
migrate -path db/migrations -database 'postgres://postgres:Secr3t!@localhost:5432/brms?sslmode=disable' up

migrate -path db/migrations -database 'postgres://postgres:Secr3t!@localhost:5432/brms_test?sslmode=disable' up
```

4. Install dependencies:

```bash
go mod download
```

5. Run the application:

```bash
go run main.go
```

### Development Database Connection

The development database will be available with these credentials:

- Host: localhost
- Port: 5432
- User: postgres
- Password: Secr3t!
- Databases: brms, brms_test

You can connect using:

```bash
# Connect to main database
psql -h localhost -U postgres -d brms

# Connect to test database
psql -h localhost -U postgres -d brms_test
```

### Stopping the Services

For development setup:

```bash
docker-compose -f docker-compose.yml down
```

### Running Tests

With the development database running:

```bash
go test ./... -v
```

## API Endpoints

### Authentication

- `POST /auth/login` - User login

### Client Management

- `GET /admin/clients` - Get all clients
- `POST /admin/clients` - Create new client
- `GET /admin/clients/:id` - Get client by ID
- `DELETE /admin/clients/:id` - Delete client

### JDM (JSON Decision Model) Management

- `GET /jdms` - Get all JDMs for a client
- `POST /jdms/save` - Create new JDM
- `PUT /jdms/update` - Update JDM by name
- `GET /jdms/:id` - Get JDM by ID
- `PUT /jdms/:id` - Update JDM
- `DELETE /jdms/:id` - Delete JDM
- `POST /jdms/:id/evaluate` - Evaluate JDM
- `POST /jdms/simulate` - Simulate JDM execution
- `PUT /jdms/:id/simulation` - Update JDM simulation data

## Security

The application implements several security measures:

- JWT-based authentication
- Role-based access control
- Client-based resource isolation
- Request validation middleware
- CORS protection

## Testing

Run the tests using:

```bash
go test ./...
```

## Error Handling

The application uses a standardized error response format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

## Success Response Format

Successful responses follow this format:

```json
{
    "status": "success",
    "data": { ... }
}
```

## Contributing

1. Clone the repository at https://github.com/mintifi-tech/brms
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
