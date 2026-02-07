import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Create client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { businessId, isActive, platformAdminId } = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
    }

    // Verify authorization - must be a valid platform admin
    if (!platformAdminId) {
      return NextResponse.json({ error: 'Unauthorized - missing admin ID' }, { status: 403 });
    }

    const { data: admin, error: adminError } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('id', platformAdminId)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Unauthorized - invalid admin' }, { status: 403 });
    }

    const { error } = await supabase
      .from('businesses')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', businessId);

    if (error) {
      console.error('Error toggling business:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, isActive });
  } catch (error) {
    console.error('Toggle business error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
