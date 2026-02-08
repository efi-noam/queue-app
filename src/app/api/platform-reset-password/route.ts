import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'סיסמה חייבת להכיל לפחות 8 תווים' }, { status: 400 });
    }

    // Find platform admin
    const { data: admin, error: findError } = await supabase
      .from('platform_admins')
      .select('id, email, reset_code, reset_code_expires')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (findError || !admin) {
      return NextResponse.json({ error: 'פרטים שגויים' }, { status: 400 });
    }

    // Verify code
    if (admin.reset_code !== code) {
      return NextResponse.json({ error: 'קוד שגוי' }, { status: 400 });
    }

    if (admin.reset_code_expires && new Date(admin.reset_code_expires) < new Date()) {
      return NextResponse.json({ error: 'הקוד פג תוקף' }, { status: 400 });
    }

    // Update password and clear reset code
    const { error: updateError } = await supabase
      .from('platform_admins')
      .update({
        password_hash: await bcrypt.hash(newPassword, 10),
        reset_code: null,
        reset_code_expires: null,
      })
      .eq('id', admin.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: 'שגיאה בעדכון סיסמה' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 });
  }
}
