from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    
    # Project analysis endpoints
    path('analyze-project/', views.analyze_project, name='analyze_project'),
    path('create-project-with-analysis/', views.create_project_with_analysis, name='create_project_with_analysis'),
    path('project-analysis-status/<uuid:project_id>/', views.project_analysis_status, name='project_analysis_status'),
    
    # Other AI service endpoints
    path('match-freelancers/', views.match_freelancers, name='match_freelancers'),
    path('skill-assessment/', views.skill_assessment, name='skill_assessment'),
    path('learning-path/', views.learning_path, name='learning_path'),
    
    # Service health and testing
    path('health/', views.service_health, name='service_health'),
    path('test-analysis/', views.test_analysis, name='test_analysis'),
    
    # Skill profile update endpoints
    path('trigger-skill-update/', views.trigger_skill_update, name='trigger_skill_update'),
    path('trigger-batch-skill-update/', views.trigger_batch_skill_update, name='trigger_batch_skill_update'),
    path('skill-profile-status/', views.skill_profile_status, name='skill_profile_status'),
    
    # Skill validation endpoints
    path('validate-skills/', views.validate_skills, name='validate_skills'),
    path('skill-categories/', views.skill_categories, name='skill_categories'),
    
    # Resume parsing endpoints
    path('upload-resume/', views.upload_resume, name='upload_resume'),
    path('resume-status/', views.resume_status, name='resume_status'),
    path('resume-details/<uuid:resume_id>/', views.resume_details, name='resume_details'),
    path('combine-resume-github/', views.combine_resume_github, name='combine_resume_github'),
]