#!/usr/bin/env bash

# HURE Core - Set Brevo API Key in Supabase Edge Functions

echo "🔑 Setting BREVO_API_KEY in Supabase Edge Functions..."
echo ""

BREVO_KEY="your-brevo-api-key-here"

echo "Running: supabase secrets set BREVO_API_KEY=..."
echo ""

npx supabase secrets set BREVO_API_KEY="$BREVO_KEY" --project-ref hjridosuleevyjjeirbv

echo ""
echo "✅ Secret set! Now redeploying functions..."
echo ""

npx supabase functions deploy send-email-otp --no-verify-jwt
npx supabase functions deploy verify-email-otp --no-verify-jwt

echo ""
echo "🎉 Complete! Try signing up again."
