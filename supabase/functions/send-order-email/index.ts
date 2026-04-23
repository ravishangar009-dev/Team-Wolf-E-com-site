import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = "re_P8cYsG15_6YjTiVXRQ1ct2sv3WwJTdAQs"; // Using the user provided key

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderEmailRequest {
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  storeName: string;
  totalAmount: number;
  deliveryFee: number;
  distance: string;
  latitude: number | null;
  longitude: number | null;
  orderItems: OrderItem[];
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const {
      customerEmail,
      customerPhone,
      deliveryAddress,
      storeName,
      totalAmount,
      deliveryFee,
      distance,
      latitude,
      longitude,
      orderItems,
      orderId,
    }: OrderEmailRequest = await req.json();

    console.log("Received order email request:", { orderId, storeName, totalAmount });

    // Validate required inputs
    if (!orderId || !storeName || !customerEmail || !orderItems?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const itemsHtml = orderItems
      .map(
        (item) =>
          `<tr style="border-bottom: 1px solid #262626;">
            <td style="padding: 12px 8px; color: #ffffff;">${item.name}</td>
            <td style="padding: 12px 8px; color: #ffffff; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 8px; color: #ffffff; text-align: right;">₹${item.price}</td>
          </tr>`
      )
      .join("");

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Order - Team Wolf Supplement</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0c; color: #ffffff;">
    <div style="background: linear-gradient(135deg, #1f1f1f 0%, #0a0a0a 100%); padding: 30px; border-radius: 12px; border: 1px solid #333; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        
        <div style="text-align: center; border-bottom: 2px solid #e11d48; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">🐺 Team Wolf</h1>
            <p style="color: #a3a3a3; margin: 10px 0 0 0; font-size: 14px;">NEW ORDER INITIATED</p>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #e11d48; font-size: 18px; margin-bottom: 12px; font-weight: 700;">ORDER DETAILS #${orderId.slice(0, 8)}</h2>
            <div style="background-color: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #262626;">
                <p style="margin: 5px 0; color: #e5e5e5;"><strong>Store:</strong> ${storeName}</p>
                <p style="margin: 5px 0; color: #e5e5e5;"><strong>Customer Email:</strong> ${customerEmail}</p>
                <p style="margin: 5px 0; color: #e5e5e5;"><strong>Phone:</strong> ${customerPhone}</p>
                <p style="margin: 5px 0; color: #e5e5e5;"><strong>Address:</strong> ${deliveryAddress}</p>
            </div>
        </div>

        <div style="margin-bottom: 30px;">
            <h2 style="color: #e11d48; font-size: 18px; margin-bottom: 12px; font-weight: 700;">PURCHASED ITEMS</h2>
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid #333;">
                        <th style="padding: 12px 8px; color: #a3a3a3; font-weight: 600;">ITEM</th>
                        <th style="padding: 12px 8px; color: #a3a3a3; font-weight: 600; text-align: center;">QTY</th>
                        <th style="padding: 12px 8px; color: #a3a3a3; font-weight: 600; text-align: right;">PRICE</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>

        <div style="background-color: #e11d48; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
            <h3 style="color: #ffffff; margin: 0; font-size: 22px;">TOTAL AMOUNT: ₹${totalAmount}</h3>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <p style="color: #525252; font-size: 12px;">This is an automated system notification from the Team Wolf framework.</p>
        </div>
    </div>
</body>
</html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Team Wolf Shop <onboarding@resend.dev>",
        to: ["ravishangar130@gmail.com"],
        subject: `🐺 Team Wolf Order #${orderId.slice(0, 8)} - ${storeName}`,
        html: emailHtml,
      }),
    });

    const emailResponse = await res.json();
    
    if (!res.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
