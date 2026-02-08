import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'חסר אימייל' }, { status: 400 });
    }

    // Find platform admin
    const { data: admin, error: findError } = await supabase
      .from('platform_admins')
      .select('id, email, name')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (findError || !admin) {
      // Don't reveal if admin exists - return success anyway
      return NextResponse.json({ success: true, maskedEmail: '***' });
    }

    // Generate reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store reset code
    const { error: updateError } = await supabase
      .from('platform_admins')
      .update({
        reset_code: resetCode,
        reset_code_expires: expiresAt,
      })
      .eq('id', admin.id);

    if (updateError) {
      console.error('Error setting reset code:', updateError);
      return NextResponse.json({ error: 'שגיאה בשליחת קוד' }, { status: 500 });
    }

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'QueueApp <noreply@resend.dev>',
      to: admin.email,
      subject: 'קוד אימות לאיפוס סיסמה - Queue Platform Admin',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: Arial, sans-serif; background-color: #1F2937; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #374151; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔑 איפוס סיסמת מנהל מערכת</h1>
            </div>
            <div style="padding: 30px; text-align: center;">
              <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 10px;">
                שלום ${admin.name || 'מנהל'},
              </p>
              <p style="color: #9CA3AF; font-size: 14px; margin-bottom: 30px;">
                קיבלנו בקשה לאיפוס הסיסמה שלך. הנה קוד האימות:
              </p>
              <div style="background: #1F2937; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #60A5FA;">
                  ${resetCode}
                </span>
              </div>
              <p style="color: #6B7280; font-size: 12px; margin-bottom: 10px;">
                הקוד תקף ל-10 דקות
              </p>
              <p style="color: #6B7280; font-size: 12px;">
                אם לא ביקשת לאפס את הסיסמה, התעלם מהודעה זו
              </p>
            </div>
            <div style="background: #1F2937; padding: 20px; text-align: center; border-top: 1px solid #4B5563;">
              <p style="color: #6B7280; font-size: 12px; margin: 0;">Queue Platform - ניהול מערכת</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Email error:', emailError);
      await supabase
        .from('platform_admins')
        .update({ reset_code: null, reset_code_expires: null })
        .eq('id', admin.id);
      return NextResponse.json({ error: 'שגיאה בשליחת האימייל. נסה שוב.' }, { status: 500 });
    }

    // Mask email
    const parts = admin.email.split('@');
    const maskedEmail = parts[0].substring(0, 2) + '***@' + parts[1];

    return NextResponse.json({ success: true, maskedEmail });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 });
  }
}
