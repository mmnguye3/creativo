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
      Deno.env.get('SUPABASE_URL') ?? '',
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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

    // List users using admin client
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      throw listError
    }

    // Get user roles
    const { data: allUserRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')

    const usersWithRoles = users.users.map(user => {
      const roles = allUserRoles?.filter(role => role.user_id === user.id).map(role => role.role) || []
      return {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        roles
      }
    })

    return new Response(
      JSON.stringify({ users: usersWithRoles }),
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