# Generated manually for AI Agent models

from django.db import migrations, models
import django.core.validators
import django.contrib.postgres.fields
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('ai_services', '0002_resumedocument_profileanalysiscombined_and_more'),
        ('users', '0001_initial'),
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AIAgent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('agent_type', models.CharField(choices=[('code_generator', 'Code Generator'), ('code_reviewer', 'Code Reviewer'), ('documentation', 'Documentation Specialist'), ('testing', 'Testing Specialist'), ('full_stack', 'Full Stack Developer'), ('data_analyst', 'Data Analyst'), ('devops', 'DevOps Specialist'), ('ui_ux', 'UI/UX Designer')], max_length=50)),
                ('agent_name', models.CharField(help_text='Display name for the AI agent', max_length=200)),
                ('agent_description', models.TextField(help_text='Description of agent capabilities')),
                ('api_endpoint', models.URLField(blank=True, help_text='Primary API endpoint for agent communication', max_length=500, null=True)),
                ('authentication_method', models.CharField(choices=[('api_key', 'API Key'), ('oauth', 'OAuth 2.0'), ('jwt', 'JWT Token'), ('webhook', 'Webhook')], default='api_key', max_length=20)),
                ('api_key_hash', models.CharField(blank=True, help_text='Hashed API key for secure storage', max_length=255, null=True)),
                ('webhook_url', models.URLField(blank=True, help_text='Webhook URL for receiving notifications', max_length=500, null=True)),
                ('always_available', models.BooleanField(default=True, help_text='Whether agent is available 24/7')),
                ('response_time_sla', models.IntegerField(default=5, help_text='Response time SLA in minutes', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(1440)])),
                ('max_concurrent_projects', models.IntegerField(default=10, help_text='Maximum number of concurrent projects', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(100)])),
                ('current_availability_status', models.CharField(choices=[('available', 'Available'), ('busy', 'Busy'), ('maintenance', 'Under Maintenance'), ('offline', 'Offline')], default='available', max_length=20)),
                ('automation_level', models.IntegerField(default=80, help_text='Automation level percentage (0-100)', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('requires_human_oversight', models.BooleanField(default=False, help_text='Whether agent requires human oversight for all tasks')),
                ('success_rate', models.FloatField(default=0.0, help_text='Success rate percentage', validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(100.0)])),
                ('average_quality_score', models.FloatField(default=0.0, help_text='Average quality score (0-5)', validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(5.0)])),
                ('client_satisfaction_rate', models.FloatField(default=0.0, help_text='Client satisfaction rate percentage', validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(100.0)])),
                ('completion_time_accuracy', models.FloatField(default=0.0, help_text='Completion time accuracy percentage', validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(100.0)])),
                ('is_verified', models.BooleanField(default=False, help_text='Whether agent has been verified by platform')),
                ('is_certified', models.BooleanField(default=False, help_text='Whether agent has platform certification')),
                ('verification_date', models.DateTimeField(blank=True, help_text='Date when agent was verified', null=True)),
                ('certification_level', models.CharField(blank=True, choices=[('basic', 'Basic'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced'), ('expert', 'Expert')], max_length=20, null=True)),
                ('is_active', models.BooleanField(default=True, help_text='Whether agent is active on the platform')),
                ('is_suspended', models.BooleanField(default=False, help_text='Whether agent is temporarily suspended')),
                ('suspension_reason', models.TextField(blank=True, help_text='Reason for suspension if applicable', null=True)),
                ('last_health_check', models.DateTimeField(blank=True, help_text='Last successful health check', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_activity', models.DateTimeField(blank=True, help_text='Last activity timestamp', null=True)),
                ('user', models.OneToOneField(on_delete=models.deletion.CASCADE, related_name='ai_agent_profile', to='users.user')),
            ],
            options={
                'db_table': 'ai_agents',
            },
        ),
        migrations.CreateModel(
            name='AgentCapability',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('category', models.CharField(choices=[('programming_language', 'Programming Language'), ('framework', 'Framework'), ('database', 'Database'), ('cloud_platform', 'Cloud Platform'), ('tool', 'Development Tool'), ('methodology', 'Development Methodology'), ('domain_knowledge', 'Domain Knowledge'), ('soft_skill', 'Soft Skill')], max_length=50)),
                ('skill_name', models.CharField(max_length=100)),
                ('proficiency_level', models.CharField(choices=[('basic', 'Basic'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced'), ('expert', 'Expert')], max_length=20)),
                ('is_verified', models.BooleanField(default=False, help_text='Whether capability has been verified through testing')),
                ('confidence_score', models.FloatField(default=0.0, help_text='AI confidence in this capability (0.0 to 1.0)', validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(1.0)])),
                ('verification_date', models.DateTimeField(blank=True, help_text='Date when capability was verified', null=True)),
                ('success_rate', models.FloatField(default=0.0, help_text='Success rate for tasks using this capability', validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(100.0)])),
                ('average_completion_time', models.DurationField(blank=True, help_text='Average time to complete tasks with this capability', null=True)),
                ('evidence_data', models.JSONField(default=dict, help_text='Evidence supporting this capability (test results, examples, etc.)')),
                ('documentation_url', models.URLField(blank=True, help_text='URL to capability documentation or examples', max_length=500, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_used', models.DateTimeField(blank=True, help_text='Last time this capability was used in a project', null=True)),
                ('agent', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='capabilities', to='ai_services.aiagent')),
            ],
            options={
                'db_table': 'agent_capabilities',
            },
        ),
        migrations.CreateModel(
            name='AgentWorkPreference',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('preferred_project_types', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(choices=[('web_development', 'Web Development'), ('mobile_development', 'Mobile Development'), ('data_analysis', 'Data Analysis'), ('machine_learning', 'Machine Learning'), ('devops', 'DevOps'), ('testing', 'Testing'), ('documentation', 'Documentation'), ('code_review', 'Code Review'), ('api_development', 'API Development'), ('database_design', 'Database Design')], max_length=50), default=list, help_text='Types of projects the agent prefers', size=None)),
                ('excluded_project_types', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(choices=[('web_development', 'Web Development'), ('mobile_development', 'Mobile Development'), ('data_analysis', 'Data Analysis'), ('machine_learning', 'Machine Learning'), ('devops', 'DevOps'), ('testing', 'Testing'), ('documentation', 'Documentation'), ('code_review', 'Code Review'), ('api_development', 'API Development'), ('database_design', 'Database Design')], max_length=50), default=list, help_text='Types of projects the agent cannot or will not handle', size=None)),
                ('min_complexity_level', models.CharField(choices=[('simple', 'Simple'), ('moderate', 'Moderate'), ('complex', 'Complex'), ('expert', 'Expert Level')], default='simple', max_length=20)),
                ('max_complexity_level', models.CharField(choices=[('simple', 'Simple'), ('moderate', 'Moderate'), ('complex', 'Complex'), ('expert', 'Expert Level')], default='complex', max_length=20)),
                ('preferred_collaboration_mode', models.CharField(choices=[('fully_autonomous', 'Fully Autonomous'), ('human_supervised', 'Human Supervised'), ('collaborative', 'Collaborative'), ('human_assisted', 'Human Assisted')], default='fully_autonomous', max_length=30)),
                ('requires_human_review', models.BooleanField(default=False, help_text='Whether agent requires human review for all deliverables')),
                ('min_project_duration', models.DurationField(blank=True, help_text='Minimum project duration agent will accept', null=True)),
                ('max_project_duration', models.DurationField(blank=True, help_text='Maximum project duration agent can handle', null=True)),
                ('min_hourly_rate', models.DecimalField(blank=True, decimal_places=2, help_text='Minimum acceptable hourly rate', max_digits=10, null=True)),
                ('max_hourly_rate', models.DecimalField(blank=True, decimal_places=2, help_text='Maximum hourly rate agent charges', max_digits=10, null=True)),
                ('requires_api_access', models.BooleanField(default=True, help_text='Whether agent requires API access to external services')),
                ('requires_sandbox_environment', models.BooleanField(default=True, help_text='Whether agent requires sandboxed execution environment')),
                ('allowed_external_apis', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=200), default=list, help_text='List of external APIs agent is allowed to use', size=None)),
                ('preferred_communication_format', models.CharField(choices=[('json', 'JSON'), ('xml', 'XML'), ('yaml', 'YAML'), ('plain_text', 'Plain Text')], default='json', max_length=20)),
                ('supports_real_time_communication', models.BooleanField(default=True, help_text='Whether agent supports real-time communication')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('agent', models.OneToOneField(on_delete=models.deletion.CASCADE, related_name='work_preferences', to='ai_services.aiagent')),
            ],
            options={
                'db_table': 'agent_work_preferences',
            },
        ),
        migrations.CreateModel(
            name='AgentPerformanceMetric',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('metric_type', models.CharField(choices=[('project_completion', 'Project Completion'), ('quality_score', 'Quality Score'), ('response_time', 'Response Time'), ('client_satisfaction', 'Client Satisfaction'), ('error_rate', 'Error Rate'), ('uptime', 'Uptime'), ('throughput', 'Throughput')], max_length=30)),
                ('metric_value', models.FloatField()),
                ('metric_unit', models.CharField(choices=[('percentage', 'Percentage'), ('seconds', 'Seconds'), ('minutes', 'Minutes'), ('hours', 'Hours'), ('count', 'Count'), ('score', 'Score')], max_length=20)),
                ('measurement_period_start', models.DateTimeField()),
                ('measurement_period_end', models.DateTimeField()),
                ('metadata', models.JSONField(default=dict, help_text='Additional metric data and context')),
                ('recorded_at', models.DateTimeField(auto_now_add=True)),
                ('agent', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='performance_metrics', to='ai_services.aiagent')),
                ('project_context', models.ForeignKey(blank=True, help_text='Specific project this metric relates to', null=True, on_delete=models.deletion.CASCADE, to='projects.project')),
            ],
            options={
                'db_table': 'agent_performance_metrics',
            },
        ),
        migrations.CreateModel(
            name='AgentAuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action_type', models.CharField(choices=[('project_assigned', 'Project Assigned'), ('proposal_submitted', 'Proposal Submitted'), ('work_started', 'Work Started'), ('deliverable_submitted', 'Deliverable Submitted'), ('communication_sent', 'Communication Sent'), ('status_updated', 'Status Updated'), ('error_occurred', 'Error Occurred'), ('escalation_triggered', 'Escalation Triggered'), ('configuration_changed', 'Configuration Changed'), ('capability_updated', 'Capability Updated')], max_length=30)),
                ('action_description', models.TextField()),
                ('action_data', models.JSONField(default=dict, help_text='Detailed data about the action')),
                ('request_data', models.JSONField(default=dict, help_text='Request data that triggered this action')),
                ('response_data', models.JSONField(default=dict, help_text='Response data from this action')),
                ('was_successful', models.BooleanField(default=True)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('execution_time_ms', models.IntegerField(blank=True, help_text='Execution time in milliseconds', null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('agent', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='audit_logs', to='ai_services.aiagent')),
                ('project_context', models.ForeignKey(blank=True, help_text='Project context for this action', null=True, on_delete=models.deletion.CASCADE, to='projects.project')),
                ('user_context', models.ForeignKey(blank=True, help_text='User involved in this action', null=True, on_delete=models.deletion.CASCADE, to='users.user')),
            ],
            options={
                'db_table': 'agent_audit_logs',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='aiagent',
            index=models.Index(fields=['user'], name='ai_agents_user_id_idx'),
        ),
        migrations.AddIndex(
            model_name='aiagent',
            index=models.Index(fields=['agent_type'], name='ai_agents_agent_type_idx'),
        ),
        migrations.AddIndex(
            model_name='aiagent',
            index=models.Index(fields=['is_active', 'is_suspended'], name='ai_agents_is_active_is_suspended_idx'),
        ),
        migrations.AddIndex(
            model_name='aiagent',
            index=models.Index(fields=['current_availability_status'], name='ai_agents_current_availability_status_idx'),
        ),
        migrations.AddIndex(
            model_name='aiagent',
            index=models.Index(fields=['is_verified', 'is_certified'], name='ai_agents_is_verified_is_certified_idx'),
        ),
        migrations.AddIndex(
            model_name='aiagent',
            index=models.Index(fields=['success_rate'], name='ai_agents_success_rate_idx'),
        ),
        migrations.AddIndex(
            model_name='aiagent',
            index=models.Index(fields=['last_activity'], name='ai_agents_last_activity_idx'),
        ),
        migrations.AddIndex(
            model_name='agentcapability',
            index=models.Index(fields=['agent', 'category'], name='agent_capabilities_agent_category_idx'),
        ),
        migrations.AddIndex(
            model_name='agentcapability',
            index=models.Index(fields=['skill_name', 'proficiency_level'], name='agent_capabilities_skill_name_proficiency_level_idx'),
        ),
        migrations.AddIndex(
            model_name='agentcapability',
            index=models.Index(fields=['is_verified'], name='agent_capabilities_is_verified_idx'),
        ),
        migrations.AddIndex(
            model_name='agentcapability',
            index=models.Index(fields=['confidence_score'], name='agent_capabilities_confidence_score_idx'),
        ),
        migrations.AddIndex(
            model_name='agentcapability',
            index=models.Index(fields=['success_rate'], name='agent_capabilities_success_rate_idx'),
        ),
        migrations.AddIndex(
            model_name='agentworkpreference',
            index=models.Index(fields=['agent'], name='agent_work_preferences_agent_idx'),
        ),
        migrations.AddIndex(
            model_name='agentworkpreference',
            index=models.Index(fields=['preferred_collaboration_mode'], name='agent_work_preferences_preferred_collaboration_mode_idx'),
        ),
        migrations.AddIndex(
            model_name='agentworkpreference',
            index=models.Index(fields=['min_complexity_level', 'max_complexity_level'], name='agent_work_preferences_min_complexity_level_max_complexity_level_idx'),
        ),
        migrations.AddIndex(
            model_name='agentperformancemetric',
            index=models.Index(fields=['agent', 'metric_type'], name='agent_performance_metrics_agent_metric_type_idx'),
        ),
        migrations.AddIndex(
            model_name='agentperformancemetric',
            index=models.Index(fields=['measurement_period_start', 'measurement_period_end'], name='agent_performance_metrics_measurement_period_start_measurement_period_end_idx'),
        ),
        migrations.AddIndex(
            model_name='agentperformancemetric',
            index=models.Index(fields=['project_context'], name='agent_performance_metrics_project_context_idx'),
        ),
        migrations.AddIndex(
            model_name='agentperformancemetric',
            index=models.Index(fields=['recorded_at'], name='agent_performance_metrics_recorded_at_idx'),
        ),
        migrations.AddIndex(
            model_name='agentauditlog',
            index=models.Index(fields=['agent', 'timestamp'], name='agent_audit_logs_agent_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='agentauditlog',
            index=models.Index(fields=['action_type', 'timestamp'], name='agent_audit_logs_action_type_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='agentauditlog',
            index=models.Index(fields=['project_context', 'timestamp'], name='agent_audit_logs_project_context_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='agentauditlog',
            index=models.Index(fields=['was_successful'], name='agent_audit_logs_was_successful_idx'),
        ),
        migrations.AddIndex(
            model_name='agentauditlog',
            index=models.Index(fields=['timestamp'], name='agent_audit_logs_timestamp_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='agentcapability',
            unique_together={('agent', 'category', 'skill_name')},
        ),
    ]