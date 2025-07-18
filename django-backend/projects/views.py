from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from .models import (
    Project, Task, ProjectReview, ProjectProposal, 
    ProposalModification, SeniorDeveloperAssignment,
    TeamInvitation, TaskAssignment, DynamicPricing, ResourceAllocation
)
from payments.models import Milestone, Payment
from .serializers import (
    ProjectSerializer, TaskSerializer, 
    MilestoneSerializer, PaymentSerializer, ProjectReviewSerializer,
    ProjectProposalSerializer, ProposalModificationSerializer,
    SeniorDeveloperAssignmentSerializer, ProposalModifyRequestSerializer,
    ProposalApprovalSerializer, TeamInvitationSerializer, TaskAssignmentSerializer,
    DynamicPricingSerializer, ResourceAllocationSerializer, InvitationResponseSerializer,
    TeamHiringRequestSerializer, TaskApprovalRequestSerializer, TaskApprovalStatusSerializer
)

User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for managing projects"""
    
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter projects based on user role"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return projects where user is client or senior developer
        return self.queryset.filter(
            models.Q(client=user) | models.Q(senior_developer=user)
        )
    
    def perform_create(self, serializer):
        """Create a new project with current user as client"""
        serializer.save(client=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for managing AI-generated tasks"""
    
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter tasks based on user role"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return tasks where user is assigned developer, project client, or senior developer
        return self.queryset.filter(
            models.Q(assigned_developer=user) | 
            models.Q(project__client=user) | 
            models.Q(project__senior_developer=user)
        )
    
    @action(detail=True, methods=['post'], url_path='approval-workflow')
    def approval_workflow(self, request, pk=None):
        """Handle task approval workflow actions"""
        task = self.get_object()
        user = request.user
        
        serializer = TaskApprovalRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            if action == 'submit_qa':
                # Developer submits task for QA review
                if task.assigned_developer != user:
                    return Response(
                        {'error': 'Only assigned developer can submit task for QA'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                result = TaskApprovalService.submit_task_for_qa(task, user, notes)
                
            elif action == 'qa_approve':
                # QA reviewer approves task
                result = TaskApprovalService.qa_approve_task(task, user, notes)
                
            elif action == 'qa_reject':
                # QA reviewer rejects task
                result = TaskApprovalService.qa_reject_task(task, user, notes)
                
            elif action == 'client_approve':
                # Client gives final approval
                if task.project.client != user:
                    return Response(
                        {'error': 'Only project client can give final approval'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                result = TaskApprovalService.client_approve_task(task, user, notes)
                
            elif action == 'client_reject':
                # Client rejects task
                if task.project.client != user:
                    return Response(
                        {'error': 'Only project client can reject task'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                result = TaskApprovalService.client_reject_task(task, user, notes)
                
            else:
                return Response(
                    {'error': f'Invalid action: {action}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'message': result['message'],
                'task': TaskSerializer(task).data,
                **{k: v for k, v in result.items() if k != 'message'}
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='approval-status')
    def get_approval_status(self, request, pk=None):
        """Get comprehensive approval status for a task"""
        task = self.get_object()
        
        try:
            status_data = TaskApprovalService.get_task_approval_status(task)
            return Response(status_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error getting approval status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for managing 25% payment milestones"""
    
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter milestones based on user access to projects"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return milestones for projects user has access to
        return self.queryset.filter(
            models.Q(project__client=user) | models.Q(project__senior_developer=user)
        )


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing milestone-based payments"""
    
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments based on user involvement"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return payments where user is the developer receiving payment or project client
        return self.queryset.filter(
            models.Q(developer=user) | models.Q(milestone__project__client=user)
        )


class ProjectReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project reviews"""
    
    queryset = ProjectReview.objects.all()
    serializer_class = ProjectReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter reviews based on user involvement"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return reviews where user is reviewer or reviewee
        return self.queryset.filter(
            models.Q(reviewer=user) | models.Q(reviewee=user)
        )
    
    def perform_create(self, serializer):
        """Create a new review with current user as reviewer"""
        serializer.save(reviewer=self.request.user)

from .senior_developer_service import SeniorDeveloperService
from .proposal_service import ProposalService
from .team_hiring_service import TeamHiringService
from .task_approval_service import TaskApprovalService


class ProjectProposalViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project proposals"""
    
    queryset = ProjectProposal.objects.all()
    serializer_class = ProjectProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter proposals based on user access"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return proposals for projects user has access to
        return self.queryset.filter(
            models.Q(project__client=user) | models.Q(project__senior_developer=user)
        )
    
    @action(detail=True, methods=['post'], url_path='modify')
    def modify_proposal(self, request, pk=None):
        """Modify a proposal (senior developer only)"""
        proposal = self.get_object()
        user = request.user
        
        # Check if user is the assigned senior developer
        if user != proposal.project.senior_developer:
            return Response(
                {'error': 'Only assigned senior developer can modify proposal'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ProposalModifyRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                modifications = {}
                for field in ['current_budget', 'current_timeline', 'current_task_breakdown', 'current_sla_terms']:
                    if field in serializer.validated_data:
                        modifications[field] = serializer.validated_data[field]
                
                modification_records = ProposalService.modify_proposal(
                    proposal=proposal,
                    modifications=modifications,
                    modified_by=user,
                    justification=serializer.validated_data['justification']
                )
                
                return Response({
                    'message': 'Proposal modified successfully',
                    'modifications_count': len(modification_records),
                    'proposal': ProjectProposalSerializer(proposal).data
                }, status=status.HTTP_200_OK)
                
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='senior-approve')
    def senior_approve(self, request, pk=None):
        """Senior developer approves proposal"""
        proposal = self.get_object()
        user = request.user
        
        # Check if user is the assigned senior developer
        if user != proposal.project.senior_developer:
            return Response(
                {'error': 'Only assigned senior developer can approve proposal'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ProposalApprovalSerializer(data=request.data)
        if serializer.is_valid():
            try:
                if serializer.validated_data['approved']:
                    success = ProposalService.senior_developer_approve(proposal, user)
                    if success:
                        return Response({
                            'message': 'Proposal approved by senior developer',
                            'proposal': ProjectProposalSerializer(proposal).data
                        }, status=status.HTTP_200_OK)
                else:
                    # Handle rejection logic if needed
                    return Response(
                        {'message': 'Proposal approval declined'},
                        status=status.HTTP_200_OK
                    )
                    
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='client-approve')
    def client_approve(self, request, pk=None):
        """Client approves proposal"""
        proposal = self.get_object()
        user = request.user
        
        # Check if user is the project client
        if user != proposal.project.client:
            return Response(
                {'error': 'Only project client can approve proposal'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ProposalApprovalSerializer(data=request.data)
        if serializer.is_valid():
            try:
                if serializer.validated_data['approved']:
                    success = ProposalService.client_approve(proposal, user)
                    if success:
                        return Response({
                            'message': 'Proposal approved by client and locked',
                            'proposal': ProjectProposalSerializer(proposal).data
                        }, status=status.HTTP_200_OK)
                else:
                    # Handle rejection
                    reason = serializer.validated_data.get('comments', 'No reason provided')
                    success = ProposalService.reject_proposal(proposal, user, reason)
                    if success:
                        return Response({
                            'message': 'Proposal rejected by client',
                            'proposal': ProjectProposalSerializer(proposal).data
                        }, status=status.HTTP_200_OK)
                    
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], url_path='history')
    def get_history(self, request, pk=None):
        """Get modification history for a proposal"""
        proposal = self.get_object()
        history = ProposalService.get_proposal_history(proposal)
        
        return Response({
            'proposal_id': str(proposal.id),
            'history': history
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path='summary')
    def get_summary(self, request, pk=None):
        """Get comprehensive proposal summary"""
        proposal = self.get_object()
        summary = ProposalService.get_proposal_summary(proposal)
        
        return Response(summary, status=status.HTTP_200_OK)


class ProposalModificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing proposal modifications (read-only)"""
    
    queryset = ProposalModification.objects.all()
    serializer_class = ProposalModificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter modifications based on user access to proposals"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return modifications for proposals user has access to
        return self.queryset.filter(
            models.Q(proposal__project__client=user) | 
            models.Q(proposal__project__senior_developer=user)
        )


class SeniorDeveloperAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing senior developer assignments"""
    
    queryset = SeniorDeveloperAssignment.objects.all()
    serializer_class = SeniorDeveloperAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter assignments based on user involvement"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return assignments where user is the senior developer or project client
        return self.queryset.filter(
            models.Q(senior_developer=user) | models.Q(project__client=user)
        )
    
    @action(detail=False, methods=['post'], url_path='identify-candidates')
    def identify_candidates(self, request):
        """Identify senior developer candidates for a project"""
        project_id = request.data.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = Project.objects.get(id=project_id)
            
            # Check if user has access to this project
            if request.user != project.client and not request.user.is_staff:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            candidates = SeniorDeveloperService.identify_senior_developers(project)
            
            return Response({
                'project_id': str(project.id),
                'project_title': project.title,
                'candidates': [{
                    'developer': {
                        'id': candidate['developer'].id,
                        'username': candidate['developer'].username,
                        'first_name': candidate['developer'].first_name,
                        'last_name': candidate['developer'].last_name,
                    },
                    'scores': candidate['scores'],
                    'profile': {
                        'experience_level': candidate['profile'].experience_level,
                        'skills': candidate['profile'].skills,
                        'reputation_score': candidate['profile'].reputation_score,
                        'projects_completed': candidate['profile'].projects_completed,
                    }
                } for candidate in candidates]
            }, status=status.HTTP_200_OK)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], url_path='assign')
    def assign_senior_developer(self, request):
        """Assign a senior developer to a project"""
        project_id = request.data.get('project_id')
        developer_id = request.data.get('developer_id')
        
        if not project_id or not developer_id:
            return Response(
                {'error': 'project_id and developer_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = Project.objects.get(id=project_id)
            developer = User.objects.get(id=developer_id, role='developer')
            
            # Check if user has permission to assign (client or admin)
            if request.user != project.client and not request.user.is_staff:
                return Response(
                    {'error': 'Only project client or admin can assign senior developer'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            assignment = SeniorDeveloperService.assign_senior_developer(project, developer)
            
            return Response({
                'message': 'Senior developer assigned successfully',
                'assignment': SeniorDeveloperAssignmentSerializer(assignment).data
            }, status=status.HTTP_201_CREATED)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Developer not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='accept')
    def accept_assignment(self, request, pk=None):
        """Accept a senior developer assignment"""
        assignment = self.get_object()
        user = request.user
        
        # Check if user is the assigned senior developer
        if user != assignment.senior_developer:
            return Response(
                {'error': 'Only assigned senior developer can accept assignment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        success = SeniorDeveloperService.accept_senior_assignment(assignment)
        if success:
            return Response({
                'message': 'Assignment accepted successfully',
                'assignment': SeniorDeveloperAssignmentSerializer(assignment).data
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to accept assignment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='decline')
    def decline_assignment(self, request, pk=None):
        """Decline a senior developer assignment"""
        assignment = self.get_object()
        user = request.user
        
        # Check if user is the assigned senior developer
        if user != assignment.senior_developer:
            return Response(
                {'error': 'Only assigned senior developer can decline assignment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reason = request.data.get('reason', '')
        success = SeniorDeveloperService.decline_senior_assignment(assignment, reason)
        
        if success:
            return Response({
                'message': 'Assignment declined successfully',
                'assignment': SeniorDeveloperAssignmentSerializer(assignment).data
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to decline assignment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TeamInvitationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing team member invitations"""
    
    queryset = TeamInvitation.objects.all()
    serializer_class = TeamInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter invitations based on user involvement"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return invitations where user is the developer, project client, or senior developer
        return self.queryset.filter(
            models.Q(developer=user) | 
            models.Q(task__project__client=user) | 
            models.Q(task__project__senior_developer=user)
        )
    
    @action(detail=True, methods=['post'], url_path='respond')
    def respond_to_invitation(self, request, pk=None):
        """Respond to a team invitation"""
        invitation = self.get_object()
        user = request.user
        
        # Check if user is the invited developer
        if user != invitation.developer:
            return Response(
                {'error': 'Only invited developer can respond to invitation'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = InvitationResponseSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = TeamHiringService.respond_to_invitation(
                    invitation=invitation,
                    action=serializer.validated_data['action'],
                    counter_offer_rate=serializer.validated_data.get('counter_offer_rate'),
                    decline_reason=serializer.validated_data.get('decline_reason')
                )
                
                return Response({
                    'message': result['message'],
                    'status': result['status'],
                    'invitation': TeamInvitationSerializer(invitation).data,
                    **{k: v for k, v in result.items() if k not in ['message', 'status']}
                }, status=status.HTTP_200_OK)
                
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='my-invitations')
    def my_invitations(self, request):
        """Get current user's invitations"""
        user = request.user
        
        if user.role != 'developer':
            return Response(
                {'error': 'Only developers can view their invitations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        invitations = self.queryset.filter(developer=user).order_by('-invited_at')
        serializer = self.get_serializer(invitations, many=True)
        
        return Response({
            'invitations': serializer.data,
            'total_count': invitations.count(),
            'pending_count': invitations.filter(status='pending').count(),
            'accepted_count': invitations.filter(status='accepted').count(),
            'declined_count': invitations.filter(status='declined').count()
        })


class TaskAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing active task assignments"""
    
    queryset = TaskAssignment.objects.all()
    serializer_class = TaskAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter assignments based on user involvement"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return assignments where user is the developer, project client, or senior developer
        return self.queryset.filter(
            models.Q(developer=user) | 
            models.Q(task__project__client=user) | 
            models.Q(task__project__senior_developer=user)
        )
    
    @action(detail=True, methods=['post'], url_path='update-progress')
    def update_progress(self, request, pk=None):
        """Update task progress"""
        assignment = self.get_object()
        user = request.user
        
        # Check if user is the assigned developer
        if user != assignment.developer:
            return Response(
                {'error': 'Only assigned developer can update progress'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        progress_percentage = request.data.get('progress_percentage')
        hours_logged = request.data.get('hours_logged')
        
        if progress_percentage is not None:
            if not (0 <= progress_percentage <= 100):
                return Response(
                    {'error': 'Progress percentage must be between 0 and 100'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            assignment.progress_percentage = progress_percentage
            assignment.task.completion_percentage = progress_percentage
            assignment.task.save()
        
        if hours_logged is not None:
            if hours_logged < 0:
                return Response(
                    {'error': 'Hours logged cannot be negative'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            assignment.hours_logged = hours_logged
            assignment.spent_budget = assignment.agreed_rate * hours_logged
        
        assignment.last_activity_date = timezone.now()
        assignment.save()
        
        return Response({
            'message': 'Progress updated successfully',
            'assignment': TaskAssignmentSerializer(assignment).data
        })
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_assignment(self, request, pk=None):
        """Mark assignment as completed"""
        assignment = self.get_object()
        user = request.user
        
        # Check if user is the assigned developer
        if user != assignment.developer:
            return Response(
                {'error': 'Only assigned developer can complete assignment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        assignment.status = 'completed'
        assignment.actual_completion_date = timezone.now()
        assignment.progress_percentage = 100
        assignment.task.status = 'completed'
        assignment.task.completion_percentage = 100
        assignment.task.save()
        assignment.save()
        
        return Response({
            'message': 'Assignment completed successfully',
            'assignment': TaskAssignmentSerializer(assignment).data
        })
    
    @action(detail=False, methods=['get'], url_path='my-assignments')
    def my_assignments(self, request):
        """Get current user's assignments"""
        user = request.user
        
        if user.role != 'developer':
            return Response(
                {'error': 'Only developers can view their assignments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        assignments = self.queryset.filter(developer=user).order_by('-created_at')
        serializer = self.get_serializer(assignments, many=True)
        
        return Response({
            'assignments': serializer.data,
            'total_count': assignments.count(),
            'active_count': assignments.filter(status='active').count(),
            'completed_count': assignments.filter(status='completed').count()
        })


class TeamHiringViewSet(viewsets.ViewSet):
    """ViewSet for managing dynamic team hiring"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='initiate')
    def initiate_team_hiring(self, request):
        """Initiate automatic team hiring for a project"""
        serializer = TeamHiringRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            project = Project.objects.get(id=serializer.validated_data['project_id'])
            
            # Check if user has permission to initiate hiring
            if (request.user != project.client and 
                request.user != project.senior_developer and 
                not request.user.is_staff):
                return Response(
                    {'error': 'Only project client, senior developer, or admin can initiate hiring'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Initiate team hiring
            result = TeamHiringService.initiate_team_hiring(
                project=project,
                task_ids=serializer.validated_data.get('task_ids'),
                max_invitations_per_task=serializer.validated_data['max_invitations_per_task'],
                invitation_expiry_hours=serializer.validated_data['invitation_expiry_hours']
            )
            
            return Response({
                'message': 'Team hiring initiated successfully',
                'results': result
            }, status=status.HTTP_200_OK)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='project-status')
    def get_project_hiring_status(self, request):
        """Get hiring status for a project"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = Project.objects.get(id=project_id)
            
            # Check permissions
            if (request.user != project.client and 
                request.user != project.senior_developer and 
                not request.user.is_staff):
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get hiring statistics
            total_tasks = project.tasks.count()
            assigned_tasks = project.tasks.filter(assigned_developer__isnull=False).count()
            pending_invitations = TeamInvitation.objects.filter(
                task__project=project, status='pending'
            ).count()
            
            # Get resource allocation if exists
            resource_allocation = getattr(project, 'resource_allocation', None)
            
            return Response({
                'project_id': str(project.id),
                'project_title': project.title,
                'project_status': project.status,
                'hiring_statistics': {
                    'total_tasks': total_tasks,
                    'assigned_tasks': assigned_tasks,
                    'unassigned_tasks': total_tasks - assigned_tasks,
                    'pending_invitations': pending_invitations,
                    'assignment_percentage': int((assigned_tasks / total_tasks) * 100) if total_tasks > 0 else 0
                },
                'resource_allocation': ResourceAllocationSerializer(resource_allocation).data if resource_allocation else None
            })
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class DynamicPricingViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing dynamic pricing calculations"""
    
    queryset = DynamicPricing.objects.all()
    serializer_class = DynamicPricingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter pricing based on user access to tasks"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return pricing for tasks user has access to
        return self.queryset.filter(
            models.Q(task__project__client=user) | 
            models.Q(task__project__senior_developer=user) |
            models.Q(task__assigned_developer=user)
        )


class ResourceAllocationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing resource allocation and timeline management"""
    
    queryset = ResourceAllocation.objects.all()
    serializer_class = ResourceAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter resource allocations based on user access to projects"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return resource allocations for projects user has access to
        return self.queryset.filter(
            models.Q(project__client=user) | 
            models.Q(project__senior_developer=user)
        )


class DynamicPricingViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing dynamic pricing calculations"""
    
    queryset = DynamicPricing.objects.all()
    serializer_class = DynamicPricingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter pricing based on user access to projects"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return pricing for tasks in projects user has access to
        return self.queryset.filter(
            models.Q(task__project__client=user) | 
            models.Q(task__project__senior_developer=user) |
            models.Q(task__assigned_developer=user)
        )


class ResourceAllocationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing resource allocation and timeline management"""
    
    queryset = ResourceAllocation.objects.all()
    serializer_class = ResourceAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter resource allocation based on user access to projects"""
        user = self.request.user
        
        if user.is_staff:
            return self.queryset
        
        # Return resource allocation for projects user has access to
        return self.queryset.filter(
            models.Q(project__client=user) | 
            models.Q(project__senior_developer=user) |
            models.Q(project__tasks__assigned_developer=user)
        ).distinct()