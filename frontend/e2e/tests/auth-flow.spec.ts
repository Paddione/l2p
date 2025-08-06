import { test, expect } from '@playwright/test';

test.describe('Authentication Flow - End to End', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('Complete user registration and verification flow', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Register');
    
    // Fill registration form
    const testEmail = `test${Date.now()}@example.com`;
    const testUsername = `testuser${Date.now()}`;
    
    await page.fill('[data-testid="username-input"]', testUsername);
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
    
    // Select character
    await page.click('[data-testid="character-1"]');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Verify registration success message
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    await expect(page.locator('text=Please check your email for verification')).toBeVisible();
    
    // Verify user is not logged in yet (no token)
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('Email verification flow', async ({ page }) => {
    // First register a user
    await page.click('text=Register');
    
    const testEmail = `test${Date.now()}@example.com`;
    const testUsername = `testuser${Date.now()}`;
    
    await page.fill('[data-testid="username-input"]', testUsername);
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
    await page.click('[data-testid="character-1"]');
    await page.click('[data-testid="register-button"]');
    
    // Navigate to email verification page
    await page.goto('/verify-email');
    
    // Simulate email verification (in real scenario, user clicks link from email)
    // For testing, we'll use the verification token directly
    const verificationToken = 'test-verification-token'; // This would come from the email in real scenario
    
    await page.fill('[data-testid="verification-token-input"]', verificationToken);
    await page.click('[data-testid="verify-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();
    await expect(page.locator('text=Email verified successfully')).toBeVisible();
    
    // Verify user is now logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('User login flow', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Login');
    
    // Fill login form
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Verify successful login
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('text=Welcome, testuser')).toBeVisible();
    
    // Verify user is redirected to lobby
    await expect(page.locator('[data-testid="lobby-page"]')).toBeVisible();
  });

  test('Login validation - incorrect credentials', async ({ page }) => {
    await page.click('text=Login');
    
    await page.fill('[data-testid="username-input"]', 'nonexistent');
    await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Verify user is not logged in
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('Login validation - unverified email', async ({ page }) => {
    // First register a user without verifying email
    await page.click('text=Register');
    
    const testEmail = `unverified${Date.now()}@example.com`;
    const testUsername = `unverified${Date.now()}`;
    
    await page.fill('[data-testid="username-input"]', testUsername);
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
    await page.click('[data-testid="character-1"]');
    await page.click('[data-testid="register-button"]');
    
    // Try to login without verifying email
    await page.click('text=Login');
    await page.fill('[data-testid="username-input"]', testUsername);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('text=Please verify your email before logging in')).toBeVisible();
  });

  test('Password reset flow', async ({ page }) => {
    // Navigate to forgot password page
    await page.click('text=Login');
    await page.click('[data-testid="forgot-password-link"]');
    
    // Fill email for password reset
    const testEmail = 'test@example.com';
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.click('[data-testid="request-reset-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="reset-request-success"]')).toBeVisible();
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
    
    // Navigate to password reset page
    await page.goto('/reset-password');
    
    // Fill reset token and new password
    const resetToken = 'test-reset-token'; // This would come from email in real scenario
    await page.fill('[data-testid="reset-token-input"]', resetToken);
    await page.fill('[data-testid="new-password-input"]', 'NewPassword123!');
    await page.fill('[data-testid="confirm-new-password-input"]', 'NewPassword123!');
    await page.click('[data-testid="reset-password-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="reset-success"]')).toBeVisible();
    await expect(page.locator('text=Password reset successfully')).toBeVisible();
    
    // Verify can login with new password
    await page.click('text=Login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'NewPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('Character selection and profile management', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to profile page
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-link"]');
    
    // Verify current character is displayed
    await expect(page.locator('[data-testid="current-character"]')).toBeVisible();
    
    // Change character
    await page.click('[data-testid="change-character-button"]');
    await page.click('[data-testid="character-2"]');
    await page.click('[data-testid="confirm-character-button"]');
    
    // Verify character was updated
    await expect(page.locator('[data-testid="character-updated"]')).toBeVisible();
    await expect(page.locator('text=Character updated successfully')).toBeVisible();
    
    // Verify new character is displayed
    await expect(page.locator('[data-testid="current-character"]')).toContainText('Student');
  });

  test('User profile and experience display', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to profile page
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-link"]');
    
    // Verify user information is displayed
    await expect(page.locator('[data-testid="username-display"]')).toContainText('testuser');
    await expect(page.locator('[data-testid="email-display"]')).toContainText('test@example.com');
    
    // Verify experience and level information
    await expect(page.locator('[data-testid="experience-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="level-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="experience-progress"]')).toBeVisible();
  });

  test('Logout functionality', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Verify user is logged out
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    // Verify user is redirected to home page
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test('Registration validation - weak password', async ({ page }) => {
    await page.click('text=Register');
    
    const testEmail = `test${Date.now()}@example.com`;
    const testUsername = `testuser${Date.now()}`;
    
    await page.fill('[data-testid="username-input"]', testUsername);
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'weak');
    await page.fill('[data-testid="confirm-password-input"]', 'weak');
    await page.click('[data-testid="character-1"]');
    
    // Verify password validation error is shown
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    
    // Verify form cannot be submitted
    await expect(page.locator('[data-testid="register-button"]')).toBeDisabled();
  });

  test('Registration validation - email format', async ({ page }) => {
    await page.click('text=Register');
    
    const testUsername = `testuser${Date.now()}`;
    
    await page.fill('[data-testid="username-input"]', testUsername);
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
    await page.click('[data-testid="character-1"]');
    
    // Verify email validation error is shown
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    
    // Verify form cannot be submitted
    await expect(page.locator('[data-testid="register-button"]')).toBeDisabled();
  });

  test('Registration validation - duplicate username', async ({ page }) => {
    // First register a user
    await page.click('text=Register');
    
    const testEmail = `test${Date.now()}@example.com`;
    const testUsername = `testuser${Date.now()}`;
    
    await page.fill('[data-testid="username-input"]', testUsername);
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
    await page.click('[data-testid="character-1"]');
    await page.click('[data-testid="register-button"]');
    
    // Try to register with same username
    await page.click('text=Register');
    
    const newEmail = `test2${Date.now()}@example.com`;
    
    await page.fill('[data-testid="username-input"]', testUsername); // Same username
    await page.fill('[data-testid="email-input"]', newEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
    await page.click('[data-testid="character-1"]');
    await page.click('[data-testid="register-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="registration-error"]')).toBeVisible();
    await expect(page.locator('text=Username already exists')).toBeVisible();
  });

  test('Session persistence', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Verify user is still logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('text=Welcome, testuser')).toBeVisible();
  });

  test('Protected route access', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/profile');
    
    // Verify user is redirected to login
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
    await expect(page.locator('text=Please log in to access this page')).toBeVisible();
  });
}); 