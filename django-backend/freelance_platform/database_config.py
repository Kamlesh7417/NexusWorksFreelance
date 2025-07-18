"""
Database configuration for production deployment
"""
import os
from django.core.exceptions import ImproperlyConfigured

def get_database_config():
    """Get database configuration with connection pooling and optimization"""
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ImproperlyConfigured("DATABASE_URL environment variable is required")
    
    # Parse database URL
    import dj_database_url
    db_config = dj_database_url.parse(database_url)
    
    # Enhanced connection pooling and optimization settings
    db_config.update({
        'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', '300')),  # 5 minutes
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            # Connection pooling
            'MAX_CONNS': int(os.environ.get('DB_MAX_CONNS', '20')),
            'MIN_CONNS': int(os.environ.get('DB_MIN_CONNS', '5')),
            'connect_timeout': int(os.environ.get('DB_CONNECT_TIMEOUT', '10')),
            'application_name': 'freelance_platform',
            
            # Performance optimizations
            'options': ' '.join([
                '-c default_transaction_isolation=read_committed',
                '-c statement_timeout=30000',  # 30 seconds
                '-c idle_in_transaction_session_timeout=300000',  # 5 minutes
                '-c lock_timeout=10000',  # 10 seconds
                '-c shared_preload_libraries=pg_stat_statements',
                '-c log_min_duration_statement=1000',  # Log slow queries > 1s
                '-c log_statement=ddl',  # Log DDL statements
                '-c log_checkpoints=on',
                '-c log_connections=on',
                '-c log_disconnections=on',
                '-c log_lock_waits=on',
                '-c deadlock_timeout=1s',
                '-c max_connections=100',
                '-c shared_buffers=256MB',
                '-c effective_cache_size=1GB',
                '-c maintenance_work_mem=64MB',
                '-c checkpoint_completion_target=0.9',
                '-c wal_buffers=16MB',
                '-c default_statistics_target=100',
                '-c random_page_cost=1.1',
                '-c effective_io_concurrency=200',
            ]),
            
            # SSL settings for production
            'sslmode': os.environ.get('DB_SSL_MODE', 'require'),
            'sslcert': os.environ.get('DB_SSL_CERT'),
            'sslkey': os.environ.get('DB_SSL_KEY'),
            'sslrootcert': os.environ.get('DB_SSL_ROOT_CERT'),
        }
    })
    
    # Remove None values
    db_config['OPTIONS'] = {k: v for k, v in db_config['OPTIONS'].items() if v is not None}
    
    return db_config

def get_read_replica_config():
    """Get read replica configuration if available"""
    read_replica_url = os.environ.get('READ_REPLICA_URL')
    if not read_replica_url:
        return None
    
    import dj_database_url
    replica_config = dj_database_url.parse(read_replica_url)
    
    replica_config.update({
        'CONN_MAX_AGE': int(os.environ.get('REPLICA_CONN_MAX_AGE', '300')),
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'MAX_CONNS': int(os.environ.get('REPLICA_MAX_CONNS', '10')),
            'MIN_CONNS': int(os.environ.get('REPLICA_MIN_CONNS', '2')),
            'connect_timeout': int(os.environ.get('REPLICA_CONNECT_TIMEOUT', '10')),
            'application_name': 'freelance_platform_read',
            'options': '-c default_transaction_isolation=read_committed'
        }
    })
    
    return replica_config

# Database router for read/write splitting
class DatabaseRouter:
    """
    A router to control all database operations on models
    """
    
    read_db_models = {
        # Models that can use read replicas
        'users.User',
        'projects.Project',
        'ai_services.SkillEmbedding',
        'matching.DeveloperMatch',
    }
    
    def db_for_read(self, model, **hints):
        """Suggest the database to read from."""
        if f"{model._meta.app_label}.{model._meta.object_name}" in self.read_db_models:
            # Use read replica if available
            if 'read_replica' in hints.get('instance', {}) or os.environ.get('READ_REPLICA_URL'):
                return 'read_replica'
        return 'default'
    
    def db_for_write(self, model, **hints):
        """Suggest the database to write to."""
        return 'default'
    
    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations if models are in the same app."""
        return True
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure that certain apps' models get created on the right database."""
        if db == 'read_replica':
            return False  # Don't migrate on read replica
        return True

# Cache configuration
def get_cache_config():
    """Get cache configuration"""
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    return {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': redis_url,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': int(os.environ.get('REDIS_MAX_CONNECTIONS', '50')),
                    'retry_on_timeout': True,
                    'health_check_interval': 30,
                },
                'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
            },
            'TIMEOUT': int(os.environ.get('CACHE_TIMEOUT', '300')),  # 5 minutes
            'KEY_PREFIX': 'freelance_platform',
            'VERSION': 1,
        },
        'sessions': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': redis_url,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': int(os.environ.get('REDIS_MAX_CONNECTIONS', '50')),
                },
            },
            'TIMEOUT': int(os.environ.get('SESSION_TIMEOUT', '86400')),  # 24 hours
            'KEY_PREFIX': 'freelance_platform_sessions',
        }
    }
# 
Database monitoring and optimization utilities
class DatabaseMonitor:
    """Database monitoring and optimization utilities"""
    
    @staticmethod
    def get_connection_stats():
        """Get database connection statistics"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Get connection count
            cursor.execute("""
                SELECT count(*) as total_connections,
                       count(*) FILTER (WHERE state = 'active') as active_connections,
                       count(*) FILTER (WHERE state = 'idle') as idle_connections,
                       count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
                FROM pg_stat_activity 
                WHERE datname = current_database()
            """)
            
            stats = cursor.fetchone()
            
            return {
                'total_connections': stats[0],
                'active_connections': stats[1],
                'idle_connections': stats[2],
                'idle_in_transaction': stats[3],
            }
    
    @staticmethod
    def get_slow_queries(limit=10):
        """Get slow queries from pg_stat_statements"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            try:
                cursor.execute("""
                    SELECT query,
                           calls,
                           total_time,
                           mean_time,
                           rows,
                           100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
                    FROM pg_stat_statements
                    ORDER BY mean_time DESC
                    LIMIT %s
                """, [limit])
                
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
                
            except Exception as e:
                # pg_stat_statements extension might not be available
                return []
    
    @staticmethod
    def get_table_stats():
        """Get table statistics"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT schemaname,
                       tablename,
                       n_tup_ins as inserts,
                       n_tup_upd as updates,
                       n_tup_del as deletes,
                       n_live_tup as live_tuples,
                       n_dead_tup as dead_tuples,
                       last_vacuum,
                       last_autovacuum,
                       last_analyze,
                       last_autoanalyze
                FROM pg_stat_user_tables
                ORDER BY n_live_tup DESC
                LIMIT 20
            """)
            
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    @staticmethod
    def get_index_usage():
        """Get index usage statistics"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT schemaname,
                       tablename,
                       indexname,
                       idx_tup_read,
                       idx_tup_fetch,
                       idx_scan
                FROM pg_stat_user_indexes
                WHERE idx_scan = 0
                ORDER BY schemaname, tablename
            """)
            
            columns = [desc[0] for desc in cursor.description]
            unused_indexes = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            cursor.execute("""
                SELECT schemaname,
                       tablename,
                       indexname,
                       idx_tup_read,
                       idx_tup_fetch,
                       idx_scan
                FROM pg_stat_user_indexes
                WHERE idx_scan > 0
                ORDER BY idx_scan DESC
                LIMIT 20
            """)
            
            most_used_indexes = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {
                'unused_indexes': unused_indexes,
                'most_used_indexes': most_used_indexes,
            }
    
    @staticmethod
    def analyze_query_performance():
        """Analyze overall query performance"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Get database size
            cursor.execute("""
                SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
            """)
            database_size = cursor.fetchone()[0]
            
            # Get cache hit ratio
            cursor.execute("""
                SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
                FROM pg_statio_user_tables
            """)
            cache_hit_ratio = cursor.fetchone()[0] or 0
            
            # Get transaction statistics
            cursor.execute("""
                SELECT xact_commit, xact_rollback, 
                       xact_commit::float / (xact_commit + xact_rollback) * 100 as commit_ratio
                FROM pg_stat_database 
                WHERE datname = current_database()
            """)
            xact_stats = cursor.fetchone()
            
            return {
                'database_size': database_size,
                'cache_hit_ratio': float(cache_hit_ratio),
                'transactions': {
                    'commits': xact_stats[0],
                    'rollbacks': xact_stats[1],
                    'commit_ratio': float(xact_stats[2]) if xact_stats[2] else 0,
                }
            }

# Database optimization management command
class DatabaseOptimizer:
    """Database optimization utilities"""
    
    @staticmethod
    def vacuum_analyze_tables():
        """Run VACUUM ANALYZE on all tables"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT schemaname, tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
            """)
            
            tables = cursor.fetchall()
            
            for schema, table in tables:
                try:
                    cursor.execute(f'VACUUM ANALYZE "{schema}"."{table}"')
                    print(f"VACUUM ANALYZE completed for {schema}.{table}")
                except Exception as e:
                    print(f"Error running VACUUM ANALYZE on {schema}.{table}: {e}")
    
    @staticmethod
    def reindex_tables():
        """Reindex all tables"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT schemaname, tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
            """)
            
            tables = cursor.fetchall()
            
            for schema, table in tables:
                try:
                    cursor.execute(f'REINDEX TABLE "{schema}"."{table}"')
                    print(f"REINDEX completed for {schema}.{table}")
                except Exception as e:
                    print(f"Error reindexing {schema}.{table}: {e}")
    
    @staticmethod
    def update_table_statistics():
        """Update table statistics"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            try:
                cursor.execute('ANALYZE')
                print("Table statistics updated successfully")
            except Exception as e:
                print(f"Error updating table statistics: {e}")

# Connection pool monitoring
def monitor_connection_pool():
    """Monitor database connection pool"""
    try:
        stats = DatabaseMonitor.get_connection_stats()
        
        # Log connection pool status
        import logging
        logger = logging.getLogger('performance')
        
        logger.info(f"Database connections - Total: {stats['total_connections']}, "
                   f"Active: {stats['active_connections']}, "
                   f"Idle: {stats['idle_connections']}, "
                   f"Idle in transaction: {stats['idle_in_transaction']}")
        
        # Alert if connection usage is high
        max_connections = int(os.environ.get('DB_MAX_CONNS', '20'))
        if stats['total_connections'] > max_connections * 0.8:
            logger.warning(f"High database connection usage: {stats['total_connections']}/{max_connections}")
        
        return stats
        
    except Exception as e:
        import logging
        logger = logging.getLogger('performance')
        logger.error(f"Failed to monitor connection pool: {e}")
        return None