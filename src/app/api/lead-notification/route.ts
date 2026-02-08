import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { businessName, contactName, phone, email } = await request.json();

    if (!businessName || !contactName || !phone) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
    }

    // Send notification to platform owner
    const PLATFORM_OWNER_EMAIL = process.env.PLATFORM_OWNER_EMAIL || 'effi.noam@gmail.com';

    const { success: emailSent, error: emailError } = await sendEmail({
      to: PLATFORM_OWNER_EMAIL,
      subject: `🔔 ליד חדש! ${contactName} - ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #F59E0B, #EF4444); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔥 ליד חדש!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">מישהו מעוניין בשירות שלך</p>
            </div>
            <div style="padding: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: bold; text-align: right;">${businessName}</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; text-align: left; width: 80px;">שם העסק</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: bold; text-align: right;">${contactName}</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; text-align: left;">איש קשר</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                    <a href="tel:${phone}" style="color: #3B82F6; font-weight: bold; text-decoration: none; font-size: 18px;">${phone}</a>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; text-align: left;">טלפון</td>
                </tr>
                ${email ? `<tr>
                  <td style="padding: 12px 0; color: #1F2937; text-align: right;">
                    <a href="mailto:${email}" style="color: #3B82F6; text-decoration: none;">${email}</a>
                  </td>
                  <td style="padding: 12px 0; color: #6B7280; text-align: left;">אימייל</td>
                </tr>` : ''}
              </table>

              <div style="margin-top: 24px; text-align: center;">
                <a href="https://wa.me/${phone.replace(/[^0-9]/g, '').replace(/^0/, '972')}?text=${encodeURIComponent(`היי ${contactName}! קיבלנו את הפנייה שלך לגבי ${businessName}. מתי נוח לך לדבר?`)}" 
                   style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  💬 שלח הודעה בוואטסאפ
                </a>
              </div>

              <div style="margin-top: 12px; text-align: center;">
                <a href="tel:${phone}" 
                   style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  📞 התקשר עכשיו
                </a>
              </div>
            </div>
            <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })} | Queue Platform
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (!emailSent) {
      console.error('Lead notification email error:', emailError);
      return NextResponse.json({ error: 'שגיאה בשליחת התראה' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead notification error:', error);
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 });
  }
}
