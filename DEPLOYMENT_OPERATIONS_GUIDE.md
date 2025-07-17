# Deployment and Operations Guide
# RelyGate Multi-Tenant Visitor Management System

This comprehensive guide covers production deployment, operations, monitoring, and maintenance procedures for the RelyGate visitor management system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Configuration](#environment-configuration)
3. [Docker-Based Deployment](#docker-based-deployment)
4. [Production Deployment Strategies](#production-deployment-strategies)
5. [Security Hardening](#security-hardening)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Scaling and Performance](#scaling-and-performance)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Database Management](#database-management)
11. [Health Checks and Alerting](#health-checks-and-alerting)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Maintenance Procedures](#maintenance-procedures)

---

## Architecture Overview

### System Components
- **Application Server**: Node.js Express application (Multi-tenant)
- **Database**: PostgreSQL 15 with connection pooling
- **File Storage**: Local filesystem with structured uploads
- **Authentication**: JWT-based with tenant isolation
- **Container Runtime**: Docker with Docker Compose orchestration

### Multi-Tenant Architecture
- Row-level security with `TenantID` column in all tables
- JWT tokens contain tenant context (`TenantID`, `UserID`, `Role`)
- Middleware enforces tenant isolation at API level
- Separate file storage paths per tenant

---

## Environment Configuration

### Development Environment (.env.development)
```bash
# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRATION=24h

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=relygate
DB_USER=postgres
DB_PASSWORD=MySecurePassword123
DATABASE_URL=postgresql://postgres:MySecurePassword123@localhost:5432/relygate
DB_POOL_MIN=2
DB_POOL_MAX=10

# Features
SMS_ENABLED=false
FILE_CLEANUP_ENABLED=true
DEBUG_LOGS=true

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3065

# File Upload
MAX_FILE_SIZE=10MB
UPLOAD_PATH=/app/uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Staging Environment (.env.staging)
```bash
# Application
NODE_ENV=staging
PORT=3000
JWT_SECRET=staging-jwt-secret-very-secure-key-change-me
JWT_EXPIRATION=12h

# Database
DB_HOST=staging-postgres.internal
DB_PORT=5432
DB_NAME=relygate_staging
DB_USER=relygate_user
DB_PASSWORD=StAgInG_sEcUrE_pAsSwOrD_2024
DATABASE_URL=postgresql://relygate_user:StAgInG_sEcUrE_pAsSwOrD_2024@staging-postgres.internal:5432/relygate_staging
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=10000
DB_POOL_CONNECTION_TIMEOUT=2000

# SSL/TLS
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# Features
SMS_ENABLED=true
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_staging_account_sid
TWILIO_AUTH_TOKEN=your_staging_auth_token
TWILIO_FROM_NUMBER=+1234567890

FILE_CLEANUP_ENABLED=true
DEBUG_LOGS=false

# CORS
ALLOWED_ORIGINS=https://staging.relygate.com,https://staging-admin.relygate.com

# File Upload
MAX_FILE_SIZE=20MB
UPLOAD_PATH=/app/uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=200

# Health Checks
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Production Environment (.env.production)
```bash
# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=super-secure-production-jwt-secret-256-bit-key
JWT_EXPIRATION=8h

# Database
DB_HOST=prod-postgres-cluster.internal
DB_PORT=5432
DB_NAME=relygate_production
DB_USER=relygate_prod_user
DB_PASSWORD=Pr0d_UlTrA_sEcUrE_dB_pAsSwOrD_2024!
DATABASE_URL=postgresql://relygate_prod_user:Pr0d_UlTrA_sEcUrE_dB_pAsSwOrD_2024!@prod-postgres-cluster.internal:5432/relygate_production
DB_POOL_MIN=10
DB_POOL_MAX=50
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=5000

# SSL/TLS
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA_CERT=/app/certs/ca-certificate.crt
DB_SSL_CLIENT_CERT=/app/certs/client-certificate.crt
DB_SSL_CLIENT_KEY=/app/certs/client-key.key

# Features
SMS_ENABLED=true
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_production_account_sid
TWILIO_AUTH_TOKEN=your_production_auth_token
TWILIO_FROM_NUMBER=+1234567890

FILE_CLEANUP_ENABLED=true
DEBUG_LOGS=false

# Security
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
REQUEST_TIMEOUT=30000
BODY_LIMIT=10mb

# CORS
ALLOWED_ORIGINS=https://app.relygate.com,https://admin.relygate.com

# File Upload
MAX_FILE_SIZE=25MB
UPLOAD_PATH=/app/uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true

# Health Checks
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=5s
HEALTH_CHECK_RETRIES=3

# Monitoring & Logging
LOG_LEVEL=warn
ENABLE_METRICS=true
METRICS_PORT=9090
LOG_FORMAT=json
LOG_DESTINATION=file
LOG_FILE_PATH=/app/logs/application.log
LOG_MAX_SIZE=100MB
LOG_MAX_FILES=10

# Performance
CLUSTER_MODE=true
CLUSTER_WORKERS=0  # 0 = number of CPU cores
COMPRESSION_ENABLED=true
CACHE_ENABLED=true
CACHE_TTL=300

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=relygate-backups-prod
```

---

## Docker-Based Deployment

### Production Docker Compose (docker-compose.prod.yml)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/:/docker-entrypoint-initdb.d/
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - relygate-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3000
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    ports:
      - "3000:3000"
      - "9090:9090"  # Metrics port
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - app_uploads:/app/uploads
      - app_logs:/app/logs
      - app_certs:/app/certs:ro
    networks:
      - relygate-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - relygate-network
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks:
      - relygate-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
    networks:
      - relygate-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  app_uploads:
    driver: local
  app_logs:
    driver: local
  app_certs:
    driver: local
  nginx_logs:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local

networks:
  relygate-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Production Dockerfile (Dockerfile.prod)
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Run any build steps if needed
# RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    wget \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code from builder stage
COPY --from=builder /app .

# Create necessary directories with proper permissions
RUN mkdir -p uploads logs certs && \
    chmod 755 uploads logs && \
    chmod 700 certs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S relygate -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R relygate:nodejs /app

# Switch to non-root user
USER relygate

# Expose ports
EXPOSE 3000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
```

### Deployment Commands
```bash
# Development deployment
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Clean deployment
docker-compose -f docker-compose.prod.yml down
docker system prune -f
docker-compose -f docker-compose.prod.yml up -d
```

---

## Production Deployment Strategies

### 1. Cloud Platform Deployments

#### AWS ECS Deployment
```yaml
# ecs-task-definition.json
{
  "family": "relygate-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "relygate-app",
      "image": "your-registry/relygate:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DB_HOST",
          "value": "your-rds-endpoint"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/relygate-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### AWS ECS Service Configuration
```yaml
# ecs-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: relygate-service
spec:
  desiredCount: 3
  cluster: relygate-cluster
  taskDefinition: relygate-app:REVISION
  networkConfiguration:
    awsvpcConfiguration:
      subnets:
        - subnet-12345678
        - subnet-87654321
      securityGroups:
        - sg-12345678
      assignPublicIp: DISABLED
  loadBalancers:
    - targetGroupArn: arn:aws:elasticloadbalancing:region:account:targetgroup/relygate-tg
      containerName: relygate-app
      containerPort: 3000
  deploymentConfiguration:
    maximumPercent: 200
    minimumHealthyPercent: 50
    deploymentCircuitBreaker:
      enable: true
      rollback: true
```

#### Google Cloud Run Deployment
```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: relygate-app
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "2Gi"
        run.googleapis.com/cpu: "2"
        run.googleapis.com/max-scale: "10"
        run.googleapis.com/min-scale: "1"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - name: relygate-app
        image: gcr.io/PROJECT_ID/relygate:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              key: "DB_HOST"
              name: "db-config"
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
```

#### Azure Container Apps Deployment
```yaml
# containerapp.yaml
apiVersion: app.containers.azure.com/v1beta1
kind: ContainerApp
metadata:
  name: relygate-app
spec:
  environmentId: /subscriptions/SUBSCRIPTION_ID/resourceGroups/RG_NAME/providers/Microsoft.App/managedEnvironments/ENV_NAME
  configuration:
    ingress:
      external: true
      targetPort: 3000
      allowInsecure: false
    secrets:
    - name: db-password
      value: "your-db-password"
    - name: jwt-secret
      value: "your-jwt-secret"
  template:
    containers:
    - name: relygate-app
      image: your-registry.azurecr.io/relygate:latest
      env:
      - name: NODE_ENV
        value: "production"
      - name: DB_PASSWORD
        secretRef: db-password
      - name: JWT_SECRET
        secretRef: jwt-secret
      resources:
        cpu: 1.0
        memory: 2Gi
      probes:
      - type: liveness
        httpGet:
          path: "/health"
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 30
      - type: readiness
        httpGet:
          path: "/health"
          port: 3000
        initialDelaySeconds: 10
        periodSeconds: 10
    scale:
      minReplicas: 1
      maxReplicas: 10
      rules:
      - name: http-scaling
        http:
          concurrent: 100
```

### 2. Kubernetes Deployment

#### Kubernetes Manifests
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: relygate-production

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: relygate-config
  namespace: relygate-production
data:
  NODE_ENV: "production"
  PORT: "3000"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "relygate_production"
  ALLOWED_ORIGINS: "https://app.relygate.com,https://admin.relygate.com"

---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: relygate-secrets
  namespace: relygate-production
type: Opaque
stringData:
  DB_USER: "relygate_user"
  DB_PASSWORD: "your-secure-db-password"
  JWT_SECRET: "your-secure-jwt-secret"

---
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: relygate-app
  namespace: relygate-production
  labels:
    app: relygate-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: relygate-app
  template:
    metadata:
      labels:
        app: relygate-app
    spec:
      containers:
      - name: relygate-app
        image: your-registry/relygate:latest
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 9090
          name: metrics
        envFrom:
        - configMapRef:
            name: relygate-config
        - secretRef:
            name: relygate-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: relygate-uploads-pvc
      - name: logs
        persistentVolumeClaim:
          claimName: relygate-logs-pvc

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: relygate-service
  namespace: relygate-production
  labels:
    app: relygate-app
spec:
  type: ClusterIP
  ports:
  - port: 3000
    targetPort: 3000
    protocol: TCP
    name: http
  - port: 9090
    targetPort: 9090
    protocol: TCP
    name: metrics
  selector:
    app: relygate-app

---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: relygate-ingress
  namespace: relygate-production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.relygate.com
    secretName: relygate-tls
  rules:
  - host: api.relygate.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: relygate-service
            port:
              number: 3000

---
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: relygate-hpa
  namespace: relygate-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: relygate-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 3. On-Premise Deployment

#### Docker Swarm Configuration
```yaml
# docker-stack.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: relygate_production
      POSTGRES_USER: relygate_user
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - relygate-network
    secrets:
      - db_password
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
      placement:
        constraints:
          - node.role == manager

  app:
    image: your-registry/relygate:latest
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      PORT: 3000
    networks:
      - relygate-network
    secrets:
      - source: db_password
        target: DB_PASSWORD
      - source: jwt_secret
        target: JWT_SECRET
    volumes:
      - app_uploads:/app/uploads
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      rollback_config:
        parallelism: 1
        delay: 10s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - relygate-network
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true

volumes:
  postgres_data:
    driver: local
  app_uploads:
    driver: local

networks:
  relygate-network:
    driver: overlay
    attachable: true
```

#### Deploy Commands
```bash
# Initialize Docker Swarm
docker swarm init

# Create secrets
echo "your-secure-db-password" | docker secret create db_password -
echo "your-secure-jwt-secret" | docker secret create jwt_secret -

# Deploy stack
docker stack deploy -c docker-stack.yml relygate

# Check services
docker service ls
docker service logs relygate_app

# Scale services
docker service scale relygate_app=5

# Update service
docker service update --image your-registry/relygate:v2.0.0 relygate_app
```

---

## Security Hardening

### 1. Application Security

#### Security Middleware Configuration
```javascript
// security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const securityMiddleware = {
  // Helmet configuration
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),

  // Rate limiting
  rateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      responseCode: 'E',
      responseMessage: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Speed limiting
  speedLimiter: slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: 500,
  }),

  // Authentication rate limiting
  authLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: {
      responseCode: 'E',
      responseMessage: 'Too many login attempts, please try again later',
    },
  }),
};

module.exports = securityMiddleware;
```

#### Input Validation and Sanitization
```javascript
// validation.js
const { body, param, query, validationResult } = require('express-validator');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const validationRules = {
  // User input validation
  userRegistration: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
    body('fname')
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name must be 2-50 characters and contain only letters'),
    body('mobile')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Valid 10-digit Indian mobile number is required'),
  ],

  // Tenant validation
  tenantValidation: [
    param('tenantId')
      .isUUID()
      .withMessage('Valid tenant ID is required'),
  ],

  // File upload validation
  fileUpload: [
    body('category')
      .isIn(['visitor', 'vehicle', 'id_document', 'qr_code'])
      .withMessage('Invalid file category'),
  ],

  // SQL injection prevention
  sanitizeInput: (req, res, next) => {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = purify.sanitize(req.body[key]);
      }
    }
    next();
  },

  // Validation error handler
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        responseCode: 'E',
        responseMessage: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
};

module.exports = validationRules;
```

### 2. Database Security

#### PostgreSQL Security Configuration
```sql
-- postgresql.conf security settings
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
ssl_ca_file = '/etc/ssl/certs/ca.crt'
ssl_crl_file = '/etc/ssl/certs/server.crl'

# Connection security
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'
ssl_prefer_server_ciphers = on
ssl_ecdh_curve = 'prime256v1'

# Authentication
password_encryption = scram-sha-256
krb_server_keyfile = '/etc/postgresql/krb5.keytab'

# Logging
log_connections = on
log_disconnections = on
log_checkpoints = on
log_lock_waits = on
log_statement = 'ddl'
log_min_duration_statement = 1000

# Resource limits
shared_preload_libraries = 'pg_stat_statements'
max_connections = 200
```

#### Row Level Security (RLS) Implementation
```sql
-- Enable RLS on all tenant tables
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_visitors ON visitors
    FOR ALL TO application_role
    USING (TenantID = current_setting('app.tenant_id')::UUID);

CREATE POLICY tenant_isolation_staff ON staff
    FOR ALL TO application_role
    USING (TenantID = current_setting('app.tenant_id')::UUID);

CREATE POLICY tenant_isolation_students ON students
    FOR ALL TO application_role
    USING (TenantID = current_setting('app.tenant_id')::UUID);

-- Create application role
CREATE ROLE application_role;
GRANT CONNECT ON DATABASE relygate_production TO application_role;
GRANT USAGE ON SCHEMA public TO application_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO application_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO application_role;
```

### 3. Container Security

#### Security-Hardened Dockerfile
```dockerfile
# Use specific version and security updates
FROM node:18.19.0-alpine3.19

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S relygate -u 1001 -G nodejs

# Copy package files
COPY --chown=relygate:nodejs package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --chown=relygate:nodejs . .

# Set proper permissions
RUN chmod -R 755 /app && \
    chmod -R 700 /app/uploads /app/logs

# Remove unnecessary files
RUN rm -rf /app/.git /app/README.md /app/docs

# Switch to non-root user
USER relygate

# Security scan point
LABEL security.scan="required"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use init system
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### 4. Network Security

#### Nginx Security Configuration
```nginx
# nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Hide nginx version
    server_tokens off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    upstream app_backend {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        server_name api.relygate.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.relygate.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Request size limits
        client_max_body_size 10M;
        client_body_timeout 60s;
        client_header_timeout 60s;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        location / {
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            access_log off;
            proxy_pass http://app_backend;
        }
    }
}
```

---

## Monitoring and Logging

### 1. Application Metrics

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'relygate-app'
    static_configs:
      - targets: ['app:9090']
    metrics_path: /metrics
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

#### Alert Rules
```yaml
# alert_rules.yml
groups:
- name: relygate-alerts
  rules:
  - alert: HighCPUUsage
    expr: cpu_usage_percent > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High CPU usage detected
      description: "CPU usage is above 80% for more than 5 minutes"

  - alert: HighMemoryUsage
    expr: memory_usage_percent > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High memory usage detected
      description: "Memory usage is above 85% for more than 5 minutes"

  - alert: DatabaseConnectionFailed
    expr: postgres_up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: Database connection failed
      description: "PostgreSQL database is not responding"

  - alert: HighResponseTime
    expr: http_request_duration_seconds{quantile="0.95"} > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High response time detected
      description: "95th percentile response time is above 2 seconds"

  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected
      description: "Error rate is above 5% for more than 5 minutes"
```

### 2. Logging Strategy

#### Structured Logging Configuration
```javascript
// logger.js
const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      stack,
      tenantId: meta.tenantId,
      userId: meta.userId,
      requestId: meta.requestId,
      ...meta,
    });
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'relygate-api',
    version: process.env.APP_VERSION || '1.0.0',
  },
  transports: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'error.log'),
      level: 'error',
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'combined.log'),
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Add request logging middleware
const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || require('uuid').v4();
  req.requestId = requestId;
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

module.exports = { logger, requestLogger };
```

#### Log Aggregation with ELK Stack
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.4
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - logging-network

  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.4
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline:ro
      - ./logstash/config:/usr/share/logstash/config:ro
      - app_logs:/app/logs:ro
    ports:
      - "5044:5044"
    environment:
      LS_JAVA_OPTS: "-Xmx256m -Xms256m"
    networks:
      - logging-network
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.4
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    networks:
      - logging-network
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.10.4
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - app_logs:/app/logs:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - logging-network
    depends_on:
      - logstash

volumes:
  elasticsearch_data:
  app_logs:

networks:
  logging-network:
    driver: bridge
```

#### Filebeat Configuration
```yaml
# filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /app/logs/*.log
  fields:
    service: relygate-api
  fields_under_root: true
  multiline.pattern: '^\{'
  multiline.negate: true
  multiline.match: after

- type: docker
  containers.ids:
    - "*"
  processors:
    - add_docker_metadata:
        host: "unix:///var/run/docker.sock"

output.logstash:
  hosts: ["logstash:5044"]

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - decode_json_fields:
      fields: ["message"]
      target: ""
      overwrite_keys: true
```

### 3. Grafana Dashboards

#### Application Dashboard Configuration
```json
{
  "dashboard": {
    "title": "RelyGate Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100"
          }
        ]
      },
      {
        "title": "Active Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "postgres_active_connections"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes / 1024 / 1024"
          }
        ]
      }
    ]
  }
}
```

---

## Backup and Recovery

### 1. Database Backup Strategy

#### Automated Backup Scripts
```bash
#!/bin/bash
# backup.sh - Automated database backup script

set -euo pipefail

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-relygate_production}
DB_USER=${DB_USER:-postgres}
BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION_DAYS=${RETENTION_DAYS:-30}
S3_BUCKET=${S3_BUCKET:-relygate-backups}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/relygate_backup_$TIMESTAMP.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

echo "Starting database backup at $(date)"

# Create database dump
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --if-exists --create \
    --format=plain --no-owner --no-privileges \
    > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Verify backup integrity
if gunzip -t "$COMPRESSED_FILE"; then
    echo "Backup integrity verified: $COMPRESSED_FILE"
else
    echo "Backup integrity check failed: $COMPRESSED_FILE"
    exit 1
fi

# Upload to S3 (if configured)
if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "$S3_BUCKET" ]; then
    aws s3 cp "$COMPRESSED_FILE" "s3://$S3_BUCKET/$(basename "$COMPRESSED_FILE")"
    echo "Backup uploaded to S3: s3://$S3_BUCKET/$(basename "$COMPRESSED_FILE")"
fi

# Clean up old backups
find "$BACKUP_DIR" -name "relygate_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Database backup completed successfully at $(date)"

# Log backup completion
logger -t relygate-backup "Database backup completed: $COMPRESSED_FILE"
```

#### Backup Verification Script
```bash
#!/bin/bash
# verify-backup.sh - Verify backup integrity

set -euo pipefail

BACKUP_FILE="$1"
TEST_DB_NAME="relygate_test_restore"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Verifying backup: $BACKUP_FILE"

# Create test database
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB_NAME" || true

# Restore backup to test database
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME"
else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" < "$BACKUP_FILE"
fi

# Verify table count
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "Backup verification successful: $TABLE_COUNT tables restored"
else
    echo "Backup verification failed: No tables found"
    exit 1
fi

# Clean up test database
dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEST_DB_NAME"

echo "Backup verification completed successfully"
```

### 2. Point-in-Time Recovery

#### WAL Archiving Configuration
```bash
# postgresql.conf settings for WAL archiving
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 300
checkpoint_timeout = 5min
max_wal_size = 1GB
min_wal_size = 80MB
```

#### Point-in-Time Recovery Script
```bash
#!/bin/bash
# pitr-restore.sh - Point-in-time recovery

set -euo pipefail

BACKUP_FILE="$1"
RECOVERY_TARGET_TIME="$2"  # Format: '2024-01-15 14:30:00'
WAL_ARCHIVE_DIR="/var/lib/postgresql/wal_archive"
RESTORE_DATA_DIR="/var/lib/postgresql/restore_data"

echo "Starting point-in-time recovery to: $RECOVERY_TARGET_TIME"

# Stop PostgreSQL service
systemctl stop postgresql

# Clean restore directory
rm -rf "$RESTORE_DATA_DIR"
mkdir -p "$RESTORE_DATA_DIR"

# Extract base backup
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | pg_restore -d postgres --create
else
    pg_restore -d postgres --create "$BACKUP_FILE"
fi

# Create recovery configuration
cat > "$RESTORE_DATA_DIR/recovery.conf" << EOF
restore_command = 'cp $WAL_ARCHIVE_DIR/%f %p'
recovery_target_time = '$RECOVERY_TARGET_TIME'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL with restored data
systemctl start postgresql

echo "Point-in-time recovery initiated. Monitor logs for completion."
```

### 3. File Storage Backup

#### File Backup Script
```bash
#!/bin/bash
# file-backup.sh - Backup uploaded files

set -euo pipefail

UPLOADS_DIR="/app/uploads"
BACKUP_DIR="/backups/files"
RETENTION_DAYS=90
S3_BUCKET="relygate-file-backups"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="uploads_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

echo "Starting file backup at $(date)"

# Create compressed archive
tar -czf "$BACKUP_PATH" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"

# Verify archive
if tar -tzf "$BACKUP_PATH" > /dev/null; then
    echo "File backup created successfully: $BACKUP_PATH"
else
    echo "File backup verification failed"
    exit 1
fi

# Upload to S3
if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "$S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/$(basename "$BACKUP_PATH")"
    echo "File backup uploaded to S3"
fi

# Clean old backups
find "$BACKUP_DIR" -name "uploads_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "File backup completed at $(date)"
```

### 4. Disaster Recovery Plan

#### Complete System Recovery Procedure
```bash
#!/bin/bash
# disaster-recovery.sh - Complete system recovery

set -euo pipefail

BACKUP_DATE="$1"  # Format: YYYYMMDD_HHMMSS
RECOVERY_TYPE="${2:-full}"  # full|database|files

echo "Starting disaster recovery for backup: $BACKUP_DATE"
echo "Recovery type: $RECOVERY_TYPE"

case "$RECOVERY_TYPE" in
  "full")
    # Full system recovery
    echo "Performing full system recovery..."
    
    # Restore database
    ./restore-database.sh "$BACKUP_DATE"
    
    # Restore files
    ./restore-files.sh "$BACKUP_DATE"
    
    # Restart services
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d
    ;;
    
  "database")
    # Database only recovery
    echo "Performing database recovery..."
    ./restore-database.sh "$BACKUP_DATE"
    
    # Restart application
    docker-compose -f docker-compose.prod.yml restart app
    ;;
    
  "files")
    # Files only recovery
    echo "Performing files recovery..."
    ./restore-files.sh "$BACKUP_DATE"
    ;;
    
  *)
    echo "Invalid recovery type: $RECOVERY_TYPE"
    echo "Usage: $0 <backup_date> [full|database|files]"
    exit 1
    ;;
esac

echo "Disaster recovery completed successfully"
```

---

## Scaling and Performance

### 1. Horizontal Scaling

#### Load Balancer Configuration (HAProxy)
```
# haproxy.cfg
global
    daemon
    maxconn 4096
    log stdout local0

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog
    option dontlognull
    option redispatch
    retries 3

frontend relygate_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/relygate.pem
    redirect scheme https if !{ ssl_fc }
    
    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request reject if { sc_http_req_rate(0) gt 20 }
    
    default_backend relygate_backend

backend relygate_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    
    server app1 app1:3000 check inter 30s rise 2 fall 3
    server app2 app2:3000 check inter 30s rise 2 fall 3
    server app3 app3:3000 check inter 30s rise 2 fall 3
    
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE
```

#### Docker Swarm Scaling
```bash
# Scale services
docker service scale relygate_app=5

# Update with rolling deployment
docker service update --image relygate:v2.0.0 --update-parallelism 1 --update-delay 30s relygate_app

# Auto-scaling with constraints
docker service create \
  --name relygate-app \
  --replicas 3 \
  --constraint 'node.role==worker' \
  --reserve-memory 512MB \
  --limit-memory 1GB \
  --reserve-cpu 0.25 \
  --limit-cpu 0.5 \
  --update-parallelism 1 \
  --update-delay 30s \
  --rollback-parallelism 1 \
  --rollback-delay 30s \
  --endpoint-mode vip \
  relygate:latest
```

### 2. Database Scaling

#### Read Replica Configuration
```javascript
// database-pool.js - Master-slave configuration
const { Pool } = require('pg');

const masterPool = new Pool({
  host: process.env.DB_MASTER_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const replicaPool = new Pool({
  host: process.env.DB_REPLICA_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  max: 15,
  min: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const query = async (text, params, useReplica = false) => {
  const pool = useReplica && !text.toLowerCase().includes('insert') && 
                !text.toLowerCase().includes('update') && 
                !text.toLowerCase().includes('delete') ? replicaPool : masterPool;
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { 
      text: text.substring(0, 100), 
      duration, 
      rows: res.rowCount,
      pool: pool === replicaPool ? 'replica' : 'master'
    });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = { query, masterPool, replicaPool };
```

#### Connection Pooling Optimization
```javascript
// connection-pool.js - Optimized connection pooling
const { Pool } = require('pg');

class DatabasePool {
  constructor() {
    this.pools = new Map();
    this.initializePools();
  }

  initializePools() {
    // Master pool for writes
    this.pools.set('master', new Pool({
      host: process.env.DB_MASTER_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      application_name: 'relygate-master',
    }));

    // Read replica pools
    const replicas = process.env.DB_REPLICA_HOSTS?.split(',') || [];
    replicas.forEach((host, index) => {
      this.pools.set(`replica-${index}`, new Pool({
        host: host.trim(),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        max: 15,
        min: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        application_name: `relygate-replica-${index}`,
      }));
    });
  }

  getPool(type = 'master') {
    if (type === 'replica') {
      const replicaPools = Array.from(this.pools.keys()).filter(key => key.startsWith('replica-'));
      if (replicaPools.length > 0) {
        // Round-robin replica selection
        const replicaIndex = Math.floor(Math.random() * replicaPools.length);
        return this.pools.get(replicaPools[replicaIndex]);
      }
    }
    return this.pools.get('master');
  }

  async query(text, params, options = {}) {
    const { useReplica = false, timeout = 30000 } = options;
    const isReadQuery = this.isReadQuery(text);
    const pool = useReplica && isReadQuery ? this.getPool('replica') : this.getPool('master');

    const client = await pool.connect();
    try {
      const start = Date.now();
      const result = await Promise.race([
        client.query(text, params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ]);
      const duration = Date.now() - start;
      
      console.log('Query executed', {
        query: text.substring(0, 100),
        duration,
        rows: result.rowCount,
        pool: pool === this.getPool('replica') ? 'replica' : 'master'
      });
      
      return result;
    } finally {
      client.release();
    }
  }

  isReadQuery(query) {
    const readPatterns = /^\s*(SELECT|WITH|SHOW|EXPLAIN|DESCRIBE)/i;
    return readPatterns.test(query.trim());
  }

  async healthCheck() {
    const checks = [];
    for (const [name, pool] of this.pools) {
      checks.push(
        pool.query('SELECT 1 as health')
          .then(() => ({ pool: name, status: 'healthy' }))
          .catch(error => ({ pool: name, status: 'unhealthy', error: error.message }))
      );
    }
    return Promise.all(checks);
  }

  async close() {
    for (const pool of this.pools.values()) {
      await pool.end();
    }
  }
}

module.exports = new DatabasePool();
```

### 3. Caching Strategy

#### Redis Caching Implementation
```javascript
// cache.js - Redis caching layer
const redis = require('redis');

class CacheManager {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  async get(key, tenantId) {
    const fullKey = `tenant:${tenantId}:${key}`;
    try {
      const value = await this.client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, tenantId, ttl = 300) {
    const fullKey = `tenant:${tenantId}:${key}`;
    try {
      await this.client.setex(fullKey, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key, tenantId) {
    const fullKey = `tenant:${tenantId}:${key}`;
    try {
      await this.client.del(fullKey);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async flush(tenantId) {
    try {
      const keys = await this.client.keys(`tenant:${tenantId}:*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Cache decorator for methods
  withCache(keyGenerator, ttl = 300) {
    return (target, propertyName, descriptor) => {
      const method = descriptor.value;
      
      descriptor.value = async function(...args) {
        const key = keyGenerator(...args);
        const tenantId = this.tenantId || args[0]?.tenantId;
        
        if (!tenantId) {
          return method.apply(this, args);
        }

        const cached = await cacheManager.get(key, tenantId);
        if (cached) {
          return cached;
        }

        const result = await method.apply(this, args);
        await cacheManager.set(key, result, tenantId, ttl);
        
        return result;
      };
    };
  }
}

const cacheManager = new CacheManager();

// Usage example in service
class VisitorService {
  @cacheManager.withCache(
    (tenantId, visitorId) => `visitor:${visitorId}`,
    600 // 10 minutes
  )
  async getVisitor(tenantId, visitorId) {
    // Database query here
    return await VisitorModel.findById(visitorId, tenantId);
  }
}

module.exports = cacheManager;
```

### 4. Performance Optimization

#### Application Performance Monitoring
```javascript
// performance.js - APM implementation
const performanceHooks = require('perf_hooks');
const { performance, PerformanceObserver } = performanceHooks;

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      database: new Map(),
      cache: new Map(),
    };

    this.setupObservers();
  }

  setupObservers() {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric(entry);
      }
    });
    obs.observe({ entryTypes: ['measure'] });
  }

  recordMetric(entry) {
    const [type, operation] = entry.name.split(':');
    if (!this.metrics[type]) return;

    if (!this.metrics[type].has(operation)) {
      this.metrics[type].set(operation, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0,
      });
    }

    const metric = this.metrics[type].get(operation);
    metric.count++;
    metric.totalTime += entry.duration;
    metric.minTime = Math.min(metric.minTime, entry.duration);
    metric.maxTime = Math.max(metric.maxTime, entry.duration);
    metric.avgTime = metric.totalTime / metric.count;
  }

  measureRequest() {
    return (req, res, next) => {
      const start = `request-start-${req.requestId}`;
      const end = `request-end-${req.requestId}`;
      
      performance.mark(start);
      
      res.on('finish', () => {
        performance.mark(end);
        performance.measure(`requests:${req.method}:${req.route?.path || req.path}`, start, end);
      });
      
      next();
    };
  }

  measureDatabase(operation) {
    const start = `db-start-${Date.now()}`;
    const end = `db-end-${Date.now()}`;
    
    performance.mark(start);
    
    return () => {
      performance.mark(end);
      performance.measure(`database:${operation}`, start, end);
    };
  }

  getMetrics() {
    const result = {};
    for (const [type, operations] of this.metrics) {
      result[type] = {};
      for (const [operation, metrics] of operations) {
        result[type][operation] = { ...metrics };
      }
    }
    return result;
  }

  reset() {
    for (const operations of this.metrics.values()) {
      operations.clear();
    }
  }
}

const performanceMonitor = new PerformanceMonitor();

// Database query wrapper with performance monitoring
const monitoredQuery = async (text, params, options = {}) => {
  const finish = performanceMonitor.measureDatabase('query');
  try {
    const result = await originalQuery(text, params, options);
    return result;
  } finally {
    finish();
  }
};

module.exports = { performanceMonitor, monitoredQuery };
```

---

## CI/CD Pipeline

### 1. GitHub Actions Workflow

#### Complete CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: RelyGate CI/CD Pipeline

on:
  push:
    branches: [main, develop, staging]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: relygate_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run security audit
      run: npm audit --audit-level=high

    - name: Run tests
      env:
        NODE_ENV: test
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: relygate_test
        DB_USER: test_user
        DB_PASSWORD: test_password
        JWT_SECRET: test-jwt-secret
      run: npm test

    - name: Generate test coverage
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

    - name: OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'relygate'
        path: '.'
        format: 'JSON'

  build:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        file: ./Dockerfile.prod
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/staging'
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup SSH
      uses: webfactory/ssh-agent@v0.8.0
      with:
        ssh-private-key: ${{ secrets.STAGING_SSH_KEY }}

    - name: Deploy to staging
      run: |
        ssh -o StrictHostKeyChecking=no ${{ secrets.STAGING_USER }}@${{ secrets.STAGING_HOST }} << 'EOF'
          cd /opt/relygate
          docker-compose -f docker-compose.staging.yml pull
          docker-compose -f docker-compose.staging.yml up -d
          docker system prune -f
        EOF

    - name: Health check
      run: |
        sleep 30
        curl -f ${{ secrets.STAGING_URL }}/health || exit 1

    - name: Run smoke tests
      run: |
        npm run test:smoke -- --endpoint=${{ secrets.STAGING_URL }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup SSH
      uses: webfactory/ssh-agent@v0.8.0
      with:
        ssh-private-key: ${{ secrets.PRODUCTION_SSH_KEY }}

    - name: Create backup before deployment
      run: |
        ssh -o StrictHostKeyChecking=no ${{ secrets.PRODUCTION_USER }}@${{ secrets.PRODUCTION_HOST }} << 'EOF'
          cd /opt/relygate
          ./scripts/backup.sh
        EOF

    - name: Deploy to production
      run: |
        ssh -o StrictHostKeyChecking=no ${{ secrets.PRODUCTION_USER }}@${{ secrets.PRODUCTION_HOST }} << 'EOF'
          cd /opt/relygate
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d --no-deps app
          sleep 60
          # Health check
          if ! curl -f http://localhost:3000/health; then
            echo "Health check failed, rolling back..."
            docker-compose -f docker-compose.prod.yml rollback
            exit 1
          fi
          docker system prune -f
        EOF

    - name: Post-deployment verification
      run: |
        sleep 30
        curl -f ${{ secrets.PRODUCTION_URL }}/health || exit 1

    - name: Run production smoke tests
      run: |
        npm run test:smoke -- --endpoint=${{ secrets.PRODUCTION_URL }}

    - name: Notify deployment success
      uses: 8398a7/action-slack@v3
      with:
        status: success
        channel: '#deployments'
        text: 'Production deployment successful! :rocket:'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

  rollback:
    runs-on: ubuntu-latest
    if: failure()
    needs: [deploy-production]
    environment: production
    
    steps:
    - name: Rollback production deployment
      run: |
        ssh -o StrictHostKeyChecking=no ${{ secrets.PRODUCTION_USER }}@${{ secrets.PRODUCTION_HOST }} << 'EOF'
          cd /opt/relygate
          docker-compose -f docker-compose.prod.yml down
          ./scripts/restore-backup.sh latest
          docker-compose -f docker-compose.prod.yml up -d
        EOF

    - name: Notify rollback
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        channel: '#deployments'
        text: 'Production deployment failed and rolled back! :warning:'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

#### Branch Protection and Environment Configuration
```yaml
# .github/environments/production.yml
name: production
protection_rules:
  required_reviewers: 2
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  required_status_checks:
    - test
    - security-scan
    - build
deployment_branch_policy:
  protected_branches: true
  custom_branches: false
secrets:
  PRODUCTION_SSH_KEY: ${{ secrets.PRODUCTION_SSH_KEY }}
  PRODUCTION_HOST: ${{ secrets.PRODUCTION_HOST }}
  PRODUCTION_USER: ${{ secrets.PRODUCTION_USER }}
  PRODUCTION_URL: ${{ secrets.PRODUCTION_URL }}
  SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. GitLab CI/CD Pipeline

#### Complete GitLab CI Configuration
```yaml
# .gitlab-ci.yml
stages:
  - test
  - security
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  POSTGRES_DB: relygate_test
  POSTGRES_USER: test_user
  POSTGRES_PASSWORD: test_password

cache:
  paths:
    - node_modules/
    - .npm/

before_script:
  - npm ci --cache .npm --prefer-offline

test:
  stage: test
  image: node:18-alpine
  services:
    - postgres:15-alpine
  variables:
    NODE_ENV: test
    DB_HOST: postgres
    DB_PORT: 5432
    DB_NAME: $POSTGRES_DB
    DB_USER: $POSTGRES_USER
    DB_PASSWORD: $POSTGRES_PASSWORD
    JWT_SECRET: test-jwt-secret
  script:
    - npm run lint
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 1 week

security_scan:
  stage: security
  image: docker:stable
  services:
    - docker:dind
  before_script:
    - apk add --no-cache curl
  script:
    - docker run --rm -v "$PWD":/app -w /app aquasec/trivy fs .
    - docker run --rm -v "$PWD":/src securecodewarrior/docker-npm-audit /src
  allow_failure: false

build:
  stage: build
  image: docker:stable
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -f Dockerfile.prod -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main
    - staging

deploy_staging:
  stage: deploy-staging
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$STAGING_SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $STAGING_HOST >> ~/.ssh/known_hosts
    - chmod 644 ~/.ssh/known_hosts
  script:
    - ssh $STAGING_USER@$STAGING_HOST "cd /opt/relygate && docker-compose -f docker-compose.staging.yml pull && docker-compose -f docker-compose.staging.yml up -d"
    - sleep 30
    - curl -f $STAGING_URL/health
  environment:
    name: staging
    url: $STAGING_URL
  only:
    - staging

deploy_production:
  stage: deploy-production
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client curl
    - eval $(ssh-agent -s)
    - echo "$PRODUCTION_SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $PRODUCTION_HOST >> ~/.ssh/known_hosts
    - chmod 644 ~/.ssh/known_hosts
  script:
    # Create backup
    - ssh $PRODUCTION_USER@$PRODUCTION_HOST "cd /opt/relygate && ./scripts/backup.sh"
    # Deploy
    - ssh $PRODUCTION_USER@$PRODUCTION_HOST "cd /opt/relygate && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d --no-deps app"
    # Health check
    - sleep 60
    - curl -f $PRODUCTION_URL/health
  environment:
    name: production
    url: $PRODUCTION_URL
  when: manual
  only:
    - main
```

### 3. Jenkins Pipeline

#### Declarative Jenkins Pipeline
```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_NAME = 'relygate'
        STAGING_HOST = credentials('staging-host')
        PRODUCTION_HOST = credentials('production-host')
        SLACK_WEBHOOK = credentials('slack-webhook')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Lint & Test') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test:coverage'
                        publishHTML([
                            allowMissing: false,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'coverage',
                            reportFiles: 'index.html',
                            reportName: 'Coverage Report'
                        ])
                    }
                }
                stage('Security Audit') {
                    steps {
                        sh 'npm audit --audit-level=high'
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    sh '''
                        docker run --rm -v "$PWD":/app -w /app aquasec/trivy fs . --format json --output trivy-report.json
                    '''
                    archiveArtifacts artifacts: 'trivy-report.json', fingerprint: true
                }
            }
        }
        
        stage('Build Docker Image') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                }
            }
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.GIT_COMMIT_SHORT}", "-f Dockerfile.prod .")
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'staging'
            }
            steps {
                script {
                    sshagent(['staging-ssh-key']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no deploy@${STAGING_HOST} '
                                cd /opt/relygate &&
                                docker-compose -f docker-compose.staging.yml pull &&
                                docker-compose -f docker-compose.staging.yml up -d &&
                                sleep 30 &&
                                curl -f http://localhost:3000/health
                            '
                        """
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message "Deploy to production?"
                ok "Deploy"
                parameters {
                    choice(name: 'ENVIRONMENT', choices: ['production'], description: 'Target environment')
                }
            }
            steps {
                script {
                    sshagent(['production-ssh-key']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no deploy@${PRODUCTION_HOST} '
                                cd /opt/relygate &&
                                ./scripts/backup.sh &&
                                docker-compose -f docker-compose.prod.yml pull &&
                                docker-compose -f docker-compose.prod.yml up -d --no-deps app &&
                                sleep 60 &&
                                curl -f http://localhost:3000/health
                            '
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                if (env.BRANCH_NAME == 'main') {
                    slackSend(
                        channel: '#deployments',
                        color: 'good',
                        message: ":rocket: Production deployment successful! Commit: ${env.GIT_COMMIT_SHORT}",
                        teamDomain: 'your-team',
                        tokenCredentialId: 'slack-token'
                    )
                }
            }
        }
        failure {
            script {
                slackSend(
                    channel: '#deployments',
                    color: 'danger',
                    message: ":x: Deployment failed! Branch: ${env.BRANCH_NAME}, Commit: ${env.GIT_COMMIT_SHORT}",
                    teamDomain: 'your-team',
                    tokenCredentialId: 'slack-token'
                )
            }
        }
        always {
            cleanWs()
        }
    }
}
```

---

## Database Management

### 1. Migration System

#### Database Migration Framework
```javascript
// migrations/migration-runner.js
const fs = require('fs').promises;
const path = require('path');
const { query } = require('../config/database');

class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.migrationTable = 'schema_migrations';
  }

  async initialize() {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        checksum VARCHAR(255)
      )
    `);
  }

  async getExecutedMigrations() {
    const result = await query(`SELECT version FROM ${this.migrationTable} ORDER BY version`);
    return result.rows.map(row => row.version);
  }

  async getPendingMigrations() {
    const allMigrations = await this.getAllMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    
    return allMigrations.filter(migration => 
      !executedMigrations.includes(migration.version)
    );
  }

  async getAllMigrations() {
    const files = await fs.readdir(this.migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    return migrationFiles.map(file => ({
      version: file.replace('.sql', ''),
      name: this.extractMigrationName(file),
      filename: file,
      path: path.join(this.migrationsDir, file)
    }));
  }

  extractMigrationName(filename) {
    // Extract name from format: 20240115_120000_create_visitors_table.sql
    const parts = filename.replace('.sql', '').split('_');
    return parts.slice(2).join('_');
  }

  async executeMigration(migration) {
    const startTime = Date.now();
    const content = await fs.readFile(migration.path, 'utf8');
    const checksum = require('crypto').createHash('md5').update(content).digest('hex');

    console.log(`Executing migration: ${migration.version} - ${migration.name}`);

    try {
      // Execute the migration
      await query(content);
      
      const executionTime = Date.now() - startTime;
      
      // Record the migration
      await query(`
        INSERT INTO ${this.migrationTable} (version, name, execution_time_ms, checksum)
        VALUES ($1, $2, $3, $4)
      `, [migration.version, migration.name, executionTime, checksum]);
      
      console.log(`Migration completed in ${executionTime}ms`);
      
    } catch (error) {
      console.error(`Migration failed: ${migration.version}`, error);
      throw error;
    }
  }

  async runMigrations() {
    await this.initialize();
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }
    
    console.log('All migrations completed successfully');
  }

  async rollback(targetVersion) {
    // Implementation for rollback functionality
    console.log(`Rolling back to version: ${targetVersion}`);
    // This would require down migrations to be implemented
  }

  async status() {
    await this.initialize();
    const allMigrations = await this.getAllMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    
    console.log('\nMigration Status:');
    console.log('================');
    
    for (const migration of allMigrations) {
      const status = executedMigrations.includes(migration.version) ? '✓' : '✗';
      console.log(`${status} ${migration.version} - ${migration.name}`);
    }
  }
}

module.exports = MigrationRunner;
```

#### Migration CLI Tool
```javascript
#!/usr/bin/env node
// bin/migrate.js

const MigrationRunner = require('../migrations/migration-runner');
const fs = require('fs').promises;
const path = require('path');

const commands = {
  async create(name) {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filepath = path.join(__dirname, '../migrations', filename);
    
    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Up migration
BEGIN;

-- Add your migration SQL here


COMMIT;

-- Down migration (for rollback support)
-- BEGIN;
-- 
-- Add rollback SQL here
-- 
-- COMMIT;
`;
    
    await fs.writeFile(filepath, template);
    console.log(`Created migration: ${filename}`);
  },

  async up() {
    const runner = new MigrationRunner();
    await runner.runMigrations();
  },

  async status() {
    const runner = new MigrationRunner();
    await runner.status();
  },

  async rollback(version) {
    const runner = new MigrationRunner();
    await runner.rollback(version);
  }
};

async function main() {
  const [,, command, ...args] = process.argv;
  
  if (!command || !commands[command]) {
    console.log(`
Usage: npm run migrate <command> [args]

Commands:
  create <name>     Create a new migration file
  up               Run all pending migrations
  status           Show migration status
  rollback <version>  Rollback to specific version

Examples:
  npm run migrate create "add users table"
  npm run migrate up
  npm run migrate status
  npm run migrate rollback 20240115_120000
    `);
    process.exit(1);
  }
  
  try {
    await commands[command](...args);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

#### Sample Migration Files
```sql
-- migrations/20240115_120000_create_visitors_table.sql
-- Migration: Create visitors table with tenant isolation
-- Created: 2024-01-15T12:00:00.000Z

-- Up migration
BEGIN;

CREATE TABLE IF NOT EXISTS visitors (
    VisitorID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    TenantID UUID NOT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100),
    Mobile VARCHAR(15) NOT NULL,
    Email VARCHAR(255),
    Purpose VARCHAR(255),
    VisitorType VARCHAR(50) DEFAULT 'unregistered',
    PhotoPath VARCHAR(500),
    IDDocumentPath VARCHAR(500),
    CheckInTime TIMESTAMP,
    CheckOutTime TIMESTAMP,
    Status VARCHAR(50) DEFAULT 'pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CreatedBy UUID,
    UpdatedBy UUID,
    IsActive BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_visitors_tenant_id ON visitors(TenantID);
CREATE INDEX idx_visitors_mobile ON visitors(Mobile);
CREATE INDEX idx_visitors_status ON visitors(Status);
CREATE INDEX idx_visitors_check_in_time ON visitors(CheckInTime);
CREATE INDEX idx_visitors_created_at ON visitors(CreatedAt);

-- Add constraints
ALTER TABLE visitors ADD CONSTRAINT chk_visitors_mobile 
    CHECK (Mobile ~ '^[6-9][0-9]{9}$');

ALTER TABLE visitors ADD CONSTRAINT chk_visitors_status 
    CHECK (Status IN ('pending', 'checked_in', 'checked_out', 'cancelled'));

-- Enable row level security
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tenant_isolation_visitors ON visitors
    FOR ALL TO application_role
    USING (TenantID = current_setting('app.tenant_id')::UUID);

COMMIT;
```

### 2. Database Schema Versioning

#### Schema Version Control
```javascript
// db/schema-manager.js
const { query } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class SchemaManager {
  constructor() {
    this.schemaDir = path.join(__dirname, 'schema');
    this.seedsDir = path.join(__dirname, 'seeds');
  }

  async getCurrentSchemaVersion() {
    try {
      const result = await query(`
        SELECT version FROM schema_migrations 
        ORDER BY version DESC 
        LIMIT 1
      `);
      return result.rows[0]?.version || '0';
    } catch (error) {
      return '0';
    }
  }

  async exportSchema() {
    const version = await this.getCurrentSchemaVersion();
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
    const filename = `schema_${version}_${timestamp}.sql`;
    const filepath = path.join(this.schemaDir, filename);

    const schemaSQL = await this.generateSchemaSQL();
    await fs.writeFile(filepath, schemaSQL);
    
    console.log(`Schema exported: ${filename}`);
    return filepath;
  }

  async generateSchemaSQL() {
    // Get all tables structure
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'schema_migrations'
      ORDER BY table_name
    `);

    let schemaSQL = '-- Generated Schema Export\n';
    schemaSQL += `-- Generated: ${new Date().toISOString()}\n\n`;

    for (const table of tables.rows) {
      const tableName = table.table_name;
      
      // Get table structure
      const createTableSQL = await this.getCreateTableSQL(tableName);
      schemaSQL += createTableSQL + '\n\n';
      
      // Get indexes
      const indexes = await this.getTableIndexes(tableName);
      if (indexes.length > 0) {
        schemaSQL += `-- Indexes for ${tableName}\n`;
        schemaSQL += indexes.join('\n') + '\n\n';
      }
    }

    // Get foreign keys
    const foreignKeys = await this.getForeignKeys();
    if (foreignKeys.length > 0) {
      schemaSQL += '-- Foreign Key Constraints\n';
      schemaSQL += foreignKeys.join('\n') + '\n\n';
    }

    return schemaSQL;
  }

  async getCreateTableSQL(tableName) {
    const columns = await query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    let sql = `CREATE TABLE ${tableName} (\n`;
    
    const columnDefs = columns.rows.map(col => {
      let def = `  ${col.column_name} ${col.data_type}`;
      
      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`;
      }
      
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      
      return def;
    });

    sql += columnDefs.join(',\n');
    sql += '\n);';
    
    return sql;
  }

  async seedDatabase() {
    const seedFiles = await fs.readdir(this.seedsDir);
    const sortedSeeds = seedFiles
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const seedFile of sortedSeeds) {
      console.log(`Running seed: ${seedFile}`);
      const seedSQL = await fs.readFile(path.join(this.seedsDir, seedFile), 'utf8');
      await query(seedSQL);
    }
    
    console.log('Database seeding completed');
  }

  async validateSchema() {
    const validations = [];
    
    // Check for missing indexes on foreign keys
    const missingIndexes = await this.findMissingIndexes();
    if (missingIndexes.length > 0) {
      validations.push({
        type: 'warning',
        message: 'Missing indexes on foreign keys',
        details: missingIndexes
      });
    }
    
    // Check for tables without row-level security
    const tablesWithoutRLS = await this.findTablesWithoutRLS();
    if (tablesWithoutRLS.length > 0) {
      validations.push({
        type: 'error',
        message: 'Tables without row-level security',
        details: tablesWithoutRLS
      });
    }
    
    return validations;
  }

  async findMissingIndexes() {
    // Implementation to find foreign key columns without indexes
    const result = await query(`
      SELECT 
        conrelid::regclass AS table_name,
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_def
      FROM pg_constraint
      WHERE contype = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = conrelid
        AND i.indkey::text = conkey::text
      )
    `);
    
    return result.rows;
  }

  async findTablesWithoutRLS() {
    const result = await query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename != 'schema_migrations'
      AND NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE schemaname = 'public'
        AND tablename = pg_tables.tablename
      )
    `);
    
    return result.rows.map(row => row.tablename);
  }
}

module.exports = SchemaManager;
```

### 3. Database Monitoring

#### Database Health Monitoring
```javascript
// monitoring/db-monitor.js
const { pool, query } = require('../config/database');
const { logger } = require('../utils/logger');

class DatabaseMonitor {
  constructor() {
    this.metrics = {
      connections: 0,
      queries: 0,
      slowQueries: 0,
      errors: 0,
    };
    
    this.slowQueryThreshold = 1000; // 1 second
    this.monitoringInterval = 30000; // 30 seconds
  }

  start() {
    setInterval(() => {
      this.collectMetrics();
    }, this.monitoringInterval);
    
    logger.info('Database monitoring started');
  }

  async collectMetrics() {
    try {
      // Connection metrics
      const connectionStats = await this.getConnectionStats();
      const queryStats = await this.getQueryStats();
      const tableStats = await this.getTableStats();
      const lockStats = await this.getLockStats();
      
      const metrics = {
        timestamp: new Date().toISOString(),
        connections: connectionStats,
        queries: queryStats,
        tables: tableStats,
        locks: lockStats,
        pool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount,
        },
      };
      
      logger.info('Database metrics collected', metrics);
      
      // Check for alerts
      this.checkAlerts(metrics);
      
    } catch (error) {
      logger.error('Failed to collect database metrics', { error: error.message });
    }
  }

  async getConnectionStats() {
    const result = await query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    
    return result.rows[0];
  }

  async getQueryStats() {
    const result = await query(`
      SELECT 
        sum(calls) as total_queries,
        sum(total_time) as total_time,
        avg(mean_time) as avg_time,
        max(max_time) as max_time,
        sum(calls) FILTER (WHERE mean_time > $1) as slow_queries
      FROM pg_stat_statements
    `, [this.slowQueryThreshold]);
    
    return result.rows[0];
  }

  async getTableStats() {
    const result = await query(`
      SELECT 
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        n_tup_ins,
        n_tup_upd,
        n_tup_del,
        n_live_tup,
        n_dead_tup
      FROM pg_stat_user_tables
      ORDER BY seq_tup_read DESC
      LIMIT 10
    `);
    
    return result.rows;
  }

  async getLockStats() {
    const result = await query(`
      SELECT 
        mode,
        count(*) as count
      FROM pg_locks
      WHERE granted = true
      GROUP BY mode
      ORDER BY count DESC
    `);
    
    return result.rows;
  }

  async getSlowQueries() {
    const result = await query(`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time,
        stddev_time
      FROM pg_stat_statements
      WHERE mean_time > $1
      ORDER BY mean_time DESC
      LIMIT 10
    `, [this.slowQueryThreshold]);
    
    return result.rows;
  }

  checkAlerts(metrics) {
    // High connection count
    if (metrics.connections.total_connections > 150) {
      logger.warn('High database connection count', {
        count: metrics.connections.total_connections,
        threshold: 150
      });
    }
    
    // High idle in transaction
    if (metrics.connections.idle_in_transaction > 10) {
      logger.warn('High idle in transaction connections', {
        count: metrics.connections.idle_in_transaction,
        threshold: 10
      });
    }
    
    // Pool exhaustion warning
    if (metrics.pool.waiting > 5) {
      logger.warn('Connection pool exhaustion warning', {
        waiting: metrics.pool.waiting,
        total: metrics.pool.total,
        idle: metrics.pool.idle
      });
    }
  }

  async getHealthStatus() {
    try {
      const connectionTest = await query('SELECT 1 as health');
      const metrics = await this.collectMetrics();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connection: connectionTest.rows[0].health === 1,
        pool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}

module.exports = DatabaseMonitor;
```

---

## Health Checks and Alerting

### 1. Application Health Checks

#### Comprehensive Health Check Implementation
```javascript
// routes/health.js
const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Basic health check
router.get('/health', async (req, res) => {
  try {
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {}
    };

    // Database connectivity check
    try {
      const dbStart = Date.now();
      await query('SELECT 1 as db_health');
      healthChecks.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart
      };
    } catch (error) {
      healthChecks.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
      healthChecks.status = 'unhealthy';
    }

    // File system check
    try {
      const fs = require('fs').promises;
      await fs.access('./uploads', fs.constants.W_OK);
      healthChecks.checks.filesystem = {
        status: 'healthy',
        uploadsDirectory: 'writable'
      };
    } catch (error) {
      healthChecks.checks.filesystem = {
        status: 'unhealthy',
        error: error.message
      };
      healthChecks.status = 'unhealthy';
    }

    // Memory check
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 1024 * 1024 * 1024; // 1GB
    healthChecks.checks.memory = {
      status: memoryUsage.heapUsed < memoryThreshold ? 'healthy' : 'warning',
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    };

    const statusCode = healthChecks.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthChecks);

  } catch (error) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        pid: process.pid
      },
      application: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000
      },
      resources: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      checks: {}
    };

    // Database detailed check
    try {
      const dbStats = await query(`
        SELECT 
          current_database() as database_name,
          version() as version,
          current_setting('max_connections') as max_connections,
          count(*) as active_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
      
      detailedHealth.checks.database = {
        status: 'healthy',
        ...dbStats.rows[0]
      };
    } catch (error) {
      detailedHealth.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
      detailedHealth.status = 'unhealthy';
    }

    // Disk space check
    try {
      const fs = require('fs').promises;
      const stats = await fs.stat('./uploads');
      detailedHealth.checks.storage = {
        status: 'healthy',
        uploadsDirectory: {
          exists: true,
          size: stats.size,
          modified: stats.mtime
        }
      };
    } catch (error) {
      detailedHealth.checks.storage = {
        status: 'unhealthy',
        error: error.message
      };
      detailedHealth.status = 'unhealthy';
    }

    const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);

  } catch (error) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if application is ready to serve traffic
    await query('SELECT 1');
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
```

### 2. Alerting System

#### Alerting Configuration
```javascript
// monitoring/alerting.js
const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

class AlertingSystem {
  constructor() {
    this.channels = {
      email: this.setupEmailChannel(),
      slack: this.setupSlackChannel(),
      webhook: this.setupWebhookChannel()
    };
    
    this.alertThresholds = {
      highCPU: 80,
      highMemory: 85,
      highDiskUsage: 90,
      highResponseTime: 2000,
      highErrorRate: 5,
      databaseConnectionsFull: 90
    };
    
    this.alertCooldowns = new Map();
  }

  setupEmailChannel() {
    if (!process.env.SMTP_HOST) return null;
    
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  setupSlackChannel() {
    if (!process.env.SLACK_WEBHOOK_URL) return null;
    
    return {
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#alerts'
    };
  }

  setupWebhookChannel() {
    if (!process.env.ALERT_WEBHOOK_URL) return null;
    
    return {
      url: process.env.ALERT_WEBHOOK_URL,
      token: process.env.ALERT_WEBHOOK_TOKEN
    };
  }

  async sendAlert(alert) {
    const alertKey = `${alert.type}_${alert.resource}`;
    const now = Date.now();
    const cooldownPeriod = 15 * 60 * 1000; // 15 minutes
    
    // Check cooldown
    if (this.alertCooldowns.has(alertKey)) {
      const lastAlert = this.alertCooldowns.get(alertKey);
      if (now - lastAlert < cooldownPeriod) {
        logger.debug('Alert in cooldown period, skipping', { alertKey });
        return;
      }
    }
    
    this.alertCooldowns.set(alertKey, now);
    
    logger.warn('Sending alert', alert);
    
    // Send to all configured channels
    const promises = [];
    
    if (this.channels.email) {
      promises.push(this.sendEmailAlert(alert));
    }
    
    if (this.channels.slack) {
      promises.push(this.sendSlackAlert(alert));
    }
    
    if (this.channels.webhook) {
      promises.push(this.sendWebhookAlert(alert));
    }
    
    await Promise.allSettled(promises);
  }

  async sendEmailAlert(alert) {
    if (!this.channels.email) return;
    
    const subject = `[ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`;
    const html = this.generateEmailTemplate(alert);
    
    try {
      await this.channels.email.sendMail({
        from: process.env.ALERT_FROM_EMAIL || 'alerts@relygate.com',
        to: process.env.ALERT_TO_EMAIL,
        subject,
        html
      });
      
      logger.info('Email alert sent', { alertType: alert.type });
    } catch (error) {
      logger.error('Failed to send email alert', { error: error.message });
    }
  }

  async sendSlackAlert(alert) {
    if (!this.channels.slack) return;
    
    const payload = {
      channel: this.channels.slack.channel,
      username: 'RelyGate Alerts',
      icon_emoji: this.getAlertEmoji(alert.severity),
      attachments: [{
        color: this.getAlertColor(alert.severity),
        title: alert.title,
        text: alert.description,
        fields: [
          {
            title: 'Severity',
            value: alert.severity,
            short: true
          },
          {
            title: 'Resource',
            value: alert.resource,
            short: true
          },
          {
            title: 'Value',
            value: alert.value,
            short: true
          },
          {
            title: 'Threshold',
            value: alert.threshold,
            short: true
          }
        ],
        footer: 'RelyGate Monitoring',
        ts: Math.floor(Date.now() / 1000)
      }]
    };
    
    try {
      const response = await fetch(this.channels.slack.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }
      
      logger.info('Slack alert sent', { alertType: alert.type });
    } catch (error) {
      logger.error('Failed to send Slack alert', { error: error.message });
    }
  }

  async sendWebhookAlert(alert) {
    if (!this.channels.webhook) return;
    
    try {
      const response = await fetch(this.channels.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.channels.webhook.token}`
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          service: 'relygate',
          environment: process.env.NODE_ENV,
          ...alert
        })
      });
      
      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }
      
      logger.info('Webhook alert sent', { alertType: alert.type });
    } catch (error) {
      logger.error('Failed to send webhook alert', { error: error.message });
    }
  }

  generateEmailTemplate(alert) {
    return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .alert-header { background: ${this.getAlertColor(alert.severity)}; color: white; padding: 10px; }
          .alert-body { padding: 20px; border: 1px solid #ddd; }
          .alert-details { margin-top: 15px; }
          .alert-details table { width: 100%; border-collapse: collapse; }
          .alert-details td { padding: 8px; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="alert-header">
          <h2>${alert.title}</h2>
        </div>
        <div class="alert-body">
          <p><strong>Description:</strong> ${alert.description}</p>
          <div class="alert-details">
            <table>
              <tr><td><strong>Severity:</strong></td><td>${alert.severity}</td></tr>
              <tr><td><strong>Resource:</strong></td><td>${alert.resource}</td></tr>
              <tr><td><strong>Current Value:</strong></td><td>${alert.value}</td></tr>
              <tr><td><strong>Threshold:</strong></td><td>${alert.threshold}</td></tr>
              <tr><td><strong>Time:</strong></td><td>${new Date().toISOString()}</td></tr>
              <tr><td><strong>Environment:</strong></td><td>${process.env.NODE_ENV}</td></tr>
            </table>
          </div>
        </div>
      </body>
    </html>
    `;
  }

  getAlertEmoji(severity) {
    const emojis = {
      critical: ':fire:',
      warning: ':warning:',
      info: ':information_source:'
    };
    return emojis[severity] || ':question:';
  }

  getAlertColor(severity) {
    const colors = {
      critical: '#FF0000',
      warning: '#FFA500',
      info: '#0080FF'
    };
    return colors[severity] || '#808080';
  }

  // Alert check methods
  checkCPUUsage(cpuUsage) {
    if (cpuUsage > this.alertThresholds.highCPU) {
      this.sendAlert({
        type: 'high_cpu',
        severity: cpuUsage > 95 ? 'critical' : 'warning',
        title: 'High CPU Usage',
        description: `CPU usage is at ${cpuUsage}%`,
        resource: 'CPU',
        value: `${cpuUsage}%`,
        threshold: `${this.alertThresholds.highCPU}%`
      });
    }
  }

  checkMemoryUsage(memoryUsage) {
    const usagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    if (usagePercent > this.alertThresholds.highMemory) {
      this.sendAlert({
        type: 'high_memory',
        severity: usagePercent > 95 ? 'critical' : 'warning',
        title: 'High Memory Usage',
        description: `Memory usage is at ${usagePercent.toFixed(2)}%`,
        resource: 'Memory',
        value: `${usagePercent.toFixed(2)}%`,
        threshold: `${this.alertThresholds.highMemory}%`
      });
    }
  }

  checkResponseTime(responseTime) {
    if (responseTime > this.alertThresholds.highResponseTime) {
      this.sendAlert({
        type: 'high_response_time',
        severity: responseTime > 5000 ? 'critical' : 'warning',
        title: 'High Response Time',
        description: `Response time is ${responseTime}ms`,
        resource: 'API Response Time',
        value: `${responseTime}ms`,
        threshold: `${this.alertThresholds.highResponseTime}ms`
      });
    }
  }
}

module.exports = AlertingSystem;
```

### 3. Monitoring Integration

#### Prometheus Metrics Export
```javascript
// monitoring/metrics.js
const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({
  app: 'relygate-api',
  prefix: 'relygate_',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register
});

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'relygate_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'relygate_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const dbQueryDuration = new client.Histogram({
  name: 'relygate_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

const dbConnectionsActive = new client.Gauge({
  name: 'relygate_db_connections_active',
  help: 'Number of active database connections'
});

const visitorCheckIns = new client.Counter({
  name: 'relygate_visitor_checkins_total',
  help: 'Total number of visitor check-ins',
  labelNames: ['tenant_id', 'visitor_type']
});

const tenantActiveUsers = new client.Gauge({
  name: 'relygate_tenant_active_users',
  help: 'Number of active users per tenant',
  labelNames: ['tenant_id']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(visitorCheckIns);
register.registerMetric(tenantActiveUsers);

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Database metrics tracking
const trackDbQuery = (queryType, duration) => {
  dbQueryDuration
    .labels(queryType)
    .observe(duration / 1000);
};

// Business metrics tracking
const trackVisitorCheckIn = (tenantId, visitorType) => {
  visitorCheckIns
    .labels(tenantId, visitorType)
    .inc();
};

const updateTenantActiveUsers = (tenantId, count) => {
  tenantActiveUsers
    .labels(tenantId)
    .set(count);
};

// Metrics endpoint
const getMetrics = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
};

module.exports = {
  register,
  metricsMiddleware,
  trackDbQuery,
  trackVisitorCheckIn,
  updateTenantActiveUsers,
  getMetrics,
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    dbQueryDuration,
    dbConnectionsActive,
    visitorCheckIns,
    tenantActiveUsers
  }
};
```

---

## Troubleshooting Guide

### 1. Common Issues and Solutions

#### Application Startup Issues
```
Problem: Application fails to start with "Cannot connect to database"

Symptoms:
- Application logs show database connection errors
- Health check endpoints return 503
- Container restarts repeatedly

Diagnosis:
1. Check database container status:
   docker-compose ps
   
2. Verify database logs:
   docker-compose logs postgres
   
3. Test database connectivity:
   docker-compose exec app ping postgres
   
4. Check environment variables:
   docker-compose exec app env | grep DB_

Solutions:
1. Verify database is running and healthy
2. Check database credentials in environment
3. Ensure network connectivity between containers
4. Verify database initialization scripts completed
5. Check PostgreSQL configuration for connection limits

Commands:
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Reset database connection
docker-compose restart postgres app

# View full environment
docker-compose config
```

#### High Memory Usage
```
Problem: Application consuming excessive memory

Symptoms:
- Memory usage above 1GB
- OOM (Out of Memory) errors
- Slow response times
- Container being killed by orchestrator

Diagnosis:
1. Check memory usage:
   docker stats container_name
   
2. Analyze heap dump:
   docker-compose exec app kill -USR2 1
   
3. Check for memory leaks:
   # Enable GC logging
   NODE_OPTIONS="--max-old-space-size=1024 --trace-gc"

Solutions:
1. Optimize database connection pooling
2. Implement proper caching strategies
3. Add memory limits to containers
4. Review and optimize file upload handling
5. Implement garbage collection monitoring

Configuration:
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

#### Database Performance Issues
```
Problem: Slow database queries and high response times

Symptoms:
- API response times > 2 seconds
- Database CPU usage high
- Many slow query log entries
- Connection pool exhaustion

Diagnosis:
1. Check slow queries:
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;
   
2. Check active connections:
   SELECT count(*), state 
   FROM pg_stat_activity 
   GROUP BY state;
   
3. Check index usage:
   SELECT schemaname, tablename, seq_scan, idx_scan 
   FROM pg_stat_user_tables 
   WHERE seq_scan > 0;

Solutions:
1. Add missing database indexes
2. Optimize query patterns
3. Implement query caching
4. Increase connection pool size
5. Consider read replicas for heavy read workloads

Commands:
# Create missing indexes
CREATE INDEX CONCURRENTLY idx_visitors_tenant_mobile 
ON visitors(TenantID, Mobile);

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM visitors WHERE TenantID = $1;
```

#### File Upload Issues
```
Problem: File uploads failing or corrupted

Symptoms:
- Upload endpoints returning 500 errors
- Files not appearing in expected directories
- Corrupted image files
- Disk space errors

Diagnosis:
1. Check disk space:
   df -h /app/uploads
   
2. Verify directory permissions:
   ls -la /app/uploads
   
3. Check upload logs:
   docker-compose logs app | grep upload
   
4. Test file write permissions:
   touch /app/uploads/test.txt

Solutions:
1. Ensure proper directory permissions (755 for directories, 644 for files)
2. Implement disk space monitoring
3. Add file validation and size limits
4. Configure proper cleanup routines
5. Use external storage for production (S3, etc.)

Commands:
# Fix permissions
docker-compose exec app chown -R relygate:nodejs /app/uploads
docker-compose exec app chmod -R 755 /app/uploads

# Clean old files
find /app/uploads -type f -mtime +30 -delete
```

#### JWT Authentication Issues
```
Problem: Users getting authentication errors

Symptoms:
- 401 Unauthorized responses
- "Invalid token" errors
- Users logged out unexpectedly
- Token verification failures

Diagnosis:
1. Check JWT secret configuration:
   echo $JWT_SECRET
   
2. Verify token format:
   # Decode JWT header and payload
   node -e "console.log(JSON.parse(Buffer.from('$TOKEN'.split('.')[1], 'base64')))"
   
3. Check token expiration:
   # Look for 'exp' field in decoded token

Solutions:
1. Verify JWT_SECRET is consistent across all instances
2. Check token expiration settings
3. Implement proper token refresh mechanism
4. Ensure system clock synchronization
5. Add proper error handling for expired tokens

Code fix:
// Add token refresh logic
const refreshToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token && isTokenExpiringSoon(token)) {
    const newToken = generateToken(req.user);
    res.setHeader('X-New-Token', newToken);
  }
  next();
};
```

### 2. Monitoring and Alerts Troubleshooting

#### Metrics Collection Issues
```
Problem: Prometheus metrics not being collected

Symptoms:
- Missing data in Grafana dashboards
- Prometheus targets showing as down
- Metrics endpoint returning 404

Diagnosis:
1. Check metrics endpoint:
   curl http://localhost:3000/metrics
   
2. Verify Prometheus configuration:
   docker-compose exec prometheus cat /etc/prometheus/prometheus.yml
   
3. Check Prometheus targets:
   curl http://localhost:9090/api/v1/targets

Solutions:
1. Ensure metrics endpoint is properly exposed
2. Verify network connectivity between services
3. Check Prometheus service discovery configuration
4. Validate metrics format and labels

Configuration:
# Expose metrics endpoint
app.get('/metrics', metricsMiddleware);

# Test metrics endpoint
curl -s http://localhost:3000/metrics | head -20
```

#### Log Aggregation Issues
```
Problem: Logs not appearing in centralized logging

Symptoms:
- Missing application logs in ELK stack
- Filebeat not forwarding logs
- Log parsing errors in Logstash

Diagnosis:
1. Check log file permissions:
   ls -la /app/logs/
   
2. Verify Filebeat configuration:
   docker-compose exec filebeat filebeat test config
   
3. Check Logstash processing:
   docker-compose logs logstash | grep ERROR

Solutions:
1. Ensure log files are accessible to Filebeat
2. Verify log format matches Logstash patterns
3. Check network connectivity to Elasticsearch
4. Validate Elasticsearch cluster health

Commands:
# Test Filebeat configuration
docker-compose exec filebeat filebeat test output

# Check Elasticsearch health
curl http://localhost:9200/_cluster/health
```

### 3. Performance Troubleshooting

#### CPU Usage Investigation
```bash
#!/bin/bash
# cpu-investigation.sh

echo "=== CPU Usage Investigation ==="
echo "Current time: $(date)"
echo

# Overall system CPU
echo "=== System CPU Usage ==="
top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}'

# Container CPU usage
echo "=== Container CPU Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Process-level CPU for application
echo "=== Application Process CPU ==="
docker-compose exec app ps aux | head -1
docker-compose exec app ps aux | grep node

# Node.js event loop lag
echo "=== Event Loop Lag ==="
docker-compose exec app node -e "
  const { performance } = require('perf_hooks');
  const start = performance.now();
  setImmediate(() => {
    console.log('Event loop lag:', performance.now() - start, 'ms');
  });
"

# Database CPU usage
echo "=== Database CPU Usage ==="
docker-compose exec postgres psql -U postgres -d relygate -c "
  SELECT 
    query,
    calls,
    total_time,
    mean_time,
    (100.0 * total_time / sum(total_time) OVER()) AS percent_total
  FROM pg_stat_statements 
  ORDER BY total_time DESC 
  LIMIT 5;
"
```

#### Memory Leak Detection
```bash
#!/bin/bash
# memory-leak-detection.sh

echo "=== Memory Leak Detection ==="
echo "Current time: $(date)"
echo

# Take heap snapshot
echo "=== Taking Heap Snapshot ==="
docker-compose exec app node -e "
  require('v8').writeHeapSnapshot('/app/logs/heap-snapshot-$(date +%s).heapsnapshot');
  console.log('Heap snapshot saved');
"

# Monitor memory over time
echo "=== Memory Usage Over Time ==="
for i in {1..10}; do
  echo "Sample $i:"
  docker stats --no-stream --format "{{.MemUsage}}\t{{.MemPerc}}" relygate_app
  sleep 30
done

# Check for memory leaks in logs
echo "=== Checking for Memory Warnings ==="
docker-compose logs app | grep -i "memory\|heap\|gc" | tail -20

# Database memory usage
echo "=== Database Memory Usage ==="
docker-compose exec postgres psql -U postgres -d relygate -c "
  SELECT 
    setting as max_connections,
    current_setting('shared_buffers') as shared_buffers,
    current_setting('work_mem') as work_mem
  FROM pg_settings WHERE name = 'max_connections';
"
```

### 4. Network Connectivity Issues

#### Network Diagnostics Script
```bash
#!/bin/bash
# network-diagnostics.sh

echo "=== Network Diagnostics ==="
echo "Current time: $(date)"
echo

# Check container network connectivity
echo "=== Container Network Connectivity ==="
docker-compose exec app ping -c 3 postgres
docker-compose exec app ping -c 3 redis
docker-compose exec app nslookup postgres

# Check port accessibility
echo "=== Port Accessibility ==="
docker-compose exec app nc -zv postgres 5432
docker-compose exec app nc -zv redis 6379

# Check external connectivity
echo "=== External Connectivity ==="
docker-compose exec app ping -c 3 8.8.8.8
docker-compose exec app curl -I https://api.github.com

# Check load balancer health
echo "=== Load Balancer Health ==="
curl -I http://localhost/health
curl -I https://localhost/health

# Check SSL certificate
echo "=== SSL Certificate Check ==="
openssl s_client -connect localhost:443 -servername localhost < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Database connection test
echo "=== Database Connection Test ==="
docker-compose exec app node -e "
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
  
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.log('Database connection failed:', err.message);
    } else {
      console.log('Database connection successful:', res.rows[0]);
    }
    pool.end();
  });
"
```

---

## Maintenance Procedures

### 1. Routine Maintenance Tasks

#### Daily Maintenance Script
```bash
#!/bin/bash
# daily-maintenance.sh

set -euo pipefail

LOG_FILE="/var/log/relygate-maintenance.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

log "Starting daily maintenance tasks"

# 1. Health check
log "Performing health check"
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log "ERROR: Health check failed"
    exit 1
fi

# 2. Database maintenance
log "Running database maintenance"
docker-compose exec -T postgres psql -U postgres -d relygate << 'EOF'
-- Update table statistics
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Check for bloated tables
SELECT 
    schemaname, 
    tablename, 
    n_dead_tup, 
    n_live_tup,
    ROUND(n_dead_tup * 100.0 / GREATEST(n_live_tup + n_dead_tup, 1), 2) as dead_tuple_percent
FROM pg_stat_user_tables 
WHERE n_dead_tup > 1000
ORDER BY dead_tuple_percent DESC;
EOF

# 3. Log rotation
log "Rotating logs"
find /app/logs -name "*.log" -size +100M -exec gzip {} \;
find /app/logs -name "*.log.gz" -mtime +30 -delete

# 4. Cleanup old uploads
log "Cleaning up old uploads"
find /app/uploads/temp -type f -mtime +1 -delete
find /app/uploads/qr_codes -type f -mtime +7 -delete

# 5. Container cleanup
log "Cleaning up Docker containers"
docker system prune -f

# 6. Backup verification
log "Verifying recent backups"
LATEST_BACKUP=$(ls -t /backups/relygate_backup_*.sql.gz 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    if [ $(find "$LATEST_BACKUP" -mtime -1) ]; then
        log "Recent backup found: $LATEST_BACKUP"
    else
        log "WARNING: No recent backup found"
    fi
else
    log "WARNING: No backups found"
fi

# 7. Disk space check
log "Checking disk space"
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log "WARNING: Disk usage is at ${DISK_USAGE}%"
fi

# 8. Memory usage check
log "Checking memory usage"
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 85 ]; then
    log "WARNING: Memory usage is at ${MEMORY_USAGE}%"
fi

# 9. Certificate expiry check
log "Checking SSL certificate expiry"
if [ -f "/etc/nginx/ssl/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -in /etc/nginx/ssl/fullchain.pem -noout -enddate | cut -d= -f2)
    CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
        log "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
    else
        log "SSL certificate valid for $DAYS_UNTIL_EXPIRY days"
    fi
fi

log "Daily maintenance completed successfully"
```

#### Weekly Maintenance Script
```bash
#!/bin/bash
# weekly-maintenance.sh

set -euo pipefail

LOG_FILE="/var/log/relygate-weekly-maintenance.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

log "Starting weekly maintenance tasks"

# 1. Database performance analysis
log "Analyzing database performance"
docker-compose exec -T postgres psql -U postgres -d relygate << 'EOF'
-- Table size analysis
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
    pg_total_relation_size(tablename::regclass) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Index usage analysis
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public';

-- Slow query analysis
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;
EOF

# 2. Security updates check
log "Checking for security updates"
docker-compose pull
if docker-compose config --quiet 2>/dev/null; then
    log "Docker images are up to date"
else
    log "WARNING: Docker configuration issues detected"
fi

# 3. Backup cleanup
log "Cleaning old backups"
find /backups -name "relygate_backup_*.sql.gz" -mtime +30 -delete
find /backups -name "uploads_backup_*.tar.gz" -mtime +90 -delete

# 4. Performance metrics export
log "Exporting performance metrics"
METRICS_DIR="/var/log/metrics"
mkdir -p "$METRICS_DIR"

# Export database metrics
docker-compose exec -T postgres psql -U postgres -d relygate -c "
COPY (
    SELECT 
        current_timestamp as timestamp,
        'database_size' as metric,
        pg_database_size(current_database()) as value
    UNION ALL
    SELECT 
        current_timestamp,
        'active_connections',
        count(*)
    FROM pg_stat_activity
    WHERE datname = current_database()
) TO STDOUT WITH CSV HEADER;" > "$METRICS_DIR/db_metrics_$(date +%Y%m%d).csv"

# 5. Log analysis
log "Analyzing application logs"
ERROR_COUNT=$(docker-compose logs app --since="7d" | grep -c "ERROR" || echo "0")
WARN_COUNT=$(docker-compose logs app --since="7d" | grep -c "WARN" || echo "0")

log "Last 7 days: $ERROR_COUNT errors, $WARN_COUNT warnings"

if [ "$ERROR_COUNT" -gt 100 ]; then
    log "WARNING: High error count detected"
fi

# 6. Tenant usage analysis
log "Analyzing tenant usage"
docker-compose exec -T postgres psql -U postgres -d relygate << 'EOF'
-- Tenant visitor counts
SELECT 
    t.TenantName,
    COUNT(v.VisitorID) as total_visitors,
    COUNT(CASE WHEN v.CreatedAt >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_visitors
FROM tenants t
LEFT JOIN visitors v ON t.TenantID = v.TenantID
GROUP BY t.TenantID, t.TenantName
ORDER BY total_visitors DESC;
EOF

# 7. File system cleanup
log "Deep cleaning file system"
# Remove temporary files older than 7 days
find /tmp -type f -mtime +7 -delete 2>/dev/null || true

# Clean up Docker volumes
docker volume prune -f

# Clean up unused Docker networks
docker network prune -f

log "Weekly maintenance completed successfully"
```

### 2. Update and Upgrade Procedures

#### Application Update Script
```bash
#!/bin/bash
# update-application.sh

set -euo pipefail

VERSION="$1"
ENVIRONMENT="${2:-production}"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version> [environment]"
    echo "Example: $0 v2.1.0 production"
    exit 1
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting application update to version $VERSION"

# Pre-update checks
log "Performing pre-update checks"

# Check if version exists
if ! docker pull "your-registry/relygate:$VERSION"; then
    log "ERROR: Version $VERSION not found in registry"
    exit 1
fi

# Health check current deployment
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log "ERROR: Current deployment is unhealthy"
    exit 1
fi

# Create backup
log "Creating pre-update backup"
./scripts/backup.sh

# Update deployment
log "Updating application to version $VERSION"

case "$ENVIRONMENT" in
    "production")
        COMPOSE_FILE="docker-compose.prod.yml"
        ;;
    "staging")
        COMPOSE_FILE="docker-compose.staging.yml"
        ;;
    *)
        COMPOSE_FILE="docker-compose.yml"
        ;;
esac

# Update image tag in compose file
sed -i "s|image: your-registry/relygate:.*|image: your-registry/relygate:$VERSION|g" "$COMPOSE_FILE"

# Pull new image
docker-compose -f "$COMPOSE_FILE" pull app

# Rolling update
log "Performing rolling update"
docker-compose -f "$COMPOSE_FILE" up -d --no-deps app

# Wait for health check
log "Waiting for application to be healthy"
TIMEOUT=300
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "Application is healthy"
        break
    fi
    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    log "ERROR: Application failed to become healthy, rolling back"
    ./scripts/rollback.sh
    exit 1
fi

# Run database migrations if needed
log "Running database migrations"
docker-compose -f "$COMPOSE_FILE" exec app npm run migrate

# Post-update verification
log "Running post-update verification"
./scripts/smoke-test.sh

# Cleanup old images
log "Cleaning up old Docker images"
docker image prune -f

log "Application update completed successfully"
```

#### Database Migration Script
```bash
#!/bin/bash
# migrate-database.sh

set -euo pipefail

ENVIRONMENT="${1:-production}"
DRY_RUN="${2:-false}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

case "$ENVIRONMENT" in
    "production")
        COMPOSE_FILE="docker-compose.prod.yml"
        ;;
    "staging")
        COMPOSE_FILE="docker-compose.staging.yml"
        ;;
    *)
        COMPOSE_FILE="docker-compose.yml"
        ;;
esac

log "Starting database migration for $ENVIRONMENT"

# Pre-migration backup
if [ "$ENVIRONMENT" = "production" ]; then
    log "Creating pre-migration backup"
    ./scripts/backup.sh
fi

# Check migration status
log "Checking current migration status"
docker-compose -f "$COMPOSE_FILE" exec app npm run migrate status

if [ "$DRY_RUN" = "true" ]; then
    log "Dry run mode - showing pending migrations"
    docker-compose -f "$COMPOSE_FILE" exec app npm run migrate status
    exit 0
fi

# Run migrations
log "Running database migrations"
if docker-compose -f "$COMPOSE_FILE" exec app npm run migrate up; then
    log "Database migrations completed successfully"
else
    log "ERROR: Database migration failed"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Restoring from backup"
        ./scripts/restore-backup.sh latest
    fi
    
    exit 1
fi

# Verify migrations
log "Verifying migration status"
docker-compose -f "$COMPOSE_FILE" exec app npm run migrate status

log "Database migration completed"
```

### 3. Disaster Recovery Procedures

#### Complete System Recovery
```bash
#!/bin/bash
# disaster-recovery.sh

set -euo pipefail

BACKUP_DATE="$1"
RECOVERY_TYPE="${2:-full}"

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date> [recovery_type]"
    echo "Example: $0 20240115_120000 full"
    echo "Recovery types: full, database, files"
    exit 1
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting disaster recovery"
log "Backup date: $BACKUP_DATE"
log "Recovery type: $RECOVERY_TYPE"

# Stop services
log "Stopping services"
docker-compose -f docker-compose.prod.yml down

case "$RECOVERY_TYPE" in
    "full")
        log "Performing full system recovery"
        
        # Restore database
        log "Restoring database"
        if [ -f "/backups/relygate_backup_${BACKUP_DATE}.sql.gz" ]; then
            docker-compose -f docker-compose.prod.yml up -d postgres
            sleep 30
            
            gunzip -c "/backups/relygate_backup_${BACKUP_DATE}.sql.gz" | \
                docker-compose -f docker-compose.prod.yml exec -T postgres \
                psql -U postgres -d relygate
        else
            log "ERROR: Database backup not found for $BACKUP_DATE"
            exit 1
        fi
        
        # Restore files
        log "Restoring files"
        if [ -f "/backups/uploads_backup_${BACKUP_DATE}.tar.gz" ]; then
            tar -xzf "/backups/uploads_backup_${BACKUP_DATE}.tar.gz" -C /
        else
            log "WARNING: File backup not found for $BACKUP_DATE"
        fi
        
        # Start all services
        log "Starting services"
        docker-compose -f docker-compose.prod.yml up -d
        ;;
        
    "database")
        log "Performing database recovery only"
        # Database recovery logic here
        ;;
        
    "files")
        log "Performing file recovery only"
        # File recovery logic here
        ;;
        
    *)
        log "ERROR: Invalid recovery type: $RECOVERY_TYPE"
        exit 1
        ;;
esac

# Wait for services to be healthy
log "Waiting for services to be healthy"
sleep 60

# Health check
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log "Disaster recovery completed successfully"
else
    log "ERROR: Services are not healthy after recovery"
    exit 1
fi

# Send notification
log "Sending recovery notification"
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🔄 Disaster recovery completed for RelyGate"}' \
        "$SLACK_WEBHOOK_URL"
fi

log "Disaster recovery procedure completed"
```

This completes the comprehensive deployment and operations guide for the RelyGate visitor management system. The guide covers:

1. **Complete Architecture Overview** - Multi-tenant design with security layers
2. **Environment Configuration** - Development, staging, and production setups
3. **Docker-Based Deployment** - Production-ready containerization
4. **Production Deployment Strategies** - Cloud platforms and on-premise options
5. **Security Hardening** - Application, database, container, and network security
6. **Monitoring and Logging** - Comprehensive observability stack
7. **Backup and Recovery** - Automated backup strategies and disaster recovery
8. **Scaling and Performance** - Horizontal scaling and optimization techniques
9. **CI/CD Pipeline** - Complete automation workflows
10. **Database Management** - Migration system and performance monitoring
11. **Health Checks and Alerting** - Comprehensive monitoring and notification system
12. **Troubleshooting Guide** - Common issues and diagnostic procedures
13. **Maintenance Procedures** - Routine tasks and update procedures

The guide provides production-ready configurations, scripts, and procedures that can be directly implemented for deploying and operating the RelyGate system at scale with proper security, monitoring, and maintenance practices.