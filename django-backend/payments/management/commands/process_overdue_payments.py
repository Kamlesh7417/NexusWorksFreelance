"""
Management command to process overdue payments and pause projects
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from payments.services import PaymentDelayService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check for overdue payments and pause projects as needed'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without making changes (preview mode)',
        )
        parser.add_argument(
            '--days-overdue',
            type=int,
            default=7,
            help='Number of days overdue before pausing project (default: 7)',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(
                f'Starting overdue payment check at {timezone.now()}'
            )
        )
        
        try:
            delay_service = PaymentDelayService()
            
            if options['dry_run']:
                self.stdout.write(
                    self.style.WARNING('Running in DRY RUN mode - no changes will be made')
                )
                # In a real implementation, we'd add a dry_run parameter to the service
                # For now, just log what would happen
                self.stdout.write('Would check for overdue payments and pause projects')
            else:
                delay_service.check_overdue_payments()
                self.stdout.write(
                    self.style.SUCCESS('Overdue payment check completed successfully')
                )
                
        except Exception as e:
            logger.error(f"Error in overdue payment check: {str(e)}")
            self.stdout.write(
                self.style.ERROR(f'Error processing overdue payments: {str(e)}')
            )
            raise