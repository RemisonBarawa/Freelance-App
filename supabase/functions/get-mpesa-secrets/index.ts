
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

    // Get masked versions of existing secrets (show first 4 and last 4 characters)
    const secretNames = [
      'MPESA_CONSUMER_KEY',
      'MPESA_CONSUMER_SECRET', 
      'MPESA_PASSKEY',
      'MPESA_SHORTCODE',
      'MPESA_CALLBACK_URL',
      'MPESA_INITIATOR_NAME',
      'MPESA_SECURITY_CREDENTIAL',
      'MPESA_QUEUE_TIMEOUT_URL',
      'MPESA_RESULT_URL'
    ];

    const maskedSecrets: Record<string, string> = {};
    
    for (const secretName of secretNames) {
      const value = Deno.env.get(secretName);
      if (value) {
        // For URLs and non-sensitive data, show full value
        if (secretName.includes('URL') || secretName === 'MPESA_SHORTCODE' || secretName === 'MPESA_INITIATOR_NAME') {
          maskedSecrets[secretName] = value;
        } else {
          // For sensitive data, mask the middle part
          if (value.length > 8) {
            maskedSecrets[secretName] = value.substring(0, 4) + '****' + value.substring(value.length - 4);
          } else {
            maskedSecrets[secretName] = '****';
          }
        }
      } else {
        maskedSecrets[secretName] = '';
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        secrets: maskedSecrets
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in get-mpesa-secrets:', error);
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
