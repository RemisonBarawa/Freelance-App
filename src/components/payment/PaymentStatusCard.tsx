import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type TransactionStatus = Database['public']['Enums']['transaction_status'];

interface Transaction {
  id: string;
  amount: number;
  status: TransactionStatus;
  created_at: string;
  mpesa_receipt_number?: string | null;
  metadata?: any;
}

interface PaymentStatusCardProps {
  transaction: Transaction;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function PaymentStatusCard({ 
  transaction, 
  onRefresh,
  isRefreshing = false 
}: PaymentStatusCardProps) {
  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'cancelled':
      case 'refunded':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = () => {
    switch (transaction.status) {
      case 'completed':
        return 'Payment Completed';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      case 'refunded':
        return 'Payment Refunded';
      case 'processing':
        return 'Processing Payment';
      case 'pending':
      default:
        return 'Payment Pending';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Payment Details</span>
          </div>
          {onRefresh && (transaction.status === 'pending' || transaction.status === 'processing') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Badge className={getStatusColor()}>
            {transaction.status.toUpperCase()}
          </Badge>
        </div>

        {/* Amount Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-bold">KES {transaction.amount.toLocaleString()}</span>
          </div>
          
          {transaction.metadata && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Platform Fee:</span>
                <span>KES {(transaction.metadata.platform_commission || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Freelancer Amount:</span>
                <span>KES {(transaction.metadata.freelancer_amount || 0).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Receipt Number */}
        {transaction.mpesa_receipt_number && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">M-Pesa Receipt:</span>
            <span className="font-mono">{transaction.mpesa_receipt_number}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Created:</span>
          <span>{formatDate(transaction.created_at)}</span>
        </div>

        {/* Status Messages */}
        {transaction.status === 'processing' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Payment in progress</p>
              <p>Please complete the M-Pesa transaction on your phone.</p>
            </div>
          </div>
        )}

        {transaction.status === 'completed' && (
          <div className="flex items-start gap-2 p-3 bg-green-50 rounded-md border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-medium">Payment successful!</p>
              <p>Funds are held in escrow and your project is now open for bidding.</p>
            </div>
          </div>
        )}

        {(transaction.status === 'failed' || transaction.status === 'cancelled' || transaction.status === 'refunded') && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-md border border-red-200">
            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Payment failed</p>
              <p>Please try again or contact support if the issue persists.</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}