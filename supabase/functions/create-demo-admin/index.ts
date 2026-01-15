import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const demoEmail = 'demo@chopbar.com'
    const demoPassword = 'demo1234'

    // Check if demo user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const demoUser = existingUsers?.users?.find(u => u.email === demoEmail)

    if (demoUser) {
      // Ensure demo user has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', demoUser.id)
        .eq('role', 'admin')
        .single()

      if (!existingRole) {
        await supabase
          .from('user_roles')
          .upsert({ user_id: demoUser.id, role: 'admin' })
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Demo admin account already exists',
          email: demoEmail,
          password: demoPassword
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create demo user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo Admin'
      }
    })

    if (createError) throw createError

    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'admin' })

    if (roleError) throw roleError

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ 
        user_id: newUser.user.id, 
        full_name: 'Demo Admin' 
      })

    // Ignore profile error if it already exists (trigger may have created it)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo admin account created',
        email: demoEmail,
        password: demoPassword
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
