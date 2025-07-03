
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Eye, EyeOff, Save, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface MpesaSecrets {
  MPESA_CONSUMER_KEY: string;
  MPESA_CONSUMER_SECRET: string;
  MPESA_PASSKEY: string;
  MPESA_SHORTCODE: string;
  MPESA_CALLBACK_URL: string;
  MPESA_INITIATOR_NAME: string;
  MPESA_SECURITY_CREDENTIAL: string;
  MPESA_QUEUE_TIMEOUT_URL: string;
  MPESA_RESULT_URL: string;
}

export default function MpesaSecretsDialog() {
  const [open, setOpen] = useState(false);
  const [secrets, setSecrets] = useState<MpesaSecrets>({
    MPESA_CONSUMER_KEY: '',
    MPESA_CONSUMER_SECRET: '',
    MPESA_PASSKEY: '',
    MPESA_SHORTCODE: '',
    MPESA_CALLBACK_URL: '',
    MPESA_INITIATOR_NAME: '',
    MPESA_SECURITY_CREDENTIAL: '',
    MPESA_QUEUE_TIMEOUT_URL: '',
    MPESA_RESULT_URL: ''
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const secretDescriptions = {
    MPESA_CONSUMER_KEY: "Consumer Key from Safaricom Developer Portal",
    MPESA_CONSUMER_SECRET: "Consumer Secret from Safaricom Developer Portal",
    MPESA_PASSKEY: "Lipa Na M-Pesa Online Passkey",
    MPESA_SHORTCODE: "Business Short Code (Paybill/Till Number)",
    MPESA_CALLBACK_URL: "Callback URL for payment notifications",
    MPESA_INITIATOR_NAME: "Initiator name for B2C transactions",
    MPESA_SECURITY_CREDENTIAL: "Security credential for B2C transactions",
    MPESA_QUEUE_TIMEOUT_URL: "Queue timeout URL for B2C transactions",
    MPESA_RESULT_URL: "Result URL for B2C transactions"
  };

  // Load existing secrets when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingSecrets();
    }
  }, [open]);

  const loadExistingSecrets = async () => {
    setIsLoading(true);
    try {
      // Call a function to get current secret values (masked)
      const { data, error } = await supabase.functions.invoke('get-mpesa-secrets', {
        body: { action: 'get_masked_values' }
      });

      if (error) {
        console.error('Error loading secrets:', error);
        toast.error("Could not load existing secrets");
        return;
      }

      if (data?.secrets) {
        setSecrets(prevSecrets => ({
          ...prevSecrets,
          ...data.secrets
        }));
      }
    } catch (error) {
      console.error('Error loading secrets:', error);
      toast.error("Could not load existing secrets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: keyof MpesaSecrets, value: string) => {
    setSecrets(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Check if all required fields are filled
      const requiredFields = ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_PASSKEY', 'MPESA_SHORTCODE'];
      const missingFields = requiredFields.filter(field => !secrets[field as keyof MpesaSecrets].trim());
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Set default URLs if not provided
      const baseUrl = "https://ciaihnxkqqbebjwotjsc.supabase.co/functions/v1";
      const updatedSecrets = {
        ...secrets,
        MPESA_CALLBACK_URL: secrets.MPESA_CALLBACK_URL || `${baseUrl}/mpesa-callback`,
        MPESA_QUEUE_TIMEOUT_URL: secrets.MPESA_QUEUE_TIMEOUT_URL || `${baseUrl}/mpesa-b2c-timeout`,
        MPESA_RESULT_URL: secrets.MPESA_RESULT_URL || `${baseUrl}/mpesa-b2c-result`
      };

      // Update secrets through edge function
      const { data, error } = await supabase.functions.invoke('update-mpesa-secrets', {
        body: { secrets: updatedSecrets }
      });

      if (error) {
        throw new Error(error.message || 'Failed to update secrets');
      }

      if (data?.success) {
        toast.success("M-Pesa secrets updated successfully!");
        setOpen(false);
      } else {
        throw new Error(data?.error || 'Failed to update secrets');
      }
    } catch (error: any) {
      console.error('Error updating M-Pesa secrets:', error);
      toast.error(`Failed to update M-Pesa secrets: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const loadDefaultUrls = () => {
    const baseUrl = "https://ciaihnxkqqbebjwotjsc.supabase.co/functions/v1";
    setSecrets(prev => ({
      ...prev,
      MPESA_CALLBACK_URL: prev.MPESA_CALLBACK_URL || `${baseUrl}/mpesa-callback`,
      MPESA_QUEUE_TIMEOUT_URL: prev.MPESA_QUEUE_TIMEOUT_URL || `${baseUrl}/mpesa-b2c-timeout`,
      MPESA_RESULT_URL: prev.MPESA_RESULT_URL || `${baseUrl}/mpesa-b2c-result`
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          M-Pesa Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Update M-Pesa Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These settings configure M-Pesa payment integration. Ensure you have the correct credentials from Safaricom Developer Portal.
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading existing configuration...</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {Object.entries(secrets).map(([key, value]) => (
                <Card key={key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {key.replace(/MPESA_/, '').replace(/_/g, ' ')}
                        {['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_PASSKEY', 'MPESA_SHORTCODE'].includes(key) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </CardTitle>
                      {key.includes('SECRET') || key.includes('KEY') || key.includes('CREDENTIAL') ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(key)}
                        >
                          {showSecrets[key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
                    </div>
                    <CardDescription className="text-xs">
                      {secretDescriptions[key as keyof typeof secretDescriptions]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Input
                      type={
                        (key.includes('SECRET') || key.includes('KEY') || key.includes('CREDENTIAL')) && !showSecrets[key]
                          ? 'password'
                          : 'text'
                      }
                      value={value}
                      onChange={(e) => handleInputChange(key as keyof MpesaSecrets, e.target.value)}
                      placeholder={`Enter ${key.replace(/MPESA_/, '').replace(/_/g, ' ').toLowerCase()}`}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={loadDefaultUrls}
              className="flex-1"
            >
              Load Default URLs
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || isLoading}
              className="flex-1 gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
