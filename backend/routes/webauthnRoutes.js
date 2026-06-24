import express from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// Use your own domain
const rpID = process.env.VITE_APP_DOMAIN || "localhost";
const rpName = "StockFlow Inventory";
const origin = process.env.VITE_APP_ORIGIN || "http://localhost:5173";

// ============================================================================
// Setup & Debug Endpoints
// ============================================================================

/**
 * GET /api/webauthn/setup
 * Check if WebAuthn tables exist and are accessible
 */
router.get("/setup", async (req, res) => {
  try {
    // Test webauthn_challenges table
    const challengesTest = await supabase
      .from("webauthn_challenges")
      .select("count()", { count: "exact" })
      .limit(1);

    // Test webauthn_credentials table
    const credentialsTest = await supabase
      .from("webauthn_credentials")
      .select("count()", { count: "exact" })
      .limit(1);

    const result = {
      rpID,
      origin,
      tables: {
        webauthn_challenges: {
          accessible: !challengesTest.error,
          error: challengesTest.error?.message || null,
        },
        webauthn_credentials: {
          accessible: !credentialsTest.error,
          error: credentialsTest.error?.message || null,
        },
      },
      message:
        !challengesTest.error && !credentialsTest.error
          ? "All WebAuthn tables are accessible ✓"
          : "Some tables are missing or inaccessible. Run the webauthn-migration.sql in Supabase.",
    };

    res.json(result);
  } catch (error) {
    console.error("Setup check error:", error);
    res.status(500).json({ message: `Setup check failed: ${error.message}` });
  }
});

// ============================================================================
// Registration Endpoints
// ============================================================================

/**
 * POST /api/webauthn/register/start
 * Generate registration options for a new credential
 */
router.post("/register/start", async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ message: "userId and email are required" });
    }

    console.log("Starting registration for:", { userId, email });

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpID,
      rpName,
      userID: userId,
      userName: email,
      userDisplayName: email,
      attestationType: "direct",
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Platform authenticator (fingerprint)
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Store the challenge in the database for later verification
    const { error, data } = await supabase
      .from("webauthn_challenges")
      .upsert(
        {
          user_id: userId,
          challenge: options.challenge,
          type: "registration",
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select();

    if (error) {
      console.error("Challenge storage error:", error);
      return res.status(500).json({ 
        message: `Failed to store challenge: ${error.message}. Make sure webauthn_challenges table exists in Supabase.` 
      });
    }

    console.log("Challenge stored:", { challenge: options.challenge.substring(0, 20) + "..." });
    res.json(options);
  } catch (error) {
    console.error("Registration start error:", error.message);
    res.status(500).json({ message: `Registration failed: ${error.message}` });
  }
});

/**
 * POST /api/webauthn/register/complete
 * Verify and complete the registration
 */
router.post("/register/complete", async (req, res) => {
  try {
    const { userId, credentialName, attestationResponse } = req.body;

    if (!userId || !attestationResponse) {
      return res
        .status(400)
        .json({ message: "userId and attestationResponse are required" });
    }

    console.log("Completing registration for:", userId);

    // Get the stored challenge
    const { data: challengeData, error: challengeError } = await supabase
      .from("webauthn_challenges")
      .select("challenge")
      .eq("user_id", userId)
      .eq("type", "registration")
      .single();

    if (challengeError) {
      console.error("Challenge retrieval error:", challengeError);
      return res.status(400).json({ 
        message: `Challenge not found: ${challengeError.message}` 
      });
    }

    if (!challengeData) {
      return res.status(400).json({ message: "Challenge not found for this user" });
    }

    // Verify the registration response
    let verification;
    try {
      console.log("Verifying registration with:", {
        rpID,
        origin,
        challengeLength: challengeData.challenge.length,
        attestationResponseKeys: Object.keys(attestationResponse),
      });
      
      verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (error) {
      console.error("Registration verification error:", error.message);
      return res.status(400).json({ 
        message: `Verification failed: ${error.message}` 
      });
    }

    if (!verification.verified) {
      console.error("Verification returned false");
      return res.status(400).json({ message: "Registration verification failed" });
    }

    console.log("Verification successful, storing credential...");

    // Convert credential public key and ID
    let credentialId, credentialPublicKey;
    try {
      credentialId = Buffer.from(
        verification.registrationInfo.credentialID
      ).toString('base64');
      credentialPublicKey = Buffer.from(
        verification.registrationInfo.credentialPublicKey
      ).toString('base64');
    } catch (e) {
      console.error("Buffer conversion error:", e);
      return res.status(500).json({ message: "Failed to process credential data" });
    }

    // Store the credential in the database
    const { data: credential, error: insertError } = await supabase
      .from("webauthn_credentials")
      .insert({
        user_id: userId,
        credential_id: credentialId,
        credential_name:
          credentialName || `Device ${new Date().toLocaleDateString()}`,
        credential_public_key: credentialPublicKey,
        sign_count: verification.registrationInfo.signCount || 0,
        transports: attestationResponse.response?.transports || [],
      })
      .select("id");

    if (insertError) {
      console.error("Credential insertion error:", insertError);
      return res.status(500).json({ 
        message: `Failed to save credential: ${insertError.message}` 
      });
    }

    console.log("Credential stored, clearing challenge...");

    // Clear the challenge
    const { error: deleteError } = await supabase
      .from("webauthn_challenges")
      .delete()
      .eq("user_id", userId)
      .eq("type", "registration");

    if (deleteError) {
      console.error("Challenge deletion error:", deleteError);
      // Don't fail here, registration is already successful
    }

    res.json({
      message: "Registration successful",
      credentialId: credential[0]?.id,
    });
  } catch (error) {
    console.error("Registration complete error:", error.message);
    res.status(500).json({ message: `Registration error: ${error.message}` });
  }
});

// ============================================================================
// Authentication Endpoints
// ============================================================================

/**
 * POST /api/webauthn/authenticate/start
 * Generate authentication options
 */
router.post("/authenticate/start", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    // Get user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's credentials
    const { data: credentials, error: credError } = await supabase
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", profile.id)
      .eq("is_active", true);

    if (credError || !credentials || credentials.length === 0) {
      return res
        .status(404)
        .json({ message: "No credentials registered for this user" });
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((cred) => ({
        id: new Uint8Array(Buffer.from(cred.credential_id, 'base64')),
        type: "public-key",
        transports: ["internal"],
      })),
      userVerification: "preferred",
    });

    // Store the challenge
    const { error: storageError } = await supabase
      .from("webauthn_challenges")
      .upsert(
        {
          user_id: profile.id,
          challenge: options.challenge,
          type: "authentication",
          created_at: new Date(),
        },
        { onConflict: "user_id" }
      );

    if (storageError) throw storageError;

    res.json(options);
  } catch (error) {
    console.error("Authentication start error:", error);
    res.status(500).json({ message: "Failed to start authentication" });
  }
});

/**
 * POST /api/webauthn/authenticate/complete
 * Verify and complete the authentication
 */
router.post("/authenticate/complete", async (req, res) => {
  try {
    const { email, assertionResponse } = req.body;

    if (!email || !assertionResponse) {
      return res
        .status(400)
        .json({ message: "email and assertionResponse are required" });
    }

    // Get user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the stored challenge
    const { data: challengeData, error: challengeError } = await supabase
      .from("webauthn_challenges")
      .select("challenge")
      .eq("user_id", profile.id)
      .eq("type", "authentication")
      .single();

    if (challengeError || !challengeData) {
      return res.status(400).json({ message: "Challenge not found" });
    }

    // Get the credential - convert assertionResponse.id from base64 string to buffer for comparison
    const credentialIDFromResponse = Buffer.from(assertionResponse.id, 'base64');
    const { data: credential, error: credError } = await supabase
      .from("webauthn_credentials")
      .select("*")
      .eq("user_id", profile.id)
      .eq("is_active", true);

    if (credError || !credential || credential.length === 0) {
      return res.status(404).json({ message: "Credential not found" });
    }

    // Find matching credential by comparing base64 IDs
    const matchedCredential = credential.find(
      (cred) => cred.credential_id === credentialIDFromResponse.toString('base64')
    );

    if (!matchedCredential) {
      return res.status(404).json({ message: "Credential not found" });
    }

    // Verify authentication response
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: credentialIDFromResponse,
          publicKey: Buffer.from(matchedCredential.credential_public_key, 'base64'),
          signCount: matchedCredential.sign_count,
          transports: matchedCredential.transports,
        },
      });
    } catch (error) {
      console.error("Authentication verification error:", error);
      return res
        .status(400)
        .json({ message: "Invalid authentication response" });
    }

    if (!verification.verified) {
      return res
        .status(400)
        .json({ message: "Authentication verification failed" });
    }

    // Update sign count
    const { error: updateError } = await supabase
      .from("webauthn_credentials")
      .update({
        sign_count: verification.authenticationInfo.signCount,
        last_used_at: new Date(),
      })
      .eq("id", matchedCredential.id);

    if (updateError) console.error("Failed to update sign count:", updateError);

    // Clear the challenge
    await supabase
      .from("webauthn_challenges")
      .delete()
      .eq("user_id", profile.id)
      .eq("type", "authentication");

    // Create a Supabase session by getting a fresh auth user
    // We need to set up session using admin API
    try {
      // Get the Supabase auth user for this email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching auth users:", authError);
        return res.status(500).json({ message: "Failed to create session" });
      }

      const authUser = authUsers.users.find(u => u.email === email);
      
      if (!authUser) {
        return res.status(404).json({ message: "Auth user not found" });
      }

      // Generate a session using admin API
      const { data: session, error: sessionError } = await supabase.auth.admin.createSession({
        user_id: authUser.id,
      });

      if (sessionError) {
        console.error("Error creating session:", sessionError);
        return res.status(500).json({ message: "Failed to create session" });
      }

      // Return user data with session tokens
      res.json({
        message: "Authentication successful",
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          status: profile.status,
        },
        session: {
          access_token: session.session.access_token,
          refresh_token: session.session.refresh_token,
          authenticated: true,
        },
      });
    } catch (sessionError) {
      console.error("Session creation error:", sessionError);
      // If session creation fails, still return user data
      res.json({
        message: "Authentication successful (session pending)",
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          status: profile.status,
        },
        session: {
          authenticated: true,
        },
      });
    }
  } catch (error) {
    console.error("Authentication complete error:", error);
    res.status(500).json({ message: "Failed to complete authentication" });
  }
});

export default router;
