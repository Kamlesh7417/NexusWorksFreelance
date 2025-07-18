# Generated by Django 5.2.4 on 2025-07-18 03:47

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_services', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ResumeDocument',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('original_filename', models.CharField(max_length=255)),
                ('file_path', models.FileField(max_length=500, upload_to='resumes/%Y/%m/')),
                ('file_size', models.PositiveIntegerField(help_text='File size in bytes')),
                ('file_type', models.CharField(choices=[('pdf', 'PDF'), ('docx', 'DOCX'), ('doc', 'DOC'), ('txt', 'TXT')], max_length=10)),
                ('parsing_status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('parsing_error', models.TextField(blank=True, help_text='Error message if parsing failed')),
                ('raw_text', models.TextField(blank=True, help_text='Extracted raw text content')),
                ('parsed_data', models.JSONField(default=dict, help_text='Structured parsed data from AI')),
                ('extracted_skills', models.JSONField(default=list, help_text='List of extracted skills')),
                ('skill_confidence_scores', models.JSONField(default=dict, help_text='Confidence scores for skills')),
                ('experience_analysis', models.JSONField(default=dict, help_text='Work experience analysis')),
                ('education_analysis', models.JSONField(default=dict, help_text='Education analysis')),
                ('is_active', models.BooleanField(default=True, help_text='Whether this is the active resume')),
                ('processing_time_seconds', models.FloatField(help_text='Time taken to process', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parsed_at', models.DateTimeField(help_text='When parsing was completed', null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='resume_documents', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'ai_resume_documents',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ProfileAnalysisCombined',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('github_analysis_data', models.JSONField(default=dict, help_text='GitHub analysis results')),
                ('final_skills', models.JSONField(default=dict, help_text='Final skill list with confidence scores')),
                ('experience_level', models.CharField(choices=[('junior', 'Junior'), ('mid', 'Mid-level'), ('senior', 'Senior'), ('lead', 'Lead')], max_length=20)),
                ('total_experience_years', models.FloatField(default=0.0)),
                ('overall_confidence_score', models.FloatField(help_text='Overall profile confidence (0.0 to 1.0)')),
                ('resume_confidence', models.FloatField(default=0.0)),
                ('github_confidence', models.FloatField(default=0.0)),
                ('consistency_score', models.FloatField(default=0.0, help_text='Consistency between sources')),
                ('analysis_version', models.CharField(default='1.0', max_length=20)),
                ('sources_used', models.JSONField(default=list, help_text='List of data sources used')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='combined_profile_analysis', to=settings.AUTH_USER_MODEL)),
                ('resume_document', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='ai_services.resumedocument')),
            ],
            options={
                'db_table': 'ai_profile_analysis_combined',
            },
        ),
        migrations.CreateModel(
            name='ResumeSkillExtraction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('confidence_score', models.FloatField(help_text='AI confidence in skill extraction (0.0 to 1.0)')),
                ('extraction_method', models.CharField(choices=[('direct_mention', 'Direct Mention'), ('context_inference', 'Context Inference'), ('experience_analysis', 'Experience Analysis'), ('project_analysis', 'Project Analysis')], max_length=50)),
                ('text_evidence', models.JSONField(default=list, help_text='Text snippets supporting this skill')),
                ('context_sections', models.JSONField(default=list, help_text='Resume sections where skill was found')),
                ('is_validated', models.BooleanField(default=False)),
                ('validation_source', models.CharField(blank=True, choices=[('github', 'GitHub Analysis'), ('manual', 'Manual Validation'), ('project_history', 'Project History')], max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('resume', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='skill_extractions', to='ai_services.resumedocument')),
                ('skill', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ai_services.skillnode')),
            ],
            options={
                'db_table': 'ai_resume_skill_extractions',
            },
        ),
        migrations.AddIndex(
            model_name='resumedocument',
            index=models.Index(fields=['user', 'is_active'], name='ai_resume_d_user_id_a4b953_idx'),
        ),
        migrations.AddIndex(
            model_name='resumedocument',
            index=models.Index(fields=['parsing_status'], name='ai_resume_d_parsing_1c60fd_idx'),
        ),
        migrations.AddIndex(
            model_name='resumedocument',
            index=models.Index(fields=['created_at'], name='ai_resume_d_created_bc9db7_idx'),
        ),
        migrations.AddIndex(
            model_name='profileanalysiscombined',
            index=models.Index(fields=['user'], name='ai_profile__user_id_fb47c4_idx'),
        ),
        migrations.AddIndex(
            model_name='profileanalysiscombined',
            index=models.Index(fields=['overall_confidence_score'], name='ai_profile__overall_41bff4_idx'),
        ),
        migrations.AddIndex(
            model_name='profileanalysiscombined',
            index=models.Index(fields=['experience_level'], name='ai_profile__experie_32762e_idx'),
        ),
        migrations.AddIndex(
            model_name='profileanalysiscombined',
            index=models.Index(fields=['updated_at'], name='ai_profile__updated_bb4e40_idx'),
        ),
        migrations.AddIndex(
            model_name='resumeskillextraction',
            index=models.Index(fields=['resume', 'confidence_score'], name='ai_resume_s_resume__e251d3_idx'),
        ),
        migrations.AddIndex(
            model_name='resumeskillextraction',
            index=models.Index(fields=['skill', 'confidence_score'], name='ai_resume_s_skill_i_2420da_idx'),
        ),
        migrations.AddIndex(
            model_name='resumeskillextraction',
            index=models.Index(fields=['is_validated'], name='ai_resume_s_is_vali_1c8857_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='resumeskillextraction',
            unique_together={('resume', 'skill')},
        ),
    ]
