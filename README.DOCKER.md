# Docker Deployment Guide for SlotSwapper

This guide explains how to deploy SlotSwapper using Docker.

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)
- MongoDB database (local or remote like MongoDB Atlas)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Connection String
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/slotswapper?retryWrites=true&w=majority

# JWT Secret Key (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here
```

**Important**: Never commit the `.env` file to version control. It's already included in `.gitignore`.

## Building and Running with Docker Compose

### 1. Build and Start Services

```bash
docker-compose up -d --build
```

This will:
- Build both backend and frontend images from the single root Dockerfile
- Start both containers
- Set up networking between them
- Run containers in detached mode

### 2. View Logs

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View frontend logs only
docker-compose logs -f frontend
```

### 3. Stop Services

```bash
docker-compose down
```

### 4. Rebuild After Code Changes

```bash
docker-compose up -d --build
```

## Individual Docker Commands

### Backend

```bash
# Build backend image from root directory
docker build --target backend -t slotswapper-backend .

# Run backend container
docker run -d \
  --name slotswapper-backend \
  -p 3001:3001 \
  -e DATABASE_URL=your_mongodb_connection_string \
  -e JWT_SECRET=your_jwt_secret \
  slotswapper-backend
```

### Frontend

```bash
# Build frontend image from root directory
docker build --target frontend -t slotswapper-frontend .

# Run frontend container (requires backend to be accessible)
docker run -d \
  --name slotswapper-frontend \
  -p 80:80 \
  slotswapper-frontend
```

## Accessing the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/auth (should return 404, which means the server is running)

## Production Considerations

1. **Use HTTPS**: In production, use a reverse proxy (like Nginx or Traefik) with SSL certificates.

2. **Environment Variables**: Use Docker secrets or environment variable files for sensitive data.

3. **Database**: Ensure MongoDB is accessible from your Docker containers. For production, use MongoDB Atlas or a managed MongoDB service.

4. **Volumes**: For persistent data, consider using Docker volumes for any file uploads or logs.

5. **Resource Limits**: Add resource limits to your docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 512M
   ```

6. **Nginx Configuration**: The frontend Dockerfile includes a basic Nginx configuration. For production, you may want to customize it further.

## Troubleshooting

### Backend won't start
- Check if MongoDB connection string is correct
- Verify JWT_SECRET is set
- Check logs: `docker-compose logs backend`

### Frontend can't connect to backend
- Ensure both containers are on the same network
- Verify backend is running: `docker-compose ps`
- Check nginx configuration in frontend Dockerfile

### Port conflicts
- Change port mappings in docker-compose.yml if ports 80 or 3001 are already in use

## Dockerfile Structure

The root `Dockerfile` uses multi-stage builds with four stages:

1. **backend-builder**: Builds the TypeScript backend code
2. **backend**: Production backend image with Node.js
3. **frontend-builder**: Builds the React frontend with Vite
4. **frontend**: Production frontend image with Nginx

### Benefits of Single Dockerfile

- **Centralized**: All Docker configuration in one place
- **Efficient**: Shared build context and better caching
- **Consistent**: Same base images and build process
- **Simplified**: Easier to manage and update

### Build Targets

The Dockerfile uses build targets to create separate images:
- `--target backend` for the backend service
- `--target frontend` for the frontend service

Docker Compose automatically uses these targets when building.

## Development vs Production

The Dockerfile is optimized for production:
- Multi-stage builds for smaller images
- Only production dependencies installed
- Non-root user for backend security
- Health checks included
- Nginx for frontend serving with SPA routing

For development, continue using `npm run dev` in your local environment.

