-- Supabase email template fix for OTP in password reset emails.
-- In Dashboard → Authentication → Email Templates → Magic Link, use:

/*
Subject: Your Homefy CRM verification code

Body:
<h2>Password reset code</h2>
<p>Your 6-digit verification code is:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>This code expires in 10 minutes.</p>
<p>If you did not request this, ignore this email.</p>
*/

-- Also enable: Authentication → Providers → Email → Confirm email (OTP enabled)

SELECT 1;
