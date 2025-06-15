# NexusWorks - The Future of Freelancing

NexusWorks is a revolutionary work-to-earn freelancing platform that combines AI enhancement, blockchain payments, and educational opportunities for developers and students.

## 🚀 Features

### Authentication & User Management
- **GitHub OAuth Integration**: Seamless sign-in with GitHub
- **Role-based Access**: Support for clients, developers, and students
- **Automatic Profile Creation**: GitHub data integration with custom onboarding
- **Protected Routes**: Secure access to authenticated features

### Core Platform Features
- **AI-Powered Matching**: Quantum algorithms for project-developer matching
- **Real-time Collaboration**: Live project updates and messaging
- **Blockchain Payments**: Secure, transparent payment system
- **Learning Platform**: Comprehensive developer education with earn-while-learning
- **Project Management**: Advanced tools for project tracking and collaboration

### Technology Stack
- **Frontend**: Next.js 13, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Authentication**: Supabase Auth with GitHub OAuth
- **Payments**: Blockchain integration (Ethereum/Polygon)
- **AI**: OpenAI GPT-4 for intelligent features

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- GitHub OAuth App

### 1. Clone and Install
```bash
git clone <repository-url>
cd nexusworks
npm install
```

### 2. Environment Configuration
Create `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://nexusworks.in
OPENAI_API_KEY=your_openai_api_key
```

### 3. Supabase Setup
1. Create a new Supabase project
2. Run the migration scripts in order (see `supabase/migrations/`)
3. Configure GitHub OAuth in Supabase Auth settings:
   - **Site URL**: `https://nexusworks.in`
   - **Redirect URLs**: `https://nexusworks.in/auth/callback`

### 4. GitHub OAuth Setup
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App:
   - **Application name**: NexusWorks
   - **Homepage URL**: `https://nexusworks.in`
   - **Authorization callback URL**: `https://nexusworks.in/auth/callback`
3. Copy Client ID and Client Secret to Supabase Auth settings

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🏗️ Architecture

### Authentication Flow
1. User clicks "Sign in with GitHub"
2. Redirected to GitHub OAuth
3. GitHub redirects to `/auth/callback`
4. Supabase exchanges code for session
5. Auto-create user profile from GitHub data
6. Redirect to onboarding or dashboard

### Database Schema
- **user_profiles**: User information and roles
- **projects**: Project listings and details
- **project_bids**: Developer bids on projects
- **messages**: Real-time messaging system
- **reviews**: Rating and review system

### Key Routes
- `/` - Public homepage
- `/auth/signin` - GitHub OAuth sign-in
- `/auth/callback` - OAuth callback handler
- `/onboarding` - New user setup
- `/dashboard` - Role-specific dashboard
- `/profile` - User profile management
- `/supabase-demo` - Database demo

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Protected Routes**: Middleware-based route protection
- **Role-based Access**: Different permissions for clients/developers
- **Secure File Storage**: User-scoped file access
- **Real-time Security**: Authenticated real-time subscriptions

## 🚀 Deployment

### Netlify Deployment
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy with build command: `npm run build`

### Domain Configuration
- **Production**: `https://nexusworks.in`
- **Staging**: Configure as needed

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://nexusworks.in
```

## 📱 Features Overview

### For Developers
- Browse and bid on projects
- Real-time project collaboration
- Skill-based matching
- Portfolio management
- Earn while learning

### For Clients
- Post projects with AI assistance
- Review developer profiles
- Real-time project tracking
- Secure milestone payments
- Quality assurance

### For Students
- Learn through real projects
- Earn cryptocurrency (WORK tokens)
- Mentorship opportunities
- Skill development tracking
- Career pathway guidance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Email: support@nexusworks.in
- Documentation: [docs.nexusworks.in](https://docs.nexusworks.in)
- Community: [community.nexusworks.in](https://community.nexusworks.in)

---

**NexusWorks** - Where Learning Meets Earning 🚀