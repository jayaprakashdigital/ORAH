import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const demoEmail = 'demo@orah.ai';
    const demoPassword = 'demo123456';
    const demoCompanyId = '11111111-1111-1111-1111-111111111111';

    // Check if demo user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users.some(u => u.email === demoEmail);

    if (userExists) {
      return new Response(
        JSON.stringify({ message: 'Demo user already exists', email: demoEmail }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create demo user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Create user profile linked to demo company
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: demoEmail,
      name: 'Demo User',
      company_id: demoCompanyId,
      role: 'admin',
    });

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo user created successfully',
        credentials: {
          email: demoEmail,
          password: demoPassword,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});