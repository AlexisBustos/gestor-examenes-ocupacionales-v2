import axiosInstance from '../lib/axios';
import type { Order } from '../types/order.types';

/**
 * Orders API Service
 * Handles all API calls related to exam orders
 */
export const ordersService = {
    /**
     * Fetch all orders with nested relations (worker, company, examBattery, ges)
     * @returns Promise with array of orders
     */
    async getOrders(): Promise<Order[]> {
        const response = await axiosInstance.get<Order[]>('/orders');
        return response.data;
    },

    /**
     * Fetch a single order by ID
     * @param id - Order ID
     * @returns Promise with order data
     */
    async getOrderById(id: string): Promise<Order> {
        const response = await axiosInstance.get<Order>(`/orders/${id}`);
        return response.data;
    },
};
