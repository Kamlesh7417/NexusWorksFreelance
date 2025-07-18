# Testing Documentation

This document provides comprehensive information about the testing infrastructure for the AI-powered freelancing platform.

## Overview

The testing suite includes:
- **Unit Tests**: Django models, services, and API endpoints
- **Integration Tests**: Complete workflows and API communication
- **End-to-End Tests**: Full user journeys using Playwright
- **Performance Tests**: Matching algorithms and database queries
- **Security Tests**: Authentication and payment processing
- **Frontend Component Tests**: React components with Testing Library

## Test Structure

```
├── django-backend/
│   ├── users/test_models.py              # User model tests
│   ├── projects/test_models.py           # Project model tests
│   ├── ai_services/test_models.py        # AI service model tests
│   ├── authentication/test_views.py      # Auth API tests
│   ├── tests/
│   │   ├── test_integration_workflows.py # Integration tests
│   │   ├── test_ai_matching_e2e.py      # AI matching E2E tests
│   │   ├── test_performance.py          # Performance tests
│   │   ├── test_security.py             # Security tests
│   │   └── mock_data_generators.py      # Test data generators
│   └── run_tests.py                     # Django test runner
├── __tests__/
│   ├── components/
│   │   ├── auth/auth-forms.test.tsx     # Auth component tests
│   │   └── ai/project-submission-form.test.tsx # AI component tests
│   └── integration/
│       └── api-integration.test.ts      # API integration tests
├── e2e/
│   ├── auth-flow.spec.ts               # E2E auth tests
│   └── project-creation-flow.spec.ts   # E2E project tests
├── jest.config.js                      # Jest configuration
├── playwright.config.ts               # Playwright configuration
└── run-all-tests.sh                   # Master test runner
```

## Running Tests

### Quick Start

Run all tests:
```bash
./run-all-tests.sh
```

### Individual Test Categories

**Backend Tests Only:**
```bash
./run-all-tests.sh --backend-only
```

**Frontend Tests Only:**
```bash
./run-all-tests.sh --frontend-only
```

**E2E Tests Only:**
```bash
./run-all-tests.sh --e2e-only
```

**With Coverage Reports:**
```bash
./run-all-tests.sh --coverage
```

### Django Backend Tests

Run specific test categories:
```bash
cd django-backend
python run_tests.py unit          # Unit tests
python run_tests.py integration   # Integration tests
python run_tests.py e2e          # AI matching E2E tests
python run_tests.py performance  # Performance tests
python run_tests.py security     # Security tests
python run_tests.py all          # All categories
```

With coverage:
```bash
python run_tests.py --coverage
```

### Frontend Tests

Run Jest tests:
```bash
npm test                    # Interactive mode
npm test -- --watchAll=false  # Single run
npm run test:coverage      # With coverage
```

### End-to-End Tests

Run Playwright tests:
```bash
npx playwright test                    # All browsers
npx playwright test --headed          # With browser UI
npx playwright test --project=chromium # Specific browser
```

## Test Categories

### 1. Unit Tests

**Django Models:**
- User model validation and relationships
- Project model business logic
- AI service model data integrity
- Payment model calculations

**API Endpoints:**
- Authentication endpoints
- Project CRUD operations
- Matching service APIs
- Payment processing APIs

**Frontend Components:**
- Authentication forms
- Project submission forms
- AI matching results display
- Payment interfaces

### 2. Integration Tests

**Complete Workflows:**
- Project creation → AI analysis → Developer matching
- Team hiring → Task assignment → Payment processing
- User registration → Profile setup → Project participation

**API Communication:**
- Next.js ↔ Django API integration
- Real-time data synchronization
- Error handling and retry logic

### 3. End-to-End Tests

**User Journeys:**
- Client registration and project creation
- Developer registration and profile setup
- Complete project workflow from creation to completion
- Payment processing and dispute resolution

**Cross-browser Testing:**
- Chrome, Firefox, Safari
- Mobile responsive design
- Accessibility compliance

### 4. Performance Tests

**Matching Algorithms:**
- Large dataset performance (200+ developers)
- Concurrent matching requests
- Database query optimization
- Vector similarity search performance

**Load Testing:**
- API endpoint response times
- Database connection pooling
- Caching effectiveness

### 5. Security Tests

**Authentication:**
- Password strength validation
- Rate limiting
- Token expiration and refresh
- SQL injection protection
- XSS protection

**Authorization:**
- Role-based access control
- Data isolation between users
- API endpoint protection

**Payment Security:**
- Payment data encryption
- Amount validation
- Replay attack protection
- Gateway error handling

## Mock Data Generators

The testing suite includes comprehensive mock data generators:

```python
from tests.mock_data_generators import TestDataFactory

# Create complete test scenario
scenario = TestDataFactory.create_complete_project_scenario()

# Create matching test scenario
matching_scenario = TestDataFactory.create_matching_test_scenario(50)
```

**Available Generators:**
- `UserMockGenerator`: Users and profiles
- `ProjectMockGenerator`: Projects and tasks
- `AIMockGenerator`: AI analysis results
- `TestDataFactory`: Complete scenarios

## Coverage Requirements

**Minimum Coverage Thresholds:**
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

**Coverage Reports:**
- Frontend: `coverage/lcov-report/index.html`
- Backend: `django-backend/htmlcov/index.html`

## Continuous Integration

The test suite is designed for CI/CD integration:

```yaml
# Example GitHub Actions workflow
- name: Run Backend Tests
  run: cd django-backend && python run_tests.py all

- name: Run Frontend Tests
  run: npm test -- --watchAll=false --coverage

- name: Run E2E Tests
  run: npx playwright test
```

## Test Data Management

**Test Database:**
- Uses `--keepdb` flag for faster test runs
- Automatic cleanup between test runs
- Isolated test data per test case

**Mock Services:**
- AI service responses
- Payment gateway interactions
- GitHub API responses
- Email service calls

## Debugging Tests

**Django Tests:**
```bash
python run_tests.py unit --verbose
python manage.py test specific.test.module --pdb
```

**Frontend Tests:**
```bash
npm test -- --verbose
npm test -- --watch  # Interactive debugging
```

**E2E Tests:**
```bash
npx playwright test --debug
npx playwright test --headed --slowMo=1000
```

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use Descriptive Names**: Test names should explain what is being tested
3. **Test Edge Cases**: Include boundary conditions and error scenarios
4. **Mock External Dependencies**: Use mocks for external APIs and services
5. **Keep Tests Independent**: Each test should be able to run in isolation

### Test Organization

1. **Group Related Tests**: Use test classes and describe blocks
2. **Use Setup/Teardown**: Properly initialize and clean up test data
3. **Avoid Test Interdependencies**: Tests should not rely on execution order
4. **Use Factories**: Generate test data using factory patterns

### Performance Considerations

1. **Use Test Database**: Separate database for testing
2. **Minimize Database Hits**: Use bulk operations and select_related
3. **Mock Expensive Operations**: Mock AI services and external APIs
4. **Parallel Execution**: Run tests in parallel when possible

## Troubleshooting

### Common Issues

**Django Tests:**
- Database connection issues: Check database settings
- Import errors: Verify PYTHONPATH and Django setup
- Mock failures: Ensure proper mock configuration

**Frontend Tests:**
- Module resolution: Check Jest moduleNameMapping
- Async test failures: Use proper async/await patterns
- Component rendering: Verify test environment setup

**E2E Tests:**
- Service startup: Ensure backend and frontend are running
- Element not found: Use proper wait strategies
- Browser compatibility: Test across different browsers

### Getting Help

1. Check test output for specific error messages
2. Review test logs and coverage reports
3. Use debugging tools and breakpoints
4. Consult testing framework documentation

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD approach
2. **Maintain Coverage**: Ensure new code is properly tested
3. **Update Documentation**: Keep testing docs current
4. **Run Full Suite**: Verify all tests pass before submitting

## Resources

- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://testingjavascript.com/)