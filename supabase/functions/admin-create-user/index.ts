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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create a Supabase client with service role permissions
    const supabaseAdmin = createClient(
      'https://ukabvhdvfajudrtqnfpm.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create a regular client to verify the user's admin status
    const supabase = createClient(
      'https://ukabvhdvfajudrtqnfpm.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrYWJ2aGR2ZmFqdWRydHFuZnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODA0ODMsImV4cCI6MjA3NTQ1NjQ4M30.s_k6lT11c0PzxjBEjF1BztJ6zaovuFI93tcxx5yo5Ms',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Get the user from the auth header
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Check if user is admin using RLS-compliant function
    const { data: isAdminResult, error: adminError } = await supabase
      .rpc('is_admin')

    if (adminError) {
      console.error('Error checking admin status:', adminError)
      throw new Error('Error checking admin status')
    }

    if (!isAdminResult) {
      throw new Error('User is not an admin')
    }

    const { email, password, role } = await req.json()

    // Create the user using admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError) {
      throw createError
    }

    // Add role to the new user
    if (newUser.user) {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role })
    }

    return new Response(
      JSON.stringify({ user: newUser.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})