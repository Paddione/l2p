-- Migration: Add email verification fields to users table
-- This migration adds email verification functionality to the authentication system

-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Create indexes for email verification
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Add constraint to ensure email is lowercase
ALTER TABLE users 
ADD CONSTRAINT check_email_lowercase 
CHECK (email = LOWER(email));

-- Update existing users to have email_verified = TRUE (grandfathering existing accounts)
UPDATE users 
SET email_verified = TRUE 
WHERE email IS NULL OR email = '';

-- Add comment to table
COMMENT ON COLUMN users.email IS 'User email address for verification and password reset';
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification';
COMMENT ON COLUMN users.email_verification_expires IS 'Expiration time for email verification token';
COMMENT ON COLUMN users.password_reset_token IS 'Token for password reset';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration time for password reset token'; 