# AI-Powered Freelancing Platform - Django Backend

This is the Django backend for the AI-powered freelancing platform. It provides RESTful APIs for the Next.js frontend and handles all the business logic, data persistence, and AI integrations.

## Project Structure

The backend is organized into the following Django apps:

- **authentication**: Handles user authentication, OAuth integration, and session management
- **users**: User profiles, skills, and portfolio management
- **projects**: Project creation, management, bidding, and reviews
- **matching**: AI-powered developer matching and team assembly
- **payments**: Milestone-based payment processing and fund distribution
- **communications**: Real-time chat and messaging system
- **learning**: Personalized learning platform and skill development
- **community**: Events, hackathons, and collaboration features
- **marketplace**: Featured projects and developers
- **ai_services**: Integration with Google Gemini, Pinecone, and Neo4j

## Setup Instructions

### Prerequisites

- Python 3.10+
- PostgreSQL (Neon)
- Redis (for caching and real-time features)

### Installation

1. Clone the repository
2. Navigate to the django-backend directory
3. Create a virtual environment:
   ```
   python -m venv .venv
   ```
4. Activate the virtual environment:
   - Windows: `.venv\Scripts\activate`
   - macOS/Linux: `source .venv/bin/activate`
5. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
   or using uv:
   ```
   uv pip install -e .
   ```

### Environment Variables

Create a `.env` file in the django-backend directory with the following variables:

```
# Django Configuration
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# AI Services Configuration
GEMINI_API_KEY=your-gemini-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password

# GitHub Integration Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Payment Gateway Configuration
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-password
DEFAULT_FROM_EMAIL=noreply@freelanceplatform.com

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
```

### Database Setup

1. Make sure your Neon PostgreSQL database is set up and running
2. Apply migrations:
   ```
   python manage.py migrate
   ```
3. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

### Running the Server

```
python manage.py runserver
```

The API will be available at http://localhost:8000/

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register/`: Register a new user
- `POST /api/auth/login/`: Login and get authentication token
- `POST /api/auth/logout/`: Logout and invalidate token
- `GET /api/auth/user/`: Get current user information
- `POST /api/auth/oauth/github/`: Authenticate with GitHub

### User Endpoints

- `GET /api/users/profile/`: Get user profile
- `PUT /api/users/profile/`: Update user profile
- `GET /api/users/skills/`: Get user skills
- `POST /api/users/skills/`: Add a skill to user profile
- `GET /api/users/portfolio/`: Get user portfolio items
- `POST /api/users/portfolio/`: Add a portfolio item

### Project Endpoints

- `GET /api/projects/`: List all projects
- `POST /api/projects/`: Create a new project
- `GET /api/projects/{id}/`: Get project details
- `PUT /api/projects/{id}/`: Update project
- `DELETE /api/projects/{id}/`: Delete project
- `GET /api/projects/{id}/bids/`: Get project bids
- `POST /api/projects/{id}/bids/`: Submit a bid for a project
- `GET /api/projects/{id}/milestones/`: Get project milestones
- `POST /api/projects/{id}/milestones/`: Create a project milestone

### AI Matching Endpoints

- `POST /api/matching/analyze-project/`: Analyze project and generate tasks
- `GET /api/matching/developers/{task_id}/`: Get matched developers for a task
- `POST /api/matching/team-suggestion/`: Get team structure suggestion

### Payment Endpoints

- `GET /api/payments/milestones/{id}/`: Get milestone payment details
- `POST /api/payments/milestones/{id}/pay/`: Process milestone payment
- `GET /api/payments/history/`: Get payment history

## Testing

Run tests with:

```
python manage.py test
```

## Deployment

The application is configured to be deployed to any cloud provider that supports Django applications. For production deployment:

1. Set `DEBUG=False` in the .env file
2. Configure proper `ALLOWED_HOSTS`
3. Set up a production-ready database
4. Configure a proper email backend
5. Set up a production-ready web server (Gunicorn, uWSGI)
6. Set up a reverse proxy (Nginx, Apache)
7. Configure SSL/TLS certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request