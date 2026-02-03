import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// Check if WebAuthn is supported and if platform authenticator is available
export async function checkBiometricSupport(): Promise<{
  webauthnSupported: boolean;
  platformAuthenticatorAvailable: boolean;
}> {
  if (typeof window === 'undefined') {
    return { webauthnSupported: false, platformAuthenticatorAvailable: false };
  }

  // Check if WebAuthn is supported
  if (!window.PublicKeyCredential) {
    return { webauthnSupported: false, platformAuthenticatorAvailable: false };
  }

  try {
    // Check if platform authenticator (Face ID, Touch ID, etc.) is available
    const platformAuthenticatorAvailable = 
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    return {
      webauthnSupported: true,
      platformAuthenticatorAvailable,
    };
  } catch {
    return { webauthnSupported: false, platformAuthenticatorAvailable: false };
  }
}

// Register a new passkey
export async function registerPasskey(
  customerId: string,
  customerName: string,
  customerPhone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get registration options from server
    const optionsRes = await fetch('/api/webauthn/register-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, customerName, customerPhone }),
    });

    if (!optionsRes.ok) {
      const error = await optionsRes.json();
      return { success: false, error: error.error || 'Failed to get options' };
    }

    const options = await optionsRes.json();

    // Start the registration ceremony (this triggers Face ID / Touch ID)
    const registrationResponse = await startRegistration(options);

    // Verify with server
    const verifyRes = await fetch('/api/webauthn/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, response: registrationResponse }),
    });

    if (!verifyRes.ok) {
      const error = await verifyRes.json();
      return { success: false, error: error.error || 'Registration failed' };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Passkey registration error:', error);
    
    // Handle user cancellation
    if (error instanceof Error && error.name === 'NotAllowedError') {
      return { success: false, error: 'cancelled' };
    }
    
    return { success: false, error: 'Registration failed' };
  }
}

// Authenticate with passkey
export async function authenticateWithPasskey(
  customerId: string
): Promise<{ success: boolean; customer?: { id: string; name: string; phone: string; email?: string }; error?: string }> {
  try {
    // Get authentication options from server
    const optionsRes = await fetch('/api/webauthn/auth-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });

    if (!optionsRes.ok) {
      const error = await optionsRes.json();
      return { success: false, error: error.error || 'Failed to get options' };
    }

    const options = await optionsRes.json();

    // Start the authentication ceremony (this triggers Face ID / Touch ID)
    const authResponse = await startAuthentication(options);

    // Verify with server
    const verifyRes = await fetch('/api/webauthn/auth-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, response: authResponse }),
    });

    if (!verifyRes.ok) {
      const error = await verifyRes.json();
      return { success: false, error: error.error || 'Authentication failed' };
    }

    const result = await verifyRes.json();
    return { success: true, customer: result.customer };
  } catch (error: unknown) {
    console.error('Passkey authentication error:', error);
    
    // Handle user cancellation
    if (error instanceof Error && error.name === 'NotAllowedError') {
      return { success: false, error: 'cancelled' };
    }
    
    return { success: false, error: 'Authentication failed' };
  }
}

// Check if customer has a passkey registered
export async function checkCustomerHasPasskey(customerId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/webauthn/check-passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });

    if (!res.ok) return false;

    const { hasPasskey } = await res.json();
    return hasPasskey;
  } catch {
    return false;
  }
}
