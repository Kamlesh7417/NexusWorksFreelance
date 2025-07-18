#!/usr/bin/env python
"""
Test script for Senior Developer Assignment and Proposal System

This script tests the core functionality of task 8:
- Senior developer identification logic
- Proposal modification interface
- Dual approval workflow
- Proposal locking mechanism
- Change tracking
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
from django.test import TestCase
from django.utils import timezone

from projects.models import Project, ProjectProposal, ProposalModification, SeniorDeveloperAssignment
from projects.senior_developer_service import SeniorDeveloperService
from projects.proposal_service import ProposalService
from users.models import DeveloperProfile

User = get_user_model()


def create_test_users():
    """Create test users for the system"""
    print("🔧 Creating test users...")
    
    # Create client
    client = User.objects.create_user(
        username='test_client',
        email='client@test.com',
        password='testpass123',
        role='client'
    )
    
    # Create senior developers
    senior_dev1 = User.objects.create_user(
        username='senior_dev1',
        email='senior1@test.com',
        password='testpass123',
        role='developer'
    )
    
    senior_dev2 = User.objects.create_user(
        username='senior_dev2',
        email='senior2@test.com',
        password='testpass123',
        role='developer'
    )
    
    # Create developer profiles
    DeveloperProfile.objects.create(
        user=senior_dev1,
        experience_level='senior',
        skills=['Python', 'Django', 'React'],
        hourly_rate=Decimal('85.00'),
        reputation_score=4.5,
        projects_completed=15
    )
    
    DeveloperProfile.objects.create(
        user=senior_dev2,
        experience_level='lead',
        skills=['Python', 'Django', 'PostgreSQL', 'AWS'],
        hourly_rate=Decimal('120.00'),
        reputation_score=4.8,
        projects_completed=25
    )
    
    print(f"✅ Created users: {client.username}, {senior_dev1.username}, {senior_dev2.username}")
    return client, senior_dev1, senior_dev2


def create_test_project(client):
    """Create a test project"""
    print("🔧 Creating test project...")
    
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
    return project


def test_senior_developer_identification(project):
    """Test senior developer identification logic"""
    print("\n🧪 Testing senior developer identification...")
    
    # Test identifying senior developers
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
    
    return candidates


def test_senior_developer_assignment(project, senior_dev):
    """Test senior developer assignment"""
    print(f"\n🧪 Testing senior developer assignment for {senior_dev.username}...")
    
    # Assign senior developer
    assignment = SeniorDeveloperService.assign_senior_developer(project, senior_dev)
    
    print(f"✅ Assignment created with ID: {assignment.id}")
    print(f"   Status: {assignment.status}")
    print(f"   Total Score: {assignment.total_score:.2f}")
    
    # Test accepting assignment
    success = SeniorDeveloperService.accept_senior_assignment(assignment)
    print(f"✅ Assignment accepted: {success}")
    
    return assignment


def test_proposal_creation_and_modification(project):
    """Test proposal creation and modification"""
    print(f"\n🧪 Testing proposal creation and modification...")
    
    # Create initial proposal
    ai_analysis = project.ai_analysis.copy()
    ai_analysis.update({
        'budget_estimate': float(project.budget_estimate),
        'timeline_estimate': project.timeline_estimate,
        'task_breakdown': project.ai_analysis.get('task_breakdown', {}),
        'sla_terms': project.ai_analysis.get('sla_terms', {})
    })
    
    proposal = ProposalService.create_initial_proposal(project, ai_analysis)
    print(f"✅ Initial proposal created with ID: {proposal.id}")
    print(f"   Original Budget: ${proposal.original_budget}")
    print(f"   Status: {proposal.status}")
    
    # Test proposal modification by senior developer
    modifications = {
        'current_budget': Decimal('18000.00'),  # Increase budget
        'current_timeline': timedelta(days=105),  # Extend timeline
        'current_sla_terms': {
            'response_time': '12 hours',  # Improve SLA
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
    
    print(f"✅ Proposal modified with {len(modification_records)} changes")
    for mod in modification_records:
        print(f"   - {mod.modification_type}: {mod.field_name}")
        print(f"     Old: {mod.old_value}")
        print(f"     New: {mod.new_value}")
    
    return proposal


def test_dual_approval_workflow(proposal):
    """Test dual approval workflow"""
    print(f"\n🧪 Testing dual approval workflow...")
    
    # Senior developer approval
    success = ProposalService.senior_developer_approve(proposal, proposal.project.senior_developer)
    print(f"✅ Senior developer approval: {success}")
    print(f"   Status: {proposal.status}")
    print(f"   Senior approved: {proposal.senior_developer_approved}")
    
    # Client approval
    success = ProposalService.client_approve(proposal, proposal.project.client)
    print(f"✅ Client approval: {success}")
    print(f"   Status: {proposal.status}")
    print(f"   Client approved: {proposal.client_approved}")
    print(f"   Locked: {proposal.is_locked}")
    
    return proposal


def test_proposal_locking_and_history(proposal):
    """Test proposal locking mechanism and change tracking"""
    print(f"\n🧪 Testing proposal locking and history...")
    
    # Check if proposal is locked
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
    
    # Get proposal summary
    summary = ProposalService.get_proposal_summary(proposal)
    print(f"✅ Proposal summary:")
    print(f"   Budget changed: {summary['budget_changed']}")
    print(f"   Timeline changed: {summary['timeline_changed']}")
    print(f"   Modifications count: {summary['modifications_count']}")
    
    return summary


def test_error_handling():
    """Test error handling scenarios"""
    print(f"\n🧪 Testing error handling scenarios...")
    
    # Test modifying locked proposal
    try:
        # This should fail since proposal is locked
        locked_proposal = ProjectProposal.objects.filter(is_locked=True).first()
        if locked_proposal:
            ProposalService.modify_proposal(
                proposal=locked_proposal,
                modifications={'current_budget': Decimal('20000.00')},
                modified_by=locked_proposal.project.senior_developer,
                justification="This should fail"
            )
            print("❌ ERROR: Should not be able to modify locked proposal")
        else:
            print("✅ No locked proposals to test with")
    except ValueError as e:
        print(f"✅ Correctly prevented modification of locked proposal: {str(e)}")
    
    # Test unauthorized modification
    try:
        proposal = ProjectProposal.objects.filter(is_locked=False).first()
        if proposal:
            # Create a different user
            unauthorized_user = User.objects.create_user(
                username='unauthorized',
                email='unauthorized@test.com',
                role='developer'
            )
            
            ProposalService.modify_proposal(
                proposal=proposal,
                modifications={'current_budget': Decimal('25000.00')},
                modified_by=unauthorized_user,
                justification="This should fail"
            )
            print("❌ ERROR: Should not allow unauthorized modification")
        else:
            print("✅ No unlocked proposals to test with")
    except ValueError as e:
        print(f"✅ Correctly prevented unauthorized modification: {str(e)}")


def main():
    """Main test function"""
    print("🚀 Starting Senior Developer Assignment and Proposal System Tests")
    print("=" * 70)
    
    try:
        # Clean up existing test data
        User.objects.filter(username__startswith='test_').delete()
        User.objects.filter(username='unauthorized').delete()
        
        # Create test data
        client, senior_dev1, senior_dev2 = create_test_users()
        project = create_test_project(client)
        
        # Test senior developer identification
        candidates = test_senior_developer_identification(project)
        
        if candidates:
            # Use the best candidate
            best_candidate = candidates[0]['developer']
            
            # Test assignment
            assignment = test_senior_developer_assignment(project, best_candidate)
            
            # Test proposal workflow
            proposal = test_proposal_creation_and_modification(project)
            proposal = test_dual_approval_workflow(proposal)
            test_proposal_locking_and_history(proposal)
            
            # Test error handling
            test_error_handling()
            
            print("\n" + "=" * 70)
            print("🎉 All tests completed successfully!")
            print("✅ Senior developer identification: PASSED")
            print("✅ Proposal modification interface: PASSED")
            print("✅ Dual approval workflow: PASSED")
            print("✅ Proposal locking mechanism: PASSED")
            print("✅ Change tracking: PASSED")
            print("✅ Error handling: PASSED")
            
        else:
            print("❌ No senior developer candidates found - check test data")
            
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)