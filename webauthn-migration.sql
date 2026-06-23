-- WebAuthn Credentials Table for fingerprint authentication

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id BYTEA NOT NULL UNIQUE,
    credential_name VARCHAR(255) NOT NULL,
    credential_public_key BYTEA NOT NULL,
    sign_count INTEGER NOT NULL DEFAULT 0,
    transports TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);

-- Enable Row Level Security (RLS)
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own credentials
CREATE POLICY "Users can view their own credentials"
    ON webauthn_credentials
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own credentials
CREATE POLICY "Users can insert their own credentials"
    ON webauthn_credentials
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own credentials
CREATE POLICY "Users can update their own credentials"
    ON webauthn_credentials
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own credentials
CREATE POLICY "Users can delete their own credentials"
    ON webauthn_credentials
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webauthn_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_webauthn_credentials_updated_at ON webauthn_credentials;
CREATE TRIGGER trigger_webauthn_credentials_updated_at
    BEFORE UPDATE ON webauthn_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_webauthn_credentials_updated_at();

-- ============================================================================
-- WebAuthn Challenges Table for storing registration/authentication challenges
-- ============================================================================

CREATE TABLE IF NOT EXISTS webauthn_challenges (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'registration' or 'authentication'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_type ON webauthn_challenges(type);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);
