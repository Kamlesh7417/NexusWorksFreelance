# Supabase Database Setup Instructions

## 🚀 How to Apply the Database Migrations

Since the Supabase CLI isn't available in this environment, you'll need to apply the migrations manually through the Supabase Dashboard.

### Step 1: Access Your Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Open your project: `https://supabase.com/dashboard/project/fvmytlubzjifwtvwfdpi`

### Step 2: Open the SQL Editor
1. In your project dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"** to create a new SQL script

### Step 3: Apply Migrations in Order
Copy and paste each migration file content into the SQL Editor and run them **in this exact order**:

#### Migration 1: User Profiles
```sql
-- Copy the content from: supabase/migrations/20250613120302_heavy_mouse.sql
```

#### Migration 2: Projects Table
```sql
-- Copy the content from: supabase/migrations/20250613120311_quiet_snowflake.sql
```

#### Migration 3: Project Bids
```sql
-- Copy the content from: supabase/migrations/20250613120320_silver_wind.sql
```

#### Migration 4: Messages
```sql
-- Copy the content from: supabase/migrations/20250613120327_precious_sun.sql
```

#### Migration 5: Storage Buckets
```sql
-- Copy the content from: supabase/migrations/20250613120333_icy_garden.sql
```

#### Migration 6: Reviews
```sql
-- Copy the content from: supabase/migrations/20250613120342_yellow_voice.sql
```

#### Migration 7: Enable Realtime
```sql
-- Copy the content from: supabase/migrations/20250613120349_pale_brook.sql
```

#### Migration 8: Sample Data
```sql
-- Copy the content from: supabase/migrations/20250613120351_empty_river.sql
```

### Step 4: Verify Setup
After running all migrations, verify your setup:

1. **Check Tables**: Go to **Table Editor** and confirm these tables exist:
   - `user_profiles`
   - `projects`
   - `project_bids`
   - `messages`
   - `reviews`

2. **Check Storage**: Go to **Storage** and confirm these buckets exist:
   - `project-files`
   - `avatars`
   - `portfolios`

3. **Check Realtime**: Go to **Database > Replication** and confirm realtime is enabled

### Step 5: Test the Demo
1. Visit `/supabase-demo` in your application
2. Create a test account (both client and developer)
3. Test creating projects, uploading files, and real-time updates

## 🔧 Troubleshooting

### If you get permission errors:
- Make sure you're signed in as the project owner
- Check that RLS policies are properly created

### If storage doesn't work:
- Verify storage buckets are created
- Check storage policies in the Storage section

### If realtime doesn't work:
- Confirm realtime is enabled for all tables
- Check browser console for connection errors

## 🎯 What This Database Supports

✅ **Complete User Management**
- User profiles with roles (client/developer/admin)
- Automatic profile creation on signup
- Secure authentication with Supabase Auth

✅ **Project Management**
- Full CRUD operations for projects
- Status tracking and categorization
- Budget and deadline management

✅ **Bidding System**
- Developers can bid on projects
- One bid per developer per project
- Status tracking (pending/accepted/rejected)

✅ **Real-time Messaging**
- Direct messages between users
- Project-specific conversations
- Read/unread status tracking

✅ **File Storage**
- Secure file uploads with user-scoped access
- Support for project files, avatars, and portfolios
- Automatic cleanup and permissions

✅ **Review System**
- 5-star rating system
- Comments and feedback
- Automatic average rating calculation

✅ **Real-time Updates**
- Live notifications for new projects, bids, messages
- Instant UI updates across all connected clients
- Browser notifications support

## 🚀 Ready to Use!

Once you've applied all migrations, your NexusWorks platform will have a complete, production-ready database with:
- Secure authentication and authorization
- Real-time collaboration features
- File storage and management
- Comprehensive project management
- Rating and review system

The demo at `/supabase-demo` will showcase all these features working together! 🎉