#!/usr/bin/env python
"""
Test script for the proposal system workflow.
This tests the proposal creation, modification, and approval process.
"""

import os
import sys
import django
from decimal import Decimal
from datetime import timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from projects.models import Project, ProjectProposal, ProposalModification
from projects.proposal_service import ProposalService

User = get_user_model()


def test_proposal_creation_and_workflow():
    """Test the complete proposal workflow"""
    print("\n=== Testing Proposal Creation and Workflow ===")
    
    # Create test users
    client_user = User.objects.create_user(
        username='testclient_proposal',
        email='client_proposal@test.com',
        user_type='client'
    )
    
    senior_dev = User.objects.create_user(
        username='seniordev_proposal',
        email='senior_proposal@test.com',
        user_type='freelancer'
    )
    
    # Create test project
    project = Project.objects.create(
        client=client_user,
        title='Test Project for Proposals',
        description='Test project for proposal workflow',
        status='proposal_review',
        senior_developer=senior_dev
    )
    
    print(f"Created project: {project.title}")
    
    # Create AI analysis data
    ai_analysis = {
        'budget_estimate': 5000.00,
        'timeline_estimate': timedelta(days=30).total_seconds(),
        'task_breakdown': {
            'backend': {'hours': 40, 'rate': 75},
            'frontend': {'hours': 30, 'rate': 70},
            'testing': {'hours': 10, 'rate': 65}
        },
        'sla_terms': {
            'delivery_timeline': '30 days',
            'revision_rounds': 2,
            'support_period': '30 days'
        }
    }
    
    # Test proposal creation
    try:
        proposal = ProposalService.create_initial_proposal(project, ai_analysis)
        
        print(f"Created proposal: {proposal.id}")
        print(f"  Original Budget: ${proposal.original_budget}")
        print(f"  Original Timeline: {proposal.original_timeline}")
        print(f"  Status: {proposal.status}")
        
        # Verify proposal was created correctly
        assert proposal.project == project
        assert proposal.original_budget == Decimal('5000.00')
        assert proposal.current_budget == proposal.original_budget
        assert proposal.status == 'draft'
        
        print("✅ Proposal creation successful")
        
    except Exception as e:
        print(f"❌ Error creating proposal: {str(e)}")
        return False
    
    # Test proposal modification by senior developer
    try:
        modifications = {
            'current_budget': Decimal('5500.00'),
            'current_timeline': timedelta(days=35),
            'current_task_breakdown': {
                'backend': {'hours': 45, 'rate': 75},
                'frontend': {'hours': 30, 'rate': 70},
                'testing': {'hours': 15, 'rate': 65}
            }
        }
        
        modification_records = ProposalService.modify_proposal(
            proposal=proposal,
            modifications=modifications,
            modified_by=senior_dev,
            justification="Increased scope for better quality and additional testing"
        )
        
        print(f"\nModified proposal:")
        print(f"  New Budget: ${proposal.current_budget}")
        print(f"  New Timeline: {proposal.current_timeline}")
        print(f"  Modifications Created: {len(modification_records)}")
        print(f"  Status: {proposal.status}")
        
        # Verify modifications
        proposal.refresh_from_db()
        assert proposal.current_budget == Decimal('5500.00')
        assert proposal.current_timeline == timedelta(days=35)
        assert proposal.status == 'senior_review'
        assert len(modification_records) >= 2  # Budget and timeline changes
        
        print("✅ Proposal modification successful")
        
    except Exception as e:
        print(f"❌ Error modifying proposal: {str(e)}")
        return False
    
    # Test senior developer approval
    try:
        success = ProposalService.senior_developer_approve(proposal, senior_dev)
        
        proposal.refresh_from_db()
        print(f"\nSenior developer approval:")
        print(f"  Success: {success}")
        print(f"  Senior Approved: {proposal.senior_developer_approved}")
        print(f"  Status: {proposal.status}")
        
        assert success == True
        assert proposal.senior_developer_approved == True
        assert proposal.status == 'client_review'
        
        print("✅ Senior developer approval successful")
        
    except Exception as e:
        print(f"❌ Error in senior developer approval: {str(e)}")
        return False
    
    # Test client approval and locking
    try:
        success = ProposalService.client_approve(proposal, client_user)
        
        proposal.refresh_from_db()
        project.refresh_from_db()
        
        print(f"\nClient approval:")
        print(f"  Success: {success}")
        print(f"  Client Approved: {proposal.client_approved}")
        print(f"  Is Locked: {proposal.is_locked}")
        print(f"  Status: {proposal.status}")
        print(f"  Project Status: {project.status}")
        
        assert success == True
        assert proposal.client_approved == True
        assert proposal.is_locked == True
        assert proposal.status == 'locked'
        assert project.status == 'team_assembly'
        
        print("✅ Client approval and locking successful")
        
    except Exception as e:
        print(f"❌ Error in client approval: {str(e)}")
        return False
    
    # Test proposal history
    try:
        history = ProposalService.get_proposal_history(proposal)
        
        print(f"\nProposal history:")
        print(f"  Total modifications: {len(history)}")
        
        for i, mod in enumerate(history, 1):
            print(f"  {i}. {mod['modification_type']}: {mod['field_name']}")
            print(f"     By: {mod['modified_by']}")
            print(f"     Justification: {mod['justification'][:50]}...")
        
        assert len(history) >= 2  # Should have budget and timeline modifications
        
        print("✅ Proposal history retrieval successful")
        
    except Exception as e:
        print(f"❌ Error retrieving proposal history: {str(e)}")
        return False
    
    # Test proposal summary
    try:
        summary = ProposalService.get_proposal_summary(proposal)
        
        print(f"\nProposal summary:")
        print(f"  Project: {summary['project_title']}")
        print(f"  Status: {summary['status']}")
        print(f"  Budget Changed: {summary['budget_changed']}")
        print(f"  Timeline Changed: {summary['timeline_changed']}")
        print(f"  Modifications Count: {summary['modifications_count']}")
        print(f"  Is Locked: {summary['is_locked']}")
        
        assert summary['budget_changed'] == True
        assert summary['timeline_changed'] == True
        assert summary['modifications_count'] >= 2
        assert summary['is_locked'] == True
        
        print("✅ Proposal summary generation successful")
        
    except Exception as e:
        print(f"❌ Error generating proposal summary: {str(e)}")
        return False
    
    print(f"\n✅ Complete proposal workflow test successful!")
    return True


def test_proposal_rejection():
    """Test proposal rejection workflow"""
    print("\n=== Testing Proposal Rejection ===")
    
    # Create test users
    client_user = User.objects.create_user(
        username='testclient_reject',
        email='client_reject@test.com',
        user_type='client'
    )
    
    senior_dev = User.objects.create_user(
        username='seniordev_reject',
        email='senior_reject@test.com',
        user_type='freelancer'
    )
    
    # Create test project
    project = Project.objects.create(
        client=client_user,
        title='Test Project for Rejection',
        description='Test project for rejection workflow',
        status='proposal_review',
        senior_developer=senior_dev
    )
    
    # Create proposal
    ai_analysis = {
        'budget_estimate': 3000.00,
        'timeline_estimate': timedelta(days=20).total_seconds(),
        'task_breakdown': {'development': {'hours': 40, 'rate': 75}},
        'sla_terms': {'delivery_timeline': '20 days'}
    }
    
    proposal = ProposalService.create_initial_proposal(project, ai_analysis)
    
    # Senior developer approves
    ProposalService.senior_developer_approve(proposal, senior_dev)
    
    # Test client rejection
    try:
        success = ProposalService.reject_proposal(
            proposal, 
            client_user, 
            "Budget is too high for our current requirements"
        )
        
        proposal.refresh_from_db()
        project.refresh_from_db()
        
        print(f"Proposal rejection:")
        print(f"  Success: {success}")
        print(f"  Status: {proposal.status}")
        print(f"  Project Status: {project.status}")
        
        # Check modification record for rejection
        rejection_mods = proposal.modifications.filter(
            modification_type='scope_change',
            field_name='status'
        )
        
        print(f"  Rejection Records: {rejection_mods.count()}")
        
        assert success == True
        assert proposal.status == 'rejected'
        assert project.status == 'analyzing'  # Back to analyzing for revision
        assert rejection_mods.count() >= 1
        
        print("✅ Proposal rejection successful")
        return True
        
    except Exception as e:
        print(f"❌ Error in proposal rejection: {str(e)}")
        return False


def run_proposal_tests():
    """Run all proposal system tests"""
    print("Starting Proposal System Tests...")
    print("=" * 50)
    
    tests = [
        test_proposal_creation_and_workflow,
        test_proposal_rejection
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"\n❌ Test {test_func.__name__} failed with exception: {str(e)}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("✅ All Proposal System Tests Passed!")
        return True
    else:
        print("❌ Some tests failed!")
        return False


if __name__ == '__main__':
    success = run_proposal_tests()
    sys.exit(0 if success else 1)