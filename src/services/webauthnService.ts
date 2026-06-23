import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { supabase } from "../lib/supabaseClient";

/**
 * WebAuthn Service
 * Handles fingerprint biometric authentication registration and login
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ============================================================================
// Registration Functions
// ============================================================================

/**
 * Start the WebAuthn registration process
 * Returns registration options to be used by the browser
 */
export const initiateRegistration = async (userId: string, email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/webauthn/register/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email }),
    });

    if (!response.ok) {
      throw new Error("Failed to initiate registration");
    }

    const options = await response.json();
    return { success: true, options };
  } catch (error) {
    console.error("Error initiating registration:", error);
    return { success: false, error: String(error) };
  }
};

/**
 * Complete the WebAuthn registration process
 * Sends the attestation response to the server
 */
export const completeRegistration = async (
  userId: string,
  credentialName: string,
  attestationResponse: any
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/webauthn/register/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        credentialName,
        attestationResponse,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to complete registration");
    }

    const result = await response.json();
    return { success: true, credentialId: result.credentialId };
  } catch (error) {
    console.error("Error completing registration:", error);
    return { success: false, error: String(error) };
  }
};

/**
 * Register a new fingerprint credential
 */
export const registerFingerprint = async (
  userId: string,
  email: string,
  credentialName: string
) => {
  try {
    // Check if browser supports WebAuthn
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported on this browser");
    }

    // Check for user verification support
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        console.warn(
          "Browser does not support user verification (fingerprint)"
        );
      }
    } catch (e) {
      console.warn("Could not check user verification support");
    }

    // Step 1: Get registration options from server
    const initResponse = await initiateRegistration(userId, email);
    if (!initResponse.success) {
      throw new Error(initResponse.error);
    }

    // Step 2: Start registration in browser
    let attResp;
    try {
      attResp = await startRegistration(initResponse.options);
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        throw new Error("Fingerprint registration cancelled");
      }
      throw error;
    }

    // Step 3: Complete registration on server
    const completeResponse = await completeRegistration(
      userId,
      credentialName,
      attResp
    );

    if (!completeResponse.success) {
      throw new Error(completeResponse.error);
    }

    return {
      success: true,
      message: "Fingerprint registered successfully",
      credentialId: completeResponse.credentialId,
    };
  } catch (error) {
    console.error("Fingerprint registration error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
};

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Start the WebAuthn authentication process
 * Returns authentication options for the browser
 */
export const initiateAuthentication = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/webauthn/authenticate/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Failed to initiate authentication");
    }

    const options = await response.json();
    return { success: true, options };
  } catch (error) {
    console.error("Error initiating authentication:", error);
    return { success: false, error: String(error) };
  }
};

/**
 * Complete the WebAuthn authentication process
 * Verifies the assertion response and returns auth token
 */
export const completeAuthentication = async (
  email: string,
  assertionResponse: any
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/webauthn/authenticate/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        assertionResponse,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Authentication failed");
    }

    const result = await response.json();
    return {
      success: true,
      user: result.user,
      session: result.session,
    };
  } catch (error) {
    console.error("Error completing authentication:", error);
    return { success: false, error: String(error) };
  }
};

/**
 * Authenticate using fingerprint
 */
export const authenticateWithFingerprint = async (email: string) => {
  try {
    // Check if browser supports WebAuthn
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported on this browser");
    }

    // Step 1: Get authentication options from server
    const initResponse = await initiateAuthentication(email);
    if (!initResponse.success) {
      throw new Error(initResponse.error);
    }

    // Step 2: Start authentication in browser
    let assertionResp;
    try {
      assertionResp = await startAuthentication(initResponse.options);
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        throw new Error("Fingerprint authentication cancelled");
      }
      throw error;
    }

    // Step 3: Verify authentication on server
    const completeResponse = await completeAuthentication(email, assertionResp);

    if (!completeResponse.success) {
      throw new Error(completeResponse.error);
    }

    return {
      success: true,
      user: completeResponse.user,
      message: "Successfully authenticated with fingerprint",
    };
  } catch (error) {
    console.error("Fingerprint authentication error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
};

// ============================================================================
// Credential Management Functions
// ============================================================================

/**
 * Get all registered fingerprint credentials for a user
 */
export const getUserCredentials = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("webauthn_credentials")
      .select("id, credential_id, credential_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, credentials: data || [] };
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return { success: false, error: String(error), credentials: [] };
  }
};

/**
 * Delete a specific credential
 */
export const deleteCredential = async (credentialId: string) => {
  try {
    const { error } = await supabase
      .from("webauthn_credentials")
      .delete()
      .eq("id", credentialId);

    if (error) throw error;
    return { success: true, message: "Credential deleted" };
  } catch (error) {
    console.error("Error deleting credential:", error);
    return { success: false, error: String(error) };
  }
};

/**
 * Check if user has any registered credentials
 */
export const hasRegisteredCredentials = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("webauthn_credentials")
      .select("id", { count: "exact" })
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true, hasCredentials: (data?.length || 0) > 0 };
  } catch (error) {
    console.error("Error checking credentials:", error);
    return { success: false, hasCredentials: false };
  }
};

// ============================================================================
// Browser Support Checks
// ============================================================================

export const isWebauthnSupported = (): boolean => {
  return !!window.PublicKeyCredential;
};

export const canUseFingerprint = async (): Promise<boolean> => {
  if (!isWebauthnSupported()) return false;
  // Check if browser supports user verification
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
};
