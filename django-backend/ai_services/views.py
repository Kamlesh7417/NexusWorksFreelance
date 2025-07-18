"""
API views for AI services including skill profile updates and analysis.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
import logging

from users.models import User, DeveloperProfile
from .tasks import update_developer_profile, update_all_developer_profiles
from .skill_validator import SkillValidator

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_skill_update(request):
    """
    Trigger skill profile update for the authenticated user or specified user.
    
    POST /api/ai-services/trigger-skill-update/
    {
        "user_id": "optional-user-id",
        "force_update": false
    }
    """
    try:
        # Get target user (default to authenticated user)
        user_id = request.data.get('user_id')
        force_update = request.data.get('force_update', False)
        
        if user_id:
            # Admin or user updating another profile
            if not request.user.is_staff and str(request.user.id) != user_id:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            target_user = get_object_or_404(User, id=user_id, role='developer')
        else:
            # User updating their own profile
            if request.user.role != 'developer':
                return Response(
                    {'error': 'Only developers can update skill profiles'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            target_user = request.user
        
        # Check if user has developer profile
        if not hasattr(target_user, 'developer_profile'):
            return Response(
                {'error': 'Developer profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if GitHub username is configured
        if not target_user.github_username:
            return Response(
                {'error': 'GitHub username not configured'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check rate limiting (prevent too frequent updates)
        if not force_update:
            profile = target_user.developer_profile
            last_update = profile.github_analysis.get('analyzed_at')
            if last_update:
                try:
                    from datetime import datetime
                    last_update_dt = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
                    if timezone.now() - last_update_dt < timedelta(hours=1):
                        return Response({
                            'error': 'Profile updated recently. Use force_update=true to override.',
                            'last_updated': last_update
                        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
                except (ValueError, TypeError):
                    pass
        
        # Queue the update task
        task = update_developer_profile.delay(str(target_user.id), force_update)
        
        logger.info(f"Skill update task queued for user {target_user.id} (task: {task.id})")
        
        return Response({
            'success': True,
            'message': 'Skill profile update queued successfully',
            'task_id': task.id,
            'user_id': str(target_user.id),
            'github_username': target_user.github_username,
            'force_update': force_update,
            'queued_at': timezone.now().isoformat()
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        logger.error(f"Error triggering skill update: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_batch_skill_update(request):
    """
    Trigger batch skill profile update for all developers (admin only).
    
    POST /api/ai-services/trigger-batch-skill-update/
    {
        "batch_size": 10,
        "force_update": false
    }
    """
    try:
        # Check admin permissions
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin permissions required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        batch_size = request.data.get('batch_size', 10)
        force_update = request.data.get('force_update', False)
        
        # Validate batch size
        if not isinstance(batch_size, int) or batch_size < 1 or batch_size > 50:
            return Response(
                {'error': 'Batch size must be between 1 and 50'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Queue the batch update task
        task = update_all_developer_profiles.delay(batch_size, force_update)
        
        logger.info(f"Batch skill update task queued by admin {request.user.id} (task: {task.id})")
        
        return Response({
            'success': True,
            'message': 'Batch skill profile update queued successfully',
            'task_id': task.id,
            'batch_size': batch_size,
            'force_update': force_update,
            'queued_at': timezone.now().isoformat()
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        logger.error(f"Error triggering batch skill update: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def skill_profile_status(request):
    """
    Get skill profile status for the authenticated user.
    
    GET /api/ai-services/skill-profile-status/
    """
    try:
        if request.user.role != 'developer':
            return Response(
                {'error': 'Only developers have skill profiles'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not hasattr(request.user, 'developer_profile'):
            return Response(
                {'error': 'Developer profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        profile = request.user.developer_profile
        github_analysis = profile.github_analysis or {}
        
        # Calculate status information
        last_update = github_analysis.get('analyzed_at')
        skills_count = len(profile.skills or [])
        embeddings_count = len(profile.skill_embeddings or [])
        
        # Determine update status
        update_needed = False
        update_reason = None
        
        if not last_update:
            update_needed = True
            update_reason = 'Never updated'
        elif last_update:
            try:
                from datetime import datetime
                last_update_dt = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
                hours_since_update = (timezone.now() - last_update_dt).total_seconds() / 3600
                
                if hours_since_update > 24:
                    update_needed = True
                    update_reason = f'Last updated {hours_since_update:.1f} hours ago'
            except (ValueError, TypeError):
                update_needed = True
                update_reason = 'Invalid last update timestamp'
        
        return Response({
            'user_id': str(request.user.id),
            'github_username': request.user.github_username,
            'skills_count': skills_count,
            'embeddings_count': embeddings_count,
            'reputation_score': profile.reputation_score,
            'last_updated': last_update,
            'update_needed': update_needed,
            'update_reason': update_reason,
            'github_analysis_available': bool(github_analysis),
            'profile_completeness': {
                'has_github_username': bool(request.user.github_username),
                'has_skills': skills_count > 0,
                'has_embeddings': embeddings_count > 0,
                'has_github_analysis': bool(github_analysis)
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting skill profile status: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_skills(request):
    """
    Validate a list of skills and get confidence scores.
    
    POST /api/ai-services/validate-skills/
    {
        "skills": ["Python", "JavaScript", "React"],
        "github_analysis": {} // optional
    }
    """
    try:
        skills = request.data.get('skills', [])
        github_analysis = request.data.get('github_analysis', {})
        
        if not isinstance(skills, list) or not skills:
            return Response(
                {'error': 'Skills list is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(skills) > 50:
            return Response(
                {'error': 'Maximum 50 skills allowed per request'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate skills
        validator = SkillValidator()
        validation_result = validator.validate_skills(skills, github_analysis)
        
        return Response({
            'success': True,
            'validation_result': validation_result,
            'processed_at': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error validating skills: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def skill_categories(request):
    """
    Get available skill categories and popular skills.
    
    GET /api/ai-services/skill-categories/
    """
    try:
        validator = SkillValidator()
        
        return Response({
            'skill_categories': validator.skill_categories,
            'known_skills_count': len(validator.known_skills),
            'market_trends_available': len(validator.market_trends),
            'popular_skills': {
                'programming_languages': [
                    'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust'
                ],
                'web_frameworks': [
                    'React', 'Vue.js', 'Angular', 'Django', 'Express.js', 'Next.js'
                ],
                'databases': [
                    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch'
                ],
                'cloud_devops': [
                    'AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins'
                ]
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting skill categories: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Placeholder views for existing URL patterns
# These will be implemented in other tasks

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_project(request):
    """
    Analyze a project description using AI and generate task breakdown.
    
    POST /api/ai-services/analyze-project/
    {
        "title": "Project Title",
        "description": "Detailed project description",
        "project_id": "optional-existing-project-id"
    }
    """
    try:
        from .project_analysis import ProjectAnalysisEngine
        from projects.models import Project
        
        # Validate input
        title = request.data.get('title', '').strip()
        description = request.data.get('description', '').strip()
        project_id = request.data.get('project_id')
        
        if not description:
            return Response(
                {'error': 'Project description is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(description) < 50:
            return Response(
                {'error': 'Project description must be at least 50 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(description) > 10000:
            return Response(
                {'error': 'Project description must be less than 10,000 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if updating existing project or creating new analysis
        project = None
        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                # Check permissions
                if project.client != request.user and not request.user.is_staff:
                    return Response(
                        {'error': 'Permission denied'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Project.DoesNotExist:
                return Response(
                    {'error': 'Project not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Initialize analysis engine
        analysis_engine = ProjectAnalysisEngine()
        
        logger.info(f"Starting project analysis for user {request.user.id}")
        
        # Perform AI analysis
        analysis_result = analysis_engine.analyze_project(description, title)
        
        # If project exists, update it with analysis
        if project:
            analysis_engine.update_project_with_analysis(project, analysis_result)
            project.refresh_from_db()
            
            response_data = {
                'success': True,
                'message': 'Project analysis completed and updated',
                'project_id': str(project.id),
                'project_updated': True
            }
        else:
            # Return analysis without creating project
            response_data = {
                'success': True,
                'message': 'Project analysis completed',
                'project_updated': False
            }
        
        # Add analysis results to response
        response_data.update({
            'analysis': {
                'task_breakdown': analysis_result.task_breakdown,
                'budget_estimate': analysis_result.budget_estimate,
                'timeline_estimate_days': analysis_result.timeline_estimate_days,
                'required_skills': analysis_result.required_skills,
                'experience_level': analysis_result.experience_level,
                'needs_senior_developer': analysis_result.needs_senior_developer,
                'complexity_score': analysis_result.complexity_score,
                'risk_factors': analysis_result.risk_factors,
                'recommendations': analysis_result.recommendations
            },
            'analyzed_at': timezone.now().isoformat()
        })
        
        logger.info(f"Project analysis completed successfully for user {request.user.id}")
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in project analysis: {str(e)}")
        return Response(
            {'error': 'Internal server error during analysis'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_freelancers(request):
    """Placeholder for freelancer matching endpoint."""
    return Response({
        'message': 'Freelancer matching endpoint - to be implemented in task 10',
        'status': 'placeholder'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def skill_assessment(request):
    """Placeholder for skill assessment endpoint."""
    return Response({
        'message': 'Skill assessment endpoint - to be implemented in task 9',
        'status': 'placeholder'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def learning_path(request):
    """Placeholder for learning path endpoint."""
    return Response({
        'message': 'Learning path endpoint - to be implemented in task 19',
        'status': 'placeholder'
    })


@api_view(['GET'])
def service_health(request):
    """Health check endpoint for AI services."""
    return Response({
        'status': 'healthy',
        'service': 'ai_services',
        'timestamp': timezone.now().isoformat(),
        'features': {
            'skill_validation': True,
            'github_analysis': True,
            'background_tasks': True,
            'confidence_scoring': True
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_project_with_analysis(request):
    """
    Create a new project and analyze it with AI.
    
    POST /api/ai-services/create-project-with-analysis/
    {
        "title": "Project Title",
        "description": "Detailed project description"
    }
    """
    try:
        from .project_analysis import ProjectAnalysisEngine
        from projects.models import Project
        
        # Validate input
        title = request.data.get('title', '').strip()
        description = request.data.get('description', '').strip()
        
        if not title:
            return Response(
                {'error': 'Project title is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not description:
            return Response(
                {'error': 'Project description is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(description) < 50:
            return Response(
                {'error': 'Project description must be at least 50 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(description) > 10000:
            return Response(
                {'error': 'Project description must be less than 10,000 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only clients can create projects
        if request.user.role != 'client':
            return Response(
                {'error': 'Only clients can create projects'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create project
        project = Project.objects.create(
            client=request.user,
            title=title,
            description=description,
            status='analyzing'
        )
        
        logger.info(f"Created project {project.id} for client {request.user.id}")
        
        # Initialize analysis engine and analyze
        analysis_engine = ProjectAnalysisEngine()
        analysis_result = analysis_engine.analyze_project(description, title)
        
        # Update project with analysis
        analysis_engine.update_project_with_analysis(project, analysis_result)
        project.refresh_from_db()
        
        logger.info(f"Project {project.id} analysis completed")
        
        return Response({
            'success': True,
            'message': 'Project created and analyzed successfully',
            'project': {
                'id': str(project.id),
                'title': project.title,
                'status': project.status,
                'budget_estimate': float(project.budget_estimate) if project.budget_estimate else None,
                'timeline_estimate_days': project.timeline_estimate.days if project.timeline_estimate else None,
                'required_skills': project.required_skills,
                'experience_level_required': project.experience_level_required,
                'needs_senior_developer': analysis_result.needs_senior_developer,
                'task_count': project.tasks.count(),
                'created_at': project.created_at.isoformat()
            },
            'analysis': {
                'complexity_score': analysis_result.complexity_score,
                'risk_factors': analysis_result.risk_factors,
                'recommendations': analysis_result.recommendations
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating project with analysis: {str(e)}")
        return Response(
            {'error': 'Internal server error during project creation'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def project_analysis_status(request, project_id):
    """
    Get analysis status for a specific project.
    
    GET /api/ai-services/project-analysis-status/{project_id}/
    """
    try:
        from projects.models import Project
        
        # Get project
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if project.client != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get analysis data
        ai_analysis = project.ai_analysis or {}
        tasks = project.tasks.all()
        
        return Response({
            'project_id': str(project.id),
            'title': project.title,
            'status': project.status,
            'analysis_available': bool(ai_analysis),
            'analysis_timestamp': ai_analysis.get('analysis_timestamp'),
            'complexity_score': ai_analysis.get('complexity_score'),
            'needs_senior_developer': ai_analysis.get('needs_senior_developer', False),
            'budget_estimate': float(project.budget_estimate) if project.budget_estimate else None,
            'timeline_estimate_days': project.timeline_estimate.days if project.timeline_estimate else None,
            'required_skills': project.required_skills,
            'experience_level_required': project.experience_level_required,
            'task_breakdown': {
                'total_tasks': tasks.count(),
                'tasks': [
                    {
                        'id': str(task.id),
                        'title': task.title,
                        'estimated_hours': task.estimated_hours,
                        'required_skills': task.required_skills,
                        'priority': task.priority,
                        'status': task.status
                    }
                    for task in tasks.order_by('priority')
                ]
            },
            'risk_factors': ai_analysis.get('risk_factors', []),
            'recommendations': ai_analysis.get('recommendations', [])
        })
        
    except Exception as e:
        logger.error(f"Error getting project analysis status: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    """
    Upload and parse a resume document.
    
    POST /api/ai-services/upload-resume/
    Form data:
    - resume_file: File upload (PDF, DOCX, DOC, TXT)
    - replace_existing: boolean (optional, default: true)
    """
    try:
        from .resume_parser import ResumeParser, ResumeParsingError
        from .models import ResumeDocument
        
        # Check if user is a developer
        if request.user.role != 'developer':
            return Response(
                {'error': 'Only developers can upload resumes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get uploaded file
        if 'resume_file' not in request.FILES:
            return Response(
                {'error': 'No resume file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['resume_file']
        replace_existing = request.data.get('replace_existing', 'true').lower() == 'true'
        
        # Initialize parser
        parser = ResumeParser()
        
        logger.info(f"Starting resume upload for user {request.user.id}")
        
        # Parse resume
        start_time = timezone.now()
        try:
            parsed_data = parser.parse_resume(uploaded_file, str(request.user.id))
        except ResumeParsingError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        processing_time = (timezone.now() - start_time).total_seconds()
        
        # Deactivate existing resumes if replacing
        if replace_existing:
            ResumeDocument.objects.filter(
                user=request.user, 
                is_active=True
            ).update(is_active=False)
        
        # Create resume document record
        resume_doc = ResumeDocument.objects.create(
            user=request.user,
            original_filename=uploaded_file.name,
            file_path=uploaded_file,
            file_size=uploaded_file.size,
            file_type=parsed_data['metadata']['file_name'].split('.')[-1].lower(),
            parsing_status='completed',
            raw_text=parsed_data.get('raw_text', ''),
            parsed_data=parsed_data,
            extracted_skills=parsed_data.get('skills', []),
            skill_confidence_scores=parsed_data.get('skill_validation', {}).get('confidence_scores', {}),
            experience_analysis=parsed_data.get('experience', []),
            education_analysis=parsed_data.get('education', []),
            is_active=True,
            processing_time_seconds=processing_time,
            parsed_at=timezone.now()
        )
        
        # Update developer profile with resume data
        if hasattr(request.user, 'developer_profile'):
            profile = request.user.developer_profile
            
            # Update skills from resume
            resume_skills = [skill['skill'] for skill in parsed_data.get('validated_skills', [])]
            if resume_skills:
                # Merge with existing skills
                existing_skills = set(profile.skills or [])
                new_skills = set(resume_skills)
                combined_skills = list(existing_skills.union(new_skills))
                profile.skills = combined_skills
            
            # Update experience level
            if parsed_data.get('experience_level'):
                profile.experience_level = parsed_data['experience_level']
            
            # Update other profile fields
            if parsed_data.get('personal_info', {}).get('location'):
                profile.location = parsed_data['personal_info']['location']
            
            if parsed_data.get('summary'):
                profile.bio = parsed_data['summary']
            
            profile.save()
        
        logger.info(f"Resume upload completed for user {request.user.id} in {processing_time:.2f}s")
        
        return Response({
            'success': True,
            'message': 'Resume uploaded and parsed successfully',
            'resume': {
                'id': str(resume_doc.id),
                'filename': resume_doc.original_filename,
                'file_size': resume_doc.file_size,
                'processing_time_seconds': processing_time,
                'skills_extracted': len(parsed_data.get('skills', [])),
                'validated_skills': len(parsed_data.get('validated_skills', [])),
                'experience_level': parsed_data.get('experience_level'),
                'total_experience_years': parsed_data.get('total_experience_years', 0)
            },
            'parsing_results': {
                'skills': parsed_data.get('validated_skills', []),
                'experience_summary': {
                    'level': parsed_data.get('experience_level'),
                    'years': parsed_data.get('total_experience_years', 0),
                    'positions_count': len(parsed_data.get('experience', []))
                },
                'education_summary': {
                    'degrees_count': len(parsed_data.get('education', [])),
                    'highest_degree': parsed_data.get('education', [{}])[0].get('degree', '') if parsed_data.get('education') else ''
                }
            },
            'uploaded_at': resume_doc.created_at.isoformat()
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error uploading resume for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Internal server error during resume upload'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resume_status(request):
    """
    Get resume upload and parsing status for the authenticated user.
    
    GET /api/ai-services/resume-status/
    """
    try:
        from .models import ResumeDocument
        
        if request.user.role != 'developer':
            return Response(
                {'error': 'Only developers have resume data'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user's resumes
        resumes = ResumeDocument.objects.filter(user=request.user).order_by('-created_at')
        active_resume = resumes.filter(is_active=True).first()
        
        response_data = {
            'user_id': str(request.user.id),
            'has_resume': resumes.exists(),
            'total_resumes': resumes.count(),
            'active_resume': None,
            'resume_history': []
        }
        
        if active_resume:
            response_data['active_resume'] = {
                'id': str(active_resume.id),
                'filename': active_resume.original_filename,
                'file_size': active_resume.file_size,
                'file_type': active_resume.file_type,
                'parsing_status': active_resume.parsing_status,
                'skills_extracted': len(active_resume.extracted_skills),
                'uploaded_at': active_resume.created_at.isoformat(),
                'parsed_at': active_resume.parsed_at.isoformat() if active_resume.parsed_at else None,
                'processing_time_seconds': active_resume.processing_time_seconds
            }
            
            if active_resume.parsing_status == 'failed':
                response_data['active_resume']['error'] = active_resume.parsing_error
        
        # Add resume history
        for resume in resumes[:5]:  # Last 5 resumes
            response_data['resume_history'].append({
                'id': str(resume.id),
                'filename': resume.original_filename,
                'file_type': resume.file_type,
                'parsing_status': resume.parsing_status,
                'is_active': resume.is_active,
                'uploaded_at': resume.created_at.isoformat()
            })
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error getting resume status for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resume_details(request, resume_id):
    """
    Get detailed information about a specific resume.
    
    GET /api/ai-services/resume-details/{resume_id}/
    """
    try:
        from .models import ResumeDocument
        
        # Get resume
        try:
            resume = ResumeDocument.objects.get(id=resume_id, user=request.user)
        except ResumeDocument.DoesNotExist:
            return Response(
                {'error': 'Resume not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prepare detailed response
        response_data = {
            'id': str(resume.id),
            'filename': resume.original_filename,
            'file_size': resume.file_size,
            'file_type': resume.file_type,
            'parsing_status': resume.parsing_status,
            'is_active': resume.is_active,
            'uploaded_at': resume.created_at.isoformat(),
            'parsed_at': resume.parsed_at.isoformat() if resume.parsed_at else None,
            'processing_time_seconds': resume.processing_time_seconds
        }
        
        if resume.parsing_status == 'failed':
            response_data['error'] = resume.parsing_error
        elif resume.parsing_status == 'completed':
            parsed_data = resume.parsed_data or {}
            
            response_data['parsing_results'] = {
                'personal_info': parsed_data.get('personal_info', {}),
                'summary': parsed_data.get('summary', ''),
                'skills': {
                    'extracted': resume.extracted_skills,
                    'validated': parsed_data.get('validated_skills', []),
                    'confidence_scores': resume.skill_confidence_scores
                },
                'experience': {
                    'level': parsed_data.get('experience_level'),
                    'total_years': parsed_data.get('total_experience_years', 0),
                    'positions': resume.experience_analysis
                },
                'education': resume.education_analysis,
                'projects': parsed_data.get('projects', []),
                'certifications': parsed_data.get('certifications', [])
            }
            
            # Add metadata
            response_data['metadata'] = parsed_data.get('metadata', {})
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error getting resume details: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def combine_resume_github(request):
    """
    Combine resume data with GitHub analysis for comprehensive profile.
    
    POST /api/ai-services/combine-resume-github/
    {
        "resume_id": "optional-resume-id",
        "force_update": false
    }
    """
    try:
        from .resume_parser import ResumeParser
        from .models import ResumeDocument, ProfileAnalysisCombined
        
        if request.user.role != 'developer':
            return Response(
                {'error': 'Only developers can combine profile data'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        resume_id = request.data.get('resume_id')
        force_update = request.data.get('force_update', False)
        
        # Get resume (active resume if not specified)
        if resume_id:
            try:
                resume = ResumeDocument.objects.get(id=resume_id, user=request.user)
            except ResumeDocument.DoesNotExist:
                return Response(
                    {'error': 'Resume not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            resume = ResumeDocument.objects.filter(
                user=request.user, 
                is_active=True, 
                parsing_status='completed'
            ).first()
            
            if not resume:
                return Response(
                    {'error': 'No active parsed resume found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get GitHub analysis data
        github_analysis = {}
        if hasattr(request.user, 'developer_profile'):
            github_analysis = request.user.developer_profile.github_analysis or {}
        
        if not github_analysis and not force_update:
            return Response(
                {'error': 'No GitHub analysis data available. Run GitHub analysis first or use force_update=true'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Combine analyses
        parser = ResumeParser()
        combined_data = parser.combine_with_github_analysis(
            resume.parsed_data, 
            github_analysis
        )
        
        # Create or update combined profile analysis
        combined_analysis, created = ProfileAnalysisCombined.objects.get_or_create(
            user=request.user,
            defaults={
                'resume_document': resume,
                'github_analysis_data': github_analysis,
                'final_skills': combined_data['combined_analysis']['skills'],
                'experience_level': combined_data['combined_analysis']['experience_level']['final_level'],
                'total_experience_years': combined_data['combined_analysis']['experience_years']['estimated_years'],
                'overall_confidence_score': combined_data['combined_analysis']['overall_confidence'],
                'resume_confidence': 0.8,  # High confidence for parsed resume
                'github_confidence': 0.7 if github_analysis else 0.0,
                'consistency_score': combined_data['combined_analysis']['experience_level']['confidence_score'],
                'sources_used': ['resume'] + (['github'] if github_analysis else [])
            }
        )
        
        if not created:
            # Update existing analysis
            combined_analysis.resume_document = resume
            combined_analysis.github_analysis_data = github_analysis
            combined_analysis.final_skills = combined_data['combined_analysis']['skills']
            combined_analysis.experience_level = combined_data['combined_analysis']['experience_level']['final_level']
            combined_analysis.total_experience_years = combined_data['combined_analysis']['experience_years']['estimated_years']
            combined_analysis.overall_confidence_score = combined_data['combined_analysis']['overall_confidence']
            combined_analysis.resume_confidence = 0.8
            combined_analysis.github_confidence = 0.7 if github_analysis else 0.0
            combined_analysis.consistency_score = combined_data['combined_analysis']['experience_level']['confidence_score']
            combined_analysis.sources_used = ['resume'] + (['github'] if github_analysis else [])
            combined_analysis.save()
        
        # Update developer profile with combined data
        if hasattr(request.user, 'developer_profile'):
            profile = request.user.developer_profile
            
            # Update skills with confidence scores
            high_confidence_skills = [
                skill for skill, data in combined_data['combined_analysis']['skills'].items()
                if data['confidence_score'] >= 0.7
            ]
            profile.skills = high_confidence_skills
            profile.experience_level = combined_analysis.experience_level
            profile.save()
        
        logger.info(f"Combined profile analysis {'created' if created else 'updated'} for user {request.user.id}")
        
        return Response({
            'success': True,
            'message': f'Profile analysis {"created" if created else "updated"} successfully',
            'analysis': {
                'id': str(combined_analysis.id),
                'overall_confidence_score': combined_analysis.overall_confidence_score,
                'experience_level': combined_analysis.experience_level,
                'total_experience_years': combined_analysis.total_experience_years,
                'sources_used': combined_analysis.sources_used,
                'skills_summary': {
                    'total_skills': len(combined_data['combined_analysis']['skills']),
                    'high_confidence_skills': len([
                        s for s, d in combined_data['combined_analysis']['skills'].items()
                        if d['confidence_score'] >= 0.8
                    ]),
                    'resume_only_skills': len([
                        s for s, d in combined_data['combined_analysis']['skills'].items()
                        if 'resume' in d['sources'] and 'github' not in d['sources']
                    ]),
                    'github_only_skills': len([
                        s for s, d in combined_data['combined_analysis']['skills'].items()
                        if 'github' in d['sources'] and 'resume' not in d['sources']
                    ]),
                    'validated_by_both': len([
                        s for s, d in combined_data['combined_analysis']['skills'].items()
                        if len(d['sources']) > 1
                    ])
                }
            },
            'updated_at': combined_analysis.updated_at.isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error combining resume and GitHub analysis: {str(e)}")
        return Response(
            {'error': 'Internal server error during profile combination'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def test_analysis(request):
    """Test endpoint for AI analysis functionality."""
    try:
        from .project_analysis import ProjectAnalysisEngine
        
        # Test the analysis engine
        analysis_engine = ProjectAnalysisEngine()
        test_result = analysis_engine.test_service()
        
        return Response({
            'message': 'AI analysis test endpoint',
            'test_result': test_result,
            'services': {
                'skill_validator': 'operational',
                'github_client': 'operational',
                'embedding_service': 'operational',
                'project_analysis': test_result['status'],
                'resume_parser': 'operational'
            },
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error testing analysis service: {str(e)}")
        return Response({
            'message': 'AI analysis test endpoint',
            'test_result': {
                'status': 'error',
                'error': str(e)
            },
            'services': {
                'skill_validator': 'operational',
                'github_client': 'operational',
                'embedding_service': 'operational',
                'project_analysis': 'error',
                'resume_parser': 'operational'
            },
            'timestamp': timezone.now().isoformat()
        })