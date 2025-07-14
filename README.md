# NexusWorks - The Future of Freelancing

NexusWorks is a revolutionary work-to-earn freelancing platform that combines AI enhancement, blockchain payments, and educational opportunities for developers and students. We're building a seamless, secure, and intelligent ecosystem for the modern freelancer.

---

## 🚀 Features

### Authentication & User Management

- **GitHub OAuth Integration**: Seamless sign-in with GitHub.
- **Role-based Access**: Support for clients, freelancers, and administrators. A key feature is the ability for a freelancer to be granted a **Senior Developer** role on a project-by-project basis.
- **Automatic Profile Creation**: GitHub data integration with custom onboarding for all user roles.
- **Protected Routes**: Secure access to authenticated features and role-specific dashboards.
- **Registration & Sign-in**: Users can easily register for new accounts or sign in to existing ones.

### Core Platform Features

- **AI-Powered Project Analysis**: Utilize Gemini AI to analyze project requirements, generate detailed roadmaps, and break down projects into specific tasks.
- **Smart Matching System**: Intelligent algorithms analyze GitHub profiles to match freelancers to projects based on skill compatibility and availability.
- **Comprehensive Task Management**: Create detailed task cards with priority levels, subtasks, acceptance criteria, and track progress.
- **Team Collaboration**: Real-time chat, team member management with role-based permissions, and GitHub repository integration.
- **Secure Payment & Escrow**: Stripe-hosted checkout with an escrow system for secure fund holding and automatic payment release upon task completion.
- **Learning Platform**: Comprehensive developer education with "earn-while-learning" opportunities.

---

## 🧱 Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS  
- **Backend**: Django with PostgreSQL (via Neon)  
- **Authentication**: Django-Login with GitHub OAuth  
- **Payments**: Stripe (for secure transactions and escrow)  
- **AI**: Google Gemini AI (for intelligent features with fallback systems)  
- **Database**: PostgreSQL (hosted on Neon)

---

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+  
- npm or yarn  
- Python 3.9+  
- PostgreSQL database (e.g., via Neon)  
- GitHub OAuth App  
- Stripe Account (for payment integration)  
- Google Cloud Project (for Gemini API access)

### 1. Clone and Install

### 2. Environment Configuration

Create `.env.local` in your frontend directory and `.env` in your backend directory with your credentials:

- **Frontend**: `.env.local`  
- **Backend**: `.env`

### 3. Database Setup (Backend)

Configure your PostgreSQL database (e.g., using Neon) and update `DATABASE_URL` in your backend `.env` file.  
Run database migrations.

### 4. GitHub OAuth Setup

Go to **GitHub Settings > Developer settings > OAuth Apps**.  
Create a new OAuth App:

- **Application name**: NexusWorks  
- **Homepage URL**: `https://nexusworks.in` (or `http://localhost:3000` for local testing)  
- **Authorization callback URL**: `https://nexusworks.in/auth/callback` (or `http://localhost:3000/auth/callback`)

Copy the **Client ID** and **Client Secret** to your backend `.env` file.

### 5. Stripe Setup

- Create a Stripe account.  
- Obtain your **Stripe Secret Key** and **Webhook Secret** from the Stripe Dashboard and add them to your backend `.env` file.

### 6. Run Development Servers

**Frontend**:  
Visit `http://localhost:3000` to see the frontend application.

**Backend**:  
The backend API will be accessible at `http://localhost:5000`.

---

## 🏗️ Architecture

### Authentication Flow

1. User navigates to `/auth/signin` or `/auth/register`.
2. Users can choose GitHub or email/password registration.
3. GitHub redirects to `/auth/callback`.
4. Django backend exchanges the code for a session.
5. User profile is auto-created/updated from GitHub data.
6. User is redirected to onboarding or dashboard.

### Database Schema

- **User**: Base user and authentication.
- **FreelancerProfile**: Skills, experience, portfolio.
- **Project**: Listings, requirements, status.
- **Task**: Subtasks, acceptance criteria, specs.
- **MatchingRequest**: AI-powered matches.
- **Payment**: Transactions, escrow status.
- **Notification**: Real-time updates.
- **ProjectTeam**: Role-based team assignments.
- **ProjectChat**: Project communication.
- **TaskOffer**: Freelancer bids.
- **GitHubRepository**: Integration details.

### Key Routes

- `/` - Public homepage  
- `/auth/signin` - Sign-in  
- `/auth/register` - Register  
- `/auth/callback` - OAuth handler  
- `/onboarding` - New user setup  
- `/dashboard` - Role-based dashboard  
- `/profile` - Profile management  
- `/projects/create` - Project creation  
- `/projects/<id>` - Project management  
- `/tasks/<id>` - Task details

---

## 🔐 Security Features

- **Row Level Security (RLS)**: PostgreSQL database access control.
- **Protected Routes**: Middleware-based route protection.
- **Role-based Access**: Clients, freelancers, admins. Temporary elevation to "Senior Developer" possible.
- **Secure File Storage**: User-scoped access.
- **Real-time Security**: Authenticated real-time subscriptions.
- **Secure Session Management**: Django-Login.
- **Password Hashing**: Werkzeug.
- **Input Validation**: Prevents common vulnerabilities.

---

## 🚀 Deployment

### General Deployment Notes

- Deploy **Frontend** (Next.js) to Netlify or Vercel.  
- Deploy **Backend** (Django) to Render, Heroku, or VPS.  
- Use **Gunicorn** for Django in production.  
- Ensure correct environment variables.

### Netlify Deployment (Frontend)

- Connect GitHub repo to Netlify.  
- Set env vars (e.g., `NEXT_PUBLIC_API_URL`).  
- Deploy with: `npm run build`

### Backend Deployment

- Set `DEBUG=False` in production.  
- Use Gunicorn:  
  ```bash
  gunicorn --bind 0.0.0.0:5000 nexusworks.wsgi:application

### Configure Nginx/Apache to Proxy Requests

Make sure to configure your web server (e.g., **Nginx** or **Apache**) to proxy requests to your backend (Django running with Gunicorn) appropriately.

---

### 🌐 Domain Configuration

- **Production**: [https://nexusworks.in](https://nexusworks.in)  
- **Staging**: e.g., [https://staging.nexusworks.in](https://staging.nexusworks.in)

---

## 📱 Features Overview

### For Clients

- **Post Projects with AI Assistance**: Use Gemini AI to help define project scope.
- **Review Developer Profiles**: Browse and assess freelancer profiles with AI matching scores.
- **Real-time Project Tracking**: Monitor the status and updates on your projects.
- **Secure Milestone Payments**: Escrow-based payments with Stripe.


### For Freelancers

- **Browse and Bid on Projects**: Discover projects tailored to your skills.
- **Real-time Collaboration**: Engage in live chats and manage team roles.
- **Skill-based Matching**: Intelligent matching engine connects you with ideal projects.
- **Earn While Learning**: Get paid in WORK tokens as you learn.
- **Earn Project-Based Authority**: Gain trusted roles from clients.
- **Dynamic Senior Developer Role**: Granted freelancers advanced permissions only of them per project to manage the project tasks and intial drats.

### For Students

- **Learn Through Real Projects**: Gain experience from real-world problems.
- **Earn Cryptocurrency (WORK tokens)**: Be rewarded for your contributions.
- **Mentorship Opportunities**: Learn from senior developers.
- **Skill Development Tracking**: Monitor and improve your progress.
- **Career Pathway Guidance**: Access structured learning and career resources.

---

## 🤝 Contributing

We welcome contributions!

1. **Fork** the repository.  
2. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
