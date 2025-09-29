# AI-Powered Freelance Platform - Visual ER Diagram

```
                                    AI-POWERED FREELANCE PLATFORM
                                         DATABASE SCHEMA
                                              
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        USER MANAGEMENT                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                 │
│  ┌─────────────────┐    1:1    ┌──────────────────────┐    1:M    ┌─────────────────┐                        │
│  │      USER       │◄─────────►│  DEVELOPER_PROFILE   │◄─────────►│   USER_SKILL    │                        │
│  │                 │           │                      │           │                 │                        │
│  │ • id (BigAuto)  │           │ • user_id            │           │ • user_id       │                        │
│  │ • username      │           │ • skills (JSON)      │           │ • skill_id      │                        │
│  │ • email         │           │ • experience_level   │           │ • proficiency   │                        │
│  │ • user_type     │           │ • hourly_rate        │           │ • years_exp     │                        │
│  │ • bio           │           │ • github_analysis    │           └─────────────────┘                        │
│  │ • location      │           │ • skill_embeddings   │                    │                                 │
│  │ • timezone      │           │ • reputation_score   │                    │ M:1                             │
│  │ • hourly_rate   │           └──────────────────────┘                    ▼                                 │
│  │ • overall_rating│                                                ┌─────────────────┐                        │
│  │ • github_username│                                               │     SKILL       │                        │
│  │ • is_verified   │                                                │                 │                        │
│  └─────────────────┘                                                │ • id            │                        │
│           │                                                          │ • name          │                        │
│           │ 1:M                                                      │ • category      │                        │
│           ▼                                                          │ • description   │                        │
│  ┌─────────────────┐                                                └─────────────────┘                        │
│  │   PORTFOLIO     │                                                                                           │
│  │                 │                                                                                           │
│  │ • id            │                                                                                           │
│  │ • user_id       │                                                                                           │
│  │ • title         │                                                                                           │
│  │ • description   │                                                                                           │
│  │ • project_url   │                                                                                           │
│  │ • technologies  │                                                                                           │
│  └─────────────────┘                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      PROJECT MANAGEMENT                                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                 │
│  ┌─────────────────┐    M:1    ┌──────────────────────┐    1:M    ┌─────────────────┐                        │
│  │      USER       │◄─────────►│      PROJECT         │◄─────────►│      TASK       │                        │
│  │   (Client)      │           │                      │           │                 │                        │
│  └─────────────────┘           │ • id (UUID)          │           │ • id (UUID)     │                        │
│           ▲                     │ • client_id          │           │ • project_id    │                        │
│           │ M:1                 │ • senior_dev_id      │           │ • title         │                        │
│           │                     │ • title              │           │ • description   │                        │
│  ┌─────────────────┐           │ • description        │           │ • required_skills│                        │
│  │      USER       │           │ • ai_analysis (JSON) │           │ • estimated_hours│                        │
│  │ (Senior Dev)    │           │ • status             │           │ • assigned_dev_id│                        │
│  └─────────────────┘           │ • budget_estimate    │           │ • status        │                        │
│                                 │ • timeline_estimate  │           │ • priority      │                        │
│                                 │ • required_skills    │           └─────────────────┘                        │
│                                 │ • attachments (JSON) │                    │                                 │
│                                 └──────────────────────┘                    │ 1:M                             │
│                                          │                                  ▼                                 │
│                                          │ 1:1                       ┌─────────────────┐                        │
│                                          ▼                           │ TEAM_INVITATION │                        │
│                                 ┌──────────────────────┐             │                 │                        │
│                                 │ PROJECT_PROPOSAL     │             │ • id (UUID)     │                        │
│                                 │                      │             │ • task_id       │                        │
│                                 │ • id (UUID)          │             │ • developer_id  │                        │
│                                 │ • project_id         │             │ • match_score   │                        │
│                                 │ • original_budget    │             │ • offered_rate  │                        │
│                                 │ • current_budget     │             │ • status        │                        │
│                                 │ • original_timeline  │             │ • invitation_rank│                        │
│                                 │ • current_timeline   │             └─────────────────┘                        │
│                                 │ • status             │                      │                                 │
│                                 │ • is_locked          │                      │ 1:1                             │
│                                 └──────────────────────┘                      ▼                                 │
│                                          │                              ┌─────────────────┐                        │
│                                          │ 1:M                          │ TASK_ASSIGNMENT │                        │
│                                          ▼                              │                 │                        │
│                                 ┌──────────────────────┐                │ • id (UUID)     │                        │
│                                 │PROPOSAL_MODIFICATION │                │ • task_id       │                        │
│                                 │                      │                │ • developer_id  │                        │
│                                 │ • id (UUID)          │                │ • agreed_rate   │                        │
│                                 │ • proposal_id        │                │ • agreed_hours  │                        │
│                                 │ • modified_by        │                │ • status        │                        │
│                                 │ • modification_type  │                │ • progress_%    │                        │
│                                 │ • old_value (JSON)   │                └─────────────────┘                        │
│                                 │ • new_value (JSON)   │                                                         │
│                                 │ • justification      │                                                         │
│                                 └──────────────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       PAYMENT SYSTEM                                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                 │
│  ┌─────────────────┐    1:M    ┌──────────────────────┐    1:M    ┌─────────────────┐                        │
│  │    PROJECT      │◄─────────►│     MILESTONE        │◄─────────►│    PAYMENT      │                        │
│  │                 │           │                      │           │                 │                        │
│  └─────────────────┘           │ • id (UUID)          │           │ • id (UUID)     │                        │
│                                 │ • project_id         │           │ • milestone_id  │                        │
│                                 │ • percentage         │           │ • developer_id  │                        │
│                                 │ • amount             │           │ • amount        │                        │
│                                 │ • status             │           │ • payment_type  │                        │
│                                 │ • due_date           │           │ • status        │                        │
│                                 │ • deliverables (JSON)│           │ • transaction_id│                        │
│                                 │ • client_approved    │           │ • platform_fee  │                        │
│                                 │ • senior_dev_approved│           │ • net_amount    │                        │
│                                 └──────────────────────┘           └─────────────────┘                        │
│                                                                             │                                 │
│                                                                             │ M:1                             │
│                                                                             ▼                                 │
│                                                                    ┌─────────────────┐                        │
│                                                                    │ PAYMENT_GATEWAY │                        │
│                                                                    │                 │                        │
│                                                                    │ • id (UUID)     │                        │
│                                                                    │ • name          │                        │
│                                                                    │ • gateway_type  │                        │
│                                                                    │ • api_endpoint  │                        │
│                                                                    │ • transaction_fee│                        │
│                                                                    │ • status        │                        │
│                                                                    └─────────────────┘                        │
│                                                                                                                 │
│  ┌─────────────────┐    1:M    ┌──────────────────────┐    1:M    ┌─────────────────┐                        │
│  │    PAYMENT      │◄─────────►│  TRANSACTION_LOG     │           │ PAYMENT_DISPUTE │                        │
│  │                 │           │                      │           │                 │                        │
│  └─────────────────┘           │ • id (UUID)          │           │ • id (UUID)     │                        │
│                                 │ • payment_id         │           │ • payment_id    │                        │
│                                 │ • log_type           │           │ • initiated_by  │                        │
│                                 │ • log_level          │           │ • disputed_against│                       │
│                                 │ • message            │           │ • dispute_type  │                        │
│                                 │ • gateway_response   │           │ • status        │                        │
│                                 │ • error_code         │           │ • disputed_amount│                        │
│                                 └──────────────────────┘           │ • resolution    │                        │
│                                                                    └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        AI SERVICES                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                 │
│  ┌─────────────────┐    1:M    ┌──────────────────────┐    1:1    ┌─────────────────┐                        │
│  │      USER       │◄─────────►│  RESUME_DOCUMENT     │◄─────────►│PROFILE_ANALYSIS │                        │
│  │                 │           │                      │           │   _COMBINED     │                        │
│  └─────────────────┘           │ • id (UUID)          │           │                 │                        │
│                                 │ • user_id            │           │ • id (UUID)     │                        │
│                                 │ • original_filename  │           │ • user_id       │                        │
│                                 │ • file_path          │           │ • resume_doc_id │                        │
│                                 │ • parsing_status     │           │ • github_analysis│                       │
│                                 │ • raw_text           │           │ • final_skills  │                        │
│                                 │ • parsed_data (JSON) │           │ • experience_level│                       │
│                                 │ • extracted_skills   │           │ • confidence_score│                       │
│                                 │ • experience_analysis│           └─────────────────┘                        │
│                                 │ • education_analysis │                                                      │
│                                 └──────────────────────┘                                                      │
│                                          │                                                                     │
│                                          │ 1:M                                                                 │
│                                          ▼                                                                     │
│                                 ┌──────────────────────┐                                                      │
│                                 │RESUME_SKILL_EXTRACT  │                                                      │
│                                 │                      │                                                      │
│                                 │ • id (UUID)          │                                                      │
│                                 │ • resume_id          │                                                      │
│                                 │ • skill_id           │                                                      │
│                                 │ • confidence_score   │                                                      │
│                                 │ • extraction_method  │                                                      │
│                                 │ • text_evidence      │                                                      │
│                                 └──────────────────────┘                                                      │
│                                                                                                                 │
│  ┌─────────────────┐    1:1    ┌──────────────────────┐    M:M    ┌─────────────────┐                        │
│  │      USER       │◄─────────►│ DEVELOPER_EMBEDDING  │◄─────────►│   SKILL_NODE    │                        │
│  │                 │           │                      │           │                 │                        │
│  └─────────────────┘           │ • id (UUID)          │           │ • id (UUID)     │                        │
│                                 │ • developer_id       │           │ • name          │                        │
│                                 │ • embedding [384]    │           │ • category      │                        │
│                                 │ • skills_text        │           │ • popularity    │                        │
│                                 │ • github_summary     │           └─────────────────┘                        │
│                                 │ • resume_summary     │                    │                                 │
│                                 └──────────────────────┘                    │ M:M                             │
│                                                                             ▼                                 │
│  ┌─────────────────┐    1:1    ┌──────────────────────┐           ┌─────────────────┐                        │
│  │    PROJECT      │◄─────────►│ PROJECT_EMBEDDING    │           │SKILL_RELATIONSHIP│                        │
│  │                 │           │                      │           │                 │                        │
│  └─────────────────┘           │ • id (UUID)          │           │ • id (UUID)     │                        │
│                                 │ • project_id         │           │ • from_skill_id │                        │
│                                 │ • embedding [384]    │           │ • to_skill_id   │                        │
│                                 │ • requirements_text  │           │ • relationship  │                        │
│                                 │ • complexity_level   │           │ • strength      │                        │
│                                 └──────────────────────┘           └─────────────────┘                        │
│                                                                                                                 │
│  ┌─────────────────┐    M:1    ┌──────────────────────┐    M:1    ┌─────────────────┐                        │
│  │    PROJECT      │◄─────────►│  MATCHING_RESULT     │◄─────────►│      USER       │                        │
│  │                 │           │                      │           │   (Developer)   │                        │
│  └─────────────────┘           │ • id (UUID)          │           └─────────────────┘                        │
│                                 │ • project_id         │                                                      │
│                                 │ • developer_id       │                                                      │
│                                 │ • vector_similarity  │                                                      │
│                                 │ • graph_relationship │                                                      │
│                                 │ • availability_score │                                                      │
│                                 │ • final_match_score  │                                                      │
│                                 │ • was_selected       │                                                      │
│                                 └──────────────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      COMMUNICATIONS                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                 │
│  ┌─────────────────┐    M:M    ┌──────────────────────┐    1:M    ┌─────────────────┐                        │
│  │      USER       │◄─────────►│   CONVERSATION       │◄─────────►│    MESSAGE      │                        │
│  │                 │           │                      │           │                 │                        │
│  └─────────────────┘           │ • id (UUID)          │           │ • id (UUID)     │                        │
│           │                     │ • title              │           │ • conversation_id│                        │
│           │ M:1                 │ • conversation_type  │           │ • sender_id     │                        │
│           ▼                     │ • project_id         │           │ • content       │                        │
│  ┌─────────────────┐           │ • is_active          │           │ • message_type  │                        │
│  │    PROJECT      │           │ • last_message_at    │           │ • reply_to_id   │                        │
│  │                 │           └──────────────────────┘           │ • is_edited     │                        │
│  └─────────────────┘                    │                        └─────────────────┘                        │
│                                          │ 1:M                             │                                 │
│                                          ▼                                 │ 1:M                             │
│                                 ┌──────────────────────┐                   ▼                                 │
│                                 │  MESSAGE_THREAD      │          ┌─────────────────┐                        │
│                                 │                      │          │ FILE_ATTACHMENT │                        │
│                                 │ • id (UUID)          │          │                 │                        │
│                                 │ • conversation_id    │          │ • id (UUID)     │                        │
│                                 │ • title              │          │ • message_id    │                        │
│                                 │ • thread_type        │          │ • uploaded_by   │                        │
│                                 │ • task_id            │          │ • filename      │                        │
│                                 │ • milestone_id       │          │ • file_path     │                        │
│                                 │ • is_pinned          │          │ • file_size     │                        │
│                                 │ • is_resolved        │          │ • file_type     │                        │
│                                 └──────────────────────┘          └─────────────────┘                        │
│                                                                                                                 │
│  ┌─────────────────┐    1:M    ┌──────────────────────┐                                                      │
│  │      USER       │◄─────────►│   NOTIFICATION       │                                                      │
│  │                 │           │                      │                                                      │
│  └─────────────────┘           │ • id (UUID)          │                                                      │
│                                 │ • recipient_id       │                                                      │
│                                 │ • notification_type  │                                                      │
│                                 │ • title              │                                                      │
│                                 │ • message            │                                                      │
│                                 │ • priority           │                                                      │
│                                 │ • is_read            │                                                      │
│                                 │ • related_message_id │                                                      │
│                                 │ • related_project_id │                                                      │
│                                 │ • related_task_id    │                                                      │
│                                 └──────────────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       COMMUNITY                                                                │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                 │
│  ┌─────────────────┐    M:1    ┌──────────────────────┐    1:M    ┌─────────────────┐                        │
│  │      USER       │◄─────────►│       EVENT          │◄─────────►│EVENT_REGISTRATION│                       │
│  │   (Organizer)   │           │                      │           │                 │                        │
│  └─────────────────┘           │ • id (UUID)          │           │ • id (UUID)     │                        │
│           ▲                     │ • title              │           │ • event_id      │                        │
│           │ M:M                 │ • description        │           │ • user_id       │                        │
│           │                     │ • event_type         │           │ • status        │                        │
│  ┌─────────────────┐           │ • start_datetime     │           │ • checked_in    │                        │
│  │      USER       │           │ • end_datetime       │           │ • rating        │                        │
│  │ (Co-organizers) │           │ • is_virtual         │           │ • feedback      │                        │
│  └─────────────────┘           │ • virtual_meeting_url│           └─────────────────┘                        │
│                                 │ • video_provider     │                                                      │
│                                 │ • recording_status   │                                                      │
│                                 │ • max_participants   │                                                      │
│                                 └──────────────────────┘                                                      │
│                                          │                                                                     │
│                                          │ 1:1                                                                 │
│                                          ▼                                                                     │
│                                 ┌──────────────────────┐                                                      │
│                                 │     HACKATHON        │                                                      │
│                                 │                      │                                                      │
│                                 │ • id (UUID)          │                                                      │
│                                 │ • event_id           │                                                      │
│                                 │ • theme              │                                                      │
│                                 │ • rules              │                                                      │
│                                 │ • min_team_size      │                                                      │
│                                 │ • max_team_size      │                                                      │
│                                 │ • submission_deadline│                                                      │
│                                 │ • total_prize_pool   │                                                      │
│                                 └──────────────────────┘                                                      │
│                                          │                                                                     │
│                                          │ 1:M                                                                 │
│                                          ▼                                                                     │
│                                 ┌──────────────────────┐                                                      │
│                                 │   HACKATHON_TEAM     │                                                      │
│                                 │                      │                                                      │
│                                 │ • id (UUID)          │                                                      │
│                                 │ • hackathon_id       │                                                      │
│                                 │ • name               │                                                      │
│                                 │ • team_leader_id     │                                                      │
│                                 │ • status             │                                                      │
│                                 │ • project_name       │                                                      │
│                                 │ • github_repo        │                                                      │
│                                 │ • final_score        │                                                      │
│                                 └──────────────────────┘                                                      │
│                                                                                                                 │
│  ┌─────────────────┐    1:M    ┌──────────────────────┐    1:M    ┌─────────────────┐                        │
│  │     EVENT       │◄─────────►│VIRTUAL_MEETING_SESSION│◄─────────►│SESSION_PARTICIPANT│                      │
│  │                 │           │                      │           │                 │                        │
│  └─────────────────┘           │ • id (UUID)          │           │ • id (UUID)     │                        │
│                                 │ • event_id           │           │ • session_id    │                        │
│                                 │ • session_name       │           │ • user_id       │                        │
│                                 │ • status             │           │ • status        │                        │
│                                 │ • scheduled_start    │           │ • join_time     │                        │
│                                 │ • actual_start       │           │ • leave_time    │                        │
│                                 │ • host_id            │           │ • duration_min  │                        │
│                                 │ • recording_enabled  │           │ • chat_messages │                        │
│                                 └──────────────────────┘           └─────────────────┘                        │
│                                          │                                                                     │
│                                          │ 1:M                                                                 │
│                                          ▼                                                                     │
│                                 ┌──────────────────────┐                                                      │
│                                 │  MEETING_RECORDING   │                                                      │
│                                 │                      │                                                      │
│                                 │ • id (UUID)          │                                                      │
│                                 │ • session_id         │                                                      │
│                                 │ • recording_type     │                                                      │
│                                 │ • status             │                                                      │
│                                 │ • file_name          │                                                      │
│                                 │ • download_url       │                                                      │
│                                 │ • duration_minutes   │                                                      │
│                                 │ • transcript         │                                                      │
│                                 └──────────────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    MARKETPLACE & MATCHING                                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                 │
│  ┌─────────────────┐    1:M    ┌──────────────────────┐    M:1    ┌─────────────────┐                        │
│  │    PROJECT      │◄─────────►│  FEATURED_PROJECT    │           │      USER       │                        │
│  │                 │           │                      │           │                 │                        │
│  └─────────────────┘           │ • id (UUID)          │           └─────────────────┘                        │
│                                 │ • project_id         │                    ▲                                 │
│                                 │ • feature_type       │                    │ 1:M                             │
│                                 │ • status             │                    │                                 │
│                                 │ • price_paid         │           ┌─────────────────┐                        │
│                                 │ • feature_start_date │           │FEATURED_DEVELOPER│                        │
│                                 │ • priority_score     │           │                 │                        │
│                                 │ • view_count         │           │ • id (UUID)     │                        │
│                                 │ • click_count        │           │ • developer_id  │                        │
│                                 └──────────────────────┘           │ • feature_type  │                        │
│                                                                    │ • status        │                        │
│  ┌─────────────────┐    M:1    ┌──────────────────────┐           │ • price_paid    │                        │
│  │      TASK       │◄─────────►│  DEVELOPER_MATCH     │           │ • profile_views │                        │
│  │                 │           │                      │           │ • contact_requests│                       │
│  └─────────────────┘           │ • task_id            │           └─────────────────┘                        │
│           ▲                     │ • developer_id       │                                                      │
│           │ M:1                 │ • match_score        │                                                      │
│           │                     │ • vector_score       │                                                      │
│  ┌─────────────────┐           │ • graph_score        │                                                      │
│  │      USER       │           │ • availability_score │                                                      │
│  │   (Developer)   │           └──────────────────────┘                                                      │
│  └─────────────────┘                                                                                          │
│           │                                                                                                    │
│           │ 1:1                                                                                                │
│           ▼                                                                                                    │
│  ┌─────────────────┐                                                                                          │
│  │MATCHING_PREFERENCES│                                                                                       │
│  │                 │                                                                                          │
│  │ • user_id       │                                                                                          │
│  │ • min_budget    │                                                                                          │
│  │ • max_budget    │                                                                                          │
│  │ • preferred_skills│                                                                                        │
│  │ • skill_weight  │                                                                                          │
│  │ • experience_weight│                                                                                       │
│  │ • availability_weight│                                                                                     │
│  └─────────────────┘                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                        RELATIONSHIP LEGEND
                                        ==================
                                        
                                        1:1  = One-to-One
                                        1:M  = One-to-Many  
                                        M:1  = Many-to-One
                                        M:M  = Many-to-Many
                                        
                                        ◄──► = Bidirectional Relationship
                                        ──►  = Unidirectional Relationship
                                        
                                        (UUID) = UUID Primary Key
                                        (JSON) = JSON Data Field
                                        [384]  = Array Field with Size
```

## Key Design Features

### 1. **AI-Powered Intelligence**
- Vector embeddings for semantic matching
- Graph-based skill relationships
- Confidence scoring for AI predictions
- Multi-source profile analysis

### 2. **Comprehensive Project Management**
- AI-generated task breakdown
- Dynamic team formation
- Senior developer oversight
- Milestone-based payments

### 3. **Advanced Communication System**
- Project-linked conversations
- Threaded discussions
- File sharing capabilities
- Real-time notifications

### 4. **Community & Events**
- Virtual meeting integration
- Hackathon management
- Calendar synchronization
- Recording and playback

### 5. **Marketplace Features**
- Featured listings
- Advanced filtering
- Search analytics
- Premium subscriptions

This ER diagram represents a sophisticated, AI-enhanced freelance platform with over 70 interconnected entities supporting intelligent matching, comprehensive project management, and rich community features.