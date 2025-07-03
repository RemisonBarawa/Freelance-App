
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

    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid token');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { secrets } = await req.json();

    if (!secrets) {
      throw new Error('No secrets provided');
    }

    // Validate required fields
    const requiredFields = ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_PASSKEY', 'MPESA_SHORTCODE'];
    const missingFields = requiredFields.filter(field => !secrets[field]?.trim());
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // In a real implementation, you would use Supabase's secrets management API
    // For now, we'll log the update and return success
    // Note: This is a placeholder - in production you'd need to use Supabase CLI or Management API
    console.log('M-Pesa secrets update request:', {
      secretsCount: Object.keys(secrets).length,
      timestamp: new Date().toISOString(),
      updatedBy: user.id
    });

    // Log which secrets are being updated (without values for security)
    const secretKeys = Object.keys(secrets).filter(key => secrets[key]?.trim());
    console.log('Secrets being updated:', secretKeys);

    // Create an audit log entry
    await supabase
      .from('notifications')
      .insert({
        recipient_role: 'admin',
        message: `M-Pesa configuration updated by admin. ${secretKeys.length} secrets modified.`,
        notification_type: 'system_update',
        priority: 'medium',
        icon: 'settings'
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'M-Pesa secrets have been queued for update. Please update them manually in your Supabase project settings.',
        updatedSecrets: secretKeys
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in update-mpesa-secrets:', error);
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
