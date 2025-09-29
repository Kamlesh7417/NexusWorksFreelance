# AI-Powered Freelance Platform - Entity Relationship Diagram

## Database Schema Overview

This document provides a comprehensive ER diagram analysis for the AI-powered freelance platform. The system consists of 11 main modules with complex relationships designed to support intelligent matching, project management, and community features.

## Core Entities and Relationships

### 1. USER MANAGEMENT MODULE

**Primary Entity: User**
- **Attributes**: id (BigAutoField), username, email, user_type, bio, location, timezone, hourly_rate, availability_hours_per_week, profile_completed, email_verified, phone_verified, overall_rating, total_reviews, projects_completed, total_earnings, role, github_username, is_verified
- **Relationships**:
  - 1:1 with DeveloperProfile
  - 1:M with UserSkill
  - 1:M with Portfolio
  - 1:M with Project (as client)
  - 1:M with Project (as senior_developer)

**Supporting Entities:**
- **DeveloperProfile**: Extended profile for developers with AI features
- **Skill**: Master skill catalog with categories
- **UserSkill**: Junction table with proficiency levels
- **Portfolio**: User portfolio items

### 2. PROJECT MANAGEMENT MODULE

**Primary Entity: Project**
- **Attributes**: id (UUID), title, description, ai_analysis (JSON), status, budget_estimate, timeline_estimate, required_skills (JSON), experience_level_required, attachments (JSON)
- **Relationships**:
  - M:1 with User (client)
  - M:1 with User (senior_developer)
  - 1:M with Task
  - 1:1 with ProjectProposal
  - 1:1 with SeniorDeveloperAssignment
  - 1:1 with ResourceAllocation

**Supporting Entities:**
- **Task**: AI-generated project tasks with dependencies
- **ProjectProposal**: AI-generated proposals with senior developer modifications
- **ProposalModification**: Audit trail for proposal changes
- **SeniorDeveloperAssignment**: Senior developer assignment tracking
- **ProjectReview**: Project completion reviews
- **TeamInvitation**: Dynamic team member invitations
- **TaskAssignment**: Active task assignments
- **DynamicPricing**: AI-calculated task pricing
- **ResourceAllocation**: Project resource and timeline management

### 3. PAYMENT SYSTEM MODULE

**Primary Entity: Milestone**
- **Attributes**: id (UUID), percentage, amount, status, due_date, paid_date, description, deliverables (JSON), completion_criteria (JSON)
- **Relationships**:
  - M:1 with Project
  - 1:M with Payment

**Supporting Entities:**
- **Payment**: Individual milestone payments
- **PaymentGateway**: Payment processor configurations
- **TransactionLog**: Detailed payment transaction logs
- **PaymentDispute**: Dispute resolution system
- **PaymentMethod**: User payment method storage

### 4. AI SERVICES MODULE

**Primary Entity: ResumeDocument**
- **Attributes**: id (UUID), original_filename, file_path, file_size, file_type, parsing_status, raw_text, parsed_data (JSON), extracted_skills (JSON), experience_analysis (JSON), education_analysis (JSON)
- **Relationships**:
  - M:1 with User
  - 1:M with ResumeSkillExtraction
  - 1:1 with ProfileAnalysisCombined

**AI-Powered Entities:**
- **DeveloperEmbedding**: Vector embeddings for developers
- **ProjectEmbedding**: Vector embeddings for projects
- **TaskEmbedding**: Vector embeddings for tasks
- **SkillNode**: Graph-based skill representation
- **SkillRelationship**: Skill relationship mapping
- **DeveloperSkillProficiency**: AI-assessed skill proficiency
- **ProjectSkillRequirement**: Project skill requirements
- **MatchingResult**: AI matching results storage
- **ProfileAnalysisCombined**: Combined profile analysis

### 5. COMMUNICATIONS MODULE

**Primary Entity: Conversation**
- **Attributes**: id (UUID), title, conversation_type, is_active, is_archived, last_message_at, message_count
- **Relationships**:
  - M:M with User (participants)
  - M:1 with User (created_by)
  - M:1 with Project
  - 1:M with Message
  - 1:M with MessageThread

**Supporting Entities:**
- **Message**: Individual messages with reply functionality
- **MessageThread**: Organized discussion threads
- **FileAttachment**: File sharing within conversations
- **Notification**: System notifications
- **MessageReadStatus**: Message read tracking

### 6. COMMUNITY MODULE

**Primary Entity: Event**
- **Attributes**: id (UUID), title, description, event_type, start_datetime, end_datetime, timezone, is_virtual, location_name, virtual_meeting_url, video_provider, recording_status, max_participants
- **Relationships**:
  - M:1 with User (organizer)
  - M:M with User (co_organizers)
  - 1:M with EventRegistration
  - 1:1 with Hackathon
  - 1:1 with Meetup
  - 1:M with VirtualMeetingSession

**Supporting Entities:**
- **EventRegistration**: User event registrations
- **Hackathon**: Hackathon-specific event details
- **HackathonTeam**: Team formation for hackathons
- **Meetup**: Regular meetup series
- **Prize**: Competition prizes
- **Winner**: Prize winners
- **VirtualMeetingSession**: Virtual meeting sessions
- **SessionParticipant**: Meeting participant tracking
- **MeetingRecording**: Meeting recordings
- **CalendarIntegration**: Calendar system integration
- **CommunityPost**: Community discussions

### 7. MATCHING MODULE

**Primary Entity: DeveloperMatch**
- **Attributes**: match_score, vector_score, graph_score, availability_score
- **Relationships**:
  - M:1 with Task
  - M:1 with User (developer)

**Supporting Entities:**
- **MatchingPreferences**: User matching preferences
- **MatchingAnalytics**: Matching system analytics
- **MatchingCache**: Performance optimization cache

### 8. MARKETPLACE MODULE

**Primary Entity: FeaturedProject**
- **Attributes**: id (UUID), feature_type, status, price_paid, feature_start_date, feature_end_date, priority_score, view_count, click_count
- **Relationships**:
  - M:1 with Project

**Supporting Entities:**
- **FeaturedDeveloper**: Featured developer listings
- **MarketplaceFilter**: Saved search filters
- **SearchHistory**: User search tracking
- **PremiumAccess**: Premium subscription management
- **MarketplaceAnalytics**: Marketplace performance metrics

## Key Relationship Patterns

### 1. User-Centric Design
- **User** entity is central to the system with relationships to all major modules
- Supports multiple user types (freelancer, client, both) with role-based features
- Extended through **DeveloperProfile** for freelancer-specific features

### 2. AI-Enhanced Matching
- **Vector embeddings** stored for users, projects, and tasks
- **Graph-based skill relationships** for intelligent matching
- **Matching results** cached for performance optimization

### 3. Project Lifecycle Management
- **Projects** → **Tasks** → **TeamInvitations** → **TaskAssignments**
- **Milestones** → **Payments** with dispute resolution
- **Senior developer oversight** with proposal modification tracking

### 4. Communication Integration
- **Conversations** linked to projects and tasks
- **Notifications** for all system events
- **File attachments** and **message threading**

### 5. Community Features
- **Events** with virtual meeting capabilities
- **Hackathons** with team formation and judging
- **Calendar integration** across multiple providers

## Database Design Principles

### 1. Scalability
- UUID primary keys for distributed systems
- JSON fields for flexible data storage
- Indexed foreign keys for performance

### 2. Audit Trail
- Created/updated timestamps on all entities
- **ProposalModification** for change tracking
- **TransactionLog** for payment auditing

### 3. AI Integration
- **Embedding storage** for vector similarity
- **Confidence scores** for AI predictions
- **Metadata fields** for algorithm versioning

### 4. Performance Optimization
- **Caching layers** for expensive operations
- **Analytics tables** for reporting
- **Denormalized counters** for quick access

## Entity Count Summary
- **Core Entities**: 8 (User, Project, Task, Milestone, Payment, Event, Conversation, Message)
- **AI Entities**: 12 (Various embedding and analysis tables)
- **Junction Tables**: 15 (Many-to-many relationships)
- **Supporting Entities**: 35+ (Configuration, analytics, caching)
- **Total Entities**: 70+ tables

This comprehensive database design supports a full-featured AI-powered freelance platform with intelligent matching, project management, payment processing, communication tools, and community features.