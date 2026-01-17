# Edge Functions Deployment Guide

## Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase project linked

## Setup Steps

### 1. Run OTP Table Migration
```sql
-- Execute this in Supabase SQL Editor
-- File: supabase/migrations/003_otp_verification.sql
```

Go to: https://hjridosuleevyjjeirbv.supabase.co/project/default/sql/new

Paste and run the contents of `003_otp_verification.sql`

### 2. Set Environment Variables in Supabase

Go to: https://hjridosuleevyjjeirbv.supabase.co/project/default/settings/functions

Add these secrets:
- `BREVO_API_KEY` = `your-brevo-api-key-here`

### 3. Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref hjridosuleevyjjeirbv

# Deploy send-email-otp function
supabase functions deploy send-email-otp

# Deploy verify-email-otp function
supabase functions deploy verify-email-otp
```

### 4. Test Edge Functions

```bash
# Test send-email-otp
curl -X POST https://hjridosuleevyjjeirbv.supabase.co/functions/v1/send-email-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","firstName":"Test"}'

# Test verify-email-otp
curl -X POST https://hjridosuleevyjjeirbv.supabase.co/functions/v1/verify-email-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

## Signup Flow

1. **Step 1**: User enters account details → Sends OTP via `send-email-otp`
2. **Step 2**: User enters 6-digit code → Verifies via `verify-email-otp`
3. **Step 3**: User selects plan → Creates account + organization → Redirects to `/employer`

## Edge Function URLs

- Send OTP: `https://hjridosuleevyjjeirbv.supabase.co/functions/v1/send-email-otp`
- Verify OTP: `https://hjridosuleevyjjeirbv.supabase.co/functions/v1/verify-email-otp`

## Troubleshooting

### CORS Errors
Edge Functions include CORS headers. If you still get CORS errors, check browser console for details.

### Email Not Sending
- Verify BREVO_API_KEY is set in Supabase Edge Function secrets
- Check Brevo dashboard for email sending logs
- Ensure sender email is verified in Brevo

### OTP Verification Failed
- OTP expires in 10 minutes
- Maximum 5 attempts per OTP
- Check `email_otp_verifications` table for records
