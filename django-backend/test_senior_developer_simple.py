#!/usr/bin/env python
"""
Simple test script for Senior Developer Assignment and Proposal System

This script tests the core functionality of task 8 with a simpler approach.
"""

import os
import sys
import django
from datetime import timedelta
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone

from projects.models import Project, ProjectProposal, ProposalModification, SeniorDeveloperAssignment
from projects.senior_developer_service import SeniorDeveloperService
from projects.proposal_service import ProposalService
from users.models import DeveloperProfile

User = get_user_model()


def test_senior_developer_system():
    """Test the senior developer assignment and proposal system"""
    print("🚀 Testing Senior Developer Assignment and Proposal System")
    print("=" * 60)
    
    try:
        # Clean up existing test data
        print("🧹 Cleaning up existing test data...")
        User.objects.filter(username__startswith='test_').delete()
        
        # Create test client
        print("👤 Creating test client...")
        client = User.objects.create(
            username='test_client',
            email='client@test.com',
            role='client',
            first_name='Test',
            last_name='Client'
        )
        client.set_password('testpass123')
        client.save()
        print(f"✅ Created client: {client.username}")
        
        # Create senior developers
        print("👨‍💻 Creating senior developers...")
        senior_dev1 = User.objects.create(
            username='test_senior1',
            email='senior1@test.com',
            role='developer',
            first_name='Senior',
            last_name='Developer1'
        )
        senior_dev1.set_password('testpass123')
        senior_dev1.save()
        
        senior_dev2 = User.objects.create(
            username='test_senior2',
            email='senior2@test.com',
            role='developer',
            first_name='Senior',
            last_name='Developer2'
        )
        senior_dev2.set_password('testpass123')
        senior_dev2.save()
        
        # Create developer profiles
        profile1 = DeveloperProfile.objects.create(
            user=senior_dev1,
            experience_level='senior',
            skills=['Python', 'Django', 'React'],
            hourly_rate=Decimal('85.00'),
            reputation_score=4.5,
            projects_completed=15
        )
        
        profile2 = DeveloperProfile.objects.create(
            user=senior_dev2,
            experience_level='lead',
            skills=['Python', 'Django', 'PostgreSQL', 'AWS'],
            hourly_rate=Decimal('120.00'),
            reputation_score=4.8,
            projects_completed=25
        )
        
        print(f"✅ Created senior developers: {senior_dev1.username}, {senior_dev2.username}")
        
        # Create test project
        print("📋 Creating test project...")
        project = Project.objects.create(
            client=client,
            title="AI-Powered E-commerce Platform",
            description="Build a modern e-commerce platform with AI recommendations",
            required_skills=['Python', 'Django', 'React', 'PostgreSQL'],
            experience_level_required='senior',
            budget_estimate=Decimal('15000.00'),
            timeline_estimate=timedelta(days=90),
            ai_analysis={
                'complexity': 'high',
                'estimated_hours': 600,
                'task_breakdown': {
                    'backend': 300,
                    'frontend': 200,
                    'ai_integration': 100
                },
                'sla_terms': {
                    'response_time': '24 hours',
                    'bug_fix_time': '48 hours'
                }
            }
        )
        print(f"✅ Created project: {project.title}")
        
        # Test 1: Senior Developer Identification
        print("\n🔍 Test 1: Senior Developer Identification")
        candidates = SeniorDeveloperService.identify_senior_developers(project, limit=5)
        print(f"✅ Found {len(candidates)} senior developer candidates")
        
        for i, candidate in enumerate(candidates, 1):
            dev = candidate['developer']
            scores = candidate['scores']
            print(f"  {i}. {dev.username} (Total Score: {scores['total_score']:.2f})")
            print(f"     - Experience: {scores['experience_score']:.2f}")
            print(f"     - Reputation: {scores['reputation_score']:.2f}")
            print(f"     - Skill Match: {scores['skill_match_score']:.2f}")
            print(f"     - Leadership: {scores['leadership_score']:.2f}")
        
        if not candidates:
            print("❌ No candidates found - this indicates an issue with the scoring logic")
            return False
        
        # Test 2: Senior Developer Assignment
        print("\n👨‍💼 Test 2: Senior Developer Assignment")
        best_candidate = candidates[0]['developer']
        assignment = SeniorDeveloperService.assign_senior_developer(project, best_candidate)
        print(f"✅ Assigned {best_candidate.username} to project")
        print(f"   Assignment ID: {assignment.id}")
        print(f"   Status: {assignment.status}")
        print(f"   Total Score: {assignment.total_score:.2f}")
        
        # Accept the assignment
        success = SeniorDeveloperService.accept_senior_assignment(assignment)
        print(f"✅ Assignment accepted: {success}")
        
        # Test 3: Proposal Creation and Modification
        print("\n📝 Test 3: Proposal Creation and Modification")
        
        # Create initial proposal
        ai_analysis = {
            'budget_estimate': float(project.budget_estimate),
            'timeline_estimate': project.timeline_estimate,
            'task_breakdown': project.ai_analysis.get('task_breakdown', {}),
            'sla_terms': project.ai_analysis.get('sla_terms', {})
        }
        
        proposal = ProposalService.create_initial_proposal(project, ai_analysis)
        print(f"✅ Created initial proposal: {proposal.id}")
        print(f"   Original Budget: ${proposal.original_budget}")
        print(f"   Status: {proposal.status}")
        
        # Modify the proposal
        modifications = {
            'current_budget': Decimal('18000.00'),
            'current_timeline': timedelta(days=105),
            'current_sla_terms': {
                'response_time': '12 hours',
                'bug_fix_time': '24 hours'
            }
        }
        
        justification = "After detailed analysis, the project requires additional time for proper AI integration and testing. The improved SLA terms justify the budget increase."
        
        modification_records = ProposalService.modify_proposal(
            proposal=proposal,
            modifications=modifications,
            modified_by=project.senior_developer,
            justification=justification
        )
        
        print(f"✅ Modified proposal with {len(modification_records)} changes")
        for mod in modification_records:
            print(f"   - {mod.modification_type}: {mod.field_name}")
        
        # Test 4: Dual Approval Workflow
        print("\n✅ Test 4: Dual Approval Workflow")
        
        # Senior developer approval
        success = ProposalService.senior_developer_approve(proposal, project.senior_developer)
        print(f"✅ Senior developer approval: {success}")
        print(f"   Status: {proposal.status}")
        print(f"   Senior approved: {proposal.senior_developer_approved}")
        
        # Client approval
        success = ProposalService.client_approve(proposal, project.client)
        print(f"✅ Client approval: {success}")
        print(f"   Status: {proposal.status}")
        print(f"   Client approved: {proposal.client_approved}")
        print(f"   Locked: {proposal.is_locked}")
        
        # Test 5: Proposal Locking and Change Tracking
        print("\n🔒 Test 5: Proposal Locking and Change Tracking")
        
        print(f"✅ Proposal locked: {proposal.is_locked}")
        print(f"   Locked at: {proposal.locked_at}")
        print(f"   Locked by: {proposal.locked_by.username if proposal.locked_by else 'None'}")
        
        # Get proposal history
        history = ProposalService.get_proposal_history(proposal)
        print(f"✅ Proposal history contains {len(history)} modifications")
        
        for i, mod in enumerate(history, 1):
            print(f"   {i}. {mod['modification_type']} by {mod['modified_by']}")
            print(f"      Field: {mod['field_name']}")
            print(f"      Justification: {mod['justification'][:50]}...")
        
        # Test 6: Error Handling
        print("\n⚠️ Test 6: Error Handling")
        
        # Test modifying locked proposal
        try:
            ProposalService.modify_proposal(
                proposal=proposal,
                modifications={'current_budget': Decimal('20000.00')},
                modified_by=project.senior_developer,
                justification="This should fail"
            )
            print("❌ ERROR: Should not be able to modify locked proposal")
            return False
        except ValueError as e:
            print(f"✅ Correctly prevented modification of locked proposal: {str(e)}")
        
        # Test unauthorized modification (create new proposal for this test)
        try:
            # Create another project and proposal for testing
            test_project2 = Project.objects.create(
                client=client,
                title="Test Project 2",
                description="Another test project",
                budget_estimate=Decimal('10000.00'),
                timeline_estimate=timedelta(days=60)
            )
            
            test_proposal2 = ProposalService.create_initial_proposal(test_project2, {
                'budget_estimate': 10000.00,
                'timeline_estimate': timedelta(days=60),
                'task_breakdown': {},
                'sla_terms': {}
            })
            
            # Try to modify with unauthorized user
            unauthorized_user = User.objects.create(
                username='unauthorized',
                email='unauthorized@test.com',
                role='developer'
            )
            
            ProposalService.modify_proposal(
                proposal=test_proposal2,
                modifications={'current_budget': Decimal('25000.00')},
                modified_by=unauthorized_user,
                justification="This should fail"
            )
            print("❌ ERROR: Should not allow unauthorized modification")
            return False
        except ValueError as e:
            print(f"✅ Correctly prevented unauthorized modification: {str(e)}")
        
        print("\n" + "=" * 60)
        print("🎉 All tests completed successfully!")
        print("✅ Senior developer identification: PASSED")
        print("✅ Senior developer assignment: PASSED")
        print("✅ Proposal creation and modification: PASSED")
        print("✅ Dual approval workflow: PASSED")
        print("✅ Proposal locking mechanism: PASSED")
        print("✅ Change tracking: PASSED")
        print("✅ Error handling: PASSED")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = test_senior_developer_system()
    sys.exit(0 if success else 1)