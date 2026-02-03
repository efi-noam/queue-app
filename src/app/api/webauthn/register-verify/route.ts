import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { customerId, response: registrationResponse } = await request.json();

    if (!customerId || !registrationResponse) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get RP ID and origin from request
    const origin = request.headers.get('origin') || '';
    const rpID = new URL(origin).hostname;

    // Get stored challenge
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('reset_code, reset_code_expires')
      .eq('id', customerId)
      .single();

    if (customerError || !customer?.reset_code) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 400 });
    }

    // Check if challenge expired
    if (customer.reset_code_expires && new Date(customer.reset_code_expires) < new Date()) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    // Verify the registration
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: customer.reset_code,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Access credential info from the new API structure
    const { credential } = verification.registrationInfo;
    const credentialId = Buffer.from(credential.id).toString('base64url');
    const publicKey = Buffer.from(credential.publicKey).toString('base64url');

    // Store the credential
    const { error: insertError } = await supabase
      .from('passkey_credentials')
      .insert({
        customer_id: customerId,
        credential_id: credentialId,
        public_key: publicKey,
        counter: credential.counter,
        device_type: 'platform',
        transports: registrationResponse.response.transports || ['internal'],
      });

    if (insertError) {
      console.error('Error storing credential:', insertError);
      return NextResponse.json({ error: 'Failed to store credential' }, { status: 500 });
    }

    // Clear the challenge
    await supabase
      .from('customers')
      .update({ reset_code: null, reset_code_expires: null })
      .eq('id', customerId);

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('Registration verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
