"""
Unit tests for User models
"""
import uuid
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from users.models import User, DeveloperProfile, ClientProfile

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""
    
    def setUp(self):
        """Set up test data"""
        self.user_data = {
            'email': 'test@example.com',
            'role': 'developer',
            'github_username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User'
        }
    
    def test_create_user(self):
        """Test creating a user"""
        user = User.objects.create(**self.user_data)
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'developer')
        self.assertEqual(user.github_username, 'testuser')
        self.assertTrue(isinstance(user.id, uuid.UUID))
        self.assertFalse(user.is_verified)
    
    def test_user_str_representation(self):
        """Test user string representation"""
        user = User.objects.create(**self.user_data)
        expected_str = f"{user.first_name} {user.last_name} ({user.email})"
        self.assertEqual(str(user), expected_str)
    
    def test_user_email_unique(self):
        """Test that user email must be unique"""
        User.objects.create(**self.user_data)
        
        with self.assertRaises(Exception):
            User.objects.create(**self.user_data)
    
    def test_user_role_choices(self):
        """Test user role validation"""
        valid_roles = ['client', 'developer', 'admin']
        
        for role in valid_roles:
            user_data = self.user_data.copy()
            user_data['email'] = f'{role}@example.com'
            user_data['role'] = role
            user = User.objects.create(**user_data)
            self.assertEqual(user.role, role)
    
    def test_user_invalid_role(self):
        """Test invalid role raises validation error"""
        user_data = self.user_data.copy()
        user_data['role'] = 'invalid_role'
        
        with self.assertRaises(ValidationError):
            user = User(**user_data)
            user.full_clean()


class DeveloperProfileModelTest(TestCase):
    """Test cases for DeveloperProfile model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create(
            email='dev@example.com',
            role='developer',
            github_username='devuser'
        )
        
        self.profile_data = {
            'user': self.user,
            'skills': ['Python', 'Django', 'React'],
            'experience_level': 'mid',
            'hourly_rate': Decimal('75.00'),
            'availability_status': 'available',
            'bio': 'Experienced full-stack developer',
            'location': 'San Francisco, CA',
            'timezone': 'America/Los_Angeles'
        }
    
    def test_create_developer_profile(self):
        """Test creating a developer profile"""
        profile = DeveloperProfile.objects.create(**self.profile_data)
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.skills, ['Python', 'Django', 'React'])
        self.assertEqual(profile.experience_level, 'mid')
        self.assertEqual(profile.hourly_rate, Decimal('75.00'))
        self.assertEqual(profile.availability_status, 'available')
        self.assertEqual(profile.reputation_score, 0.0)
    
    def test_developer_profile_str_representation(self):
        """Test developer profile string representation"""
        profile = DeveloperProfile.objects.create(**self.profile_data)
        expected_str = f"Developer Profile - {self.user.email}"
        self.assertEqual(str(profile), expected_str)
    
    def test_experience_level_choices(self):
        """Test experience level validation"""
        valid_levels = ['junior', 'mid', 'senior', 'lead']
        
        for level in valid_levels:
            profile_data = self.profile_data.copy()
            profile_data['experience_level'] = level
            profile = DeveloperProfile.objects.create(**profile_data)
            self.assertEqual(profile.experience_level, level)
    
    def test_availability_status_choices(self):
        """Test availability status validation"""
        valid_statuses = ['available', 'busy', 'unavailable']
        
        for status in valid_statuses:
            profile_data = self.profile_data.copy()
            profile_data['availability_status'] = status
            profile = DeveloperProfile.objects.create(**profile_data)
            self.assertEqual(profile.availability_status, status)
    
    def test_hourly_rate_validation(self):
        """Test hourly rate validation"""
        profile_data = self.profile_data.copy()
        profile_data['hourly_rate'] = Decimal('-10.00')
        
        with self.assertRaises(ValidationError):
            profile = DeveloperProfile(**profile_data)
            profile.full_clean()
    
    def test_github_analysis_default(self):
        """Test github_analysis field defaults to empty dict"""
        profile = DeveloperProfile.objects.create(**self.profile_data)
        self.assertEqual(profile.github_analysis, {})
    
    def test_skill_embeddings_default(self):
        """Test skill_embeddings field defaults to empty list"""
        profile = DeveloperProfile.objects.create(**self.profile_data)
        self.assertEqual(profile.skill_embeddings, [])


class ClientProfileModelTest(TestCase):
    """Test cases for ClientProfile model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create(
            email='client@example.com',
            role='client',
            first_name='Client',
            last_name='User'
        )
        
        self.profile_data = {
            'user': self.user,
            'company_name': 'Tech Corp',
            'company_size': 'medium',
            'industry': 'Technology',
            'budget_range': 'medium',
            'preferred_communication': 'email'
        }
    
    def test_create_client_profile(self):
        """Test creating a client profile"""
        profile = ClientProfile.objects.create(**self.profile_data)
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.company_name, 'Tech Corp')
        self.assertEqual(profile.company_size, 'medium')
        self.assertEqual(profile.industry, 'Technology')
        self.assertEqual(profile.budget_range, 'medium')
    
    def test_client_profile_str_representation(self):
        """Test client profile string representation"""
        profile = ClientProfile.objects.create(**self.profile_data)
        expected_str = f"Client Profile - {self.user.email}"
        self.assertEqual(str(profile), expected_str)
    
    def test_company_size_choices(self):
        """Test company size validation"""
        valid_sizes = ['startup', 'small', 'medium', 'large', 'enterprise']
        
        for size in valid_sizes:
            profile_data = self.profile_data.copy()
            profile_data['company_size'] = size
            profile = ClientProfile.objects.create(**profile_data)
            self.assertEqual(profile.company_size, size)
    
    def test_budget_range_choices(self):
        """Test budget range validation"""
        valid_ranges = ['low', 'medium', 'high', 'enterprise']
        
        for budget_range in valid_ranges:
            profile_data = self.profile_data.copy()
            profile_data['budget_range'] = budget_range
            profile = ClientProfile.objects.create(**profile_data)
            self.assertEqual(profile.budget_range, budget_range)