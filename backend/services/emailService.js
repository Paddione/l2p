const crypto = require('crypto');

/**
 * Email service for authentication-related emails
 * In a production environment, this would integrate with services like:
 * - SendGrid, Mailgun, AWS SES, or similar email service providers
 * - For now, this provides a mock implementation with console logging
 */

class EmailService {
    constructor() {
        this.isEnabled = process.env.EMAIL_ENABLED === 'true';
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@learn2play.com';
        this.baseUrl = process.env.BASE_URL || 'http://10.0.0.44';
        
        if (this.isEnabled) {
            console.log('📧 Email service initialized');
        } else {
            console.log('📧 Email service disabled (EMAIL_ENABLED=false)');
        }
    }

    /**
     * Generate a secure random token
     * @param {number} length - Token length in bytes (default: 32)
     * @returns {string} Hex-encoded token
     */
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Send email verification email
     * @param {string} email - Recipient email address
     * @param {string} username - Username
     * @param {string} token - Verification token
     * @returns {Promise<boolean>} Success status
     */
    async sendVerificationEmail(email, username, token) {
        const verificationUrl = `${this.baseUrl}/verify-email?token=${token}`;
        
        const emailContent = {
            to: email,
            from: this.fromEmail,
            subject: 'Verify your Learn2Play account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4CAF50;">Welcome to Learn2Play! 🎮</h2>
                    <p>Hi <strong>${username}</strong>,</p>
                    <p>Thank you for registering with Learn2Play! To complete your account setup, please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; word-break: break-all;">
                        <a href="${verificationUrl}">${verificationUrl}</a>
                    </p>
                    
                    <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
                    
                    <p>If you didn't create this account, you can safely ignore this email.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        This email was sent by Learn2Play. If you have any questions, please contact our support team.
                    </p>
                </div>
            `,
            text: `
                Welcome to Learn2Play!
                
                Hi ${username},
                
                Thank you for registering with Learn2Play! To complete your account setup, please verify your email address by visiting this link:
                
                ${verificationUrl}
                
                This verification link will expire in 24 hours for security reasons.
                
                If you didn't create this account, you can safely ignore this email.
            `
        };

        return this.sendEmail(emailContent);
    }

    /**
     * Send password reset email
     * @param {string} email - Recipient email address
     * @param {string} username - Username
     * @param {string} token - Reset token
     * @returns {Promise<boolean>} Success status
     */
    async sendPasswordResetEmail(email, username, token) {
        const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;
        
        const emailContent = {
            to: email,
            from: this.fromEmail,
            subject: 'Reset your Learn2Play password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #FF9800;">Password Reset Request 🔐</h2>
                    <p>Hi <strong>${username}</strong>,</p>
                    <p>We received a request to reset your Learn2Play account password. If you made this request, click the button below to reset your password:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; word-break: break-all;">
                        <a href="${resetUrl}">${resetUrl}</a>
                    </p>
                    
                    <p><strong>Important:</strong> This reset link will expire in 1 hour for security reasons.</p>
                    
                    <p><strong>If you didn't request this password reset:</strong></p>
                    <ul>
                        <li>Your account is still secure</li>
                        <li>You can safely ignore this email</li>
                        <li>Consider changing your password if you're concerned</li>
                    </ul>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        This email was sent by Learn2Play. If you have any questions, please contact our support team.
                    </p>
                </div>
            `,
            text: `
                Password Reset Request
                
                Hi ${username},
                
                We received a request to reset your Learn2Play account password. If you made this request, visit this link to reset your password:
                
                ${resetUrl}
                
                This reset link will expire in 1 hour for security reasons.
                
                If you didn't request this password reset, you can safely ignore this email.
            `
        };

        return this.sendEmail(emailContent);
    }

    /**
     * Send account lockout notification email
     * @param {string} email - Recipient email address
     * @param {string} username - Username
     * @param {number} lockoutMinutes - Lockout duration in minutes
     * @returns {Promise<boolean>} Success status
     */
    async sendAccountLockoutEmail(email, username, lockoutMinutes) {
        const emailContent = {
            to: email,
            from: this.fromEmail,
            subject: 'Learn2Play Account Security Alert',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #F44336;">Security Alert 🚨</h2>
                    <p>Hi <strong>${username}</strong>,</p>
                    <p>Your Learn2Play account has been temporarily locked due to multiple failed login attempts.</p>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <strong>Account Status:</strong> Temporarily Locked<br>
                        <strong>Lockout Duration:</strong> ${lockoutMinutes} minutes<br>
                        <strong>Reason:</strong> Too many failed login attempts
                    </div>
                    
                    <p><strong>What this means:</strong></p>
                    <ul>
                        <li>Your account is temporarily inaccessible</li>
                        <li>The lockout will automatically expire in ${lockoutMinutes} minutes</li>
                        <li>No action is required from you</li>
                    </ul>
                    
                    <p><strong>If this wasn't you:</strong></p>
                    <ul>
                        <li>Someone may be trying to access your account</li>
                        <li>Consider changing your password once the lockout expires</li>
                        <li>Contact our support team if you're concerned</li>
                    </ul>
                    
                    <p>This is an automated security measure to protect your account.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        This email was sent by Learn2Play security system. If you have any questions, please contact our support team.
                    </p>
                </div>
            `,
            text: `
                Security Alert
                
                Hi ${username},
                
                Your Learn2Play account has been temporarily locked due to multiple failed login attempts.
                
                Account Status: Temporarily Locked
                Lockout Duration: ${lockoutMinutes} minutes
                Reason: Too many failed login attempts
                
                The lockout will automatically expire in ${lockoutMinutes} minutes.
                
                If this wasn't you, consider changing your password once the lockout expires.
            `
        };

        return this.sendEmail(emailContent);
    }

    /**
     * Send email (mock implementation)
     * In production, this would integrate with a real email service
     * @param {Object} emailContent - Email content object
     * @returns {Promise<boolean>} Success status
     */
    async sendEmail(emailContent) {
        if (!this.isEnabled) {
            console.log('📧 Email service disabled - Would send email:');
            console.log('📧 To:', emailContent.to);
            console.log('📧 Subject:', emailContent.subject);
            console.log('📧 Content preview:', emailContent.text.substring(0, 100) + '...');
            return true; // Mock success
        }

        try {
            // In production, this would be replaced with actual email service integration
            // Example integrations:
            // - SendGrid: await sgMail.send(emailContent)
            // - Mailgun: await mailgun.messages().send(emailContent)
            // - AWS SES: await ses.sendEmail(emailContent).promise()
            
            console.log('📧 Sending email to:', emailContent.to);
            console.log('📧 Subject:', emailContent.subject);
            
            // Simulate email sending delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('✅ Email sent successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return false;
        }
    }

    /**
     * Validate email address format
     * @param {string} email - Email address to validate
     * @returns {boolean} True if valid email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService; 