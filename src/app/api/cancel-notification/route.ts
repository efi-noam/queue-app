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
    const { appointmentId, cancelledBy } = await request.json();
    // cancelledBy: 'customer' | 'admin'

    if (!appointmentId) {
      return NextResponse.json({ error: 'חסר מזהה תור' }, { status: 400 });
    }

    // Get appointment with service and customer info
    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .select(`
        id, date, start_time, business_id,
        services ( name, price, duration ),
        customers ( name, phone, email )
      `)
      .eq('id', appointmentId)
      .single();

    if (apptError || !appointment) {
      console.error('Error fetching appointment:', apptError);
      return NextResponse.json({ error: 'תור לא נמצא' }, { status: 404 });
    }

    // Get business info and owner
    const { data: business } = await supabase
      .from('businesses')
      .select('name, owner_id')
      .eq('id', appointment.business_id)
      .single();

    const businessName = business?.name || 'העסק';

    // Format date
    const [year, month, day] = appointment.date.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const formattedDate = dateObj.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const time = appointment.start_time?.slice(0, 5) || '';
    const service = (appointment as any).services;
    const customer = (appointment as any).customers;
    const serviceName = service?.name || 'שירות';
    const customerName = customer?.name || 'לקוח';
    const customerEmail = customer?.email;

    const errors: string[] = [];

    // 1. If customer cancelled → notify business owner
    if (cancelledBy === 'customer' && business?.owner_id) {
      const { data: owner } = await supabase
        .from('business_owners')
        .select('email')
        .eq('id', business.owner_id)
        .single();

      if (owner?.email) {
        const { success } = await sendEmail({
          to: owner.email,
          subject: `❌ תור בוטל - ${customerName}`,
          html: `
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
              <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">❌ תור בוטל</h1>
                </div>
                <div style="padding: 30px;">
                  <p style="color: #374151; font-size: 16px; text-align: center; margin-bottom: 20px;">
                    <strong>${customerName}</strong> ביטל/ה את התור
                  </p>
                  <table style="width: 100%; border-collapse: collapse;">
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
                    <tr>
                      <td style="padding: 12px 0; color: #1F2937; font-weight: bold; text-align: right;">${customer?.phone || '-'}</td>
                      <td style="padding: 12px 0; color: #6B7280; text-align: left;">טלפון</td>
                    </tr>
                  </table>
                </div>
                <div style="background: #FEF2F2; padding: 20px; text-align: center; border-top: 1px solid #FECACA;">
                  <p style="color: #9CA3AF; font-size: 12px; margin: 0;">המשבצת פנויה כעת לתורים חדשים</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        if (!success) errors.push('owner');
      }
    }

    // 2. If admin cancelled → notify customer
    if (cancelledBy === 'admin' && customerEmail) {
      const { success } = await sendEmail({
        to: customerEmail,
        subject: `עדכון: התור שלך ב${businessName} בוטל`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #F59E0B, #EF4444); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">😔 התור שלך בוטל</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #374151; font-size: 16px; text-align: center; margin-bottom: 20px;">
                  שלום ${customerName}, לצערנו התור שלך ב<strong>${businessName}</strong> בוטל
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
                      <td style="padding: 10px 0; color: #1F2937; font-weight: bold; text-align: right;">${time}</td>
                      <td style="padding: 10px 0; color: #6B7280; text-align: left;">שעה</td>
                    </tr>
                  </table>
                </div>
                <p style="color: #6B7280; font-size: 14px; text-align: center; margin-top: 20px;">
                  ניתן לקבוע תור חדש בכל עת 🙏
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
      if (!success) errors.push('customer');
    }

    return NextResponse.json({
      success: true,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Cancel notification error:', error);
    return NextResponse.json({ error: 'שגיאה בשליחת התראה' }, { status: 500 });
  }
}
