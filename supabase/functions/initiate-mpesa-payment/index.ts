import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  projectId: string;
  phoneNumber: string;
  amount: number;
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

    const { projectId, phoneNumber, amount }: STKPushRequest = await req.json();

    console.log('Initiating M-Pesa payment:', { projectId, phoneNumber, amount });

    // Get M-Pesa credentials
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const passkey = Deno.env.get('MPESA_PASSKEY');
    const shortCode = Deno.env.get('MPESA_SHORTCODE');
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL');

    if (!consumerKey || !consumerSecret || !passkey || !shortCode || !callbackUrl) {
      throw new Error('M-Pesa credentials not configured');
    }

    // Step 1: Get access token
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch('https://sandbox-api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get M-Pesa access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const password = btoa(`${shortCode}${passkey}${timestamp}`);

    // Step 3: Format phone number (ensure it starts with 254)
    const formattedPhone = phoneNumber.startsWith('254') 
      ? phoneNumber 
      : phoneNumber.startsWith('0') 
        ? `254${phoneNumber.slice(1)}`
        : `254${phoneNumber}`;

    // Step 4: Get project details and calculate commission
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, profiles!projects_client_id_fkey(full_name, email)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Get commission settings
    const { data: commissionSettings } = await supabase
      .from('commission_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    const commissionRate = commissionSettings?.commission_rate || 0.10;
    const minimumCommission = commissionSettings?.minimum_commission || 50;
    const platformCommission = Math.max(amount * commissionRate, minimumCommission);
    const freelancerAmount = amount - platformCommission;

    // Step 5: Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        project_id: projectId,
        payer_id: project.client_id,
        transaction_type: 'payment',
        payment_method: 'mpesa_stk',
        amount: amount,
        phone_number: formattedPhone,
        status: 'pending',
        description: `Payment for project: ${project.title}`,
        metadata: {
          commission_rate: commissionRate,
          platform_commission: platformCommission,
          freelancer_amount: freelancerAmount
        }
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error('Failed to create transaction record');
    }

    // Step 6: Initiate STK Push
    const stkPushPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${callbackUrl}/mpesa-callback`,
      AccountReference: `PROJECT_${projectId}`,
      TransactionDesc: `Payment for ${project.title}`
    };

    console.log('STK Push payload:', stkPushPayload);

    const stkResponse = await fetch('https://sandbox-api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkData = await stkResponse.json();
    console.log('STK Push response:', stkData);

    if (stkData.ResponseCode !== '0') {
      // Update transaction status to failed
      await supabase
        .from('transactions')
        .update({ 
          status: 'failed',
          metadata: { 
            ...transaction.metadata,
            error: stkData.errorMessage || 'STK Push failed'
          }
        })
        .eq('id', transaction.id);

      throw new Error(stkData.errorMessage || 'STK Push failed');
    }

    // Update transaction with M-Pesa details
    await supabase
      .from('transactions')
      .update({
        status: 'processing',
        mpesa_transaction_id: stkData.CheckoutRequestID,
        reference_number: stkData.MerchantRequestID,
        metadata: {
          ...transaction.metadata,
          checkout_request_id: stkData.CheckoutRequestID,
          merchant_request_id: stkData.MerchantRequestID
        }
      })
      .eq('id', transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'STK Push initiated successfully',
        transactionId: transaction.id,
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in initiate-mpesa-payment:', error);
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