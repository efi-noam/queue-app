import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRegistrationOptions } from '@simplewebauthn/server';

export const dynamic = 'force-dynamic';

const rpName = 'TorLi - Queue App';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { customerId, customerName, customerPhone } = await request.json();

    if (!customerId || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get RP ID from request origin
    const origin = request.headers.get('origin') || '';
    const rpID = new URL(origin).hostname;

    // Get existing credentials for this customer
    const { data: existingCredentials } = await supabase
      .from('passkey_credentials')
      .select('credential_id, transports')
      .eq('customer_id', customerId);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(customerId),
      userName: customerPhone,
      userDisplayName: customerName,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      excludeCredentials: (existingCredentials || []).map(cred => ({
        id: cred.credential_id,
        type: 'public-key' as const,
        transports: cred.transports || ['internal'],
      })),
    });

    // Store challenge temporarily (in production, use Redis or similar)
    await supabase
      .from('customers')
      .update({ 
        reset_code: options.challenge, // Reusing this field temporarily
        reset_code_expires: new Date(Date.now() + 5 * 60 * 1000).toISOString() 
      })
      .eq('id', customerId);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Registration options error:', error);
    return NextResponse.json({ error: 'Failed to generate options' }, { status: 500 });
  }
}
