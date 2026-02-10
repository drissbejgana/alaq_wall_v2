import { useState, useEffect, useCallback } from 'react';
import { quotesService, Quote, Order, Invoice, DashboardStats } from '../services/quotes';
import { useQuery } from '@tanstack/react-query';

// export const useDashboard = () => {
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const refresh = useCallback(async () => {
//     setLoading(true);
//     try {
//       const data = await quotesService.getDashboard();
//       setStats(data);
//       setError(null);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     refresh();
//   }, [refresh]);

//   return { stats, loading, error, refresh };
// };


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