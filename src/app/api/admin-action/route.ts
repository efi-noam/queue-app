import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { action, id, platformAdminId } = await request.json();

    // Verify platform admin session
    if (!platformAdminId) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('id', platformAdminId)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
    }

    switch (action) {
      case 'delete-business': {
        const { error } = await supabase
          .from('businesses')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting business:', error);
          return NextResponse.json({ error: 'שגיאה במחיקת העסק' }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      case 'delete-lead': {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting lead:', error);
          return NextResponse.json({ error: 'שגיאה במחיקת הליד' }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'פעולה לא מוכרת' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'שגיאה לא צפויה' }, { status: 500 });
  }
}
