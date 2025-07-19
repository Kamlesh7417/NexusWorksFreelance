import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, SectionErrorBoundary } from '@/components/console/error-boundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  it('renders section-specific error message', () => {
    render(
      <ErrorBoundary section="profile">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('An error occurred in the profile section.')).toBeInTheDocument();
  });

  it('shows retry button and handles retry', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText(/Try Again/);
    expect(retryButton).toBeInTheDocument();

    // Click retry - this should reset the error state
    fireEvent.click(retryButton);

    // The error boundary should still show error UI since the component will throw again
    // But the retry count should be updated
    expect(screen.getByText(/Try Again/)).toBeInTheDocument();
  });

  it('shows reset button and handles reset', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const resetButton = screen.getByText('Reset Section');
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    // Reset should clear the error state
  });

  it('shows go home button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText('Go to Dashboard');
    expect(homeButton).toBeInTheDocument();
  });

  it('shows reload page button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    expect(reloadButton).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('limits retry attempts', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Initially should show retry button with 3 attempts left
    expect(screen.getByText(/Try Again \(3 attempts left\)/)).toBeInTheDocument();
    
    const retryButton = screen.getByText(/Try Again/);
    
    // Click retry multiple times
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);

    // After max retries, button should not be available
    expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument();
  });
});

describe('SectionErrorBoundary', () => {
  it('renders with section-specific error handling', () => {
    render(
      <SectionErrorBoundary section="messages">
        <ThrowError />
      </SectionErrorBoundary>
    );

    expect(screen.getByText('An error occurred in the messages section.')).toBeInTheDocument();
  });
});