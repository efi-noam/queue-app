import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { email, businessSlug, code, newPassword } = await request.json();

    if (!email || !businessSlug || !code || !newPassword) {
      return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'סיסמה חייבת להכיל לפחות 6 תווים' }, { status: 400 });
    }

    // Find business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('slug', businessSlug)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: 'עסק לא נמצא' }, { status: 404 });
    }

    // Find owner
    const { data: owner, error: ownerError } = await supabase
      .from('business_owners')
      .select('id, email, reset_code, reset_code_expires')
      .eq('id', business.owner_id)
      .single();

    if (ownerError || !owner || owner.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'פרטים שגויים' }, { status: 400 });
    }

    // Verify code
    if (owner.reset_code !== code) {
      return NextResponse.json({ error: 'קוד שגוי' }, { status: 400 });
    }

    if (owner.reset_code_expires && new Date(owner.reset_code_expires) < new Date()) {
      return NextResponse.json({ error: 'הקוד פג תוקף' }, { status: 400 });
    }

    // Update password and clear reset code
    const { error: updateError } = await supabase
      .from('business_owners')
      .update({
        password_hash: newPassword, // In production, use bcrypt
        reset_code: null,
        reset_code_expires: null,
      })
      .eq('id', owner.id);

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
