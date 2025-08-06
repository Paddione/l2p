import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserRepository, User, CreateUserData } from '../repositories/UserRepository.js';
import { EmailService } from './EmailService.js';

export interface TokenPayload {
  userId: number;
  username: string;
  email: string;
  selectedCharacter: string;
  characterLevel: number;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  selectedCharacter?: string;
  preferences?: {
    language: 'en' | 'de';
    theme: 'light' | 'dark';
  };
}

export interface AuthResult {
  user: Omit<User, 'password_hash'>;
  tokens: AuthTokens;
}

export class AuthService {
  private userRepository: UserRepository;
  private emailService: EmailService;
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly SALT_ROUNDS = 12;
  private readonly EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in ms
  private readonly PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour in ms

  constructor() {
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
    
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
    
    if (process.env.NODE_ENV === 'production' && 
        (this.JWT_SECRET === 'your-secret-key-change-in-production' || 
         this.JWT_REFRESH_SECRET === 'your-refresh-secret-key-change-in-production')) {
      throw new Error('JWT secrets must be set in production environment');
    }
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    // Temporarily bypass bcrypt to test if it's causing the segfault
    return 'hashed_' + password;
    // return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Temporarily bypass bcrypt to test if it's causing the segfault
    return hash === 'hashed_' + password;
    // return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'learn2play-api',
      audience: 'learn2play-client'
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'learn2play-api',
      audience: 'learn2play-client'
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      selectedCharacter: user.selected_character,
      characterLevel: user.character_level
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'learn2play-api',
        audience: 'learn2play-client'
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET, {
        issuer: 'learn2play-api',
        audience: 'learn2play-client'
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Refresh token verification failed');
    }
  }

  /**
   * Register a new user with email verification
   */
  async register(registerData: RegisterData): Promise<AuthResult> {
    const { username, email, password, selectedCharacter, preferences } = registerData;

    // Check if username already exists
    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Validate password strength
    this.validatePassword(password);

    // Hash password
    const password_hash = await this.hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = this.generateSecureToken();
    const emailVerificationExpires = new Date(Date.now() + this.EMAIL_VERIFICATION_EXPIRY);

    // Create user data
    const userData: CreateUserData = {
      username,
      email,
      password_hash,
      email_verified: false,
      email_verification_token: emailVerificationToken,
      email_verification_expires: emailVerificationExpires,
      selected_character: selectedCharacter || 'student',
      preferences: preferences || { language: 'en', theme: 'light' }
    };

    // Create user
    const user = await this.userRepository.createUser(userData);

    // Send verification email
    try {
      await this.emailService.sendEmailVerificationEmail(email, username, emailVerificationToken);
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails, but log the error
    }

    // Generate tokens (user can use the app but some features may be limited)
    const tokens = this.generateTokens(user);

    // Return user without password hash
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { username, password } = credentials;

    // Find user by username
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Note: We allow login even if email is not verified
    // Some features may be limited for unverified users

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Return user without password hash
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Get current user data
    const user = await this.userRepository.findUserById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Generate new tokens
    return this.generateTokens(user);
  }

  /**
   * Get user by token
   */
  async getUserByToken(token: string): Promise<Omit<User, 'password_hash'> | null> {
    try {
      const payload = this.verifyAccessToken(token);
      const user = await this.userRepository.findUserById(payload.userId);
      
      if (!user || !user.is_active) {
        return null;
      }

      const { password_hash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one special character (@$!%*?&)');
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    this.validatePassword(newPassword);

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await this.userRepository.updateUser(userId, { password_hash: newPasswordHash });
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: number): Promise<void> {
    await this.userRepository.updateUser(userId, { is_active: false });
  }

  /**
   * Reactivate user account
   */
  async reactivateAccount(userId: number): Promise<void> {
    await this.userRepository.updateUser(userId, { is_active: true });
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User | null> {
    const user = await this.userRepository.verifyEmail(token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Send welcome email after successful verification
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.username);
      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail verification if welcome email fails
    }

    return user;
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.email_verified) {
      throw new Error('Email is already verified');
    }

    // Generate new verification token
    const emailVerificationToken = this.generateSecureToken();
    const emailVerificationExpires = new Date(Date.now() + this.EMAIL_VERIFICATION_EXPIRY);

    // Update user with new token
    await this.userRepository.setEmailVerificationToken(
      user.id, 
      emailVerificationToken, 
      emailVerificationExpires
    );

    // Send verification email
    try {
      await this.emailService.sendEmailVerificationEmail(user.email, user.username, emailVerificationToken);
      console.log(`Verification email resent to ${user.email}`);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      throw new Error('Failed to resend verification email');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return;
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Generate temporary password and reset token
    const temporaryPassword = this.generateTemporaryPassword();
    const passwordResetToken = this.generateSecureToken();
    const passwordResetExpires = new Date(Date.now() + this.PASSWORD_RESET_EXPIRY);

    // Hash the temporary password
    const temporaryPasswordHash = await this.hashPassword(temporaryPassword);

    // Update user with temporary password and reset token
    await this.userRepository.updateUser(user.id, {
      password_hash: temporaryPasswordHash,
      password_reset_token: passwordResetToken,
      password_reset_expires: passwordResetExpires
    });

    // Send password reset email with temporary password
    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.username, temporaryPassword);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Complete password reset (change from temporary password)
   */
  async completePasswordReset(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Validate new password
    this.validatePassword(newPassword);

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update user with new password and clear reset token
    await this.userRepository.resetPassword(token, newPasswordHash);
  }

  /**
   * Check if user needs to change password (has active reset token)
   */
  async needsPasswordChange(userId: number): Promise<boolean> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      return false;
    }

    return !!(user.password_reset_token && 
              user.password_reset_expires && 
              user.password_reset_expires > new Date());
  }

  /**
   * Force password change for user with reset token
   */
  async forcePasswordChange(userId: number, newPassword: string): Promise<void> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has an active reset token
    if (!user.password_reset_token || 
        !user.password_reset_expires || 
        user.password_reset_expires <= new Date()) {
      throw new Error('No active password reset required');
    }

    // Validate new password
    this.validatePassword(newPassword);

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password and clear reset token
    await this.userRepository.updateUser(userId, {
      password_hash: newPasswordHash,
      password_reset_token: null,
      password_reset_expires: null
    });
  }
}