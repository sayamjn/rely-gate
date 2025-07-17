# Railway Deployment Guide for Rely Gate

## Prerequisites

1. Railway account: [railway.app](https://railway.app)
2. Railway CLI installed: `npm install -g @railway/cli`
3. Git repository connected to Railway
4. External PostgreSQL database (181.215.79.153:5432)

## Database Setup

You're using an external PostgreSQL database instead of Railway's managed database.

**Database Details:**
- Host: 181.215.79.153
- Port: 5432
- User: rely
- Password: rely2025
- Database: relygate

## Environment Variables

Set these environment variables in Railway:

### Required Variables
```bash
NODE_ENV=production
DB_HOST=181.215.79.153
DB_PORT=5432
DB_USER=rely
DB_PASSWORD=rely2025
DB_NAME=relygate
JWT_SECRET=supersecretjwtkey
PORT=3000
```

### Optional Variables (with defaults)
```bash
JWT_EXPIRES_IN=24h
MAX_FILE_SIZE=50mb
UPLOAD_DIR=./uploads
SMS_ENABLED=false
API_URL=https://your-app-name.railway.app
BASE_URL=https://your-app-name.railway.app
FILE_CLEANUP_ENABLED=true
FILE_MAX_AGE_DAYS=30
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,text/csv
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-app-name.railway.app
```

## Database Schema Setup

Your external database (181.215.79.153) already has the schema applied. If you need to update it:

### Option 1: Using Local psql
```bash
# Connect to your external PostgreSQL database
psql -h 181.215.79.153 -p 5432 -U rely -d relygate

# Run the schema file
\i scripts/rely_gate_pass_schema.sql
```

### Option 2: Using a Database Client
1. Connect to 181.215.79.153:5432 using pgAdmin or DBeaver
2. Database: relygate, User: rely, Password: rely2025
3. Execute the contents of `scripts/rely_gate_pass_schema.sql`

### Option 3: Database Already Initialized
Since you've already applied the schema to your external database, this step may not be necessary.

## Deployment Steps

1. **Set Environment Variables** in Railway dashboard
2. **Deploy**: Use `railway up` or push to connected Git repository
3. **Initialize Database**: Run the schema setup (see above)
4. **Verify**: Check application logs and test endpoints

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify `DATABASE_URL` is set correctly
   - Ensure `NODE_ENV=production` for SSL connection

2. **Port Issues**
   - Railway automatically sets `PORT` environment variable
   - Application should listen on `process.env.PORT || 3000`

3. **File Upload Issues**
   - Ensure `UPLOAD_DIR` is writable
   - Railway has ephemeral storage - consider using external storage for production

### Logs
```bash
railway logs
```

### Connect to External Database
```bash
# Connect to your external PostgreSQL database
psql -h 181.215.79.153 -p 5432 -U rely -d relygate
```

## Production Considerations

1. **File Storage**: Railway has ephemeral storage. For production, consider:
   - AWS S3
   - Google Cloud Storage
   - Railway Volume (persistent storage)

2. **Environment Variables**: Never commit secrets to Git
3. **Database Backups**: Set up automated backups for your PostgreSQL database
4. **Monitoring**: Set up health checks and monitoring

## Health Check

Your application includes a health check endpoint:
- `GET /health` - Basic health check
- `GET /api/health` - API health check with database connection test

Railway will automatically use these for deployment verification.