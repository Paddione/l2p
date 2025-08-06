import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../auth';
import { AuthService, TokenPayload } from '../../services/AuthService';

// Mock AuthService
jest.mock('../../services/AuthService');

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const mockTokenPayload: TokenPayload = {
    userId: 123,
    username: 'testuser',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock auth service
    mockAuthService = {
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
      registerUser: jest.fn(),
      loginUser: jest.fn(),
      refreshAccessToken: jest.fn(),
      resetPassword: jest.fn(),
      verifyPasswordResetToken: jest.fn(),
      changePassword: jest.fn(),
      verifyEmailToken: jest.fn(),
      resendVerificationEmail: jest.fn()
    } as any;

    // Create auth middleware instance
    authMiddleware = new AuthMiddleware();
    (authMiddleware as any).authService = mockAuthService;

    // Create mock request
    mockRequest = {
      headers: {},
      cookies: {},
      params: {},
      body: {}
    };

    // Create mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Create mock next function
    mockNext = jest.fn();
  });

  describe('Token Extraction', () => {
    it('should extract token from Authorization header', () => {
      mockRequest.headers = {
        authorization: 'Bearer test-token-123'
      };

      const token = (authMiddleware as any).extractToken(mockRequest as Request);

      expect(token).toBe('test-token-123');
    });

    it('should extract token from cookies', () => {
      mockRequest.cookies = {
        accessToken: 'cookie-token-456'
      };

      const token = (authMiddleware as any).extractToken(mockRequest as Request);

      expect(token).toBe('cookie-token-456');
    });

    it('should prioritize Authorization header over cookies', () => {
      mockRequest.headers = {
        authorization: 'Bearer header-token'
      };
      mockRequest.cookies = {
        accessToken: 'cookie-token'
      };

      const token = (authMiddleware as any).extractToken(mockRequest as Request);

      expect(token).toBe('header-token');
    });

    it('should return null when no token is present', () => {
      const token = (authMiddleware as any).extractToken(mockRequest as Request);

      expect(token).toBeNull();
    });

    it('should return null for malformed Authorization header', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token'
      };

      const token = (authMiddleware as any).extractToken(mockRequest as Request);

      expect(token).toBeNull();
    });

    it('should handle Authorization header without Bearer prefix', () => {
      mockRequest.headers = {
        authorization: 'test-token'
      };

      const token = (authMiddleware as any).extractToken(mockRequest as Request);

      expect(token).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('should authenticate valid token and attach user to request', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockTokenPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'No access token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired token error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };

      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Access token expired');
      });

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token expired',
        message: 'Access token has expired',
        code: 'TOKEN_EXPIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid token error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid access token');
      });

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'Access token is invalid',
        code: 'TOKEN_INVALID'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle generic token verification errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer bad-token'
      };

      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Unknown token error');
      });

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Token verification failed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should authenticate valid token and attach user to request', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authMiddleware.optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockTokenPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when no token is provided', async () => {
      await authMiddleware.optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when token verification fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware.optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should continue when user is authenticated', () => {
      mockRequest.user = mockTokenPayload;

      const requireRoleMiddleware = authMiddleware.requireRole('admin');

      requireRoleMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      const requireRoleMiddleware = authMiddleware.requireRole('admin');

      requireRoleMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    it('should continue when user owns the resource', () => {
      mockRequest.user = mockTokenPayload;
      mockRequest.params = { userId: '123' };

      const requireOwnershipMiddleware = authMiddleware.requireOwnership('userId');

      requireOwnershipMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest.params = { userId: '123' };

      const requireOwnershipMiddleware = authMiddleware.requireOwnership('userId');

      requireOwnershipMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when user ID parameter is missing', () => {
      mockRequest.user = mockTokenPayload;

      const requireOwnershipMiddleware = authMiddleware.requireOwnership('userId');

      requireOwnershipMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing user ID',
        message: 'User ID parameter is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when user ID is not a valid number', () => {
      mockRequest.user = mockTokenPayload;
      mockRequest.params = { userId: 'invalid' };

      const requireOwnershipMiddleware = authMiddleware.requireOwnership('userId');

      requireOwnershipMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not own the resource', () => {
      mockRequest.user = mockTokenPayload;
      mockRequest.params = { userId: '456' };

      const requireOwnershipMiddleware = authMiddleware.requireOwnership('userId');

      requireOwnershipMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use custom parameter name', () => {
      mockRequest.user = mockTokenPayload;
      mockRequest.params = { resourceUserId: '123' };

      const requireOwnershipMiddleware = authMiddleware.requireOwnership('resourceUserId');

      requireOwnershipMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate refresh token from cookies', async () => {
      mockRequest.cookies = {
        refreshToken: 'valid-refresh-token'
      };

      mockAuthService.verifyRefreshToken.mockReturnValue(mockTokenPayload);

      await authMiddleware.validateRefreshToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockRequest.user).toEqual(mockTokenPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate refresh token from request body', async () => {
      mockRequest.body = {
        refreshToken: 'body-refresh-token'
      };

      mockAuthService.verifyRefreshToken.mockReturnValue(mockTokenPayload);

      await authMiddleware.validateRefreshToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyRefreshToken).toHaveBeenCalledWith('body-refresh-token');
      expect(mockRequest.user).toEqual(mockTokenPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prioritize cookies over body', async () => {
      mockRequest.cookies = {
        refreshToken: 'cookie-refresh-token'
      };
      mockRequest.body = {
        refreshToken: 'body-refresh-token'
      };

      mockAuthService.verifyRefreshToken.mockReturnValue(mockTokenPayload);

      await authMiddleware.validateRefreshToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyRefreshToken).toHaveBeenCalledWith('cookie-refresh-token');
    });

    it('should return 401 when no refresh token is provided', async () => {
      await authMiddleware.validateRefreshToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Refresh token required',
        message: 'No refresh token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired refresh token error', async () => {
      mockRequest.cookies = {
        refreshToken: 'expired-refresh-token'
      };

      mockAuthService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Refresh token expired');
      });

      await authMiddleware.validateRefreshToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Refresh token expired',
        message: 'Refresh token has expired, please login again',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid refresh token error', async () => {
      mockRequest.cookies = {
        refreshToken: 'invalid-refresh-token'
      };

      mockAuthService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      await authMiddleware.validateRefreshToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid',
        code: 'REFRESH_TOKEN_INVALID'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle generic refresh token verification errors', async () => {
      mockRequest.cookies = {
        refreshToken: 'bad-refresh-token'
      };

      mockAuthService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Unknown refresh token error');
      });

      await authMiddleware.validateRefreshToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Refresh token validation failed',
        message: 'Could not validate refresh token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error exceptions in authenticate', async () => {
      mockRequest.headers = {
        authorization: 'Bearer test-token'
      };

      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw 'String error';
      });

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Token verification failed'
      });
    });

    it('should handle non-Error exceptions in validateRefreshToken', async () => {
      mockRequest.cookies = {
        refreshToken: 'test-refresh-token'
      };

      mockAuthService.verifyRefreshToken.mockImplementation(() => {
        throw 'String error';
      });

      await authMiddleware.validateRefreshToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Refresh token validation failed',
        message: 'Could not validate refresh token'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined cookies', async () => {
      mockRequest.cookies = undefined;

      const token = (authMiddleware as any).extractToken(mockRequest as Request);

      expect(token).toBeNull();
    });

    it('should handle undefined headers', async () => {
      mockRequest.headers = undefined as any;

      const token = (authMiddleware as any).extractToken(mockRequest as Request);

      expect(token).toBeNull();
    });

    it('should handle empty string token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      const token = (authMiddleware as any).extractToken(mockRequest as Request);

      expect(token).toBe('');
    });

    it('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(10000);
      mockRequest.headers = {
        authorization: `Bearer ${longToken}`
      };

      mockAuthService.verifyAccessToken.mockReturnValue(mockTokenPayload);

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(longToken);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Security Considerations', () => {
    it('should not expose sensitive information in error messages', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Internal database error with sensitive data');
      });

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Token verification failed'
      });
    });

    it('should handle malformed tokens gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer malformed.token.here'
      };

      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid access token');
      });

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'Access token is invalid',
        code: 'TOKEN_INVALID'
      });
    });
  });
}); 