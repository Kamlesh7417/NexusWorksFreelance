"""
Management command to reconcile payments with payment gateways
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from payments.services import PaymentReconciliationService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Reconcile payments with payment gateways'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--gateway',
            type=str,
            choices=['stripe', 'paypal', 'all'],
            default='all',
            help='Payment gateway to reconcile (default: all)',
        )
        parser.add_argument(
            '--start-date',
            type=str,
            help='Start date for reconciliation (YYYY-MM-DD format)',
        )
        parser.add_argument(
            '--end-date',
            type=str,
            help='End date for reconciliation (YYYY-MM-DD format)',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(
                f'Starting payment reconciliation at {timezone.now()}'
            )
        )
        
        try:
            reconciliation_service = PaymentReconciliationService()
            
            gateways = ['stripe', 'paypal'] if options['gateway'] == 'all' else [options['gateway']]
            
            for gateway in gateways:
                self.stdout.write(f'Reconciling {gateway} transactions...')
                
                try:
                    result = reconciliation_service.reconcile_gateway_transactions(gateway)
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'{gateway.title()} reconciliation completed:'
                        )
                    )
                    self.stdout.write(f'  - Total payments checked: {result["total_payments_checked"]}')
                    self.stdout.write(f'  - Mismatches found: {result["mismatches"]}')
                    
                    if result['mismatches'] > 0:
                        self.stdout.write(
                            self.style.WARNING(
                                f'  - {result["mismatches"]} payments need attention'
                            )
                        )
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f'Error reconciling {gateway}: {str(e)}'
                        )
                    )
            
            # Generate report if date range provided
            if options['start_date'] and options['end_date']:
                from datetime import datetime
                
                start_date = datetime.fromisoformat(options['start_date'])
                end_date = datetime.fromisoformat(options['end_date'])
                
                report = reconciliation_service.generate_payment_report(start_date, end_date)
                
                self.stdout.write(
                    self.style.SUCCESS('\nPayment Report Summary:')
                )
                self.stdout.write(f'  - Total payments: {report["summary"]["total_payments"]}')
                self.stdout.write(f'  - Total amount: ${report["summary"]["total_amount"]}')
                self.stdout.write(f'  - Platform fees: ${report["summary"]["total_platform_fees"]}')
                self.stdout.write(f'  - Gateway fees: ${report["summary"]["total_gateway_fees"]}')
                self.stdout.write(f'  - Net amount paid: ${report["summary"]["net_amount_paid"]}')
                
        except Exception as e:
            logger.error(f"Error in payment reconciliation: {str(e)}")
            self.stdout.write(
                self.style.ERROR(f'Error in payment reconciliation: {str(e)}')
            )
            raise