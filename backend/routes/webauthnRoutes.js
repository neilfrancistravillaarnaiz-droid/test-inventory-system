import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rpID = process.env.VITE_APP_DOMAIN || "localhost";
const origin = process.env.VITE_APP_ORIGIN || "http://localhost:5173";
const challengeTimeout = 600000; // 10 minutes

const formatCredential = (credential) => ({
  id: credential.id,
  credentialId: Buffer.from(credential.credential_id).toString("base64url"),
  credentialName: credential.credential_name,
  createdAt: credential.created_at,
});

const saveChallenge = async (userId, challenge, type) => {
  await supabase.from("webauthn_challenges").upsert([
    {
      user_id: userId,
      challenge,
      type,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + challengeTimeout).toISOString(),
    },
  ]);
};

const getChallenge = async (userId, type) => {
  const { data, error } = await supabase
    .from("webauthn_challenges")
    .select("challenge, expires_at")
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;
  const expiresAt = new Date(data.expires_at).getTime();
  if (Date.now() > expiresAt) return null;
  return data.challenge;
};

const clearChallenge = async (userId) => {
  await supabase
    .from("webauthn_challenges")
    .delete()
    .eq("user_id", userId);
};

const findUserByEmail = async (email) => {
  const { data: user, error } = await supabase
    .from("auth.users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return user;
};

const findCredentialByUserAndId = (credentials, assertionId) => {
  const assertionBuffer = Buffer.from(assertionId, "base64url");
  return (credentials || []).find((credential) =>
    Buffer.from(credential.credential_id).equals(assertionBuffer)
  );
};

router.get("/setup", async (req, res) => {
  try {
    const { data: credentials, error: credentialsError } = await supabase
      .from("webauthn_credentials")
      .select("id, credential_id, credential_name, created_at");

    if (credentialsError) {
      return res.status(500).json({
        success: false,
        message: credentialsError.message,
      });
    }

    res.json({
      success: true,
      message: "WebAuthn routes are available.",
      rpID,
      origin,
      credentials: (credentials || []).map(formatCredential),
    });
  } catch (error) {
    console.error("WebAuthn setup error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "WebAuthn setup failed.",
    });
  }
});

router.post("/register/start", async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing userId or email.",
      });
    }

    const options = generateRegistrationOptions({
      rpName: "StockFlow Inventory",
      rpID,
      userID: userId,
      userName: email,
      timeout: challengeTimeout,
      attestationType: "indirect",
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "preferred",
        authenticatorAttachment: "platform",
      },
      supportedAlgorithmIDs: [-7, -257],
      excludeCredentials: [],
    });

    await saveChallenge(userId, options.challenge, "registration");

    res.json(options);
  } catch (error) {
    console.error("Register start error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate registration options.",
    });
  }
});

router.post("/register/complete", async (req, res) => {
  try {
    const { userId, credentialName, attestationResponse } = req.body;

    if (!userId || !credentialName || !attestationResponse) {
      return res.status(400).json({
        success: false,
        message: "Missing required registration fields.",
      });
    }

    const expectedChallenge = await getChallenge(userId, "registration");
    if (!expectedChallenge) {
      return res.status(400).json({
        success: false,
        message: "Registration challenge not found or expired.",
      });
    }

    const verification = await verifyRegistrationResponse({
      credential: attestationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: "Registration verification failed.",
      });
    }

    const credential = verification.registrationInfo;
    const credentialIdBuffer = Buffer.from(credential.credentialID, "base64url");
    const publicKeyBuffer = Buffer.from(credential.credentialPublicKey, "base64url");

    const { error } = await supabase.from("webauthn_credentials").insert([
      {
        user_id: userId,
        credential_id: credentialIdBuffer,
        credential_name: credentialName,
        credential_public_key: publicKeyBuffer,
        sign_count: credential.counter,
        transports: attestationResponse.transports || [],
        is_active: true,
      },
    ]);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    await clearChallenge(userId);

    res.json({ success: true, credentialId: credentialIdBuffer.toString("base64url") });
  } catch (error) {
    console.error("Register complete error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Registration completion failed.",
    });
  }
});

router.post("/authenticate/start", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Missing email.",
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found for this email.",
      });
    }

    const { data: credentials, error } = await supabase
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    if (!credentials || credentials.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No fingerprint registered for this email.",
      });
    }

    const allowCredentials = credentials.map((credential) => ({
      type: "public-key",
      id: Buffer.from(credential.credential_id).toString("base64url"),
      transports: ["internal"],
    }));

    const options = generateAuthenticationOptions({
      timeout: challengeTimeout,
      allowCredentials,
      userVerification: "required",
      rpID,
    });

    await saveChallenge(user.id, options.challenge, "authentication");

    res.json(options);
  } catch (error) {
    console.error("Authenticate start error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate authentication options.",
    });
  }
});

router.post("/authenticate/complete", async (req, res) => {
  try {
    const { email, assertionResponse } = req.body;

    if (!email || !assertionResponse) {
      return res.status(400).json({
        success: false,
        message: "Missing required authentication fields.",
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found for this email.",
      });
    }

    const { data: credentials, error } = await supabase
      .from("webauthn_credentials")
      .select("id, user_id, credential_id, credential_public_key, sign_count")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    const credentialRecord = findCredentialByUserAndId(credentials, assertionResponse.id);
    if (!credentialRecord) {
      return res.status(404).json({
        success: false,
        message: "No registered fingerprint credential matched the authentication request.",
      });
    }

    const expectedChallenge = await getChallenge(user.id, "authentication");
    if (!expectedChallenge) {
      return res.status(400).json({
        success: false,
        message: "Authentication challenge not found or expired.",
      });
    }

    const verification = await verifyAuthenticationResponse({
      credential: assertionResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: credentialRecord.credential_id,
        credentialPublicKey: credentialRecord.credential_public_key,
        counter: credentialRecord.sign_count,
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: "Fingerprint authentication verification failed.",
      });
    }

    const newSignCount = verification.authenticationInfo.newCounter;
    await supabase
      .from("webauthn_credentials")
      .update({ sign_count: newSignCount, last_used_at: new Date().toISOString() })
      .eq("id", credentialRecord.id);

    await clearChallenge(user.id);

    res.json({
      success: true,
      user: { id: user.id, email },
      session: null,
    });
  } catch (error) {
    console.error("Authenticate complete error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Authentication completion failed.",
    });
  }
});

export default router;
