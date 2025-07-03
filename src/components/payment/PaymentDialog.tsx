import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, Smartphone, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
  amount: number;
  onSuccess: () => void;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  amount,
  onSuccess
}: PaymentDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [transactionId, setTransactionId] = useState<string>("");

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Kenyan phone numbers
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  };

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Validate phone number format
      if (!/^254[17]\d{8}$/.test(formattedPhone)) {
        throw new Error("Please enter a valid Kenyan phone number (e.g., 0712345678)");
      }

      const { data, error } = await supabase.functions.invoke('initiate-mpesa-payment', {
        body: {
          projectId,
          phoneNumber: formattedPhone,
          amount
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      setTransactionId(data.transactionId);
      toast.success("Payment request sent to your phone. Please complete the payment on your device.");
      
      // Start polling for payment status
      pollPaymentStatus(data.transactionId);

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
      setPaymentStatus('failed');
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 5 minutes (60 * 5 seconds)

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { transactionId }
        });

        if (error) throw error;

        if (data.success && data.transaction) {
          const transaction = data.transaction;
          
          if (transaction.status === 'completed') {
            setPaymentStatus('success');
            setIsProcessing(false);
            toast.success("Payment completed successfully!");
            setTimeout(() => {
              onSuccess();
              onOpenChange(false);
            }, 2000);
            return;
          } else if (transaction.status === 'failed') {
            setPaymentStatus('failed');
            setIsProcessing(false);
            toast.error("Payment failed. Please try again.");
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          setPaymentStatus('failed');
          setIsProcessing(false);
          toast.error("Payment timeout. Please try again or contact support.");
        }
      } catch (error) {
        console.error("Status check error:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setPaymentStatus('failed');
          setIsProcessing(false);
          toast.error("Unable to verify payment status. Please contact support.");
        }
      }
    };

    checkStatus();
  };

  const resetDialog = () => {
    setPhoneNumber("");
    setPaymentStatus('idle');
    setIsProcessing(false);
    setTransactionId("");
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetDialog();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-secondary/50">
            <div className="space-y-2">
              <h4 className="font-medium">{projectTitle}</h4>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-lg">KES {amount.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {paymentStatus === 'idle' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    disabled={isProcessing}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your Safaricom M-Pesa phone number
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </Button>
              </div>
            </div>
          )}

          {paymentStatus === 'processing' && (
            <div className="text-center space-y-4 py-6">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h4 className="font-medium mb-2">Processing Payment</h4>
                <p className="text-sm text-muted-foreground">
                  Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This may take up to 2 minutes...
                </p>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center space-y-4 py-6">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <h4 className="font-medium text-green-600 mb-2">Payment Successful!</h4>
                <p className="text-sm text-muted-foreground">
                  Your project has been funded and is now open for bidding.
                </p>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="text-center space-y-4 py-6">
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <div>
                <h4 className="font-medium text-destructive mb-2">Payment Failed</h4>
                <p className="text-sm text-muted-foreground">
                  The payment could not be completed. Please try again.
                </p>
              </div>
              <Button onClick={() => setPaymentStatus('idle')} variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}