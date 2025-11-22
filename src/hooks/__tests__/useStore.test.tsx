/**
 * Tests pour le hook useStore
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from '@/hooks/use-store';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-store-id',
          name: 'Test Store',
          slug: 'test-store',
        },
        error: null,
      }),
    })),
  },
}));

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
    loading: false,
  })),
}));

describe('useStore', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('returns store data when available', async () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    await waitFor(() => {
      expect(result.current.store).toBeDefined();
    });
  });

  it('handles loading state', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    // Initialement en chargement
    expect(result.current.loading).toBe(true);
  });
});

