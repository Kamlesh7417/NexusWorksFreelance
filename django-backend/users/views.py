from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Skill, UserSkill, Portfolio
from .serializers import (
    UserSerializer, UserProfileSerializer, 
    SkillSerializer, UserSkillSerializer, PortfolioSerializer
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing user instances"""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return objects for the current authenticated user only"""
        user = self.request.user
        
        # Admin can see all users
        if user.is_staff:
            return self.queryset
        
        # Regular users can only see themselves
        return self.queryset.filter(id=user.id)
    
    def get_serializer_class(self):
        """Return appropriate serializer class"""
        if self.action == 'update_profile':
            return UserProfileSerializer
        return self.serializer_class
    
    @action(detail=False, methods=['get', 'put'])
    def profile(self, request):
        """Get or update user profile"""
        user = request.user
        
        if request.method == 'GET':
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        if request.method == 'PUT':
            serializer = UserProfileSerializer(user, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(UserSerializer(user).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing skills"""
    
    queryset = Skill.objects.filter(is_active=True)
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter skills by category if provided"""
        queryset = self.queryset
        category = self.request.query_params.get('category')
        
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset


class UserSkillViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user skills"""
    
    serializer_class = UserSkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return skills for the current user only"""
        return UserSkill.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create a new user skill"""
        serializer.save(user=self.request.user)


class PortfolioViewSet(viewsets.ModelViewSet):
    """ViewSet for managing portfolio items"""
    
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return portfolio items for the current user only"""
        return Portfolio.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create a new portfolio item"""
        serializer.save(user=self.request.user)