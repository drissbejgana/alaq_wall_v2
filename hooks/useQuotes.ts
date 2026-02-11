import { useState, useEffect, useCallback } from 'react';
import { quotesService, Quote, Order, Invoice, DashboardStats } from '../services/quotes';
import { useQuery } from '@tanstack/react-query';


const fetchQuotes = async () => {
  const response = await quotesService.getQuotes();
  return response.results;
};
export const useQuotes = () => {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: fetchQuotes,
  });
};

const fetchOrders = async () => {
  const response = await quotesService.getOrders();
  return response.results;
};

export const useOrders = () => {
    return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });
};


const fetchInvoices = async () => {
  const response = await quotesService.getInvoices();
  return response.results;
};

export const useInvoices = () => {
    return useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });
};