import jwt from 'jsonwebtoken';
import { AuthService, RegisterData, LoginCredentials, TokenPayload } from '../AuthService';
import { UserRepository, User, CreateUserData } from '../../repositories/UserRepository';
import { EmailService } from '../EmailService';

// Mock the dependencies
jest.mock('../../repositories/UserRepository');
jest.mock('../EmailService');
jest.mock('jsonwebtoken');
jest.mock('crypto');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockJwt: jest.Mocked<typeof jwt>;

  // Test data
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password_hash: 'hashed_password123',
    email_verified: true,
    selected_character: 'student',
    character_level: 1,
    experience_points: 0,
    created_at: new Date('2024-01-01'),
    is_active: true,
    preferences: {
      language: 'en',
      theme: 'light'
    }
  };

  const mockRegisterData: RegisterData = {
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'Password123!',
    selectedCharacter: 'student',
    preferences: {
      language: 'en',
      theme: 'light'
    }
  };

  const mockLoginCredentials: LoginCredentials = {
    username: 'testuser',
    password: 'password123'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockEmailService = new EmailService() as jest.Mocked<EmailService>;
    mockJwt = jwt as jest.Mocked<typeof jwt>;

    // Mock crypto.randomBytes
    const mockCrypto = require('crypto');
    mockCrypto.randomBytes = jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('mock-token-123')
    });

    // Create AuthService instance
    authService = new AuthService();
    
    // Replace the private instances with our mocks
    (authService as any).userRepository = mockUserRepository;
    (authService as any).emailService = mockEmailService;

    // Set test environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    // Setup JWT mock return values
    mockJwt.sign.mockImplementation((payload: any, secret: string, options: any) => {
      if (options?.expiresIn === '15m') {
        return 'mock-access-token';
      } else if (options?.expiresIn === '7d') {
        return 'mock-refresh-token';
      }
      return 'mock-token';
    });

    mockJwt.verify.mockImplementation((token: string, secret: string, options: any) => {
      if (token === 'valid-token' || token === 'valid-refresh-token') {
        return {
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
          selectedCharacter: 'student',
          characterLevel: 1
        };
      }
      throw new jwt.JsonWebTokenError('Invalid token');
    });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  describe('Password Management', () => {
    describe('hashPassword', () => {
      it('should hash password correctly', async () => {
        const password = 'testpassword';
        const hashedPassword = await authService.hashPassword(password);
        
        expect(hashedPassword).toBe('hashed_testpassword');
      });
    });

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const password = 'testpassword';
        const hash = 'hashed_testpassword';
        
        const result = await authService.verifyPassword(password, hash);
        
        expect(result).toBe(true);
      });

      it('should reject incorrect password', async () => {
        const password = 'wrongpassword';
        const hash = 'hashed_testpassword';
        
        const result = await authService.verifyPassword(password, hash);
        
        expect(result).toBe(false);
      });
    });

    describe('validatePassword', () => {
      it('should accept valid password', () => {
        const validPassword = 'Password123!';
        
        expect(() => {
          (authService as any).validatePassword(validPassword);
        }).not.toThrow();
      });

      it('should reject password that is too short', () => {
        const shortPassword = 'Pass1!';
        
        expect(() => {
          (authService as any).validatePassword(shortPassword);
        }).toThrow('Password must be at least 8 characters long');
      });

      it('should reject password without lowercase letter', () => {
        const noLowercase = 'PASSWORD123!';
        
        expect(() => {
          (authService as any).validatePassword(noLowercase);
        }).toThrow('Password must contain at least one lowercase letter');
      });

      it('should reject password without uppercase letter', () => {
        const noUppercase = 'password123!';
        
        expect(() => {
          (authService as any).validatePassword(noUppercase);
        }).toThrow('Password must contain at least one uppercase letter');
      });

      it('should reject password without number', () => {
        const noNumber = 'Password!';
        
        expect(() => {
          (authService as any).validatePassword(noNumber);
        }).toThrow('Password must contain at least one number');
      });

      it('should reject password without special character', () => {
        const noSpecial = 'Password123';
        
        expect(() => {
          (authService as any).validatePassword(noSpecial);
        }).toThrow('Password must contain at least one special character (@$!%*?&)');
      });
    });
  });

  describe('Token Management', () => {
    const mockTokenPayload: TokenPayload = {
      userId: 1,
      username: 'testuser',
      email: 'test@example.com',
      selectedCharacter: 'student',
      characterLevel: 1
    };

    describe('generateAccessToken', () => {
      it('should generate access token with correct parameters', () => {
        const token = authService.generateAccessToken(mockTokenPayload);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          mockTokenPayload,
          'test-jwt-secret',
          {
            expiresIn: '15m',
            issuer: 'learn2play-api',
            audience: 'learn2play-client'
          }
        );
        expect(token).toBe('mock-access-token');
      });
    });

    describe('generateRefreshToken', () => {
      it('should generate refresh token with correct parameters', () => {
        const token = authService.generateRefreshToken(mockTokenPayload);
        
        expect(mockJwt.sign).toHaveBeenCalledWith(
          mockTokenPayload,
          'test-refresh-secret',
          {
            expiresIn: '7d',
            issuer: 'learn2play-api',
            audience: 'learn2play-client'
          }
        );
        expect(token).toBe('mock-refresh-token');
      });
    });

    describe('generateTokens', () => {
      it('should generate both access and refresh tokens', () => {
        const tokens = authService.generateTokens(mockUser);
        
        expect(tokens).toEqual({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        });
        expect(mockJwt.sign).toHaveBeenCalledTimes(2);
      });
    });

    describe('verifyAccessToken', () => {
      it('should verify valid access token', () => {
        const result = authService.verifyAccessToken('valid-token');
        
        expect(mockJwt.verify).toHaveBeenCalledWith(
          'valid-token',
          'test-jwt-secret',
          {
            issuer: 'learn2play-api',
            audience: 'learn2play-client'
          }
        );
        expect(result).toEqual({
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
          selectedCharacter: 'student',
          characterLevel: 1
        });
      });

      it('should throw error for expired token', () => {
        const expiredError = new jwt.TokenExpiredError('Token expired', new Date());
        mockJwt.verify.mockImplementation(() => {
          throw expiredError;
        });
        
        expect(() => {
          authService.verifyAccessToken('expired-token');
        }).toThrow('Access token expired');
      });

      it('should throw error for invalid token', () => {
        const invalidError = new jwt.JsonWebTokenError('Invalid token');
        mockJwt.verify.mockImplementation(() => {
          throw invalidError;
        });
        
        expect(() => {
          authService.verifyAccessToken('invalid-token');
        }).toThrow('Invalid access token');
      });

      it('should throw generic error for other JWT errors', () => {
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Some other error');
        });
        
        expect(() => {
          authService.verifyAccessToken('problematic-token');
        }).toThrow('Token verification failed');
      });
    });

    describe('verifyRefreshToken', () => {
      it('should verify valid refresh token', () => {
        const result = authService.verifyRefreshToken('valid-refresh-token');
        
        expect(mockJwt.verify).toHaveBeenCalledWith(
          'valid-refresh-token',
          'test-refresh-secret',
          {
            issuer: 'learn2play-api',
            audience: 'learn2play-client'
          }
        );
        expect(result).toEqual({
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
          selectedCharacter: 'student',
          characterLevel: 1
        });
      });

      it('should throw error for expired refresh token', () => {
        const expiredError = new jwt.TokenExpiredError('Token expired', new Date());
        mockJwt.verify.mockImplementation(() => {
          throw expiredError;
        });
        
        expect(() => {
          authService.verifyRefreshToken('expired-refresh-token');
        }).toThrow('Refresh token expired');
      });

      it('should throw error for invalid refresh token', () => {
        const invalidError = new jwt.JsonWebTokenError('Invalid token');
        mockJwt.verify.mockImplementation(() => {
          throw invalidError;
        });
        
        expect(() => {
          authService.verifyRefreshToken('invalid-refresh-token');
        }).toThrow('Invalid refresh token');
      });
    });
  });  
describe('User Registration', () => {
    describe('register', () => {
      it('should register new user successfully', async () => {
        // Setup mocks
        mockUserRepository.findByUsername.mockResolvedValue(null);
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.createUser.mockResolvedValue(mockUser);
        mockEmailService.sendEmailVerificationEmail.mockResolvedValue();


        const result = await authService.register(mockRegisterData);

        expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('newuser');
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
        expect(mockUserRepository.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'newuser',
            email: 'newuser@example.com',
            password_hash: 'hashed_Password123!',
            email_verified: false,
            selected_character: 'student',
            preferences: { language: 'en', theme: 'light' }
          })
        );
        expect(mockEmailService.sendEmailVerificationEmail).toHaveBeenCalledWith(
          'newuser@example.com',
          'newuser',
          'mock-token-123'
        );
        expect(result.user).toEqual(expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }));
        expect(result.user).not.toHaveProperty('password_hash');
        expect(result.tokens).toEqual({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        });
      });

      it('should throw error if username already exists', async () => {
        mockUserRepository.findByUsername.mockResolvedValue(mockUser);

        await expect(authService.register(mockRegisterData)).rejects.toThrow('Username already exists');
        
        expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('newuser');
        expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
        expect(mockUserRepository.createUser).not.toHaveBeenCalled();
      });

      it('should throw error if email already exists', async () => {
        mockUserRepository.findByUsername.mockResolvedValue(null);
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);

        await expect(authService.register(mockRegisterData)).rejects.toThrow('Email already exists');
        
        expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('newuser');
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
        expect(mockUserRepository.createUser).not.toHaveBeenCalled();
      });

      it('should throw error for invalid password', async () => {
        const invalidRegisterData = {
          ...mockRegisterData,
          password: 'weak'
        };

        await expect(authService.register(invalidRegisterData)).rejects.toThrow('Password must be at least 8 characters long');
        
        expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
        expect(mockUserRepository.createUser).not.toHaveBeenCalled();
      });

      it('should continue registration even if email sending fails', async () => {
        mockUserRepository.findByUsername.mockResolvedValue(null);
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.createUser.mockResolvedValue(mockUser);
        mockEmailService.sendEmailVerificationEmail.mockRejectedValue(new Error('Email service error'));

        const result = await authService.register(mockRegisterData);

        expect(result.user).toBeDefined();
        expect(result.tokens).toBeDefined();
        expect(mockEmailService.sendEmailVerificationEmail).toHaveBeenCalled();
      });

      it('should use default values for optional fields', async () => {
        const minimalRegisterData: RegisterData = {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'Password123!'
        };

        mockUserRepository.findByUsername.mockResolvedValue(null);
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.createUser.mockResolvedValue(mockUser);
        mockEmailService.sendEmailVerificationEmail.mockResolvedValue();

        await authService.register(minimalRegisterData);

        expect(mockUserRepository.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            selected_character: 'student',
            preferences: { language: 'en', theme: 'light' }
          })
        );
      });
    });
  });

  describe('User Login', () => {
    describe('login', () => {
      it('should login user with valid credentials', async () => {
        mockUserRepository.findByUsername.mockResolvedValue(mockUser);
        mockUserRepository.updateLastLogin.mockResolvedValue();

        const result = await authService.login(mockLoginCredentials);

        expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
        expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(1);
        expect(result.user).toEqual(expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }));
        expect(result.user).not.toHaveProperty('password_hash');
        expect(result.tokens).toEqual({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        });
      });

      it('should throw error for non-existent user', async () => {
        mockUserRepository.findByUsername.mockResolvedValue(null);

        await expect(authService.login(mockLoginCredentials)).rejects.toThrow('Invalid credentials');
        
        expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
        expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
      });

      it('should throw error for deactivated account', async () => {
        const deactivatedUser = { ...mockUser, is_active: false };
        mockUserRepository.findByUsername.mockResolvedValue(deactivatedUser);

        await expect(authService.login(mockLoginCredentials)).rejects.toThrow('Account is deactivated');
        
        expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
        expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
      });

      it('should throw error for invalid password', async () => {
        const userWithDifferentPassword = { ...mockUser, password_hash: 'hashed_differentpassword' };
        mockUserRepository.findByUsername.mockResolvedValue(userWithDifferentPassword);

        await expect(authService.login(mockLoginCredentials)).rejects.toThrow('Invalid credentials');
        
        expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
        expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
      });

      it('should allow login for unverified email', async () => {
        const unverifiedUser = { ...mockUser, email_verified: false };
        mockUserRepository.findByUsername.mockResolvedValue(unverifiedUser);
        mockUserRepository.updateLastLogin.mockResolvedValue();

        const result = await authService.login(mockLoginCredentials);

        expect(result.user).toBeDefined();
        expect(result.tokens).toBeDefined();
        expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Token Refresh', () => {
    describe('refreshToken', () => {
      it('should refresh tokens with valid refresh token', async () => {
        mockUserRepository.findUserById.mockResolvedValue(mockUser);

        const result = await authService.refreshToken('valid-refresh-token');

        expect(mockJwt.verify).toHaveBeenCalledWith(
          'valid-refresh-token',
          'test-refresh-secret',
          expect.any(Object)
        );
        expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
        expect(result).toEqual({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        });
      });

      it('should throw error if user not found', async () => {
        mockUserRepository.findUserById.mockResolvedValue(null);

        await expect(authService.refreshToken('valid-refresh-token')).rejects.toThrow('User not found');
        
        expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
      });

      it('should throw error if user account is deactivated', async () => {
        const deactivatedUser = { ...mockUser, is_active: false };
        mockUserRepository.findUserById.mockResolvedValue(deactivatedUser);

        await expect(authService.refreshToken('valid-refresh-token')).rejects.toThrow('Account is deactivated');
        
        expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
      });

      it('should throw error for invalid refresh token', async () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid token');
        });

        await expect(authService.refreshToken('invalid-refresh-token')).rejects.toThrow('Invalid refresh token');
      });
    });
  });

  describe('Get User by Token', () => {
    describe('getUserByToken', () => {
      it('should return user for valid token', async () => {
        mockUserRepository.findUserById.mockResolvedValue(mockUser);

        const result = await authService.getUserByToken('valid-token');

        expect(mockJwt.verify).toHaveBeenCalledWith(
          'valid-token',
          'test-jwt-secret',
          expect.any(Object)
        );
        expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
        expect(result).toEqual(expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }));
        expect(result).not.toHaveProperty('password_hash');
      });

      it('should return null for invalid token', async () => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid token');
        });

        const result = await authService.getUserByToken('invalid-token');

        expect(result).toBeNull();
      });

      it('should return null if user not found', async () => {
        mockUserRepository.findUserById.mockResolvedValue(null);

        const result = await authService.getUserByToken('valid-token');

        expect(result).toBeNull();
      });

      it('should return null if user is deactivated', async () => {
        const deactivatedUser = { ...mockUser, is_active: false };
        mockUserRepository.findUserById.mockResolvedValue(deactivatedUser);

        const result = await authService.getUserByToken('valid-token');

        expect(result).toBeNull();
      });
    });
  });

  describe('Password Change', () => {
    describe('changePassword', () => {
      it('should change password successfully', async () => {
        mockUserRepository.findUserById.mockResolvedValue(mockUser);
        mockUserRepository.updateUser.mockResolvedValue(mockUser);

        await authService.changePassword(1, 'password123', 'NewPassword123!');

        expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
        expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, {
          password_hash: 'hashed_NewPassword123!'
        });
      });

      it('should throw error if user not found', async () => {
        mockUserRepository.findUserById.mockResolvedValue(null);

        await expect(authService.changePassword(1, 'password123', 'NewPassword123!')).rejects.toThrow('User not found');
        
        expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
      });

      it('should throw error if current password is incorrect', async () => {
        const userWithDifferentPassword = { ...mockUser, password_hash: 'hashed_differentpassword' };
        mockUserRepository.findUserById.mockResolvedValue(userWithDifferentPassword);

        await expect(authService.changePassword(1, 'wrongpassword', 'NewPassword123!')).rejects.toThrow('Current password is incorrect');
        
        expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
      });

      it('should throw error if new password is invalid', async () => {
        mockUserRepository.findUserById.mockResolvedValue(mockUser);

        await expect(authService.changePassword(1, 'password123', 'weak')).rejects.toThrow('Password must be at least 8 characters long');
        
        expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
      });
    });
  });

  describe('Account Management', () => {
    describe('deactivateAccount', () => {
      it('should deactivate user account', async () => {
        mockUserRepository.updateUser.mockResolvedValue(mockUser);

        await authService.deactivateAccount(1);

        expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, { is_active: false });
      });
    });

    describe('reactivateAccount', () => {
      it('should reactivate user account', async () => {
        mockUserRepository.updateUser.mockResolvedValue(mockUser);

        await authService.reactivateAccount(1);

        expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, { is_active: true });
      });
    });
  });

  describe('Email Verification', () => {
    describe('verifyEmail', () => {
      it('should verify email successfully', async () => {
        mockUserRepository.verifyEmail.mockResolvedValue(mockUser);
        mockEmailService.sendWelcomeEmail.mockResolvedValue();

        const result = await authService.verifyEmail('valid-token');

        expect(mockUserRepository.verifyEmail).toHaveBeenCalledWith('valid-token');
        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'testuser');
        expect(result).toEqual(mockUser);
      });

      it('should throw error for invalid token', async () => {
        mockUserRepository.verifyEmail.mockResolvedValue(null);

        await expect(authService.verifyEmail('invalid-token')).rejects.toThrow('Invalid or expired verification token');
        
        expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
      });

      it('should continue verification even if welcome email fails', async () => {
        mockUserRepository.verifyEmail.mockResolvedValue(mockUser);
        mockEmailService.sendWelcomeEmail.mockRejectedValue(new Error('Email service error'));

        const result = await authService.verifyEmail('valid-token');

        expect(result).toEqual(mockUser);
        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
      });
    });

    describe('resendEmailVerification', () => {
      it('should resend verification email successfully', async () => {
        const unverifiedUser = { ...mockUser, email_verified: false };
        mockUserRepository.findByEmail.mockResolvedValue(unverifiedUser);
        mockUserRepository.setEmailVerificationToken.mockResolvedValue();
        mockEmailService.sendEmailVerificationEmail.mockResolvedValue();

        await authService.resendEmailVerification('test@example.com');

        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
        expect(mockUserRepository.setEmailVerificationToken).toHaveBeenCalledWith(
          1,
          'mock-token-123',
          expect.any(Date)
        );
        expect(mockEmailService.sendEmailVerificationEmail).toHaveBeenCalledWith(
          'test@example.com',
          'testuser',
          'mock-token-123'
        );
      });

      it('should throw error if user not found', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(authService.resendEmailVerification('nonexistent@example.com')).rejects.toThrow('User not found');
        
        expect(mockUserRepository.setEmailVerificationToken).not.toHaveBeenCalled();
        expect(mockEmailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
      });

      it('should throw error if email is already verified', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);

        await expect(authService.resendEmailVerification('test@example.com')).rejects.toThrow('Email is already verified');
        
        expect(mockUserRepository.setEmailVerificationToken).not.toHaveBeenCalled();
        expect(mockEmailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
      });

      it('should throw error if email sending fails', async () => {
        const unverifiedUser = { ...mockUser, email_verified: false };
        mockUserRepository.findByEmail.mockResolvedValue(unverifiedUser);
        mockUserRepository.setEmailVerificationToken.mockResolvedValue();
        mockEmailService.sendEmailVerificationEmail.mockRejectedValue(new Error('Email service error'));

        await expect(authService.resendEmailVerification('test@example.com')).rejects.toThrow('Failed to resend verification email');
        
        expect(mockUserRepository.setEmailVerificationToken).toHaveBeenCalled();
        expect(mockEmailService.sendEmailVerificationEmail).toHaveBeenCalled();
      });
    });
  });

  describe('Password Reset', () => {
    describe('requestPasswordReset', () => {
      it('should request password reset successfully', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockUserRepository.updateUser.mockResolvedValue(mockUser);
        mockEmailService.sendPasswordResetEmail.mockResolvedValue();

        await authService.requestPasswordReset('test@example.com');

        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
        expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, expect.objectContaining({
          password_reset_token: 'mock-token-123',
          password_reset_expires: expect.any(Date)
        }));
        expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
          'test@example.com',
          'testuser',
          expect.any(String)
        );
      });

      it('should not reveal if email does not exist', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await authService.requestPasswordReset('nonexistent@example.com');

        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
        expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
        expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      });

      it('should throw error for deactivated account', async () => {
        const deactivatedUser = { ...mockUser, is_active: false };
        mockUserRepository.findByEmail.mockResolvedValue(deactivatedUser);

        await expect(authService.requestPasswordReset('test@example.com')).rejects.toThrow('Account is deactivated');
        
        expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
        expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      });

      it('should throw error if email sending fails', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockUserRepository.updateUser.mockResolvedValue(mockUser);
        mockEmailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email service error'));

        await expect(authService.requestPasswordReset('test@example.com')).rejects.toThrow('Failed to send password reset email');
        
        expect(mockUserRepository.updateUser).toHaveBeenCalled();
        expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
      });
    });

    describe('completePasswordReset', () => {
      it('should complete password reset successfully', async () => {
        mockUserRepository.findByPasswordResetToken.mockResolvedValue(mockUser);
        mockUserRepository.resetPassword.mockResolvedValue(mockUser);

        await authService.completePasswordReset('valid-reset-token', 'NewPassword123!');

        expect(mockUserRepository.findByPasswordResetToken).toHaveBeenCalledWith('valid-reset-token');
        expect(mockUserRepository.resetPassword).toHaveBeenCalledWith('valid-reset-token', 'hashed_NewPassword123!');
      });

      it('should throw error for invalid reset token', async () => {
        mockUserRepository.findByPasswordResetToken.mockResolvedValue(null);

        await expect(authService.completePasswordReset('invalid-token', 'NewPassword123!')).rejects.toThrow('Invalid or expired reset token');
        
        expect(mockUserRepository.resetPassword).not.toHaveBeenCalled();
      });

      it('should throw error for invalid new password', async () => {
        mockUserRepository.findByPasswordResetToken.mockResolvedValue(mockUser);

        await expect(authService.completePasswordReset('valid-reset-token', 'weak')).rejects.toThrow('Password must be at least 8 characters long');
        
        expect(mockUserRepository.resetPassword).not.toHaveBeenCalled();
      });
    });

    describe('needsPasswordChange', () => {
      it('should return true if user has active reset token', async () => {
        const userWithResetToken = {
          ...mockUser,
          password_reset_token: 'active-token',
          password_reset_expires: new Date(Date.now() + 3600000) // 1 hour from now
        };
        mockUserRepository.findUserById.mockResolvedValue(userWithResetToken);

        const result = await authService.needsPasswordChange(1);

        expect(result).toBe(true);
        expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
      });

      it('should return false if user has no reset token', async () => {
        mockUserRepository.findUserById.mockResolvedValue(mockUser);

        const result = await authService.needsPasswordChange(1);

        expect(result).toBe(false);
      });

      it('should return false if reset token is expired', async () => {
        const userWithExpiredToken = {
          ...mockUser,
          password_reset_token: 'expired-token',
          password_reset_expires: new Date(Date.now() - 3600000) // 1 hour ago
        };
        mockUserRepository.findUserById.mockResolvedValue(userWithExpiredToken);

        const result = await authService.needsPasswordChange(1);

        expect(result).toBe(false);
      });

      it('should return false if user not found', async () => {
        mockUserRepository.findUserById.mockResolvedValue(null);

        const result = await authService.needsPasswordChange(1);

        expect(result).toBe(false);
      });
    });

    describe('forcePasswordChange', () => {
      it('should force password change successfully', async () => {
        const userWithResetToken = {
          ...mockUser,
          password_reset_token: 'active-token',
          password_reset_expires: new Date(Date.now() + 3600000)
        };
        mockUserRepository.findUserById.mockResolvedValue(userWithResetToken);
        mockUserRepository.updateUser.mockResolvedValue(mockUser);

        await authService.forcePasswordChange(1, 'NewPassword123!');

        expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
        expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, {
          password_hash: 'hashed_NewPassword123!',
          password_reset_token: null,
          password_reset_expires: null
        });
      });

      it('should throw error if user not found', async () => {
        mockUserRepository.findUserById.mockResolvedValue(null);

        await expect(authService.forcePasswordChange(1, 'NewPassword123!')).rejects.toThrow('User not found');
        
        expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
      });

      it('should throw error if no active reset token', async () => {
        mockUserRepository.findUserById.mockResolvedValue(mockUser);

        await expect(authService.forcePasswordChange(1, 'NewPassword123!')).rejects.toThrow('No active password reset required');
        
        expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
      });

      it('should throw error if reset token is expired', async () => {
        const userWithExpiredToken = {
          ...mockUser,
          password_reset_token: 'expired-token',
          password_reset_expires: new Date(Date.now() - 3600000)
        };
        mockUserRepository.findUserById.mockResolvedValue(userWithExpiredToken);

        await expect(authService.forcePasswordChange(1, 'NewPassword123!')).rejects.toThrow('No active password reset required');
        
        expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
      });

      it('should throw error for invalid new password', async () => {
        const userWithResetToken = {
          ...mockUser,
          password_reset_token: 'active-token',
          password_reset_expires: new Date(Date.now() + 3600000)
        };
        mockUserRepository.findUserById.mockResolvedValue(userWithResetToken);

        await expect(authService.forcePasswordChange(1, 'weak')).rejects.toThrow('Password must be at least 8 characters long');
        
        expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
      });
    });
  });

  describe('Constructor and Environment', () => {
    it('should throw error in production with default JWT secrets', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      process.env.NODE_ENV = 'production';

      expect(() => {
        new AuthService();
      }).toThrow('JWT secrets must be set in production environment');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not throw error in development with default JWT secrets', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      process.env.NODE_ENV = 'development';

      expect(() => {
        new AuthService();
      }).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });
  });
});