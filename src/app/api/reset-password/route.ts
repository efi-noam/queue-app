import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashPassword(password: string): string {
  // Store password as-is to match client-side auth.ts
  // In production, use proper hashing (bcrypt)
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, phone, code, newPassword } = await request.json();

    if (!businessId || !phone || !code || !newPassword) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'סיסמה חייבת להכיל לפחות 4 תווים' }, { status: 400 });
    }

    // Find customer
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('phone', phone)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });
    }

    // Verify code again
    if (customer.reset_code !== code) {
      return NextResponse.json({ error: 'קוד שגוי' }, { status: 400 });
    }

    if (customer.reset_code_expires && new Date(customer.reset_code_expires) < new Date()) {
      return NextResponse.json({ error: 'הקוד פג תוקף' }, { status: 400 });
    }

    // Update password and clear reset code
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        pin_hash: hashPassword(newPassword),
        reset_code: null,
        reset_code_expires: null,
      })
      .eq('id', customer.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: 'שגיאה בעדכון סיסמה' }, { status: 500 });
    }

    // Return updated customer
    const { data: updatedCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer.id)
      .single();

    return NextResponse.json({ 
      success: true,
      customer: updatedCustomer 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 });
  }
}
