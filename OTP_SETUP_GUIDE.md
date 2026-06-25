# Complete OTP Login Setup Guide

## Overview
This guide makes your admin login OTP feature fully functional with both email and phone OTP support.

## Part 1: Add Phone Column to Database

### Step 1.1: Add Phone Field to Profiles Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Add phone column to profiles table
ALTER TABLE public.profiles
ADD COLUMN phone TEXT DEFAULT NULL;

-- Optional: Add a unique constraint if you want unique phone numbers
-- ALTER TABLE public.profiles
-- ADD CONSTRAINT unique_phone UNIQUE (phone);

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'phone';
```

### Step 1.2: Enable Realtime for Phone Updates (Optional)
In Supabase Dashboard:
1. Go to **Replication** > **Replication Settings**
2. Enable replication for the `profiles` table if not already enabled

---

## Part 2: Configure SMS Provider (Free Option: Twilio)

### Option A: Twilio (Recommended for Free Trial)

1. **Sign up for free Twilio account:**
   - Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Create account and get a free Twilio phone number
   - You get $15 free trial credit

2. **Get Your Credentials:**
   - Account SID: Found in Twilio Console
   - Auth Token: Found in Twilio Console
   - Phone Number: Your Twilio phone number (e.g., +1234567890)

3. **Configure in Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** > **Providers** > **SMS**
   - Select "Twilio" as your SMS provider
   - Enter your Twilio Account SID
   - Enter your Twilio Auth Token
   - Enter your Twilio Phone Number
   - Click **Save**

### Option B: Other Free SMS Providers
- **AWS SNS**: Free tier includes 100 SMS per month
- **Vonage**: Free tier available
- **Firebase**: Through Cloud Functions

---

## Part 3: Update User Profiles to Store Phone Numbers

### Step 3.1: Modify User Creation
Users need to have phone numbers stored. Update the Users page to allow phone entry:

**Location:** `src/pages/users/Users.tsx`

Add phone field to the form and update the profile schema.

### Step 3.2: Modify Admin Profile Page
Allow admins to add/edit their phone number:

**Location:** `src/pages/profile/Profile.tsx`

Add a phone field in the profile settings.

---

## Part 4: Testing the OTP Flow

### Test Email OTP (Should Work Immediately)
1. Go to admin login page
2. Enter admin email & password
3. Click "Choose verification method"
4. Select "Email OTP"
5. Check your email for OTP code
6. Enter the code and verify

### Test Phone OTP (After SMS Provider Setup)
1. Ensure admin profile has a valid phone number
2. Go to admin login page
3. Enter admin email & password
4. Click "Choose verification method"
5. Select "Phone OTP"
6. Enter phone number (or use stored one if added)
7. Check SMS for OTP code
8. Enter the code and verify

---

## Part 5: Code Implementation Checklist

### ✅ Already Implemented:
- [x] Phone OTP functions in authService.ts
- [x] Admin login UI with phone/email OTP choice
- [x] OTP verification logic
- [x] Storage of OTP method preference

### ⚠️ Still Need to Do:

**1. Add phone column to profiles table** (See Part 1 SQL above)

**2. Update User Management Form** (`src/pages/users/Users.tsx`):
```tsx
// Add to ProfileInput type and form
phone?: string;
```

**3. Update Profile Page** (`src/pages/profile/Profile.tsx`):
- Add phone input field in profile settings
- Save phone to user profile

**4. Configure SMS Provider** (See Part 2)

**5. Test the flow end-to-end**

---

## Part 6: Database Update SQL

Run this complete migration:

```sql
-- 1. Add phone column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT NULL;

-- 2. Optional: Create a function to validate phone format
CREATE OR REPLACE FUNCTION validate_phone_format()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+?[1-9]\d{1,14}$' THEN
    RAISE EXCEPTION 'Invalid phone format. Use E.164 format (e.g., +1234567890)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Optional: Add trigger for phone validation
DROP TRIGGER IF EXISTS validate_phone_trigger ON profiles;
CREATE TRIGGER validate_phone_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION validate_phone_format();

-- 4. Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

---

## Part 7: Error Troubleshooting

| Issue | Solution |
|-------|----------|
| "Could not send the phone OTP" | Check SMS provider is configured in Supabase |
| "Invalid phone format" | Use E.164 format: +1234567890 |
| OTP not received | Check spam folder, verify phone number is correct |
| "This account is not allowed" | Ensure admin user has role="Admin" in profiles |
| "Phone number required" | Admin profile must have phone number stored |

---

## Part 8: Environment Variables Needed

Ensure your `.env` file has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Summary of Changes

1. ✅ Phone OTP functions added (already done)
2. ✅ Admin login UI updated (already done)
3. ⏳ Add phone column to database
4. ⏳ Configure SMS provider (Twilio recommended)
5. ⏳ Update user profile forms to store phone
6. ⏳ Test end-to-end

Once these steps are complete, your OTP login will be fully functional!

---

## Need Help?

- Twilio Docs: https://www.twilio.com/docs
- Supabase SMS Auth: https://supabase.com/docs/guides/auth/phone-signups
- E.164 Phone Format: https://en.wikipedia.org/wiki/E.164
