-- Add missing RPC function for deadline tracking
CREATE OR REPLACE FUNCTION public.update_project_deadline_flag(
  project_id UUID,
  flag_name TEXT,
  flag_value BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the specific deadline flag
  IF flag_name = 'deadline_reminder_sent' THEN
    UPDATE public.projects 
    SET deadline_reminder_sent = flag_value
    WHERE id = project_id;
  ELSIF flag_name = 'deadline_warning_sent' THEN
    UPDATE public.projects 
    SET deadline_warning_sent = flag_value
    WHERE id = project_id;
  END IF;
END;
$$;

-- Phase 1: Payment System Database Schema Design

-- Create enum for transaction types
CREATE TYPE public.transaction_type AS ENUM (
  'payment',
  'payout',
  'commission',
  'refund',
  'penalty'
);

-- Create enum for transaction status
CREATE TYPE public.transaction_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded'
);

-- Create enum for payment methods
CREATE TYPE public.payment_method AS ENUM (
  'mpesa_stk',
  'mpesa_paybill',
  'mpesa_tillnumber'
);

-- Create enum for escrow status
CREATE TYPE public.escrow_status AS ENUM (
  'held',
  'released',
  'disputed',
  'refunded'
);

-- Create enum for dispute status
CREATE TYPE public.dispute_status AS ENUM (
  'open',
  'investigating',
  'resolved',
  'closed'
);

-- 1. Transactions table - Core payment tracking
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES public.profiles(id),
  recipient_id UUID REFERENCES public.profiles(id),
  transaction_type transaction_type NOT NULL,
  payment_method payment_method NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'KES',
  mpesa_transaction_id VARCHAR(50),
  mpesa_receipt_number VARCHAR(50),
  phone_number VARCHAR(15),
  status transaction_status NOT NULL DEFAULT 'pending',
  reference_number VARCHAR(100),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes for performance
  CONSTRAINT unique_mpesa_transaction_id UNIQUE (mpesa_transaction_id)
);

-- 2. Escrow holdings table - Secure fund management
CREATE TABLE public.escrow_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  freelancer_id UUID REFERENCES public.profiles(id),
  held_amount DECIMAL(12,2) NOT NULL CHECK (held_amount > 0),
  platform_commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  freelancer_amount DECIMAL(12,2) NOT NULL CHECK (freelancer_amount > 0),
  status escrow_status NOT NULL DEFAULT 'held',
  hold_reason TEXT DEFAULT 'Payment received, awaiting project completion',
  release_conditions TEXT,
  auto_release_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure amounts are consistent
  CONSTRAINT check_amounts CHECK (held_amount = platform_commission + freelancer_amount),
  CONSTRAINT unique_project_escrow UNIQUE (project_id, transaction_id)
);

-- 3. Payment methods table - Store user payment preferences
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method_type payment_method NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  nickname VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_phone UNIQUE (user_id, phone_number)
);

-- 4. Commission settings table - Platform fee management
CREATE TABLE public.commission_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.10 CHECK (commission_rate >= 0 AND commission_rate <= 1),
  fixed_amount DECIMAL(12,2) DEFAULT 0,
  minimum_commission DECIMAL(12,2) DEFAULT 0,
  maximum_commission DECIMAL(12,2),
  applies_to_project_types TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  effective_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Disputes table - Handle payment disputes
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id),
  escrow_id UUID NOT NULL REFERENCES public.escrow_holdings(id),
  complainant_id UUID NOT NULL REFERENCES public.profiles(id),
  respondent_id UUID NOT NULL REFERENCES public.profiles(id),
  status dispute_status NOT NULL DEFAULT 'open',
  dispute_reason TEXT NOT NULL,
  complainant_evidence JSONB,
  respondent_evidence JSONB,
  admin_notes TEXT,
  resolution TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. Payment webhooks table - Track M-Pesa callbacks
CREATE TABLE public.payment_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_type VARCHAR(50) NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id),
  mpesa_transaction_id VARCHAR(50),
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create unique index for active commission settings
CREATE UNIQUE INDEX unique_active_commission_setting 
ON public.commission_settings (is_active) 
WHERE is_active = true;

-- Create indexes for performance
CREATE INDEX idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_mpesa_id ON public.transactions(mpesa_transaction_id);
CREATE INDEX idx_escrow_project_id ON public.escrow_holdings(project_id);
CREATE INDEX idx_escrow_status ON public.escrow_holdings(status);
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_disputes_project_id ON public.disputes(project_id);
CREATE INDEX idx_webhooks_processed ON public.payment_webhooks(processed);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (
    auth.uid() = payer_id OR 
    auth.uid() = recipient_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'client', 'freelancer')
    )
  );

CREATE POLICY "Admins can update transactions" ON public.transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for escrow holdings
CREATE POLICY "Users can view relevant escrow holdings" ON public.escrow_holdings
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = freelancer_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage escrow" ON public.escrow_holdings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for payment methods
CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for commission settings  
CREATE POLICY "Everyone can view active commission settings" ON public.commission_settings
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage commission settings" ON public.commission_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for disputes
CREATE POLICY "Users can view their disputes" ON public.disputes
  FOR SELECT USING (
    auth.uid() = complainant_id OR 
    auth.uid() = respondent_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (
    auth.uid() = complainant_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('client', 'freelancer')
    )
  );

CREATE POLICY "Dispute participants can update evidence" ON public.disputes
  FOR UPDATE USING (
    (auth.uid() = complainant_id OR auth.uid() = respondent_id) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for webhooks (admin only)
CREATE POLICY "Admins can manage webhooks" ON public.payment_webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escrow_updated_at
  BEFORE UPDATE ON public.escrow_holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default commission settings
INSERT INTO public.commission_settings (
  commission_type,
  commission_rate,
  minimum_commission,
  applies_to_project_types,
  is_active
) VALUES (
  'percentage',
  0.10,
  50.00,
  NULL,
  true
);