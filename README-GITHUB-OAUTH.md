# GitHub OAuth Setup for NexusWorks

This guide will walk you through setting up GitHub OAuth for the NexusWorks platform.

## Prerequisites

1. A GitHub account
2. Access to the NexusWorks project
3. Supabase project with the database schema already set up

## Step 1: Create a GitHub OAuth App

1. Go to your GitHub account settings
2. Navigate to "Developer settings" > "OAuth Apps" > "New OAuth App"
3. Fill in the application details:
   - **Application name**: NexusWorks
   - **Homepage URL**: http://localhost:3000 (for development) or your production URL
   - **Application description**: The future of freelancing with AI integration
   - **Authorization callback URL**: http://localhost:3000/api/auth/callback/github (for development) or https://yourdomain.com/api/auth/callback/github (for production)
4. Click "Register application"
5. Generate a new client secret
6. Note down the Client ID and Client Secret

## Step 2: Configure Environment Variables

1. Create or update your `.env.local` file with the following variables:

```
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

2. For production, make sure to update the `NEXTAUTH_URL` to your production URL

## Step 3: Update Supabase Schema (if needed)

Ensure your `user_profiles` table has the following columns:

- `github_username` (text)
- `onboarded` (boolean, default: false)

You can add these columns with the following SQL:

```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;
```

## Step 4: Test the Authentication Flow

1. Start your development server: `npm run dev`
2. Visit http://localhost:3000
3. Click "Sign In" and select GitHub
4. You should be redirected to GitHub for authorization
5. After authorizing, you should be redirected back to the application
6. If it's your first sign-in, you'll be taken to the onboarding page
7. Complete the onboarding process
8. You should now be logged in and redirected to the dashboard

## Troubleshooting

### Common Issues:

1. **Callback URL Mismatch**: Ensure the callback URL in your GitHub OAuth app settings exactly matches the one in your application.

2. **Environment Variables Not Loaded**: Make sure your environment variables are properly loaded. You can check by adding a temporary log statement.

3. **CORS Issues**: If you're experiencing CORS issues, check that your NEXTAUTH_URL is correctly set.

4. **Database Connection Issues**: Verify your Supabase credentials and ensure the database is accessible.

5. **Profile Creation Failure**: Check the Supabase logs for any errors during profile creation.

### Debug Logs:

To enable debug logs for NextAuth.js, add the following to your `.env.local` file:

```
DEBUG=next-auth:*
```

## Security Considerations

1. **Never commit your `.env.local` file** to version control
2. Use environment variables for all sensitive information
3. In production, ensure you're using HTTPS
4. Regularly rotate your client secrets
5. Implement proper CSRF protection (NextAuth.js handles this for you)
6. Consider adding additional authentication factors for sensitive operations

## Next Steps

1. Customize the user onboarding flow
2. Add role-based access control
3. Implement profile completion reminders
4. Add social sharing features
5. Set up email notifications for authentication events

For more information, refer to the [NextAuth.js documentation](https://next-auth.js.org/getting-started/introduction) and [GitHub OAuth documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps).