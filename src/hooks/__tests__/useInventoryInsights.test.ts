import { renderHook, waitFor } from '@testing-library/react';
import { useInventoryInsights } from '../useInventoryInsights';
import { supabase } from '@/integrations/supabase/client';
import { displayErrorMessage } from '@/utils/errorHandling';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }
}));

jest.mock('@/utils/errorHandling', () => ({
  displayErrorMessage: jest.fn()
}));

jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') {
      return '2024-01-01';
    }
    return '2024-01-01';
  }),
  subDays: jest.fn(() => new Date('2024-01-01')),
  differenceInDays: jest.fn(() => 30)
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockDisplayErrorMessage = displayErrorMessage as jest.MockedFunction<typeof displayErrorMessage>;

describe('useInventoryInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useInventoryInsights());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.insights).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should handle authentication error', async () => {
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: null
    });

    const { result } = renderHook(() => useInventoryInsights());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load inventory insights. Please try again.');
    expect(mockDisplayErrorMessage).toHaveBeenCalled();
  });

  it('should fetch insights successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockInventory = [
      {
        id: '1',
        name: 'Medicine A',
        quantity: 10,
        expiry_date: '2024-02-01',
        selling_price: 100,
        unit_cost: 50
      }
    ];
    const mockBillItems = [
      {
        inventory_item_id: '1',
        quantity: 5,
        inventory: {
          id: '1',
          name: 'Medicine A',
          quantity: 10
        },
        bills: {
          date: '2024-01-15',
          user_id: 'user-123'
        }
      }
    ];

    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockGte = jest.fn().mockReturnThis();
    const mockLte = jest.fn().mockReturnThis();

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'return_analytics') {
        return {
          select: mockSelect.mockResolvedValue({
            data: mockInventory,
            error: null
          }),
          eq: mockEq,
          order: mockOrder
        } as any;
      } else if (table === 'bill_items') {
        return {
          select: mockSelect.mockReturnValue({
            gte: mockGte.mockReturnValue({
              lte: mockLte.mockReturnValue({
                eq: mockEq.mockResolvedValue({
                  data: mockBillItems,
                  error: null
                })
              })
            })
          })
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useInventoryInsights());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.insights).toBeDefined();
    expect(result.current.insights?.prescriptionDrivenSuggestions).toBeDefined();
    expect(result.current.insights?.salesVelocity).toBeDefined();
    expect(result.current.insights?.expiryAlerts).toBeDefined();
    expect(result.current.insights?.moversAnalysis).toBeDefined();
  });

  it('should handle database errors', async () => {
    const mockUser = { id: 'user-123' };
    const mockError = new Error('Database connection failed');

    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();

    mockSupabase.from.mockReturnValue({
      select: mockSelect.mockResolvedValue({
        data: null,
        error: mockError
      }),
      eq: mockEq,
      order: mockOrder
    } as any);

    const { result } = renderHook(() => useInventoryInsights());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load inventory insights. Please try again.');
    expect(mockDisplayErrorMessage).toHaveBeenCalledWith(mockError, 'Inventory Insights');
  });

  it('should allow manual refetch', async () => {
    const mockUser = { id: 'user-123' };
    
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockGte = jest.fn().mockReturnThis();
    const mockLte = jest.fn().mockReturnThis();

    mockSupabase.from.mockImplementation(() => ({
      select: mockSelect.mockResolvedValue({
        data: [],
        error: null
      }),
      eq: mockEq,
      order: mockOrder,
      gte: mockGte,
      lte: mockLte
    } as any));

    const { result } = renderHook(() => useInventoryInsights());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Trigger refetch
    result.current.refetch();
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});