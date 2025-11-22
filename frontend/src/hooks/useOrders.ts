import { useQuery } from '@tanstack/react-query';
import { ordersService } from '../services/orders.service';

/**
 * Custom hook to fetch all orders using TanStack Query
 * Provides loading, error, and data states with automatic caching
 * 
 * @returns Query result with orders data, loading state, and error state
 */
export const useOrders = () => {
    return useQuery({
        queryKey: ['orders'],
        queryFn: ordersService.getOrders,
        staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: true,
    });
};
