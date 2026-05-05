# Railway Deployment Guide

## Prerequisites
- Railway account (railway.app)
- GitHub repository with your code pushed
- MySQL database (Railway provides this via plugins)

## Backend Setup on Railway

1. **Create a new service on Railway**
   - Connect your GitHub repository
   - Select the root directory or `/backend`

2. **Set Environment Variables** in Railway Dashboard:
   ```
   DB_HOST=<Railway MySQL hostname>
   DB_USER=<Railway MySQL username>
   DB_PASSWORD=<Railway MySQL password>
   DB_NAME=psems
   PORT=3000
   TEXTBEE_API_KEY=89553bb3-7b13-413b-b875-d583048a8547
   TEXTBEE_DEVICE_ID=691ceb9982033f16094df078
   ```

3. **Configure Start Command**:
   - In Railway, set the start command to: `node server.js`
   - Or use the `package.json` scripts (recommended): `npm start`

4. **Add MySQL Plugin** (Optional - Railway auto-detects):
   - Railway can auto-provision MySQL if you have `mysql` dependency
   - Variables like `DATABASE_URL` are auto-injected if using the plugin

## Frontend Setup on Railway

1. **Create a new service on Railway**
   - Connect your GitHub repository
   - Select the `/frontend` directory

2. **Set Build Environment Variables**:
   ```
   VITE_API_URL=https://<your-backend-service>.up.railway.app
   VITE_FIREBASE_DATABASE_URL=https://psemsapp-6ea85-default-rtdb.asia-southeast1.firebasedatabase.app
   ```

3. **Configure Build Command**:
   - Build: `npm run build`
   - Start: `npm run preview` (for local testing, Railway handles serving `dist/`)

4. **Set Output Directory**: `dist`

## Linking Services

1. In Railway Dashboard, open your **frontend service**
2. Go to **Variables** tab
3. Set `VITE_API_URL` to reference your backend service:
   ```
   https://${{ services.backend.domain }}/api
   ```
   (Replace `backend` with your actual backend service name)

## Database Setup

### Option 1: Use Railway MySQL Plugin
1. Add MySQL plugin to your Railway project
2. Railway auto-injects connection variables
3. Update your backend environment to use the injected variables

### Option 2: Manual MySQL Database
1. Set up MySQL server externally
2. Manually set connection variables in Railway

### Initialize Database
```bash
# Run your schema SQL file
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < schema.sql
```

## Testing Before Deployment

```bash
# Backend
cd backend
npm install
npm start

# Frontend (in another terminal)
cd frontend
VITE_API_URL=http://localhost:8081 npm run dev
```

## Troubleshooting

### Missing Environment Variables
- Check Railway Dashboard → Variables
- Ensure all variables from `.env` are set
- Redeploy after updating variables

### API Connection Issues
- Frontend can't find backend: Check `VITE_API_URL`
- CORS errors: Verify backend CORS config allows the frontend domain

### Database Connection Errors
- Verify MySQL service is running
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Test locally first: `mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME`

## Deployment Status

- Watch Railway Dashboard for build/deploy logs
- Check service health in the dashboard
- View application logs: Click service → Logs tab

## Production Checklist

- [ ] All environment variables set in Railway
- [ ] Database initialized with schema
- [ ] Frontend build completes without errors
- [ ] Backend starts without errors
- [ ] Frontend can communicate with backend API
- [ ] Firebase connection working (if used)
- [ ] SMS functionality tested with TEXTBEE credentials
- [ ] Security: No hardcoded credentials in code
