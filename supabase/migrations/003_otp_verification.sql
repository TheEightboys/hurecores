-- Create OTP verification table for email verification during signup
CREATE TABLE IF NOT EXISTS public.email_otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_otp_email ON public.email_otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_otp_expires ON public.email_otp_verifications(expires_at);

-- RLS Policies - Allow anonymous users to insert and verify OTPs
ALTER TABLE public.email_otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous to insert OTP"
  ON public.email_otp_verifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to read own OTP"
  ON public.email_otp_verifications
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous to update OTP verification"
  ON public.email_otp_verifications
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to cleanup expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_otp_verifications
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.email_otp_verifications TO anon;
