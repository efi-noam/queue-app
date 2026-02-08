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
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
    }

    // Find admin by email
    const { data: admin, error } = await supabase
      .from('platform_admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 });
    }

    // Check password with bcrypt
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 });
    }

    // Update last login
    await supabase
      .from('platform_admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    return NextResponse.json({
      success: true,
      session: {
        adminId: admin.id,
        adminName: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Platform login error:', error);
    return NextResponse.json({ error: 'שגיאה בהתחברות' }, { status: 500 });
  }
}
