"""
Management command to optimize matching cache performance and cleanup expired entries.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from matching.cache_service import matching_cache_service
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Optimize matching cache performance and cleanup expired entries'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup-only',
            action='store_true',
            help='Only cleanup expired entries without full optimization',
        )
        
        parser.add_argument(
            '--stats-only',
            action='store_true',
            help='Only show cache statistics without making changes',
        )
        
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force optimization even if cache is performing well',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting matching cache optimization...')
        )
        
        # Show current statistics
        stats = matching_cache_service.get_cache_statistics()
        self.display_cache_statistics(stats)
        
        if options['stats_only']:
            return
        
        if options['cleanup_only']:
            # Only cleanup expired entries
            cleaned_count = matching_cache_service.cleanup_expired_cache()
            self.stdout.write(
                self.style.SUCCESS(f'Cleaned up {cleaned_count} expired cache entries')
            )
        else:
            # Full optimization
            optimization_results = matching_cache_service.optimize_cache_performance()
            self.display_optimization_results(optimization_results)
        
        # Show final statistics
        self.stdout.write('\nFinal cache statistics:')
        final_stats = matching_cache_service.get_cache_statistics()
        self.display_cache_statistics(final_stats)
        
        self.stdout.write(
            self.style.SUCCESS('Cache optimization completed successfully!')
        )
    
    def display_cache_statistics(self, stats):
        """Display cache statistics in a formatted way"""
        if not stats:
            self.stdout.write(self.style.WARNING('No cache statistics available'))
            return
        
        self.stdout.write('\n--- Cache Statistics ---')
        self.stdout.write(f'Total entries: {stats.get("total_entries", 0)}')
        self.stdout.write(f'Active entries: {stats.get("active_entries", 0)}')
        self.stdout.write(f'Expired entries: {stats.get("expired_entries", 0)}')
        
        hit_stats = stats.get('hit_statistics', {})
        if hit_stats:
            self.stdout.write(f'Total hits: {hit_stats.get("total_hits", 0)}')
            self.stdout.write(f'Average hits per entry: {hit_stats.get("avg_hits", 0):.2f}')
            self.stdout.write(f'Max hits: {hit_stats.get("max_hits", 0)}')
        
        efficiency = stats.get('cache_efficiency', 0)
        if efficiency > 0.8:
            style = self.style.SUCCESS
        elif efficiency > 0.5:
            style = self.style.WARNING
        else:
            style = self.style.ERROR
        
        self.stdout.write(style(f'Cache efficiency: {efficiency:.2%}'))
        
        # Search type breakdown
        search_types = stats.get('search_type_breakdown', [])
        if search_types:
            self.stdout.write('\nSearch type breakdown:')
            for search_type in search_types:
                self.stdout.write(
                    f'  {search_type["search_type"]}: {search_type["count"]} entries, '
                    f'{search_type["total_hits"]} hits'
                )
    
    def display_optimization_results(self, results):
        """Display optimization results"""
        if not results:
            self.stdout.write(self.style.WARNING('No optimization results available'))
            return
        
        self.stdout.write('\n--- Optimization Results ---')
        self.stdout.write(f'Entries before optimization: {results.get("total_before", 0)}')
        self.stdout.write(f'Expired entries cleaned: {results.get("expired_cleaned", 0)}')
        self.stdout.write(f'Low-hit entries cleaned: {results.get("low_hit_cleaned", 0)}')
        self.stdout.write(f'Entries after optimization: {results.get("total_after", 0)}')
        
        total_cleaned = results.get("expired_cleaned", 0) + results.get("low_hit_cleaned", 0)
        if total_cleaned > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Total entries cleaned: {total_cleaned}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('No cleanup needed - cache is already optimized')
            )