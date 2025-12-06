import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useMutation } from 'convex/react';

// Mock Convex
vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
}));

describe('useAutoSave', () => {
  let mockSaveResponse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSaveResponse = vi.fn().mockResolvedValue(undefined);
    (useMutation as ReturnType<typeof vi.fn>).mockReturnValue(mockSaveResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with initial value', () => {
    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    expect(result.current.value).toBe('initial value');
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastSaved).toBe(null);
  });

  it('should update value when setValue is called', () => {
    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    act(() => {
      result.current.setValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });

  it('should set saving to true immediately when value changes', () => {
    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    act(() => {
      result.current.setValue('new value');
    });

    expect(result.current.saving).toBe(true);
  });

  it('should save value after 1 second debounce', async () => {
    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    act(() => {
      result.current.setValue('new value');
    });

    // Fast-forward 1 second
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockSaveResponse).toHaveBeenCalledWith({
      instanceId: 'test-instance-id',
      blockId: 'block-1',
      value: 'new value',
    });
  });

  it('should clear saving state after successful save', async () => {
    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    act(() => {
      result.current.setValue('new value');
    });

    expect(result.current.saving).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current.saving).toBe(false);
  });

  it('should set lastSaved date after successful save', async () => {
    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    act(() => {
      result.current.setValue('new value');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current.lastSaved).toBeInstanceOf(Date);
  });

  it('should not save if value equals initial value', async () => {
    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    act(() => {
      result.current.setValue('initial value');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockSaveResponse).not.toHaveBeenCalled();
  });

  it('should debounce multiple rapid changes', async () => {
    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    // Rapid changes
    act(() => {
      result.current.setValue('value 1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    act(() => {
      result.current.setValue('value 2');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    act(() => {
      result.current.setValue('value 3');
    });

    // Complete the debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Should only save the final value once
    expect(mockSaveResponse).toHaveBeenCalledTimes(1);
    expect(mockSaveResponse).toHaveBeenCalledWith({
      instanceId: 'test-instance-id',
      blockId: 'block-1',
      value: 'value 3',
    });
  });

  it('should retry on failure with exponential backoff', async () => {
    mockSaveResponse
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    act(() => {
      result.current.setValue('new value');
    });

    // First attempt (after 1s debounce)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockSaveResponse).toHaveBeenCalledTimes(1);

    // First retry (after 1s backoff)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockSaveResponse).toHaveBeenCalledTimes(2);

    // Second retry (after 2s backoff)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockSaveResponse).toHaveBeenCalledTimes(3);
    expect(result.current.error).toBe(null);
    expect(result.current.lastSaved).toBeInstanceOf(Date);
  });

  it('should show error after 3 failed retries', async () => {
    mockSaveResponse.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    act(() => {
      result.current.setValue('new value');
    });

    // First attempt (after 1s debounce)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // First retry (after 1s backoff)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Second retry (after 2s backoff)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Third retry (after 4s backoff)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(mockSaveResponse).toHaveBeenCalledTimes(4); // Initial + 3 retries
    expect(result.current.error).toBe('Failed to save. Please check your connection.');
    expect(result.current.saving).toBe(false);
  });

  it('should reset retry count on successful save after previous failure', async () => {
    mockSaveResponse
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    // First value change - will fail once then succeed
    act(() => {
      result.current.setValue('value 1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000); // Initial attempt
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000); // First retry succeeds
    });

    expect(result.current.error).toBe(null);

    // Second value change - should not carry over retry count
    mockSaveResponse.mockResolvedValueOnce(undefined);

    act(() => {
      result.current.setValue('value 2');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current.lastSaved).toBeInstanceOf(Date);
    expect(result.current.error).toBe(null);
  });

  it('should clear error when value changes after error state', async () => {
    mockSaveResponse.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        'initial value'
      )
    );

    // First change - will fail completely
    act(() => {
      result.current.setValue('value 1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000); // Initial
      await vi.advanceTimersByTimeAsync(1000); // Retry 1
      await vi.advanceTimersByTimeAsync(2000); // Retry 2
      await vi.advanceTimersByTimeAsync(4000); // Retry 3
    });

    expect(result.current.error).toBe('Failed to save. Please check your connection.');

    // Second change - error should be cleared immediately
    mockSaveResponse.mockResolvedValue(undefined);

    act(() => {
      result.current.setValue('value 2');
    });

    expect(result.current.error).toBe(null);
    expect(result.current.saving).toBe(true);
  });

  it('should work with array values (checkboxes)', async () => {
    const { result } = renderHook(() =>
      useAutoSave(
        'test-instance-id' as any,
        'block-1',
        ['option1']
      )
    );

    act(() => {
      result.current.setValue(['option1', 'option2']);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockSaveResponse).toHaveBeenCalledWith({
      instanceId: 'test-instance-id',
      blockId: 'block-1',
      value: ['option1', 'option2'],
    });
  });
});
