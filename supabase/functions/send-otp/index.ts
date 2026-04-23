import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string" || phone.length < 10) {
      return new Response(
        JSON.stringify({ error: "Valid phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone - ensure +91 prefix
    const cleanPhone = phone.replace(/\D/g, "");
    const last10 = cleanPhone.slice(-10);

    if (last10.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Phone number must be 10 digits" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullPhone = "+91" + last10;

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

    // Store OTP in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete old OTPs for this phone
    await supabase
      .from("phone_otps")
      .delete()
      .eq("phone", fullPhone);

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("phone_otps")
      .insert({ phone: fullPhone, otp_code: otp, expires_at: expiresAt });

    if (insertError) {
      console.error("DB insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP via Fast2SMS
    const fast2smsKey = "uwCgWnqihJ09krpbSXyYI3PmEaQlD5FM1eH2BA7dNfzoZLsUcx2dE5RGMiOaPFwuC1ZQnLsUXreWkYjJ"; // User provided Fast2SMS key
    if (!fast2smsKey) {
      console.error("FAST2SMS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smsResponse = await fetch(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        method: "POST",
        headers: {
          authorization: fast2smsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: `Your Team Wolf Supplement verification code is ${otp}. Valid for 5 mins. Do not share.`,
          flash: "0",
          numbers: last10,
        }),
      }
    );

    const smsData = await smsResponse.json();
    console.log("Fast2SMS response:", JSON.stringify(smsData));

    if (!smsData.return) {
      return new Response(
        JSON.stringify({ error: smsData.message || "Failed to send SMS" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-otp error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
