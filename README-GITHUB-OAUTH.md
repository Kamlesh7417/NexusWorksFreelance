# GitHub OAuth Setup for NexusWorks

This guide explains how to set up GitHub OAuth authentication for the NexusWorks platform.

## 1. GitHub OAuth App Configuration

Your GitHub OAuth app has been created with the following credentials:

- **Client ID**: `Ov23litAUoXG21W1xPRN`
- **Client Secret**: `1bc024d8d413c13ec465268a54db451f9040dd29`

## 2. Supabase Configuration

Since Supabase is showing a default callback URL, you need to manually configure the GitHub provider in your Supabase project:

1. Go to your Supabase dashboard: https://jzkouytzmgjrqvgercav.supabase.co
2. Navigate to **Authentication** → **Providers**
3. Find **GitHub** in the list and enable it
4. Enter your GitHub OAuth credentials:
   - **Client ID**: `Ov23litAUoXG21W1xPRN`
   - **Client Secret**: `1bc024d8d413c13ec465268a54db451f9040dd29`
5. For the **Callback URL**, you need to use the one provided by Supabase:
   - `https://jzkouytzmgjrqvgercav.supabase.co/auth/v1/callback`

## 3. Update GitHub OAuth App Settings

Now you need to update your GitHub OAuth App to use the Supabase callback URL:

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Select your NexusWorks OAuth App
3. Update the **Authorization callback URL** to:
   - `https://jzkouytzmgjrqvgercav.supabase.co/auth/v1/callback`
4. Click "Update application"

## 4. Environment Variables

The `.env.local` file has been created with all necessary environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://jzkouytzmgjrqvgercav.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6a291eXR6bWdqcnF2Z2VyY2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MDAsImV4cCI6MjAzMzAwNjQwMH0.Wd0jXKYQQM9wQAVzMGDZbA-HQooXk6c3G2O5JMqDhNE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6a291eXR6bWdqcnF2Z2VyY2F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzQzMDQwMCwiZXhwIjoyMDMzMDA2NDAwfQ.Wd0jXKYQQM9wQAVzMGDZbA-HQooXk6c3G2O5JMqDhNE
GITHUB_CLIENT_ID=Ov23litAUoXG21W1xPRN
GITHUB_CLIENT_SECRET=1bc024d8d413c13ec465268a54db451f9040dd29
NEXT_PUBLIC_SITE_URL=https://nexusworks.in
```

## 5. Domain Configuration

For your production domain `nexusworks.in`:

1. Once your site is deployed, you'll need to update your GitHub OAuth App settings:
   - **Homepage URL**: `https://nexusworks.in`
   - **Authorization callback URL**: `https://jzkouytzmgjrqvgercav.supabase.co/auth/v1/callback`

2. In your Supabase project, add your domain to the Site URL:
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to `https://nexusworks.in`

## 6. Testing the Authentication

1. Start your development server: `npm run dev`
2. Visit your application and click "Sign In with GitHub"
3. You should be redirected to GitHub for authorization
4. After authorizing, you'll be redirected back to your application
5. New users will be taken to the onboarding page
6. Existing users will be taken to their dashboard

## 7. Troubleshooting

If you encounter any issues:

1. Check browser console for errors
2. Verify that your GitHub OAuth App settings match the Supabase callback URL
3. Ensure all environment variables are correctly set
4. Check Supabase logs for authentication errors
5. Make sure your database has the correct schema for user profiles

## 8. Security Considerations

- Keep your GitHub Client Secret and Supabase Service Role Key secure
- Never commit `.env.local` to version control
- Use HTTPS in production
- Implement proper CSRF protection
- Consider adding additional authentication factors for sensitive operations

For more information, refer to:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)