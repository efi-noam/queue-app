import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { businessId, customerName, customerPhone, customerEmail, serviceName, date, time, price } = await request.json();

    if (!businessId || !customerName || !serviceName || !date || !time) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
    }

    // Get business info and owner email
    const { data: business } = await supabase
      .from('businesses')
      .select('name, owner_id')
      .eq('id', businessId)
      .single();

    const businessName = business?.name || 'העסק';

    // Get owner email via owner_id from business
    let owner: { email: string } | null = null;
    if (business?.owner_id) {
      const { data: ownerData } = await supabase
        .from('business_owners')
        .select('email')
        .eq('id', business.owner_id)
        .single();
      owner = ownerData;
    }

    // Format date for display
    const [year, month, day] = date.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const formattedDate = dateObj.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const errors: string[] = [];

    // 1. Send email to business owner
    if (owner?.email) {
      const { success: ownerSent, error: ownerEmailError } = await sendEmail({
        to: owner.email,
        subject: `תור חדש! ${customerName} - ${serviceName}`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📅 תור חדש!</h1>
              </div>
              <div style="padding: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: bold; text-align: right;">${customerName}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; text-align: left;">לקוח</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: bold; text-align: right;">${customerPhone || '-'}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; text-align: left;">טלפון</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: bold; text-align: right;">${serviceName}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; text-align: left;">שירות</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: bold; text-align: right;">${formattedDate}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; text-align: left;">תאריך</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: bold; font-size: 18px; text-align: right;">${time}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; text-align: left;">שעה</td>
                  </tr>
                  ${price ? `<tr>
                    <td style="padding: 12px 0; color: #10B981; font-weight: bold; font-size: 18px; text-align: right;">₪${price}</td>
                    <td style="padding: 12px 0; color: #6B7280; text-align: left;">מחיר</td>
                  </tr>` : ''}
                </table>
              </div>
              <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="color: #9CA3AF; font-size: 12px; margin: 0;">${businessName} - מערכת ניהול תורים</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (!ownerSent) {
        console.error('Owner email error:', ownerEmailError);
        errors.push('owner');
      }
    }

    // 2. Send confirmation email to customer
    if (customerEmail) {
      const { success: customerSent, error: customerEmailError } = await sendEmail({
        to: customerEmail,
        subject: `אישור תור - ${businessName}`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✅ התור שלך אושר!</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #374151; font-size: 16px; text-align: center; margin-bottom: 20px;">
                  שלום ${customerName}, התור שלך ב<strong>${businessName}</strong> אושר!
                </p>
                <div style="background: #F3F4F6; border-radius: 12px; padding: 20px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; color: #1F2937; font-weight: bold; text-align: right;">${serviceName}</td>
                      <td style="padding: 10px 0; color: #6B7280; text-align: left;">שירות</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #1F2937; font-weight: bold; text-align: right;">${formattedDate}</td>
                      <td style="padding: 10px 0; color: #6B7280; text-align: left;">תאריך</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #1F2937; font-weight: bold; font-size: 18px; text-align: right;">${time}</td>
                      <td style="padding: 10px 0; color: #6B7280; text-align: left;">שעה</td>
                    </tr>
                    ${price ? `<tr>
                      <td style="padding: 10px 0; color: #3B82F6; font-weight: bold; font-size: 18px; text-align: right;">₪${price}</td>
                      <td style="padding: 10px 0; color: #6B7280; text-align: left;">מחיר</td>
                    </tr>` : ''}
                  </table>
                </div>
                <p style="color: #6B7280; font-size: 14px; text-align: center; margin-top: 20px;">
                  נתראה! 🙏
                </p>
              </div>
              <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="color: #9CA3AF; font-size: 12px; margin: 0;">${businessName} - מערכת ניהול תורים</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (!customerSent) {
        console.error('Customer email error:', customerEmailError);
        errors.push('customer');
      }
    }

    return NextResponse.json({ 
      success: true,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Booking notification error:', error);
    return NextResponse.json({ error: 'שגיאה בשליחת התראה' }, { status: 500 });
  }
}
