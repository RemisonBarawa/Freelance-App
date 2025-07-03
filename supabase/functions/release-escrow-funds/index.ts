import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReleaseEscrowRequest {
  escrowId: string;
  releaseReason?: string;
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

    const { escrowId, releaseReason }: ReleaseEscrowRequest = await req.json();

    console.log('Releasing escrow funds:', { escrowId, releaseReason });

    // Get M-Pesa credentials for B2C
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const initiatorName = Deno.env.get('MPESA_INITIATOR_NAME');
    const securityCredential = Deno.env.get('MPESA_SECURITY_CREDENTIAL');
    const shortCode = Deno.env.get('MPESA_SHORTCODE');
    const queueTimeoutUrl = Deno.env.get('MPESA_QUEUE_TIMEOUT_URL');
    const resultUrl = Deno.env.get('MPESA_RESULT_URL');

    if (!consumerKey || !consumerSecret || !initiatorName || !securityCredential) {
      throw new Error('M-Pesa B2C credentials not configured');
    }

    // Get escrow holding details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_holdings')
      .select(`
        *,
        projects(title),
        profiles!escrow_holdings_freelancer_id_fkey(full_name, phone_number)
      `)
      .eq('id', escrowId)
      .eq('status', 'held')
      .single();

    if (escrowError || !escrow) {
      throw new Error('Escrow holding not found or already released');
    }

    if (!escrow.freelancer_id) {
      throw new Error('No freelancer assigned to this escrow');
    }

    const freelancerPhone = escrow.profiles?.phone_number;
    if (!freelancerPhone) {
      throw new Error('Freelancer phone number not found');
    }

    // Format phone number for M-Pesa
    const formattedPhone = freelancerPhone.startsWith('254') 
      ? freelancerPhone 
      : freelancerPhone.startsWith('0') 
        ? `254${freelancerPhone.slice(1)}`
        : `254${freelancerPhone}`;

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

    // Step 2: Create payout transaction record
    const { data: payoutTransaction, error: payoutError } = await supabase
      .from('transactions')
      .insert({
        project_id: escrow.project_id,
        payer_id: null, // Platform as payer
        recipient_id: escrow.freelancer_id,
        transaction_type: 'payout',
        payment_method: 'mpesa_stk',
        amount: escrow.freelancer_amount,
        phone_number: formattedPhone,
        status: 'processing',
        description: `Payout for project: ${escrow.projects?.title}`,
        metadata: {
          escrow_id: escrowId,
          release_reason: releaseReason || 'Project completed successfully'
        }
      })
      .select()
      .single();

    if (payoutError) {
      throw new Error('Failed to create payout transaction');
    }

    // Step 3: Initiate B2C payment
    const b2cPayload = {
      InitiatorName: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment',
      Amount: Math.round(escrow.freelancer_amount),
      PartyA: shortCode,
      PartyB: formattedPhone,
      Remarks: `Payout for project: ${escrow.projects?.title}`,
      QueueTimeOutURL: queueTimeoutUrl || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-b2c-timeout`,
      ResultURL: resultUrl || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-b2c-result`,
      Occasion: `PROJECT_${escrow.project_id}`
    };

    console.log('B2C payment payload:', b2cPayload);

    const b2cResponse = await fetch('https://sandbox-api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(b2cPayload),
    });

    const b2cData = await b2cResponse.json();
    console.log('B2C payment response:', b2cData);

    if (b2cData.ResponseCode !== '0') {
      // Update payout transaction to failed
      await supabase
        .from('transactions')
        .update({ 
          status: 'failed',
          metadata: { 
            ...payoutTransaction.metadata,
            error: b2cData.errorMessage || 'B2C payment failed'
          }
        })
        .eq('id', payoutTransaction.id);

      throw new Error(b2cData.errorMessage || 'B2C payment failed');
    }

    // Update payout transaction with M-Pesa details
    await supabase
      .from('transactions')
      .update({
        mpesa_transaction_id: b2cData.ConversationID,
        reference_number: b2cData.OriginatorConversationID,
        metadata: {
          ...payoutTransaction.metadata,
          conversation_id: b2cData.ConversationID,
          originator_conversation_id: b2cData.OriginatorConversationID
        }
      })
      .eq('id', payoutTransaction.id);

    // Update escrow status to released
    await supabase
      .from('escrow_holdings')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        hold_reason: releaseReason || 'Project completed successfully'
      })
      .eq('id', escrowId);

    // Create notifications
    await supabase
      .from('notifications')
      .insert([
        {
          recipient_id: escrow.freelancer_id,
          message: `Payment of KES ${escrow.freelancer_amount} has been sent to your M-Pesa number.`,
          notification_type: 'payout_initiated',
          project_id: escrow.project_id,
          priority: 'high',
          icon: 'dollar-sign',
          action_url: `/project/${escrow.project_id}`
        },
        {
          recipient_role: 'admin',
          message: `Escrow funds released: KES ${escrow.freelancer_amount} for project ${escrow.project_id}`,
          notification_type: 'escrow_released',
          project_id: escrow.project_id,
          priority: 'medium',
          icon: 'check-circle',
          action_url: `/admin/escrow`
        }
      ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Escrow funds release initiated successfully',
        payoutTransactionId: payoutTransaction.id,
        conversationId: b2cData.ConversationID,
        amount: escrow.freelancer_amount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in release-escrow-funds:', error);
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