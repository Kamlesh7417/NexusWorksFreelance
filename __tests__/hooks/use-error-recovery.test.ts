import { renderHook, act } from '@testing-library/react';
import { useErrorRecovery, useApiWithRetry, useFormWithRetry } from '@/lib/hooks/use-error-recovery';

// Mock fetch for API tests
global.fetch = jest.fn();

describe('useErrorRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes operation successfully on first try', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    const mockOperation = jest.fn().mockResolvedValue('success');

    let operationResult;
    await act(async () => {
      operationResult = await result.current.executeWithRetry(mockOperation);
    });

    expect(operationResult).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
  });

  it('retries operation on failure', async () => {
    const { result } = renderHook(() => useErrorRecovery({ maxRetries: 2, baseDelay: 10 }));
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');

    let operationResult;
    await act(async () => {
      operationResult = await result.current.executeWithRetry(mockOperation);
    });

    expect(operationResult).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('throws error after max retries exceeded', async () => {
    const { result } = renderHook(() => useErrorRecovery({ maxRetries: 1, baseDelay: 10 }));
    const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    await act(async () => {
      await expect(result.current.executeWithRetry(mockOperation)).rejects.toThrow('Persistent failure');
    });

    expect(mockOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry
    expect(result.current.lastError?.message).toBe('Persistent failure');
  });

  it('calls onError callback for each failure', async () => {
    const { result } = renderHook(() => useErrorRecovery({ maxRetries: 1, baseDelay: 10 }));
    const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));
    const onError = jest.fn();

    await act(async () => {
      try {
        await result.current.executeWithRetry(mockOperation, onError);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(onError).toHaveBeenCalledTimes(2); // Called for each attempt that fails
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 0);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 1);
  });

  it('resets state correctly', async () => {
    const { result } = renderHook(() => useErrorRecovery({ maxRetries: 1, baseDelay: 10 }));
    const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));

    await act(async () => {
      try {
        await result.current.executeWithRetry(mockOperation);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.lastError).toBeTruthy();

    act(() => {
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBeNull();
  });
});

describe('useApiWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('makes successful API call', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useApiWithRetry());

    let apiResult;
    await act(async () => {
      apiResult = await result.current.apiCall('/test');
    });

    expect(apiResult).toEqual({ data: 'test' });
    expect(fetch).toHaveBeenCalledWith('/test', {
      headers: { 'Content-Type': 'application/json' }
    });
  });

  it('retries failed API calls', async () => {
    const mockFailedResponse = { ok: false, status: 500, statusText: 'Internal Server Error' };
    const mockSuccessResponse = { ok: true, json: () => Promise.resolve({ data: 'success' }) };
    
    (fetch as jest.Mock)
      .mockResolvedValueOnce(mockFailedResponse)
      .mockResolvedValueOnce(mockFailedResponse)
      .mockResolvedValue(mockSuccessResponse);

    const { result } = renderHook(() => useApiWithRetry());

    let apiResult;
    await act(async () => {
      apiResult = await result.current.apiCall('/test');
    });

    expect(apiResult).toEqual({ data: 'success' });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('throws error for non-JSON responses when appropriate', async () => {
    const mockResponse = { 
      ok: false, 
      status: 404, 
      statusText: 'Not Found',
      headers: { get: () => 'application/json' }
    };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useApiWithRetry());

    await act(async () => {
      await expect(result.current.apiCall('/test')).rejects.toThrow('HTTP 404: Not Found');
    });
  });
});

describe('useFormWithRetry', () => {
  it('submits form successfully', async () => {
    const { result } = renderHook(() => useFormWithRetry());
    const mockSubmit = jest.fn().mockResolvedValue({ success: true });

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submitForm(mockSubmit);
    });

    expect(submitResult).toEqual({ success: true });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it('handles form submission errors', async () => {
    const { result } = renderHook(() => useFormWithRetry());
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Validation failed'));

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submitForm(mockSubmit);
    });

    expect(submitResult).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBe('Validation failed');
  });

  it('sets isSubmitting during form submission', async () => {
    const { result } = renderHook(() => useFormWithRetry());
    const mockSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    act(() => {
      result.current.submitForm(mockSubmit);
    });

    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('clears error when clearError is called', async () => {
    const { result } = renderHook(() => useFormWithRetry());
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Test error'));

    await act(async () => {
      await result.current.submitForm(mockSubmit);
    });

    expect(result.current.submitError).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.submitError).toBeNull();
  });
});