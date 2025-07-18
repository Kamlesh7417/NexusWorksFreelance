#!/usr/bin/env python
"""
Script to fix database schema issues
"""
import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def check_table_exists(table_name):
    """Check if a table exists in the database"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """, [table_name])
        return cursor.fetchone()[0]

def create_tasks_table():
    """Create the tasks table manually if it doesn't exist"""
    if not check_table_exists('tasks'):
        print("Creating tasks table...")
        with connection.cursor() as cursor:
            # Check the data types of referenced tables
            cursor.execute("""
                SELECT data_type FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'id';
            """)
            user_id_type = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT data_type FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'id';
            """)
            project_id_type = cursor.fetchone()[0]
            
            print(f"User ID type: {user_id_type}, Project ID type: {project_id_type}")
            
            # Use appropriate types
            user_fk_type = 'UUID' if user_id_type == 'uuid' else 'BIGINT'
            project_fk_type = 'UUID' if project_id_type == 'uuid' else 'BIGINT'
            task_id_type = 'UUID' if project_id_type == 'uuid' else 'BIGSERIAL'
            
            if task_id_type == 'UUID':
                task_id_def = 'UUID PRIMARY KEY DEFAULT gen_random_uuid()'
            else:
                task_id_def = 'BIGSERIAL PRIMARY KEY'
            
            cursor.execute(f"""
                CREATE TABLE tasks (
                    id {task_id_def},
                    title VARCHAR(200) NOT NULL,
                    description TEXT NOT NULL,
                    required_skills JSONB DEFAULT '[]'::jsonb,
                    estimated_hours INTEGER NOT NULL,
                    priority INTEGER DEFAULT 1,
                    status VARCHAR(20) DEFAULT 'pending',
                    completion_percentage INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    project_id {project_fk_type} REFERENCES projects(id) ON DELETE CASCADE,
                    assigned_developer_id {user_fk_type} REFERENCES users(id) ON DELETE SET NULL
                );
            """)
            
            cursor.execute(f"""
                CREATE TABLE tasks_dependencies (
                    id SERIAL PRIMARY KEY,
                    from_task_id {task_id_type.split()[0]} REFERENCES tasks(id) ON DELETE CASCADE,
                    to_task_id {task_id_type.split()[0]} REFERENCES tasks(id) ON DELETE CASCADE,
                    UNIQUE(from_task_id, to_task_id)
                );
            """)
        print("✅ Tasks table created successfully")
    else:
        print("✅ Tasks table already exists")

def update_projects_table():
    """Update projects table with missing columns"""
    print("Checking projects table...")
    
    with connection.cursor() as cursor:
        # First check the data type of users.id
        cursor.execute("""
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id';
        """)
        user_id_type = cursor.fetchone()
        
        if user_id_type:
            user_id_type = user_id_type[0]
            print(f"Users.id data type: {user_id_type}")
        else:
            print("❌ Users table not found")
            return
        
        # Determine the correct foreign key type
        if user_id_type == 'uuid':
            fk_type = 'UUID'
        else:
            fk_type = 'BIGINT'
        
        # Check and add missing columns
        columns_to_add = [
            ('ai_analysis', 'JSONB DEFAULT \'{}\'::jsonb'),
            ('budget_estimate', 'DECIMAL(12,2)'),
            ('timeline_estimate', 'INTERVAL'),
            ('senior_developer_id', f'{fk_type} REFERENCES users(id) ON DELETE SET NULL'),
        ]
        
        for column_name, column_def in columns_to_add:
            # Check if column exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'projects' 
                    AND column_name = %s
                );
            """, [column_name])
            
            if not cursor.fetchone()[0]:
                print(f"Adding column {column_name} to projects table...")
                try:
                    cursor.execute(f"ALTER TABLE projects ADD COLUMN {column_name} {column_def};")
                    print(f"✅ Column {column_name} added successfully")
                except Exception as e:
                    print(f"❌ Error adding column {column_name}: {str(e)}")
            else:
                print(f"✅ Column {column_name} already exists")

def update_users_table():
    """Update users table with missing columns"""
    print("Checking users table...")
    
    # Check and add missing columns for User model
    columns_to_add = [
        ('role', 'VARCHAR(20) DEFAULT \'developer\''),
        ('github_username', 'VARCHAR(100)'),
        ('is_verified', 'BOOLEAN DEFAULT FALSE'),
        ('created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
        ('updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ]
    
    with connection.cursor() as cursor:
        for column_name, column_def in columns_to_add:
            # Check if column exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' 
                    AND column_name = %s
                );
            """, [column_name])
            
            if not cursor.fetchone()[0]:
                print(f"Adding column {column_name} to users table...")
                try:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_def};")
                    print(f"✅ Column {column_name} added successfully")
                except Exception as e:
                    print(f"❌ Error adding column {column_name}: {str(e)}")
            else:
                print(f"✅ Column {column_name} already exists")

def main():
    """Fix database schema issues"""
    print("🔧 Fixing database schema issues...")
    
    try:
        # Check if basic tables exist
        tables_exist = {
            'users': check_table_exists('users'),
            'projects': check_table_exists('projects'),
            'tasks': check_table_exists('tasks'),
        }
        
        print(f"Table status: {tables_exist}")
        
        if not tables_exist['users'] or not tables_exist['projects']:
            print("❌ Core tables missing. Running migrations first...")
            # Try to run migrations for core apps first
            execute_from_command_line(['manage.py', 'migrate', 'users', '--fake-initial'])
            execute_from_command_line(['manage.py', 'migrate', 'projects', '0002', '--fake'])
        
        # Update users table
        if tables_exist['users']:
            update_users_table()
        
        # Update projects table
        if tables_exist['projects']:
            update_projects_table()
        
        # Create tasks table
        create_tasks_table()
        
        # Mark migrations as applied
        print("Marking migrations as applied...")
        execute_from_command_line(['manage.py', 'migrate', '--fake'])
        
        print("✅ Database schema fixed successfully!")
        
    except Exception as e:
        print(f"❌ Error fixing database: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    main()