// Supabase Edge Function for sending password reset emails via Resend.
// This runs in the Deno runtime, not Node.js - local linter errors are expected.
//
// Why this exists:
//   Supabase's built-in email service is heavily rate-limited and not meant for
//   production. Reset emails sent through it silently fail to deliver once the
//   limit is hit. This function generates a recovery link with the admin API and
//   delivers it through Resend (the same provider already used for student
//   reports), which is reliable and not rate-limited.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const createResetEmailTemplate = (resetLink: string, schoolName: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width:560px; margin:0 auto; padding:32px 20px;">
    <div style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg,#2563eb,#4f46e5); padding:32px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700;">${schoolName}</h1>
        <p style="margin:8px 0 0; color:#dbeafe; font-size:14px;">Student Progress Tracker</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 16px; color:#0f172a; font-size:20px;">Reset your password</h2>
        <p style="margin:0 0 24px; color:#475569; font-size:15px; line-height:1.6;">
          We received a request to reset the password for your ARCC account. Click the
          button below to choose a new password. This link will expire in 1 hour.
        </p>
        <div style="text-align:center; margin:0 0 24px;">
          <a href="${resetLink}" style="display:inline-block; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:600; font-size:15px;">
            Reset Password
          </a>
        </div>
        <p style="margin:0 0 8px; color:#94a3b8; font-size:13px; line-height:1.6;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 24px; word-break:break-all;">
          <a href="${resetLink}" style="color:#2563eb; font-size:13px;">${resetLink}</a>
        </p>
        <p style="margin:0; color:#94a3b8; font-size:13px; line-height:1.6;">
          If you didn't request this, you can safely ignore this email — your password
          will remain unchanged.
        </p>
      </div>
      <div style="background:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0;">
        <p style="margin:0; color:#94a3b8; font-size:12px; text-align:center;">
          🔒 This is an automated security email from ${schoolName}.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Admin client with the service role key for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the request comes from an authenticated admin/teacher
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only admins and teachers can trigger password resets for other users
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (rolesError || !userRoles?.some(r => r.role === 'admin' || r.role === 'teacher')) {
      return new Response(
        JSON.stringify({ error: 'Admin or teacher access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, redirectTo } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a password recovery link using the admin API.
    // This works regardless of the built-in email rate limits because we
    // deliver the link ourselves through Resend.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: redirectTo ? { redirectTo } : undefined,
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Error generating recovery link:', linkError)
      // Most common cause: the email does not correspond to an existing user.
      return new Response(
        JSON.stringify({ error: linkError?.message || 'Could not generate reset link for this email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resetLink = linkData.properties.action_link
    const schoolName = 'Rising Sun Montessori'
    const fromAddress = Deno.env.get('RESET_EMAIL_FROM') ?? 'ARCC <onboarding@resend.dev>'

    // Send the reset email through Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: 'Reset your ARCC password',
        html: createResetEmailTemplate(resetLink, schoolName),
        text: `Reset your ARCC password by visiting this link (expires in 1 hour):\n\n${resetLink}\n\nIf you didn't request this, you can ignore this email.`,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send reset email', details: errorData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('Password reset email sent successfully:', emailResult?.id)

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult?.id,
        message: `Password reset email sent to ${email}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error?.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
