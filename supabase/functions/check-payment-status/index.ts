import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckStatusRequest {
  transactionId?: string;
  checkoutRequestId?: string;
}

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

    const { transactionId, checkoutRequestId }: CheckStatusRequest = await req.json();

    if (!transactionId && !checkoutRequestId) {
      throw new Error('Either transactionId or checkoutRequestId is required');
    }

    console.log('Checking payment status:', { transactionId, checkoutRequestId });

    // Find transaction
    let query = supabase
      .from('transactions')
      .select(`
        *,
        projects(title, status),
        escrow_holdings(*)
      `);

    if (transactionId) {
      query = query.eq('id', transactionId);
    } else {
      query = query.eq('mpesa_transaction_id', checkoutRequestId);
    }

    const { data: transaction, error: findError } = await query.single();

    if (findError || !transaction) {
      throw new Error('Transaction not found');
    }

    // If transaction is still processing, check with M-Pesa STK Query
    if (transaction.status === 'processing' && transaction.mpesa_transaction_id) {
      try {
        const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
        const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
        const passkey = Deno.env.get('MPESA_PASSKEY');
        const shortCode = Deno.env.get('MPESA_SHORTCODE');

        if (consumerKey && consumerSecret && passkey && shortCode) {
          // Get access token
          const auth = btoa(`${consumerKey}:${consumerSecret}`);
          const tokenResponse = await fetch('https://sandbox-api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`,
            },
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Generate timestamp and password for STK Query
            const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
            const password = btoa(`${shortCode}${passkey}${timestamp}`);

            // Query STK status
            const queryPayload = {
              BusinessShortCode: shortCode,
              Password: password,
              Timestamp: timestamp,
              CheckoutRequestID: transaction.mpesa_transaction_id
            };

            const queryResponse = await fetch('https://sandbox-api.safaricom.co.ke/mpesa/stkpushquery/v1/query', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(queryPayload),
            });

            if (queryResponse.ok) {
              const queryData = await queryResponse.json();
              console.log('STK Query response:', queryData);

              // Update transaction status based on query result
              if (queryData.ResultCode === '0') {
                // Payment was successful but callback might have failed
                await supabase
                  .from('transactions')
                  .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    metadata: {
                      ...transaction.metadata,
                      stk_query_result: queryData
                    }
                  })
                  .eq('id', transaction.id);

                transaction.status = 'completed';
              } else if (queryData.ResultCode !== '1032') { // 1032 means still processing
                // Payment failed
                await supabase
                  .from('transactions')
                  .update({
                    status: 'failed',
                    completed_at: new Date().toISOString(),
                    metadata: {
                      ...transaction.metadata,
                      stk_query_result: queryData,
                      failure_reason: queryData.ResultDesc
                    }
                  })
                  .eq('id', transaction.id);

                transaction.status = 'failed';
              }
            }
          }
        }
      } catch (queryError) {
        console.error('Error querying M-Pesa status:', queryError);
        // Continue with existing transaction status
      }
    }

    // Get additional details for completed transactions
    let additionalData = {};
    if (transaction.status === 'completed') {
      // Get escrow information
      const { data: escrow } = await supabase
        .from('escrow_holdings')
        .select('*')
        .eq('transaction_id', transaction.id)
        .single();

      if (escrow) {
        additionalData = { escrow };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction: {
          ...transaction,
          ...additionalData
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in check-payment-status:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});