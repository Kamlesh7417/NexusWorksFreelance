"""
Management command to manually trigger developer skill profile updates.
Useful for testing and one-time updates.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from users.models import User, DeveloperProfile
from ai_services.tasks import update_developer_profile, update_all_developer_profiles
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Update developer skill profiles from GitHub analysis'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=str,
            help='Update specific user by ID',
        )
        parser.add_argument(
            '--username',
            type=str,
            help='Update specific user by username',
        )
        parser.add_argument(
            '--github-username',
            type=str,
            help='Update specific user by GitHub username',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Update all developer profiles',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update even if recently updated',
        )
        parser.add_argument(
            '--sync',
            action='store_true',
            help='Run synchronously instead of using Celery tasks',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help='Batch size for bulk updates (default: 10)',
        )

    def handle(self, *args, **options):
        try:
            if options['all']:
                self._update_all_profiles(options)
            elif options['user_id'] or options['username'] or options['github_username']:
                self._update_single_profile(options)
            else:
                raise CommandError('Please specify --all or provide user identification (--user-id, --username, or --github-username)')
                
        except Exception as e:
            logger.error(f"Command execution failed: {str(e)}")
            raise CommandError(f"Command failed: {str(e)}")

    def _update_single_profile(self, options):
        """Update a single developer profile."""
        user = self._get_user(options)
        
        if not user:
            raise CommandError('User not found')
        
        if user.role != 'developer':
            raise CommandError('User is not a developer')
        
        if not hasattr(user, 'developer_profile'):
            raise CommandError('User does not have a developer profile')
        
        if not user.github_username:
            raise CommandError('User does not have a GitHub username configured')
        
        self.stdout.write(f"Updating profile for user: {user.username} (GitHub: {user.github_username})")
        
        if options['sync']:
            # Run synchronously for testing
            from ai_services.tasks import update_developer_profile
            result = update_developer_profile(str(user.id), options['force'])
            self._display_result(result)
        else:
            # Use Celery task
            task = update_developer_profile.delay(str(user.id), options['force'])
            self.stdout.write(
                self.style.SUCCESS(f"Profile update task queued with ID: {task.id}")
            )
            self.stdout.write("Use 'celery -A freelance_platform worker' to process the task")

    def _update_all_profiles(self, options):
        """Update all developer profiles."""
        developers_count = User.objects.filter(
            role='developer',
            github_username__isnull=False,
            developer_profile__isnull=False
        ).count()
        
        if developers_count == 0:
            self.stdout.write(self.style.WARNING("No developers with GitHub usernames found"))
            return
        
        self.stdout.write(f"Found {developers_count} developers to update")
        
        if options['sync']:
            self.stdout.write(self.style.WARNING(
                "Synchronous update of all profiles may take a long time and is not recommended"
            ))
            if not self._confirm_action("Continue with synchronous update?"):
                return
            
            # Update profiles one by one synchronously
            developers = User.objects.filter(
                role='developer',
                github_username__isnull=False,
                developer_profile__isnull=False
            )
            
            success_count = 0
            error_count = 0
            
            for user in developers:
                try:
                    self.stdout.write(f"Updating {user.username}...")
                    from ai_services.tasks import update_developer_profile
                    result = update_developer_profile(str(user.id), options['force'])
                    
                    if result.get('success'):
                        success_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"✓ Updated {user.username}")
                        )
                    else:
                        error_count += 1
                        self.stdout.write(
                            self.style.ERROR(f"✗ Failed to update {user.username}: {result.get('error', 'Unknown error')}")
                        )
                        
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f"✗ Error updating {user.username}: {str(e)}")
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f"Completed: {success_count} successful, {error_count} errors")
            )
        else:
            # Use Celery task
            task = update_all_developer_profiles.delay(options['batch_size'], options['force'])
            self.stdout.write(
                self.style.SUCCESS(f"Batch update task queued with ID: {task.id}")
            )
            self.stdout.write("Use 'celery -A freelance_platform worker' to process the tasks")

    def _get_user(self, options):
        """Get user based on provided options."""
        if options['user_id']:
            try:
                return User.objects.get(id=options['user_id'])
            except User.DoesNotExist:
                return None
        elif options['username']:
            try:
                return User.objects.get(username=options['username'])
            except User.DoesNotExist:
                return None
        elif options['github_username']:
            try:
                return User.objects.get(github_username=options['github_username'])
            except User.DoesNotExist:
                return None
        return None

    def _display_result(self, result):
        """Display the result of a profile update."""
        if result.get('success'):
            if result.get('skipped'):
                self.stdout.write(
                    self.style.WARNING(f"Skipped: {result.get('reason', 'Unknown reason')}")
                )
            else:
                self.stdout.write(self.style.SUCCESS("Profile updated successfully!"))
                self.stdout.write(f"Skills count: {result.get('skills_count', 0)}")
                self.stdout.write(f"Embeddings count: {result.get('embeddings_count', 0)}")
                self.stdout.write(f"Reputation score: {result.get('reputation_score', 0)}")
        else:
            self.stdout.write(
                self.style.ERROR(f"Update failed: {result.get('error', 'Unknown error')}")
            )

    def _confirm_action(self, message):
        """Ask for user confirmation."""
        response = input(f"{message} (y/N): ")
        return response.lower() in ['y', 'yes']