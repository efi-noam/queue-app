import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { customerId, response: authResponse } = await request.json();

    if (!customerId || !authResponse) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get RP ID and origin from request
    const origin = request.headers.get('origin') || '';
    const rpID = new URL(origin).hostname;

    // Get stored challenge
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, email, reset_code, reset_code_expires')
      .eq('id', customerId)
      .single();

    if (customerError || !customer?.reset_code) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 400 });
    }

    // Check if challenge expired
    if (customer.reset_code_expires && new Date(customer.reset_code_expires) < new Date()) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    // Get the credential
    const { data: credential, error: credError } = await supabase
      .from('passkey_credentials')
      .select('*')
      .eq('customer_id', customerId)
      .eq('credential_id', authResponse.id)
      .single();

    if (credError || !credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Convert stored credential for verification
    const publicKeyBuffer = Buffer.from(credential.public_key, 'base64url');

    // Verify the authentication
    const verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: customer.reset_code,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.credential_id,
        publicKey: new Uint8Array(publicKeyBuffer),
        counter: credential.counter,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Update counter and last_used_at
    await supabase
      .from('passkey_credentials')
      .update({ 
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', credential.id);

    // Clear the challenge
    await supabase
      .from('customers')
      .update({ reset_code: null, reset_code_expires: null })
      .eq('id', customerId);

    return NextResponse.json({ 
      verified: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
