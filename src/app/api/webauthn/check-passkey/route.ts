import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
    }

    // Check if customer has any passkeys registered
    const { data: credentials, error } = await supabase
      .from('passkey_credentials')
      .select('id')
      .eq('customer_id', customerId)
      .limit(1);

    if (error) {
      console.error('Error checking passkey:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ 
      hasPasskey: credentials && credentials.length > 0 
    });
  } catch (error) {
    console.error('Check passkey error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
