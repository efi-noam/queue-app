import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

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

    // Get RP ID from request origin
    const origin = request.headers.get('origin') || '';
    const rpID = new URL(origin).hostname;

    // Get credentials for this customer
    const { data: credentials, error: credError } = await supabase
      .from('passkey_credentials')
      .select('credential_id, transports')
      .eq('customer_id', customerId);

    if (credError || !credentials || credentials.length === 0) {
      return NextResponse.json({ error: 'No passkeys found' }, { status: 404 });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map(cred => ({
        id: cred.credential_id,
        type: 'public-key' as const,
        transports: cred.transports || ['internal'],
      })),
      userVerification: 'required',
    });

    // Store challenge temporarily
    await supabase
      .from('customers')
      .update({ 
        reset_code: options.challenge,
        reset_code_expires: new Date(Date.now() + 5 * 60 * 1000).toISOString() 
      })
      .eq('id', customerId);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Auth options error:', error);
    return NextResponse.json({ error: 'Failed to generate options' }, { status: 500 });
  }
}
