import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  // Create clients inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { businessId, phone, businessName } = await request.json();

    if (!businessId || !phone) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
    }

    // Find customer
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('phone', phone)
      .single();

    if (findError || !customer) {
      return NextResponse.json({ error: 'מספר טלפון לא נמצא' }, { status: 404 });
    }

    if (!customer.email) {
      return NextResponse.json({ error: 'לא נמצא אימייל לחשבון זה. פנה לבעל העסק' }, { status: 400 });
    }

    // Generate reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Update customer with reset code
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        reset_code: resetCode,
        reset_code_expires: expiresAt,
      })
      .eq('id', customer.id);

    if (updateError) {
      console.error('Error setting reset code:', updateError);
      return NextResponse.json({ error: 'שגיאה בשליחת קוד' }, { status: 500 });
    }

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'QueueApp <noreply@resend.dev>',
      to: customer.email,
      subject: `קוד אימות לאיפוס סיסמה - ${businessName || 'QueueApp'}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">איפוס סיסמה</h1>
            </div>
            <div style="padding: 30px; text-align: center;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 10px;">
                שלום ${customer.name || 'לקוח יקר'},
              </p>
              <p style="color: #6B7280; font-size: 14px; margin-bottom: 30px;">
                קיבלנו בקשה לאיפוס הסיסמה שלך. הנה קוד האימות:
              </p>
              <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1F2937;">
                  ${resetCode}
                </span>
              </div>
              <p style="color: #9CA3AF; font-size: 12px; margin-bottom: 10px;">
                הקוד תקף ל-10 דקות
              </p>
              <p style="color: #9CA3AF; font-size: 12px;">
                אם לא ביקשת לאפס את הסיסמה, התעלם מהודעה זו
              </p>
            </div>
            <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                ${businessName || 'QueueApp'} - מערכת ניהול תורים
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Email error:', emailError);
      // Clear the reset code since email wasn't sent
      await supabase
        .from('customers')
        .update({ reset_code: null, reset_code_expires: null })
        .eq('id', customer.id);
      return NextResponse.json({ error: 'שגיאה בשליחת האימייל. נסה שוב.' }, { status: 500 });
    }

    // Mask email for display
    const parts = customer.email.split('@');
    const maskedEmail = parts[0].substring(0, 2) + '***@' + parts[1];

    return NextResponse.json({ 
      success: true, 
      maskedEmail 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 });
  }
}
