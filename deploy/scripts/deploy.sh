#!/bin/bash

# Production deployment script
set -e

# Configuration
ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}
COMPOSE_FILE="deploy/docker/docker-compose.prod.yml"

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Check if required environment variables are set
required_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "SECRET_KEY"
    "ALLOWED_HOSTS"
    "GEMINI_API_KEY"
    "GITHUB_TOKEN"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var environment variable is not set"
        exit 1
    fi
done

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p staticfiles
mkdir -p media
mkdir -p deploy/docker/ssl

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose -f $COMPOSE_FILE pull

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down --remove-orphans

# Start database migrations
echo "🗄️ Running database migrations..."
docker-compose -f $COMPOSE_FILE run --rm web python manage.py migrate

# Collect static files
echo "📦 Collecting static files..."
docker-compose -f $COMPOSE_FILE run --rm web python manage.py collectstatic --noinput

# Start services
echo "🔄 Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🏥 Performing health check..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:8000/health/ > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Health check failed after $max_attempts attempts"
        echo "📋 Container logs:"
        docker-compose -f $COMPOSE_FILE logs --tail=50
        exit 1
    fi
    
    echo "⏳ Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
    sleep 10
    ((attempt++))
done

# Run post-deployment tasks
echo "🔧 Running post-deployment tasks..."
docker-compose -f $COMPOSE_FILE exec -T web python manage.py setup_rag_pipeline
docker-compose -f $COMPOSE_FILE exec -T web python manage.py update_developer_skills

# Show deployment status
echo "📊 Deployment status:"
docker-compose -f $COMPOSE_FILE ps

echo "✅ Deployment to $ENVIRONMENT completed successfully!"
echo "🌐 Application is available at: https://$(echo $ALLOWED_HOSTS | cut -d',' -f1)"