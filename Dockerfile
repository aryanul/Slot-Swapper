# Multi-stage Dockerfile for SlotSwapper (Frontend + Backend)

# ============================================
# BACKEND BUILD STAGE
# ============================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Build TypeScript code
RUN npm run build

# ============================================
# BACKEND PRODUCTION STAGE
# ============================================
FROM node:20-alpine AS backend

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=backend-builder /app/backend/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the backend application
CMD ["node", "dist/server.js"]

# ============================================
# FRONTEND BUILD STAGE
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build the frontend application
RUN npm run build

# ============================================
# FRONTEND PRODUCTION STAGE
# ============================================
FROM nginx:alpine AS frontend

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built files from builder stage
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Create nginx configuration template with PORT placeholder
RUN echo 'server { \
    listen ${PORT}; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Resolver for dynamic DNS resolution \
    resolver 127.0.0.11 valid=30s; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api { \
        # Use variable to force runtime DNS resolution \
        set $backend http://backend:3001; \
        proxy_pass $backend; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # Cache static assets \
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/templates/default.conf.template

# Create startup script that substitutes PORT and starts nginx
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'export PORT=${PORT:-80}' >> /docker-entrypoint.sh && \
    echo 'envsubst '"'"'$PORT'"'"' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Create health check script that uses PORT from environment
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'PORT=${PORT:-80}' >> /healthcheck.sh && \
    echo 'wget --quiet --tries=1 --spider http://localhost:$PORT/ || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Expose port (will be overridden by Render's PORT env var)
EXPOSE 80

# Health check (uses PORT from environment)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /healthcheck.sh

# Start Nginx with custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

