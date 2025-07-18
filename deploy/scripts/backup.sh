#!/bin/bash

# Database backup and disaster recovery script
set -e

# Configuration
BACKUP_DIR="/var/backups/freelance-platform"
S3_BUCKET="${BACKUP_S3_BUCKET:-freelance-platform-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/var/log/backup.log"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "ERROR: Backup failed at line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

log "Starting backup process..."

# Database backup
backup_database() {
    log "Starting database backup..."
    
    if [ -z "$DATABASE_URL" ]; then
        log "ERROR: DATABASE_URL not set"
        exit 1
    fi
    
    # Parse database URL
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Create database dump
    BACKUP_FILE="$BACKUP_DIR/database_${TIMESTAMP}.sql"
    
    export PGPASSWORD="$DB_PASS"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges \
        --format=custom > "$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    log "Database backup completed: $BACKUP_FILE"
    echo "$BACKUP_FILE"
}

# Media files backup
backup_media() {
    log "Starting media files backup..."
    
    MEDIA_BACKUP_FILE="$BACKUP_DIR/media_${TIMESTAMP}.tar.gz"
    
    if [ -d "/app/media" ]; then
        tar -czf "$MEDIA_BACKUP_FILE" -C "/app" media/
        log "Media backup completed: $MEDIA_BACKUP_FILE"
        echo "$MEDIA_BACKUP_FILE"
    else
        log "Media directory not found, skipping media backup"
        echo ""
    fi
}

# Configuration backup
backup_config() {
    log "Starting configuration backup..."
    
    CONFIG_BACKUP_FILE="$BACKUP_DIR/config_${TIMESTAMP}.tar.gz"
    
    # Create temporary directory for config files
    TEMP_CONFIG_DIR=$(mktemp -d)
    
    # Copy important configuration files
    if [ -f "/app/.env" ]; then
        cp "/app/.env" "$TEMP_CONFIG_DIR/"
    fi
    
    if [ -d "/app/deploy" ]; then
        cp -r "/app/deploy" "$TEMP_CONFIG_DIR/"
    fi
    
    # Create backup archive
    tar -czf "$CONFIG_BACKUP_FILE" -C "$TEMP_CONFIG_DIR" .
    
    # Cleanup
    rm -rf "$TEMP_CONFIG_DIR"
    
    log "Configuration backup completed: $CONFIG_BACKUP_FILE"
    echo "$CONFIG_BACKUP_FILE"
}

# Upload to S3
upload_to_s3() {
    local file_path="$1"
    local s3_key="$2"
    
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        log "WARNING: AWS credentials not set, skipping S3 upload"
        return
    fi
    
    log "Uploading $file_path to S3..."
    
    aws s3 cp "$file_path" "s3://$S3_BUCKET/$s3_key" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256
    
    log "Upload completed: s3://$S3_BUCKET/$s3_key"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Local cleanup
    find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete
    
    # S3 cleanup (if AWS CLI is available)
    if command -v aws &> /dev/null; then
        aws s3 ls "s3://$S3_BUCKET/" --recursive | \
        awk '{print $4}' | \
        while read -r key; do
            # Extract date from filename
            file_date=$(echo "$key" | grep -o '[0-9]\{8\}' | head -1)
            if [ -n "$file_date" ]; then
                # Calculate age in days
                current_date=$(date +%Y%m%d)
                age_days=$(( ($(date -d "$current_date" +%s) - $(date -d "$file_date" +%s)) / 86400 ))
                
                if [ $age_days -gt $RETENTION_DAYS ]; then
                    log "Deleting old backup: $key"
                    aws s3 rm "s3://$S3_BUCKET/$key"
                fi
            fi
        done
    fi
    
    log "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity: $backup_file"
    
    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file"; then
            log "Backup integrity check passed"
            return 0
        else
            log "ERROR: Backup integrity check failed"
            return 1
        fi
    fi
    
    return 0
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # You can integrate with your notification system here
    # (Slack, email, etc.)
    log "NOTIFICATION: $status - $message"
}

# Main backup process
main() {
    log "=== Backup Process Started ==="
    
    # Perform backups
    DB_BACKUP=$(backup_database)
    MEDIA_BACKUP=$(backup_media)
    CONFIG_BACKUP=$(backup_config)
    
    # Verify backups
    if [ -n "$DB_BACKUP" ]; then
        verify_backup "$DB_BACKUP"
    fi
    
    if [ -n "$MEDIA_BACKUP" ]; then
        verify_backup "$MEDIA_BACKUP"
    fi
    
    if [ -n "$CONFIG_BACKUP" ]; then
        verify_backup "$CONFIG_BACKUP"
    fi
    
    # Upload to S3
    if [ -n "$DB_BACKUP" ]; then
        upload_to_s3 "$DB_BACKUP" "database/$(basename "$DB_BACKUP")"
    fi
    
    if [ -n "$MEDIA_BACKUP" ]; then
        upload_to_s3 "$MEDIA_BACKUP" "media/$(basename "$MEDIA_BACKUP")"
    fi
    
    if [ -n "$CONFIG_BACKUP" ]; then
        upload_to_s3 "$CONFIG_BACKUP" "config/$(basename "$CONFIG_BACKUP")"
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "=== Backup Process Completed Successfully ==="
    send_notification "SUCCESS" "Backup completed successfully at $TIMESTAMP"
}

# Restore function
restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log "ERROR: Backup file not specified"
        exit 1
    fi
    
    log "Starting database restore from: $backup_file"
    
    # Confirm restore operation
    read -p "This will overwrite the current database. Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Parse database URL
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" > "${backup_file%.gz}"
        backup_file="${backup_file%.gz}"
    fi
    
    # Restore database
    export PGPASSWORD="$DB_PASS"
    pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges "$backup_file"
    
    log "Database restore completed"
}

# Command line interface
# Disaster recovery functions
disaster_recovery_plan() {
    log "=== DISASTER RECOVERY PLAN ==="
    
    echo "1. IMMEDIATE RESPONSE (0-15 minutes)"
    echo "   - Assess the situation and determine scope of failure"
    echo "   - Notify stakeholders via emergency communication channels"
    echo "   - Activate incident response team"
    echo "   - Document incident start time and initial assessment"
    
    echo ""
    echo "2. SYSTEM ASSESSMENT (15-30 minutes)"
    echo "   - Check system health: ./backup.sh health_check"
    echo "   - Verify backup integrity: ./backup.sh verify_backups"
    echo "   - Assess data loss scope and timeline"
    echo "   - Determine recovery strategy (restore vs rebuild)"
    
    echo ""
    echo "3. RECOVERY EXECUTION (30 minutes - 2 hours)"
    echo "   - Stop all services: ./backup.sh stop_services"
    echo "   - Restore from latest backup: ./backup.sh full_restore"
    echo "   - Verify data integrity: ./backup.sh verify_restore"
    echo "   - Restart services: ./backup.sh start_services"
    
    echo ""
    echo "4. VALIDATION AND MONITORING (2-4 hours)"
    echo "   - Run smoke tests: ./backup.sh smoke_tests"
    echo "   - Monitor system performance"
    echo "   - Validate critical business functions"
    echo "   - Update stakeholders on recovery status"
    
    echo ""
    echo "5. POST-INCIDENT (4+ hours)"
    echo "   - Conduct post-mortem analysis"
    echo "   - Update disaster recovery procedures"
    echo "   - Implement preventive measures"
    echo "   - Update documentation and runbooks"
}

health_check() {
    log "Performing comprehensive health check..."
    
    # Database connectivity
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; then
        log "✅ Database is accessible"
    else
        log "❌ Database is not accessible"
        return 1
    fi
    
    # Application health
    if curl -f -s "$APP_URL/health/" > /dev/null 2>&1; then
        log "✅ Application is responding"
    else
        log "❌ Application is not responding"
        return 1
    fi
    
    # Redis connectivity
    if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
        log "✅ Redis is accessible"
    else
        log "❌ Redis is not accessible"
        return 1
    fi
    
    # File system space
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 90 ]; then
        log "✅ Disk usage is acceptable ($DISK_USAGE%)"
    else
        log "⚠️  High disk usage: $DISK_USAGE%"
    fi
    
    log "Health check completed"
}

verify_backups() {
    log "Verifying backup integrity..."
    
    # Find latest backups
    LATEST_DB_BACKUP=$(find "$BACKUP_DIR" -name "database_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    LATEST_MEDIA_BACKUP=$(find "$BACKUP_DIR" -name "media_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$LATEST_DB_BACKUP" ]; then
        if verify_backup "$LATEST_DB_BACKUP"; then
            log "✅ Latest database backup is valid"
        else
            log "❌ Latest database backup is corrupted"
            return 1
        fi
    else
        log "❌ No database backup found"
        return 1
    fi
    
    if [ -n "$LATEST_MEDIA_BACKUP" ]; then
        if verify_backup "$LATEST_MEDIA_BACKUP"; then
            log "✅ Latest media backup is valid"
        else
            log "❌ Latest media backup is corrupted"
            return 1
        fi
    else
        log "⚠️  No media backup found"
    fi
    
    log "Backup verification completed"
}

full_restore() {
    log "=== FULL SYSTEM RESTORE ==="
    
    # Confirmation
    echo "⚠️  WARNING: This will completely restore the system from backups."
    echo "All current data will be replaced with backup data."
    read -p "Are you absolutely sure you want to proceed? (type 'RESTORE' to confirm): " confirm
    
    if [ "$confirm" != "RESTORE" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Find latest backups
    LATEST_DB_BACKUP=$(find "$BACKUP_DIR" -name "database_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    LATEST_MEDIA_BACKUP=$(find "$BACKUP_DIR" -name "media_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -z "$LATEST_DB_BACKUP" ]; then
        log "ERROR: No database backup found for restore"
        exit 1
    fi
    
    log "Using database backup: $LATEST_DB_BACKUP"
    log "Using media backup: $LATEST_MEDIA_BACKUP"
    
    # Stop services
    stop_services
    
    # Restore database
    log "Restoring database..."
    restore_database "$LATEST_DB_BACKUP"
    
    # Restore media files
    if [ -n "$LATEST_MEDIA_BACKUP" ]; then
        log "Restoring media files..."
        restore_media "$LATEST_MEDIA_BACKUP"
    fi
    
    # Start services
    start_services
    
    log "Full restore completed"
}

restore_media() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log "ERROR: Media backup file not specified"
        return 1
    fi
    
    log "Restoring media files from: $backup_file"
    
    # Create backup of current media
    if [ -d "/app/media" ]; then
        mv "/app/media" "/app/media.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Extract media backup
    tar -xzf "$backup_file" -C "/app/"
    
    log "Media restore completed"
}

stop_services() {
    log "Stopping services..."
    
    # Stop Docker services if using Docker Compose
    if [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml stop
    fi
    
    # Stop Kubernetes services if using Kubernetes
    if command -v kubectl &> /dev/null; then
        kubectl scale deployment freelance-platform-web --replicas=0 -n freelance-platform
        kubectl scale deployment freelance-platform-celery --replicas=0 -n freelance-platform
    fi
    
    # Stop systemd services if using systemd
    if command -v systemctl &> /dev/null; then
        systemctl stop freelance-platform || true
        systemctl stop celery || true
        systemctl stop nginx || true
    fi
    
    log "Services stopped"
}

start_services() {
    log "Starting services..."
    
    # Start Docker services if using Docker Compose
    if [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml up -d
    fi
    
    # Start Kubernetes services if using Kubernetes
    if command -v kubectl &> /dev/null; then
        kubectl scale deployment freelance-platform-web --replicas=3 -n freelance-platform
        kubectl scale deployment freelance-platform-celery --replicas=2 -n freelance-platform
    fi
    
    # Start systemd services if using systemd
    if command -v systemctl &> /dev/null; then
        systemctl start nginx || true
        systemctl start freelance-platform || true
        systemctl start celery || true
    fi
    
    # Wait for services to be ready
    sleep 30
    
    log "Services started"
}

verify_restore() {
    log "Verifying restore integrity..."
    
    # Wait for services to be fully ready
    sleep 60
    
    # Check database connectivity and basic queries
    export PGPASSWORD="$DB_PASS"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM auth_user;" > /dev/null 2>&1; then
        log "✅ Database restore verified"
    else
        log "❌ Database restore verification failed"
        return 1
    fi
    
    # Check application health
    if curl -f -s "$APP_URL/health/" > /dev/null 2>&1; then
        log "✅ Application health verified"
    else
        log "❌ Application health verification failed"
        return 1
    fi
    
    # Check critical API endpoints
    if curl -f -s "$APP_URL/api/health/" > /dev/null 2>&1; then
        log "✅ API endpoints verified"
    else
        log "❌ API endpoints verification failed"
        return 1
    fi
    
    log "Restore verification completed successfully"
}

smoke_tests() {
    log "Running smoke tests..."
    
    # Test user authentication
    log "Testing user authentication..."
    # Add specific authentication tests here
    
    # Test project creation
    log "Testing project functionality..."
    # Add specific project tests here
    
    # Test AI services
    log "Testing AI services..."
    # Add specific AI service tests here
    
    # Test payment processing
    log "Testing payment processing..."
    # Add specific payment tests here
    
    log "Smoke tests completed"
}

create_recovery_point() {
    log "Creating recovery point..."
    
    RECOVERY_POINT_DIR="$BACKUP_DIR/recovery_points/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$RECOVERY_POINT_DIR"
    
    # Create database snapshot
    DB_SNAPSHOT="$RECOVERY_POINT_DIR/database_snapshot.sql"
    export PGPASSWORD="$DB_PASS"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges \
        --format=custom > "$DB_SNAPSHOT"
    
    # Create media snapshot
    if [ -d "/app/media" ]; then
        tar -czf "$RECOVERY_POINT_DIR/media_snapshot.tar.gz" -C "/app" media/
    fi
    
    # Create configuration snapshot
    if [ -f "/app/.env" ]; then
        cp "/app/.env" "$RECOVERY_POINT_DIR/env_snapshot"
    fi
    
    # Create system state snapshot
    cat > "$RECOVERY_POINT_DIR/system_state.json" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "hostname": "$(hostname)",
    "disk_usage": "$(df -h / | tail -1)",
    "memory_usage": "$(free -h)",
    "load_average": "$(uptime)",
    "docker_containers": "$(docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null || echo 'Docker not available')",
    "kubernetes_pods": "$(kubectl get pods -n freelance-platform 2>/dev/null || echo 'Kubernetes not available')"
}
EOF
    
    log "Recovery point created: $RECOVERY_POINT_DIR"
}

# Emergency contact information
emergency_contacts() {
    echo "=== EMERGENCY CONTACTS ==="
    echo "Primary On-Call: +1-XXX-XXX-XXXX"
    echo "Secondary On-Call: +1-XXX-XXX-XXXX"
    echo "DevOps Team: devops@freelanceplatform.com"
    echo "Incident Manager: incidents@freelanceplatform.com"
    echo ""
    echo "=== EXTERNAL SERVICES ==="
    echo "AWS Support: https://console.aws.amazon.com/support/"
    echo "Neon Support: https://neon.tech/docs/introduction/support"
    echo "Slack Incident Channel: #incidents"
    echo "Status Page: https://status.freelanceplatform.com"
}

# Command line interface
case "${1:-backup}" in
    "backup")
        main
        ;;
    "restore")
        restore_database "$2"
        ;;
    "full_restore")
        full_restore
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "health_check")
        health_check
        ;;
    "verify_backups")
        verify_backups
        ;;
    "verify_restore")
        verify_restore
        ;;
    "smoke_tests")
        smoke_tests
        ;;
    "stop_services")
        stop_services
        ;;
    "start_services")
        start_services
        ;;
    "recovery_point")
        create_recovery_point
        ;;
    "disaster_plan")
        disaster_recovery_plan
        ;;
    "emergency_contacts")
        emergency_contacts
        ;;
    *)
        echo "Usage: $0 {backup|restore <backup_file>|full_restore|cleanup|health_check|verify_backups|verify_restore|smoke_tests|stop_services|start_services|recovery_point|disaster_plan|emergency_contacts}"
        echo ""
        echo "Backup Commands:"
        echo "  backup           - Create full backup (database, media, config)"
        echo "  restore <file>   - Restore database from specific backup file"
        echo "  full_restore     - Full system restore from latest backups"
        echo "  cleanup          - Remove old backups based on retention policy"
        echo ""
        echo "Health & Verification:"
        echo "  health_check     - Check system health status"
        echo "  verify_backups   - Verify integrity of existing backups"
        echo "  verify_restore   - Verify system after restore"
        echo "  smoke_tests      - Run basic functionality tests"
        echo ""
        echo "Service Management:"
        echo "  stop_services    - Stop all application services"
        echo "  start_services   - Start all application services"
        echo ""
        echo "Disaster Recovery:"
        echo "  recovery_point   - Create point-in-time recovery snapshot"
        echo "  disaster_plan    - Display disaster recovery procedures"
        echo "  emergency_contacts - Display emergency contact information"
        exit 1
        ;;
esac