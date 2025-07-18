from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import transaction
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, 
    CustomTokenObtainPairSerializer, PasswordChangeSerializer,
    PasswordResetSerializer, PasswordResetConfirmSerializer,
    GithubOAuthSerializer
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint"""
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Add custom claims
            access_token['user_type'] = user.user_type
            access_token['email'] = user.email
            access_token['username'] = user.username
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type,
                    'profile_completed': user.profile_completed,
                    'github_username': user.github_username,
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view"""
    
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Add user data to response
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data['user']
                response.data['user'] = {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type,
                    'profile_completed': user.profile_completed,
                    'github_username': user.github_username,
                }
        
        return response


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def github_oauth_view(request):
    """GitHub OAuth authentication endpoint"""
    serializer = GithubOAuthSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            with transaction.atomic():
                github_data = serializer.validated_data
                
                # Check if user exists by GitHub ID or email
                user = None
                created = False
                
                # First try to find by GitHub username
                if github_data.get('username'):
                    try:
                        user = User.objects.get(github_username=github_data['username'])
                    except User.DoesNotExist:
                        pass
                
                # If not found by GitHub username, try by email
                if not user and github_data.get('email'):
                    try:
                        user = User.objects.get(email=github_data['email'])
                        # Update GitHub username if user exists but doesn't have it
                        if not user.github_username:
                            user.github_username = github_data['username']
                            user.save()
                    except User.DoesNotExist:
                        pass
                
                # If user doesn't exist, create new one
                if not user:
                    user = User.objects.create_user(
                        username=github_data['username'],
                        email=github_data['email'],
                        first_name=github_data.get('first_name', ''),
                        last_name=github_data.get('last_name', ''),
                        user_type='developer',  # Default for GitHub users
                        github_username=github_data['username'],
                        bio=github_data.get('bio', ''),
                        location=github_data.get('location', ''),
                    )
                    created = True
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                
                # Add custom claims
                access_token['user_type'] = user.user_type
                access_token['email'] = user.email
                access_token['username'] = user.username
                
                return Response({
                    'access': str(access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': str(user.id),
                        'email': user.email,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'user_type': user.user_type,
                        'profile_completed': user.profile_completed,
                        'github_username': user.github_username,
                    },
                    'created': created
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {'error': f'Authentication failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    """Get current authenticated user"""
    user = request.user
    return Response({
        'id': str(user.id),
        'email': user.email,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'user_type': user.user_type,
        'profile_completed': user.profile_completed,
        'github_username': user.github_username,
        'bio': user.bio,
        'location': user.location,
        'timezone': user.timezone,
        'hourly_rate': user.hourly_rate,
        'availability_hours_per_week': user.availability_hours_per_week,
        'overall_rating': user.overall_rating,
        'total_reviews': user.total_reviews,
        'projects_completed': user.projects_completed,
        'total_earnings': user.total_earnings,
        'created_at': user.created_at,
        'last_active': user.last_active,
    })


class PasswordChangeView(generics.GenericAPIView):
    """Password change endpoint"""
    
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """Request password reset"""
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        # TODO: Implement password reset email sending
        return Response({'message': 'Password reset email sent'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """Confirm password reset"""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        # TODO: Implement password reset confirmation
        return Response({'message': 'Password reset successful'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
