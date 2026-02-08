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
    const { email, businessSlug } = await request.json();

    if (!email || !businessSlug) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
    }

    // Find business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('slug', businessSlug)
      .single();

    if (bizError || !business) {
      // Don't reveal if business exists
      return NextResponse.json({ success: true, maskedEmail: '***' });
    }

    // Find owner
    const { data: owner, error: ownerError } = await supabase
      .from('business_owners')
      .select('id, email, name')
      .eq('id', business.owner_id)
      .single();

    if (ownerError || !owner || owner.email.toLowerCase() !== email.toLowerCase()) {
      // Don't reveal if email matches
      return NextResponse.json({ success: true, maskedEmail: '***' });
    }

    // Generate reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store reset code in business_owners table
    const { error: updateError } = await supabase
      .from('business_owners')
      .update({
        reset_code: resetCode,
        reset_code_expires: expiresAt,
      })
      .eq('id', owner.id);

    if (updateError) {
      console.error('Error setting reset code:', updateError);
      return NextResponse.json({ error: 'שגיאה בשליחת קוד' }, { status: 500 });
    }

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'QueueApp <noreply@resend.dev>',
      to: owner.email,
      subject: `קוד אימות לאיפוס סיסמה - ${business.name}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1F2937, #374151); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔐 איפוס סיסמת מנהל</h1>
            </div>
            <div style="padding: 30px; text-align: center;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 10px;">
                שלום ${owner.name || 'מנהל'},
              </p>
              <p style="color: #6B7280; font-size: 14px; margin-bottom: 30px;">
                קיבלנו בקשה לאיפוס סיסמת הניהול של <strong>${business.name}</strong>. הנה קוד האימות:
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
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">${business.name} - ממשק ניהול</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Email error:', emailError);
      await supabase
        .from('business_owners')
        .update({ reset_code: null, reset_code_expires: null })
        .eq('id', owner.id);
      return NextResponse.json({ error: 'שגיאה בשליחת האימייל. נסה שוב.' }, { status: 500 });
    }

    // Mask email
    const parts = owner.email.split('@');
    const maskedEmail = parts[0].substring(0, 2) + '***@' + parts[1];

    return NextResponse.json({ success: true, maskedEmail });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 });
  }
}
