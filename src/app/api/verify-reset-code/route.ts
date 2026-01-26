import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { businessId, phone, code } = await request.json();

    if (!businessId || !phone || !code) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
    }

    // Find customer
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, reset_code, reset_code_expires')
      .eq('business_id', businessId)
      .eq('phone', phone)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });
    }

    // Check if code matches
    if (customer.reset_code !== code) {
      return NextResponse.json({ error: 'קוד שגוי' }, { status: 400 });
    }

    // Check if code is expired
    if (customer.reset_code_expires && new Date(customer.reset_code_expires) < new Date()) {
      return NextResponse.json({ error: 'הקוד פג תוקף. בקש קוד חדש' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 });
  }
}
