#!/usr/bin/env python
"""
Comprehensive test runner for Django backend
"""
import os
import sys
import subprocess
import time
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')

import django
from django.conf import settings
from django.test.utils import get_runner
from django.core.management import execute_from_command_line


class TestRunner:
    """Comprehensive test runner with different test categories"""
    
    def __init__(self):
        self.project_dir = project_dir
        self.test_categories = {
            'unit': [
                'users.test_models',
                'projects.test_models', 
                'ai_services.test_models',
                'authentication.test_views',
            ],
            'integration': [
                'tests.test_integration_workflows',
            ],
            'e2e': [
                'tests.test_ai_matching_e2e',
            ],
            'performance': [
                'tests.test_performance',
            ],
            'security': [
                'tests.test_security',
            ]
        }
    
    def setup_django(self):
        """Setup Django for testing"""
        django.setup()
    
    def run_category(self, category: str, verbose: bool = False):
        """Run tests for a specific category"""
        if category not in self.test_categories:
            print(f"Unknown test category: {category}")
            print(f"Available categories: {', '.join(self.test_categories.keys())}")
            return False
        
        print(f"\n{'='*60}")
        print(f"Running {category.upper()} tests")
        print(f"{'='*60}")
        
        test_modules = self.test_categories[category]
        success = True
        
        for module in test_modules:
            print(f"\nRunning tests in {module}...")
            start_time = time.time()
            
            try:
                # Run the specific test module
                cmd = [
                    'python', 'manage.py', 'test', module,
                    '--keepdb',  # Keep test database for faster subsequent runs
                ]
                
                if verbose:
                    cmd.append('--verbosity=2')
                
                result = subprocess.run(cmd, cwd=self.project_dir, capture_output=True, text=True)
                
                end_time = time.time()
                duration = end_time - start_time
                
                if result.returncode == 0:
                    print(f"✅ {module} - PASSED ({duration:.2f}s)")
                else:
                    print(f"❌ {module} - FAILED ({duration:.2f}s)")
                    print("STDOUT:", result.stdout)
                    print("STDERR:", result.stderr)
                    success = False
                    
            except Exception as e:
                print(f"❌ {module} - ERROR: {e}")
                success = False
        
        return success
    
    def run_all(self, verbose: bool = False):
        """Run all test categories"""
        print("Running comprehensive test suite...")
        start_time = time.time()
        
        results = {}
        for category in self.test_categories.keys():
            results[category] = self.run_category(category, verbose)
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Print summary
        print(f"\n{'='*60}")
        print("TEST SUMMARY")
        print(f"{'='*60}")
        
        passed_categories = sum(1 for success in results.values() if success)
        total_categories = len(results)
        
        for category, success in results.items():
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"{category.upper():12} - {status}")
        
        print(f"\nTotal: {passed_categories}/{total_categories} categories passed")
        print(f"Duration: {total_duration:.2f} seconds")
        
        return all(results.values())
    
    def run_coverage(self):
        """Run tests with coverage reporting"""
        print("Running tests with coverage analysis...")
        
        try:
            # Install coverage if not available
            subprocess.run(['pip', 'install', 'coverage'], check=True)
            
            # Run tests with coverage
            cmd = [
                'coverage', 'run', '--source=.', 'manage.py', 'test',
                '--keepdb'
            ]
            
            result = subprocess.run(cmd, cwd=self.project_dir)
            
            if result.returncode == 0:
                # Generate coverage report
                subprocess.run(['coverage', 'report'], cwd=self.project_dir)
                subprocess.run(['coverage', 'html'], cwd=self.project_dir)
                print("\n✅ Coverage report generated in htmlcov/")
            else:
                print("❌ Coverage analysis failed")
                
        except subprocess.CalledProcessError as e:
            print(f"❌ Coverage analysis error: {e}")
    
    def run_linting(self):
        """Run code quality checks"""
        print("Running code quality checks...")
        
        checks = [
            (['flake8', '.'], "Flake8 linting"),
            (['black', '--check', '.'], "Black formatting"),
            (['isort', '--check-only', '.'], "Import sorting"),
        ]
        
        for cmd, description in checks:
            try:
                print(f"\nRunning {description}...")
                result = subprocess.run(cmd, cwd=self.project_dir, capture_output=True, text=True)
                
                if result.returncode == 0:
                    print(f"✅ {description} - PASSED")
                else:
                    print(f"❌ {description} - FAILED")
                    print(result.stdout)
                    print(result.stderr)
                    
            except FileNotFoundError:
                print(f"⚠️  {description} - SKIPPED (tool not installed)")
    
    def setup_test_data(self):
        """Setup test data using mock generators"""
        print("Setting up test data...")
        
        try:
            from tests.mock_data_generators import TestDataFactory
            
            # Create test scenario
            scenario = TestDataFactory.create_complete_project_scenario()
            print(f"✅ Created test scenario with {len(scenario['developers'])} developers")
            
            # Create matching test scenario
            matching_scenario = TestDataFactory.create_matching_test_scenario(50)
            print(f"✅ Created matching scenario with {len(matching_scenario['developers'])} developers")
            
        except Exception as e:
            print(f"❌ Test data setup failed: {e}")


def main():
    """Main test runner function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Django Test Runner')
    parser.add_argument('category', nargs='?', help='Test category to run (unit, integration, e2e, performance, security, all)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--coverage', '-c', action='store_true', help='Run with coverage analysis')
    parser.add_argument('--lint', '-l', action='store_true', help='Run code quality checks')
    parser.add_argument('--setup-data', action='store_true', help='Setup test data')
    
    args = parser.parse_args()
    
    runner = TestRunner()
    runner.setup_django()
    
    if args.setup_data:
        runner.setup_test_data()
        return
    
    if args.lint:
        runner.run_linting()
        return
    
    if args.coverage:
        runner.run_coverage()
        return
    
    category = args.category or 'all'
    
    if category == 'all':
        success = runner.run_all(args.verbose)
    else:
        success = runner.run_category(category, args.verbose)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()