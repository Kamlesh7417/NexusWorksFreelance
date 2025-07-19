# Railway Deployment Guide

## Fixed Issues

### 1. Marketplace Page Issue
- **Problem**: The marketplace page was not working because the route `app/marketplace/page.tsx` was missing
- **Solution**: Created the missing marketplace page route that imports the existing MarketplacePage component

## Railway Environment Variables

### Required Variables for Next.js Frontend

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-app-name.railway.app
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# AI Services
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# Django Backend URLs (update with your Railway backend URL)
NEXT_PUBLIC_DJANGO_API_URL=https://your-django-backend.railway.app/api
NEXT_PUBLIC_DJANGO_WS_URL=wss://your-django-backend.railway.app/ws

# API Configuration
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_API_RETRY_ATTEMPTS=3
NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC=true
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_ENABLE_API_LOGGING=true
NEXT_PUBLIC_ENABLE_CIRCUIT_BREAKER=true

# Optional: Legacy Supabase (if still using)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Required Variables for Django Backend

```bash
# Django Core
SECRET_KEY=your-super-secret-key-here-change-this-in-production
DEBUG=False
ALLOWED_HOSTS=your-django-backend.railway.app,your-frontend.railway.app
DJANGO_SETTINGS_MODULE=freelance_platform.settings_production

# Database
DATABASE_URL=postgresql://username:password@host:port/database
DB_CONN_MAX_AGE=300
DB_MAX_CONNS=20
DB_MIN_CONNS=5
DB_CONNECT_TIMEOUT=10

# Redis (Railway Redis addon)
REDIS_URL=redis://username:password@host:port/0
REDIS_MAX_CONNECTIONS=50
CACHE_TIMEOUT=300
SESSION_TIMEOUT=86400

# Celery
CELERY_BROKER_URL=redis://username:password@host:port/1
CELERY_RESULT_BACKEND=redis://username:password@host:port/2
CELERY_WORKER_CONCURRENCY=4

# AI Services
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
GITHUB_TOKEN=your-github-personal-access-token

# Payment Gateways
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app
CORS_ALLOW_CREDENTIALS=True

# Security Settings
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_BROWSER_XSS_FILTER=True
X_FRAME_OPTIONS=DENY
SECURE_REFERRER_POLICY=strict-origin-when-cross-origin

# Session Security
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Lax
CSRF_COOKIE_SECURE=True
CSRF_COOKIE_HTTPONLY=True
CSRF_COOKIE_SAMESITE=Lax

# Feature Flags
ENABLE_AI_MATCHING=True
ENABLE_PAYMENT_PROCESSING=True
ENABLE_GITHUB_INTEGRATION=True
ENABLE_LEARNING_PLATFORM=True
ENABLE_COMMUNITY_FEATURES=True

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=INFO
ENABLE_PERFORMANCE_MONITORING=True

# Application Version
VERSION=1.0.0
ENVIRONMENT=production

# Rate Limiting
RATE_LIMIT_ENABLE=True
RATE_LIMIT_PER_IP=100
RATE_LIMIT_WINDOW=3600

# Health Checks
HEALTH_CHECK_ENABLED=True
HEALTH_CHECK_DATABASE=True
HEALTH_CHECK_CACHE=True
HEALTH_CHECK_EXTERNAL_SERVICES=True
```

## Deployment Steps

### 1. Prepare Your Repository
1. Ensure all code is committed and pushed to your Git repository
2. Make sure the marketplace page fix is included

### 2. Create Railway Services

#### Frontend Service (Next.js)
1. Go to [Railway](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Railway will auto-detect it's a Next.js app
4. Set the environment variables listed above for the frontend
5. Deploy

#### Backend Service (Django)
1. In the same Railway project, add a new service
2. Connect the same repository but set the root directory to `django-backend`
3. Set the environment variables listed above for the backend
4. Deploy

#### Database Service
1. Add a PostgreSQL database service in Railway
2. Copy the DATABASE_URL from the database service
3. Use this URL in both frontend and backend environment variables

#### Redis Service (Optional but Recommended)
1. Add a Redis service in Railway
2. Copy the REDIS_URL
3. Use this URL for caching and Celery in the backend

### 3. Configure Domain and CORS
1. Get your Railway app URLs (they'll be like `https://your-app.railway.app`)
2. Update NEXTAUTH_URL, NEXT_PUBLIC_DJANGO_API_URL, ALLOWED_HOSTS, and CORS_ALLOWED_ORIGINS with these URLs
3. Make sure the frontend can communicate with the backend

### 4. Database Migration
After the Django backend is deployed:
1. Go to the Django service in Railway
2. Open the terminal/console
3. Run: `python manage.py migrate`
4. Create a superuser: `python manage.py createsuperuser`

### 5. Test the Deployment
1. Visit your frontend URL
2. Test the marketplace page (should now work)
3. Test authentication
4. Test API endpoints

## Important Notes

### Security Considerations
- Never use the example keys in production
- Generate strong, unique SECRET_KEY for Django
- Use environment-specific API keys (test for staging, live for production)
- Enable HTTPS redirect and security headers

### Performance Optimization
- Railway automatically handles scaling
- Consider using Railway's Redis for caching
- Monitor your database connections and optimize queries

### Troubleshooting
- Check Railway logs for both services if something isn't working
- Ensure CORS is properly configured between frontend and backend
- Verify all environment variables are set correctly
- Check that the database migrations have run successfully

### Cost Optimization
- Railway has usage-based pricing
- Monitor your resource usage
- Consider using Railway's sleep mode for development environments

## Environment Variable Checklist

### Critical Variables (Must Set)
- [ ] SECRET_KEY (Django)
- [ ] NEXTAUTH_SECRET (Next.js)
- [ ] DATABASE_URL (Both)
- [ ] GEMINI_API_KEY (Both)
- [ ] GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET (Both)
- [ ] ALLOWED_HOSTS (Django)
- [ ] CORS_ALLOWED_ORIGINS (Django)
- [ ] NEXTAUTH_URL (Next.js)
- [ ] NEXT_PUBLIC_DJANGO_API_URL (Next.js)

### Optional but Recommended
- [ ] REDIS_URL (Django)
- [ ] STRIPE_* (Django - for payments)
- [ ] EMAIL_* (Django - for notifications)
- [ ] SENTRY_DSN (Django - for error tracking)

### Development vs Production
- Set DEBUG=False for production
- Use HTTPS URLs for production
- Use production API keys for live environment
- Enable security headers for production