# Supabase Edge Functions

These are **Deno Edge Functions** that run on Supabase's serverless platform.

## ⚠️ TypeScript Errors in VS Code

You may see TypeScript errors like:
- `Cannot find module 'https://deno.land/...'`
- `Cannot find name 'Deno'`

**This is normal!** These files use Deno (not Node.js) and run perfectly on Supabase's Edge Runtime.

## 🔧 To Remove VS Code Errors (Optional)

1. **Install Deno Extension**:
   - Open VS Code Extensions
   - Search for "Deno"
   - Install the official Deno extension by Denoland

2. **Reload VS Code**:
   - Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
   - Type "Developer: Reload Window"
   - Press Enter

The `.vscode/settings.json` file is already configured to enable Deno for these function folders.

## 📁 Functions

### `send-email-otp`
Generates a 6-digit OTP code, stores it in the database, and sends it via Brevo email.

**Endpoint**: `https://hjridosuleevyjjeirbv.supabase.co/functions/v1/send-email-otp`

**Request**:
```json
{
  "email": "user@example.com",
  "firstName": "John"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### `verify-email-otp`
Validates the OTP code against the database record.

**Endpoint**: `https://hjridosuleevyjjeirbv.supabase.co/functions/v1/verify-email-otp`

**Request**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "verified": true,
  "message": "Email verified successfully"
}
```

## 🚀 Deployment

Already deployed and working! To redeploy after changes:

```bash
npx supabase functions deploy send-email-otp --no-verify-jwt
npx supabase functions deploy verify-email-otp --no-verify-jwt
```

## 🔑 Environment Variables

Set these in Supabase Dashboard → Edge Functions:
- `BREVO_API_KEY` - Your Brevo API key (already set)
- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_ANON_KEY` - Auto-provided by Supabase

## ✅ Status

Both functions are **deployed and working** on Supabase. The TypeScript errors you see in VS Code do not affect their functionality.
