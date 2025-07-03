import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type TransactionStatus = Database['public']['Enums']['transaction_status'];

interface Transaction {
  id: string;
  amount: number;
  status: TransactionStatus;
  created_at: string;
  mpesa_receipt_number?: string | null;
  metadata?: any;
}

export function usePaymentStatus(projectId: string | undefined) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    data: transactions, 
    isLoading, 
    refetch,
    error 
  } = useQuery<Transaction[]>({
    queryKey: ['project-transactions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
    refetchInterval: (query) => {
      // Auto-refetch every 5 seconds if there are pending/processing transactions
      const hasPendingTransactions = query?.state?.data?.some(
        (tx: Transaction) => tx.status === 'pending' || tx.status === 'processing'
      );
      return hasPendingTransactions ? 5000 : false;
    },
  });

  const refreshPaymentStatus = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing payment status:', error);
      toast.error('Failed to refresh payment status');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check for status changes and show appropriate toasts
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const latestTransaction = transactions[0];
      
      // Store the previous status to detect changes
      const storageKey = `transaction_status_${latestTransaction.id}`;
      const previousStatus = localStorage.getItem(storageKey);
      
      if (previousStatus && previousStatus !== latestTransaction.status) {
        switch (latestTransaction.status) {
          case 'completed':
            toast.success('Payment completed successfully!');
            break;
          case 'failed':
            toast.error('Payment failed. Please try again.');
            break;
          case 'cancelled':
            toast.error('Payment was cancelled.');
            break;
        }
      }
      
      // Update stored status
      localStorage.setItem(storageKey, latestTransaction.status);
    }
  }, [transactions]);

  const latestTransaction = transactions?.[0];
  const hasCompletedPayment = latestTransaction?.status === 'completed';
  const hasPendingPayment = latestTransaction && 
    ['pending', 'processing'].includes(latestTransaction.status);

  return {
    transactions,
    latestTransaction,
    hasCompletedPayment,
    hasPendingPayment,
    isLoading,
    isRefreshing,
    refreshPaymentStatus,
    error
  };
}