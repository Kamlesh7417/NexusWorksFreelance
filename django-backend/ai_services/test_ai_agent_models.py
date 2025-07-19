"""
Unit tests for AI Agent models
"""
import uuid
from datetime import timedelta
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from .ai_agent_models import (
    AIAgent, AgentCapability, AgentWorkPreference, 
    AgentPerformanceMetric, AgentAuditLog
)

User = get_user_model()


class AIAgentModelTest(TestCase):
    """Test cases for AIAgent model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testagent',
            email='agent@test.com',
            password='testpass123'
        )
    
    def test_create_ai_agent(self):
        """Test creating a basic AI agent"""
        agent = AIAgent.objects.create(
            user=self.user,
            agent_type='code_generator',
            agent_name='Test Code Generator',
            agent_description='A test AI agent for code generation',
            api_endpoint='https://api.example.com/agent',
            authentication_method='api_key',
            api_key_hash='hashed_key_123'
        )
        
        self.assertEqual(agent.user, self.user)
        self.assertEqual(agent.agent_type, 'code_generator')
        self.assertEqual(agent.agent_name, 'Test Code Generator')
        self.assertTrue(agent.is_active)
        self.assertFalse(agent.is_suspended)
        self.assertEqual(agent.current_availability_status, 'available')
        self.assertTrue(agent.is_available_for_work)
    
    def test_ai_agent_validation_response_time_sla(self):
        """Test validation of response time SLA"""
        with self.assertRaises(ValidationError):
            agent = AIAgent(
                user=self.user,
                agent_type='code_generator',
                agent_name='Test Agent',
                agent_description='Test description',
                response_time_sla=0  # Invalid: must be positive
            )
            agent.full_clean()
    
    def test_ai_agent_validation_automation_level(self):
        """Test validation of automation level"""
        with self.assertRaises(ValidationError):
            agent = AIAgent(
                user=self.user,
                agent_type='code_generator',
                agent_name='Test Agent',
                agent_description='Test description',
                automation_level=150  # Invalid: must be 0-100
            )
            agent.full_clean()
    
    def test_ai_agent_validation_success_rate(self):
        """Test validation of success rate"""
        with self.assertRaises(ValidationError):
            agent = AIAgent(
                user=self.user,
                agent_type='code_generator',
                agent_name='Test Agent',
                agent_description='Test description',
                success_rate=150.0  # Invalid: must be 0-100
            )
            agent.full_clean()
    
    def test_ai_agent_validation_quality_score(self):
        """Test validation of quality score"""
        with self.assertRaises(ValidationError):
            agent = AIAgent(
                user=self.user,
                agent_type='code_generator',
                agent_name='Test Agent',
                agent_description='Test description',
                average_quality_score=6.0  # Invalid: must be 0-5
            )
            agent.full_clean()
    
    def test_ai_agent_validation_api_endpoint(self):
        """Test validation of API endpoint"""
        with self.assertRaises(ValidationError):
            agent = AIAgent(
                user=self.user,
                agent_type='code_generator',
                agent_name='Test Agent',
                agent_description='Test description',
                api_endpoint='invalid-url'  # Invalid: must be valid URL
            )
            agent.full_clean()
    
    def test_ai_agent_validation_api_key_required(self):
        """Test validation that API key is required for API key authentication"""
        with self.assertRaises(ValidationError):
            agent = AIAgent(
                user=self.user,
                agent_type='code_generator',
                agent_name='Test Agent',
                agent_description='Test description',
                authentication_method='api_key',
                api_key_hash=None  # Invalid: required for API key auth
            )
            agent.full_clean()
    
    def test_ai_agent_validation_webhook_url_required(self):
        """Test validation that webhook URL is required for webhook authentication"""
        with self.assertRaises(ValidationError):
            agent = AIAgent(
                user=self.user,
                agent_type='code_generator',
                agent_name='Test Agent',
                agent_description='Test description',
                authentication_method='webhook',
                webhook_url=None  # Invalid: required for webhook auth
            )
            agent.full_clean()
    
    def test_ai_agent_is_available_for_work(self):
        """Test is_available_for_work property"""
        agent = AIAgent.objects.create(
            user=self.user,
            agent_type='code_generator',
            agent_name='Test Agent',
            agent_description='Test description'
        )
        
        # Should be available by default
        self.assertTrue(agent.is_available_for_work)
        
        # Should not be available if suspended
        agent.is_suspended = True
        self.assertFalse(agent.is_available_for_work)
        
        # Should not be available if inactive
        agent.is_suspended = False
        agent.is_active = False
        self.assertFalse(agent.is_available_for_work)
        
        # Should not be available if status is not 'available'
        agent.is_active = True
        agent.current_availability_status = 'busy'
        self.assertFalse(agent.is_available_for_work)
    
    def test_ai_agent_unique_user_constraint(self):
        """Test that each user can only have one AI agent profile"""
        AIAgent.objects.create(
            user=self.user,
            agent_type='code_generator',
            agent_name='First Agent',
            agent_description='First agent'
        )
        
        # Creating second agent for same user should fail
        with self.assertRaises(IntegrityError):
            AIAgent.objects.create(
                user=self.user,
                agent_type='code_reviewer',
                agent_name='Second Agent',
                agent_description='Second agent'
            )


class AgentCapabilityModelTest(TestCase):
    """Test cases for AgentCapability model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testagent',
            email='agent@test.com',
            password='testpass123'
        )
        self.agent = AIAgent.objects.create(
            user=self.user,
            agent_type='code_generator',
            agent_name='Test Agent',
            agent_description='Test description'
        )
    
    def test_create_agent_capability(self):
        """Test creating an agent capability"""
        capability = AgentCapability.objects.create(
            agent=self.agent,
            category='programming_language',
            skill_name='Python',
            proficiency_level='advanced',
            confidence_score=0.9,
            success_rate=85.0
        )
        
        self.assertEqual(capability.agent, self.agent)
        self.assertEqual(capability.skill_name, 'Python')
        self.assertEqual(capability.proficiency_level, 'advanced')
        self.assertEqual(capability.confidence_score, 0.9)
        self.assertEqual(capability.success_rate, 85.0)
    
    def test_agent_capability_validation_confidence_score(self):
        """Test validation of confidence score"""
        with self.assertRaises(ValidationError):
            capability = AgentCapability(
                agent=self.agent,
                category='programming_language',
                skill_name='Python',
                proficiency_level='advanced',
                confidence_score=1.5  # Invalid: must be 0.0-1.0
            )
            capability.full_clean()
    
    def test_agent_capability_validation_success_rate(self):
        """Test validation of success rate"""
        with self.assertRaises(ValidationError):
            capability = AgentCapability(
                agent=self.agent,
                category='programming_language',
                skill_name='Python',
                proficiency_level='advanced',
                success_rate=150.0  # Invalid: must be 0.0-100.0
            )
            capability.full_clean()
    
    def test_agent_capability_validation_empty_skill_name(self):
        """Test validation of empty skill name"""
        with self.assertRaises(ValidationError):
            capability = AgentCapability(
                agent=self.agent,
                category='programming_language',
                skill_name='   ',  # Invalid: empty after strip
                proficiency_level='advanced'
            )
            capability.full_clean()
    
    def test_agent_capability_validation_documentation_url(self):
        """Test validation of documentation URL"""
        with self.assertRaises(ValidationError):
            capability = AgentCapability(
                agent=self.agent,
                category='programming_language',
                skill_name='Python',
                proficiency_level='advanced',
                documentation_url='invalid-url'  # Invalid: must be valid URL
            )
            capability.full_clean()
    
    def test_agent_capability_unique_constraint(self):
        """Test unique constraint on agent, category, skill_name"""
        AgentCapability.objects.create(
            agent=self.agent,
            category='programming_language',
            skill_name='Python',
            proficiency_level='advanced'
        )
        
        # Creating duplicate should fail
        with self.assertRaises(IntegrityError):
            AgentCapability.objects.create(
                agent=self.agent,
                category='programming_language',
                skill_name='Python',
                proficiency_level='expert'  # Different proficiency, but same agent/category/skill
            )


class AgentWorkPreferenceModelTest(TestCase):
    """Test cases for AgentWorkPreference model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testagent',
            email='agent@test.com',
            password='testpass123'
        )
        self.agent = AIAgent.objects.create(
            user=self.user,
            agent_type='code_generator',
            agent_name='Test Agent',
            agent_description='Test description'
        )
    
    def test_create_agent_work_preference(self):
        """Test creating agent work preferences"""
        preferences = AgentWorkPreference.objects.create(
            agent=self.agent,
            preferred_project_types=['web_development', 'api_development'],
            excluded_project_types=['mobile_development'],
            min_complexity_level='simple',
            max_complexity_level='complex',
            preferred_collaboration_mode='fully_autonomous',
            min_hourly_rate=Decimal('50.00'),
            max_hourly_rate=Decimal('150.00')
        )
        
        self.assertEqual(preferences.agent, self.agent)
        self.assertEqual(preferences.preferred_project_types, ['web_development', 'api_development'])
        self.assertEqual(preferences.excluded_project_types, ['mobile_development'])
        self.assertEqual(preferences.min_complexity_level, 'simple')
        self.assertEqual(preferences.max_complexity_level, 'complex')
    
    def test_agent_work_preference_validation_complexity_levels(self):
        """Test validation of complexity level consistency"""
        with self.assertRaises(ValidationError):
            preferences = AgentWorkPreference(
                agent=self.agent,
                min_complexity_level='complex',
                max_complexity_level='simple'  # Invalid: max < min
            )
            preferences.full_clean()
    
    def test_agent_work_preference_validation_hourly_rates(self):
        """Test validation of hourly rate consistency"""
        with self.assertRaises(ValidationError):
            preferences = AgentWorkPreference(
                agent=self.agent,
                min_hourly_rate=Decimal('100.00'),
                max_hourly_rate=Decimal('50.00')  # Invalid: max < min
            )
            preferences.full_clean()
    
    def test_agent_work_preference_validation_project_durations(self):
        """Test validation of project duration consistency"""
        with self.assertRaises(ValidationError):
            preferences = AgentWorkPreference(
                agent=self.agent,
                min_project_duration=timedelta(days=30),
                max_project_duration=timedelta(days=7)  # Invalid: max < min
            )
            preferences.full_clean()
    
    def test_agent_work_preference_validation_project_type_overlap(self):
        """Test validation that preferred and excluded project types don't overlap"""
        with self.assertRaises(ValidationError):
            preferences = AgentWorkPreference(
                agent=self.agent,
                preferred_project_types=['web_development', 'api_development'],
                excluded_project_types=['web_development', 'mobile_development']  # Invalid: overlap
            )
            preferences.full_clean()


class AgentPerformanceMetricModelTest(TestCase):
    """Test cases for AgentPerformanceMetric model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testagent',
            email='agent@test.com',
            password='testpass123'
        )
        self.agent = AIAgent.objects.create(
            user=self.user,
            agent_type='code_generator',
            agent_name='Test Agent',
            agent_description='Test description'
        )
    
    def test_create_agent_performance_metric(self):
        """Test creating an agent performance metric"""
        from django.utils import timezone
        
        start_time = timezone.now() - timedelta(hours=1)
        end_time = timezone.now()
        
        metric = AgentPerformanceMetric.objects.create(
            agent=self.agent,
            metric_type='project_completion',
            metric_value=95.5,
            metric_unit='percentage',
            measurement_period_start=start_time,
            measurement_period_end=end_time,
            metadata={'projects_completed': 20, 'projects_total': 21}
        )
        
        self.assertEqual(metric.agent, self.agent)
        self.assertEqual(metric.metric_type, 'project_completion')
        self.assertEqual(metric.metric_value, 95.5)
        self.assertEqual(metric.metric_unit, 'percentage')
        self.assertEqual(metric.metadata['projects_completed'], 20)


class AgentAuditLogModelTest(TestCase):
    """Test cases for AgentAuditLog model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testagent',
            email='agent@test.com',
            password='testpass123'
        )
        self.agent = AIAgent.objects.create(
            user=self.user,
            agent_type='code_generator',
            agent_name='Test Agent',
            agent_description='Test description'
        )
    
    def test_create_agent_audit_log(self):
        """Test creating an agent audit log entry"""
        log_entry = AgentAuditLog.objects.create(
            agent=self.agent,
            action_type='project_assigned',
            action_description='Agent was assigned to project XYZ',
            action_data={'project_id': 'test-project-123'},
            request_data={'assignment_type': 'automatic'},
            response_data={'status': 'accepted'},
            was_successful=True,
            execution_time_ms=250
        )
        
        self.assertEqual(log_entry.agent, self.agent)
        self.assertEqual(log_entry.action_type, 'project_assigned')
        self.assertTrue(log_entry.was_successful)
        self.assertEqual(log_entry.execution_time_ms, 250)
        self.assertEqual(log_entry.action_data['project_id'], 'test-project-123')
    
    def test_agent_audit_log_ordering(self):
        """Test that audit logs are ordered by timestamp descending"""
        from django.utils import timezone
        import time
        
        # Create first log entry
        log1 = AgentAuditLog.objects.create(
            agent=self.agent,
            action_type='project_assigned',
            action_description='First action'
        )
        
        # Wait a bit to ensure different timestamps
        time.sleep(0.01)
        
        # Create second log entry
        log2 = AgentAuditLog.objects.create(
            agent=self.agent,
            action_type='work_started',
            action_description='Second action'
        )
        
        # Get all logs - should be ordered by timestamp descending
        logs = list(AgentAuditLog.objects.all())
        self.assertEqual(logs[0], log2)  # Most recent first
        self.assertEqual(logs[1], log1)  # Older second


class AIAgentModelRelationshipTest(TestCase):
    """Test relationships between AI agent models"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testagent',
            email='agent@test.com',
            password='testpass123'
        )
        self.agent = AIAgent.objects.create(
            user=self.user,
            agent_type='code_generator',
            agent_name='Test Agent',
            agent_description='Test description'
        )
    
    def test_agent_capabilities_relationship(self):
        """Test relationship between agent and capabilities"""
        # Create capabilities
        cap1 = AgentCapability.objects.create(
            agent=self.agent,
            category='programming_language',
            skill_name='Python',
            proficiency_level='advanced'
        )
        cap2 = AgentCapability.objects.create(
            agent=self.agent,
            category='framework',
            skill_name='Django',
            proficiency_level='expert'
        )
        
        # Test reverse relationship
        capabilities = self.agent.capabilities.all()
        self.assertEqual(capabilities.count(), 2)
        self.assertIn(cap1, capabilities)
        self.assertIn(cap2, capabilities)
    
    def test_agent_work_preferences_relationship(self):
        """Test relationship between agent and work preferences"""
        preferences = AgentWorkPreference.objects.create(
            agent=self.agent,
            preferred_project_types=['web_development'],
            min_complexity_level='simple',
            max_complexity_level='complex'
        )
        
        # Test reverse relationship
        self.assertEqual(self.agent.work_preferences, preferences)
    
    def test_agent_performance_metrics_relationship(self):
        """Test relationship between agent and performance metrics"""
        from django.utils import timezone
        
        start_time = timezone.now() - timedelta(hours=1)
        end_time = timezone.now()
        
        metric1 = AgentPerformanceMetric.objects.create(
            agent=self.agent,
            metric_type='project_completion',
            metric_value=95.0,
            metric_unit='percentage',
            measurement_period_start=start_time,
            measurement_period_end=end_time
        )
        metric2 = AgentPerformanceMetric.objects.create(
            agent=self.agent,
            metric_type='quality_score',
            metric_value=4.5,
            metric_unit='score',
            measurement_period_start=start_time,
            measurement_period_end=end_time
        )
        
        # Test reverse relationship
        metrics = self.agent.performance_metrics.all()
        self.assertEqual(metrics.count(), 2)
        self.assertIn(metric1, metrics)
        self.assertIn(metric2, metrics)
    
    def test_agent_audit_logs_relationship(self):
        """Test relationship between agent and audit logs"""
        log1 = AgentAuditLog.objects.create(
            agent=self.agent,
            action_type='project_assigned',
            action_description='First action'
        )
        log2 = AgentAuditLog.objects.create(
            agent=self.agent,
            action_type='work_started',
            action_description='Second action'
        )
        
        # Test reverse relationship
        logs = self.agent.audit_logs.all()
        self.assertEqual(logs.count(), 2)
        # Logs should be ordered by timestamp descending
        self.assertEqual(logs[0], log2)
        self.assertEqual(logs[1], log1)
    
    def test_cascade_deletion(self):
        """Test that related objects are deleted when agent is deleted"""
        # Create related objects
        AgentCapability.objects.create(
            agent=self.agent,
            category='programming_language',
            skill_name='Python',
            proficiency_level='advanced'
        )
        AgentWorkPreference.objects.create(
            agent=self.agent,
            preferred_project_types=['web_development']
        )
        
        # Delete agent
        agent_id = self.agent.id
        self.agent.delete()
        
        # Check that related objects are also deleted
        self.assertEqual(AgentCapability.objects.filter(agent_id=agent_id).count(), 0)
        self.assertEqual(AgentWorkPreference.objects.filter(agent_id=agent_id).count(), 0)