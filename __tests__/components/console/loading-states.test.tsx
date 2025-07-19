import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  LoadingSpinner,
  PageLoader,
  SectionLoader,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonProfile,
  ConnectionStatus,
  LoadingOverlay,
  RetryButton,
} from '@/components/console/loading-states';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('w-6', 'h-6');
  });

  it('renders with custom size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('custom-class');
  });
});

describe('PageLoader', () => {
  it('renders with default message', () => {
    render(<PageLoader />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<PageLoader message="Loading dashboard..." />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });
});

describe('SectionLoader', () => {
  it('renders with default message', () => {
    render(<SectionLoader />);
    expect(screen.getByText('Loading section...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<SectionLoader message="Loading profile..." />);
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });
});

describe('SkeletonCard', () => {
  it('renders skeleton card structure', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('SkeletonList', () => {
  it('renders default number of skeleton items', () => {
    const { container } = render(<SkeletonList />);
    const items = container.querySelectorAll('.space-y-4 > div');
    expect(items).toHaveLength(3);
  });

  it('renders custom number of skeleton items', () => {
    const { container } = render(<SkeletonList count={5} />);
    const items = container.querySelectorAll('.space-y-4 > div');
    expect(items).toHaveLength(5);
  });
});

describe('SkeletonTable', () => {
  it('renders skeleton table with default dimensions', () => {
    const { container } = render(<SkeletonTable />);
    const table = container.querySelector('.animate-pulse');
    expect(table).toBeInTheDocument();
  });

  it('renders skeleton table with custom dimensions', () => {
    const { container } = render(<SkeletonTable rows={3} cols={2} />);
    const table = container.querySelector('.animate-pulse');
    expect(table).toBeInTheDocument();
  });
});

describe('SkeletonDashboard', () => {
  it('renders dashboard skeleton structure', () => {
    const { container } = render(<SkeletonDashboard />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('SkeletonProfile', () => {
  it('renders profile skeleton structure', () => {
    const { container } = render(<SkeletonProfile />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('ConnectionStatus', () => {
  it('shows connected status when online and connected', () => {
    render(<ConnectionStatus isOnline={true} isConnected={true} />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows reconnecting status when online but not connected', () => {
    render(<ConnectionStatus isOnline={true} isConnected={false} />);
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('shows offline status when not online', () => {
    render(<ConnectionStatus isOnline={false} isConnected={false} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
});

describe('LoadingOverlay', () => {
  it('renders children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('shows overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows custom loading message', () => {
    render(
      <LoadingOverlay isLoading={true} message="Saving...">
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});

describe('RetryButton', () => {
  it('renders with default text', () => {
    const onRetry = jest.fn();
    render(<RetryButton onRetry={onRetry} />);
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    const onRetry = jest.fn();
    render(<RetryButton onRetry={onRetry}>Retry Now</RetryButton>);
    expect(screen.getByText('Retry Now')).toBeInTheDocument();
  });

  it('calls onRetry when clicked', () => {
    const onRetry = jest.fn();
    render(<RetryButton onRetry={onRetry} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    const onRetry = jest.fn();
    render(<RetryButton onRetry={onRetry} isLoading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when loading', () => {
    const onRetry = jest.fn();
    render(<RetryButton onRetry={onRetry} isLoading={true} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onRetry).not.toHaveBeenCalled();
  });
});