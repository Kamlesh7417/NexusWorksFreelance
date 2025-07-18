"""
Management command to manually trigger skill proficiency updates with confidence scoring.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from users.models import User, DeveloperProfile
from ai_services.models import DeveloperSkillProficiency, SkillNode
from ai_services.tasks import (
    update_developer_skill_proficiency, 
    periodic_skill_profile_updates,
    validate_and_update_skill_confidence
)
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Update developer skill proficiency with confidence scoring'

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
            '--periodic',
            action='store_true',
            help='Run periodic skill profile updates',
        )
        parser.add_argument(
            '--validate-confidence',
            action='store_true',
            help='Validate and update skill confidence scores',
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
            default=5,
            help='Batch size for bulk updates (default: 5)',
        )
        parser.add_argument(
            '--max-updates',
            type=int,
            default=25,
            help='Maximum updates per periodic run (default: 25)',
        )
        parser.add_argument(
            '--show-stats',
            action='store_true',
            help='Show current skill proficiency statistics',
        )

    def handle(self, *args, **options):
        try:
            if options['show_stats']:
                self._show_statistics()
            elif options['periodic']:
                self._run_periodic_updates(options)
            elif options['validate_confidence']:
                self._validate_confidence_scores(options)
            elif options['user_id'] or options['username'] or options['github_username']:
                self._update_single_profile(options)
            else:
                raise CommandError(
                    'Please specify --periodic, --validate-confidence, --show-stats, '
                    'or provide user identification (--user-id, --username, or --github-username)'
                )
                
        except Exception as e:
            logger.error(f"Command execution failed: {str(e)}")
            raise CommandError(f"Command failed: {str(e)}")

    def _update_single_profile(self, options):
        """Update skill proficiency for a single developer."""
        user = self._get_user(options)
        
        if not user:
            raise CommandError('User not found')
        
        if user.role != 'developer':
            raise CommandError('User is not a developer')
        
        if not hasattr(user, 'developer_profile'):
            raise CommandError('User does not have a developer profile')
        
        if not user.github_username:
            raise CommandError('User does not have a GitHub username configured')
        
        self.stdout.write(f"Updating skill proficiency for user: {user.username} (GitHub: {user.github_username})")
        
        if options['sync']:
            # Run synchronously for testing
            from ai_services.tasks import update_developer_skill_proficiency
            result = update_developer_skill_proficiency(str(user.id), options['force'])
            self._display_proficiency_result(result)
        else:
            # Use Celery task
            task = update_developer_skill_proficiency.delay(str(user.id), options['force'])
            self.stdout.write(
                self.style.SUCCESS(f"Skill proficiency update task queued with ID: {task.id}")
            )
            self.stdout.write("Use 'celery -A freelance_platform worker' to process the task")

    def _run_periodic_updates(self, options):
        """Run periodic skill profile updates."""
        self.stdout.write("Running periodic skill profile updates...")
        
        if options['sync']:
            from ai_services.tasks import periodic_skill_profile_updates
            result = periodic_skill_profile_updates(
                options['batch_size'], 
                options['max_updates']
            )
            self._display_periodic_result(result)
        else:
            task = periodic_skill_profile_updates.delay(
                options['batch_size'], 
                options['max_updates']
            )
            self.stdout.write(
                self.style.SUCCESS(f"Periodic updates task queued with ID: {task.id}")
            )

    def _validate_confidence_scores(self, options):
        """Validate and update skill confidence scores."""
        self.stdout.write("Validating skill confidence scores...")
        
        if options['sync']:
            from ai_services.tasks import validate_and_update_skill_confidence
            result = validate_and_update_skill_confidence(options['batch_size'])
            self._display_validation_result(result)
        else:
            task = validate_and_update_skill_confidence.delay(options['batch_size'])
            self.stdout.write(
                self.style.SUCCESS(f"Confidence validation task queued with ID: {task.id}")
            )

    def _show_statistics(self):
        """Show current skill proficiency statistics."""
        self.stdout.write(self.style.SUCCESS("=== Skill Proficiency Statistics ==="))
        
        # Total developers with skill proficiency records
        total_developers = User.objects.filter(
            role='developer',
            developerskillproficiency__isnull=False
        ).distinct().count()
        
        # Total skill proficiency records
        total_skills = DeveloperSkillProficiency.objects.count()
        
        # Skills by proficiency level
        proficiency_stats = {}
        for level, _ in DeveloperSkillProficiency.SKILL_LEVELS:
            count = DeveloperSkillProficiency.objects.filter(proficiency_level=level).count()
            proficiency_stats[level] = count
        
        # Confidence score distribution
        high_confidence = DeveloperSkillProficiency.objects.filter(confidence_score__gte=0.8).count()
        medium_confidence = DeveloperSkillProficiency.objects.filter(
            confidence_score__gte=0.5, confidence_score__lt=0.8
        ).count()
        low_confidence = DeveloperSkillProficiency.objects.filter(confidence_score__lt=0.5).count()
        
        # Most common skills
        from django.db.models import Count
        top_skills = SkillNode.objects.annotate(
            developer_count=Count('developerskillproficiency')
        ).order_by('-developer_count')[:10]
        
        # Display statistics
        self.stdout.write(f"Total developers with skills: {total_developers}")
        self.stdout.write(f"Total skill records: {total_skills}")
        self.stdout.write("")
        
        self.stdout.write("Proficiency Level Distribution:")
        for level, count in proficiency_stats.items():
            percentage = (count / max(1, total_skills)) * 100
            self.stdout.write(f"  {level.title()}: {count} ({percentage:.1f}%)")
        self.stdout.write("")
        
        self.stdout.write("Confidence Score Distribution:")
        self.stdout.write(f"  High (≥80%): {high_confidence}")
        self.stdout.write(f"  Medium (50-79%): {medium_confidence}")
        self.stdout.write(f"  Low (<50%): {low_confidence}")
        self.stdout.write("")
        
        self.stdout.write("Top 10 Skills:")
        for i, skill in enumerate(top_skills, 1):
            self.stdout.write(f"  {i}. {skill.name} ({skill.developer_count} developers)")

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

    def _display_proficiency_result(self, result):
        """Display the result of a skill proficiency update."""
        if result.get('success'):
            if result.get('skipped'):
                self.stdout.write(
                    self.style.WARNING(f"Skipped: {result.get('reason', 'Unknown reason')}")
                )
            else:
                self.stdout.write(self.style.SUCCESS("Skill proficiency updated successfully!"))
                self.stdout.write(f"Validated skills: {result.get('validated_skills_count', 0)}")
                self.stdout.write(f"Created skills: {len(result.get('created_skills', []))}")
                self.stdout.write(f"Updated skills: {len(result.get('updated_skills', []))}")
                self.stdout.write(f"Validation rate: {result.get('validation_rate', 0):.2%}")
                
                # Show confidence scores
                confidence_scores = result.get('confidence_scores', {})
                if confidence_scores:
                    self.stdout.write("\nConfidence Scores:")
                    for skill, score in sorted(confidence_scores.items(), key=lambda x: x[1], reverse=True)[:10]:
                        self.stdout.write(f"  {skill}: {score:.1f}%")
        else:
            self.stdout.write(
                self.style.ERROR(f"Update failed: {result.get('error', 'Unknown error')}")
            )

    def _display_periodic_result(self, result):
        """Display the result of periodic updates."""
        if result.get('success'):
            self.stdout.write(self.style.SUCCESS("Periodic updates completed!"))
            self.stdout.write(f"Total developers found: {result.get('total', 0)}")
            self.stdout.write(f"Updates processed: {result.get('processed', 0)}")
            
            if result.get('message'):
                self.stdout.write(f"Message: {result['message']}")
            
            queued_tasks = result.get('queued_tasks', [])
            if queued_tasks:
                self.stdout.write(f"\nQueued {len(queued_tasks)} tasks:")
                for task_info in queued_tasks[:5]:  # Show first 5
                    self.stdout.write(f"  {task_info['username']} ({task_info['github_username']})")
                if len(queued_tasks) > 5:
                    self.stdout.write(f"  ... and {len(queued_tasks) - 5} more")
        else:
            self.stdout.write(
                self.style.ERROR(f"Periodic updates failed: {result.get('error', 'Unknown error')}")
            )

    def _display_validation_result(self, result):
        """Display the result of confidence validation."""
        if result.get('success'):
            self.stdout.write(self.style.SUCCESS("Confidence validation completed!"))
            self.stdout.write(f"Total records processed: {result.get('processed', 0)}")
            self.stdout.write(f"Records updated: {result.get('updated', 0)}")
            self.stdout.write(f"Errors: {result.get('errors', 0)}")
            
            if result.get('updated', 0) > 0:
                update_rate = (result['updated'] / max(1, result.get('processed', 1))) * 100
                self.stdout.write(f"Update rate: {update_rate:.1f}%")
        else:
            self.stdout.write(
                self.style.ERROR(f"Validation failed: {result.get('error', 'Unknown error')}")
            )