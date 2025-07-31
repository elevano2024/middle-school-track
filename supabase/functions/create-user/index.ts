
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key for admin operations
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

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!userRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, password, fullName } = await req.json()

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the user using admin client
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName
      },
      email_confirm: true
    })

    if (error) {
      console.error('Error creating user:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Auto-assign 'student' role to new users - CRITICAL for access
    if (!data.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign role and ENSURE it succeeds
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: data.user.id,
        role: 'student'
      })
      .select()

    if (roleError) {
      console.error('CRITICAL: Role assignment failed for user:', data.user.id, roleError)
      
      // ROLLBACK: Delete the auth user if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to assign user role: ${roleError.message}. User creation cancelled.`,
          details: 'This prevents users from being created without proper access permissions.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify role was actually assigned
    const { data: verifyRole, error: verifyError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    if (verifyError || !verifyRole) {
      console.error('CRITICAL: Role verification failed for user:', data.user.id)
      
      // ROLLBACK: Delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify user role assignment. User creation cancelled.',
          details: 'This ensures all users have proper access permissions before login.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ User created successfully with ${verifyRole.role} role:`, data.user.email)

    return new Response(
      JSON.stringify({ 
        data,
        role: verifyRole.role,
        message: `User created successfully with ${verifyRole.role} access`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
