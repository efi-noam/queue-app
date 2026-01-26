import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { businessId, isActive } = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
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
