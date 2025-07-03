import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const callbackData = await req.json();
    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    // Store webhook data
    await supabase
      .from('payment_webhooks')
      .insert({
        webhook_type: 'mpesa_stk_callback',
        mpesa_transaction_id: callbackData.Body?.stkCallback?.CheckoutRequestID,
        payload: callbackData,
        processed: false
      });

    const stkCallback = callbackData.Body?.stkCallback;
    
    if (!stkCallback) {
      console.error('Invalid callback format');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    // Find the transaction by checkout request ID
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_transaction_id', checkoutRequestId)
      .single();

    if (findError || !transaction) {
      console.error('Transaction not found for checkout request ID:', checkoutRequestId);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    let updateData: any = {
      completed_at: new Date().toISOString(),
      metadata: {
        ...transaction.metadata,
        callback_result: stkCallback
      }
    };

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = callbackMetadata.find((item: any) => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;
      const amount = callbackMetadata.find((item: any) => item.Name === 'Amount')?.Value;

      updateData = {
        ...updateData,
        status: 'completed',
        mpesa_receipt_number: mpesaReceiptNumber,
        metadata: {
          ...updateData.metadata,
          transaction_date: transactionDate,
          phone_number: phoneNumber,
          amount_paid: amount
        }
      };

      // Update transaction
      await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id);

      // Create escrow holding
      const platformCommission = transaction.metadata?.platform_commission || 0;
      const freelancerAmount = transaction.metadata?.freelancer_amount || amount;

      await supabase
        .from('escrow_holdings')
        .insert({
          project_id: transaction.project_id,
          transaction_id: transaction.id,
          client_id: transaction.payer_id,
          held_amount: amount,
          platform_commission: platformCommission,
          freelancer_amount: freelancerAmount,
          status: 'held',
          hold_reason: 'Payment received, awaiting project completion',
          auto_release_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      // Update project status to open for bidding
      await supabase
        .from('projects')
        .update({
          status: 'open',
          available_for_bidding: true
        })
        .eq('id', transaction.project_id);

      // Create notification for successful payment
      await supabase
        .from('notifications')
        .insert({
          recipient_id: transaction.payer_id,
          message: `Payment of KES ${amount} received successfully. Your project is now open for bidding.`,
          notification_type: 'payment_success',
          project_id: transaction.project_id,
          priority: 'high',
          icon: 'check-circle',
          action_url: `/project/${transaction.project_id}`
        });

      // Notify admin about new payment
      await supabase
        .from('notifications')
        .insert({
          recipient_role: 'admin',
          message: `New payment received: KES ${amount} for project ${transaction.project_id}`,
          notification_type: 'payment_received',
          project_id: transaction.project_id,
          priority: 'medium',
          icon: 'dollar-sign',
          action_url: `/admin/transactions`
        });

      console.log('Payment processed successfully:', {
        transactionId: transaction.id,
        amount,
        mpesaReceiptNumber
      });

    } else {
      // Payment failed
      updateData.status = 'failed';
      updateData.metadata.failure_reason = resultDesc;

      await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id);

      // Create notification for failed payment
      await supabase
        .from('notifications')
        .insert({
          recipient_id: transaction.payer_id,
          message: `Payment failed: ${resultDesc}. Please try again.`,
          notification_type: 'payment_failed',
          project_id: transaction.project_id,
          priority: 'high',
          icon: 'x-circle',
          action_url: `/project/${transaction.project_id}`
        });

      console.log('Payment failed:', {
        transactionId: transaction.id,
        resultCode,
        resultDesc
      });
    }

    // Mark webhook as processed
    await supabase
      .from('payment_webhooks')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        transaction_id: transaction.id
      })
      .eq('mpesa_transaction_id', checkoutRequestId);

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('Error in mpesa-callback:', error);
    
    // Try to log the error in webhooks table
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('payment_webhooks')
        .update({
          error_message: error.message,
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('processed', false)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });
  }
});