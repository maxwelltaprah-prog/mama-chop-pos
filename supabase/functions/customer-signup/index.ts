import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  phone: string;
  password: string;
  fullName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Backend not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Partial<SignupRequest>;

    // Validate phone number (Ghana format: 0XXXXXXXXX or +233XXXXXXXXX)
    const phoneRegex = /^(?:\+233|0)[2-9]\d{8}$/;
    const cleanPhone = body.phone?.replace(/\s/g, "") || "";
    
    if (!phoneRegex.test(cleanPhone)) {
      return new Response(JSON.stringify({ error: "Invalid phone number. Use format: 0241234567 or +233241234567" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize phone to +233 format
    const normalizedPhone = cleanPhone.startsWith("0") 
      ? "+233" + cleanPhone.slice(1) 
      : cleanPhone;

    if (!body.password || body.password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if phone already exists
    const { data: existingCustomer } = await supabaseAdmin
      .from("customer_profiles")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (existingCustomer) {
      return new Response(JSON.stringify({ error: "Phone number already registered. Please sign in." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create email from phone for Supabase auth (workaround for phone+password auth)
    const pseudoEmail = `${normalizedPhone.replace("+", "")}@customer.eidikos.local`;

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: pseudoEmail,
      password: body.password,
      email_confirm: true,
      user_metadata: { 
        full_name: body.fullName || "",
        phone: normalizedPhone,
        is_customer: true,
      },
    });

    if (createError) {
      console.error("User creation error:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create customer profile
    const { error: profileError } = await supabaseAdmin
      .from("customer_profiles")
      .insert({
        user_id: newUser.user.id,
        phone: normalizedPhone,
        full_name: body.fullName || null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: "Failed to create customer profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Account created successfully",
      userId: newUser.user.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("customer-signup error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
