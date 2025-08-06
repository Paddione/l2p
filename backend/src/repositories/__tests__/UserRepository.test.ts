import { UserRepository, User, CreateUserData, UpdateUserData } from '../UserRepository';
import { BaseRepository } from '../BaseRepository';

// Mock the BaseRepository
jest.mock('../BaseRepository');

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockDb: any;

  // Test data
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password_hash: '$2b$10$hashedpassword',
    email_verified: true,
    selected_character: 'wizard',
    character_level: 5,
    experience_points: 2500,
    created_at: new Date('2023-01-01T00:00:00Z'),
    last_login: new Date('2023-01-02T00:00:00Z'),
    is_active: true,
    preferences: {
      language: 'en',
      theme: 'dark'
    },
    avatar_url: 'https://example.com/avatar.jpg',
    timezone: 'UTC',
    notification_settings: {
      email: true,
      push: false
    }
  };

  const mockCreateUserData: CreateUserData = {
    username: 'newuser',
    email: 'newuser@example.com',
    password_hash: '$2b$10$newhashedpassword',
    email_verified: false,
    email_verification_token: 'verification-token-123',
    email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    selected_character: 'student',
    character_level: 1,
    experience_points: 0,
    preferences: {
      language: 'de',
      theme: 'light'
    },
    avatar_url: 'https://example.com/new-avatar.jpg',
    timezone: 'Europe/Berlin',
    notification_settings: {
      email: true,
      push: true
    }
  };

  const mockUpdateUserData: UpdateUserData = {
    username: 'updateduser',
    email: 'updated@example.com',
    email_verified: true,
    selected_character: 'professor',
    character_level: 10,
    experience_points: 5000,
    preferences: {
      language: 'en',
      theme: 'dark'
    }
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock database connection and query methods
    mockDb = {
      query: jest.fn()
    };

    // Create UserRepository instance
    userRepository = new UserRepository();

    // Mock the inherited db property from BaseRepository
    (userRepository as any).db = mockDb;

    // Mock BaseRepository methods
    const mockBaseRepository = BaseRepository as jest.MockedClass<typeof BaseRepository>;
    mockBaseRepository.prototype.findById = jest.fn();
    mockBaseRepository.prototype.create = jest.fn();
    mockBaseRepository.prototype.update = jest.fn();
    mockBaseRepository.prototype.delete = jest.fn();
    mockBaseRepository.prototype.findAll = jest.fn();
    mockBaseRepository.prototype.exists = jest.fn();
    mockBaseRepository.prototype.count = jest.fn();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize UserRepository correctly', () => {
      expect(userRepository).toBeInstanceOf(UserRepository);
      expect(userRepository).toBeInstanceOf(BaseRepository);
    });

    it('should have correct table name', () => {
      expect((userRepository as any).tableName).toBe('users');
    });
  });

  describe('Basic CRUD Operations', () => {
    describe('findUserById', () => {
      it('should find user by ID successfully', async () => {
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(mockUser);

        const result = await userRepository.findUserById(1);

        expect(mockFindById).toHaveBeenCalledWith('users', 1);
        expect(result).toEqual(mockUser);
      });

      it('should return null when user not found', async () => {
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockResolvedValue(null);

        const result = await userRepository.findUserById(999);

        expect(mockFindById).toHaveBeenCalledWith('users', 999);
        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
        mockFindById.mockRejectedValue(new Error('Database connection failed'));

        await expect(userRepository.findUserById(1)).rejects.toThrow('Database connection failed');
      });
    });

    describe('createUser', () => {
      it('should create user with provided data', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockResolvedValue(mockUser);

        const result = await userRepository.createUser(mockCreateUserData);

        expect(mockCreate).toHaveBeenCalledWith('users', mockCreateUserData);
        expect(result).toEqual(mockUser);
      });

      it('should create user with default values when optional fields missing', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockResolvedValue(mockUser);

        const minimalUserData: CreateUserData = {
          username: 'minimaluser',
          email: 'minimal@example.com',
          password_hash: '$2b$10$minimal'
        };

        const expectedData = {
          ...minimalUserData,
          email_verified: false,
          selected_character: 'student',
          character_level: 1,
          experience_points: 0,
          preferences: {
            language: 'en',
            theme: 'light'
          },
          notification_settings: {
            email: true,
            push: true
          },
          timezone: 'UTC'
        };

        await userRepository.createUser(minimalUserData);

        expect(mockCreate).toHaveBeenCalledWith('users', expectedData);
      });

      it('should handle duplicate username error', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockRejectedValue(new Error('duplicate key value violates unique constraint "users_username_key"'));

        await expect(userRepository.createUser(mockCreateUserData)).rejects.toThrow('duplicate key');
      });

      it('should handle duplicate email error', async () => {
        const mockCreate = jest.spyOn(BaseRepository.prototype, 'create');
        mockCreate.mockRejectedValue(new Error('duplicate key value violates unique constraint "users_email_key"'));

        await expect(userRepository.createUser(mockCreateUserData)).rejects.toThrow('duplicate key');
      });
    });

    describe('updateUser', () => {
      it('should update user successfully', async () => {
        const mockUpdate = jest.spyOn(BaseRepository.prototype, 'update');
        const updatedUser = { ...mockUser, ...mockUpdateUserData };
        mockUpdate.mockResolvedValue(updatedUser);

        const result = await userRepository.updateUser(1, mockUpdateUserData);

        expect(mockUpdate).toHaveBeenCalledWith('users', 1, mockUpdateUserData);
        expect(result).toEqual(updatedUser);
      });

      it('should return null when user not found for update', async () => {
        const mockUpdate = jest.spyOn(BaseRepository.prototype, 'update');
        mockUpdate.mockResolvedValue(null);

        const result = await userRepository.updateUser(999, mockUpdateUserData);

        expect(mockUpdate).toHaveBeenCalledWith('users', 999, mockUpdateUserData);
        expect(result).toBeNull();
      });

      it('should handle partial updates', async () => {
        const mockUpdate = jest.spyOn(BaseRepository.prototype, 'update');
        const partialUpdate = { username: 'newusername' };
        const updatedUser = { ...mockUser, username: 'newusername' };
        mockUpdate.mockResolvedValue(updatedUser);

        const result = await userRepository.updateUser(1, partialUpdate);

        expect(mockUpdate).toHaveBeenCalledWith('users', 1, partialUpdate);
        expect(result).toEqual(updatedUser);
      });
    });

    describe('deleteUser', () => {
      it('should delete user successfully', async () => {
        const mockDelete = jest.spyOn(BaseRepository.prototype, 'delete');
        mockDelete.mockResolvedValue(true);

        const result = await userRepository.deleteUser(1);

        expect(mockDelete).toHaveBeenCalledWith('users', 1);
        expect(result).toBe(true);
      });

      it('should return false when user not found for deletion', async () => {
        const mockDelete = jest.spyOn(BaseRepository.prototype, 'delete');
        mockDelete.mockResolvedValue(false);

        const result = await userRepository.deleteUser(999);

        expect(mockDelete).toHaveBeenCalledWith('users', 999);
        expect(result).toBe(false);
      });

      it('should handle deletion errors', async () => {
        const mockDelete = jest.spyOn(BaseRepository.prototype, 'delete');
        mockDelete.mockRejectedValue(new Error('Foreign key constraint violation'));

        await expect(userRepository.deleteUser(1)).rejects.toThrow('Foreign key constraint violation');
      });
    });
  });

  describe('User Finding and Search Operations', () => {
    describe('findByUsername', () => {
      it('should find user by username successfully', async () => {
        mockDb.query.mockResolvedValue({ rows: [mockUser] });

        const result = await userRepository.findByUsername('testuser');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE username = $1',
          ['testuser']
        );
        expect(result).toEqual(mockUser);
      });

      it('should return null when username not found', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.findByUsername('nonexistent');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE username = $1',
          ['nonexistent']
        );
        expect(result).toBeNull();
      });

      it('should handle case-sensitive username search', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        await userRepository.findByUsername('TestUser');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE username = $1',
          ['TestUser']
        );
      });
    });

    describe('findByEmail', () => {
      it('should find user by email successfully', async () => {
        mockDb.query.mockResolvedValue({ rows: [mockUser] });

        const result = await userRepository.findByEmail('test@example.com');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE email = $1',
          ['test@example.com']
        );
        expect(result).toEqual(mockUser);
      });

      it('should return null when email not found', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.findByEmail('nonexistent@example.com');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE email = $1',
          ['nonexistent@example.com']
        );
        expect(result).toBeNull();
      });

      it('should handle email case sensitivity', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        await userRepository.findByEmail('TEST@EXAMPLE.COM');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE email = $1',
          ['TEST@EXAMPLE.COM']
        );
      });
    });

    describe('findAllUsers', () => {
      it('should find all users without pagination', async () => {
        const mockFindAll = jest.spyOn(BaseRepository.prototype, 'findAll');
        const mockUsers = [mockUser];
        mockFindAll.mockResolvedValue(mockUsers);

        const result = await userRepository.findAllUsers();

        expect(mockFindAll).toHaveBeenCalledWith('users', undefined, undefined);
        expect(result).toEqual(mockUsers);
      });

      it('should find all users with pagination', async () => {
        const mockFindAll = jest.spyOn(BaseRepository.prototype, 'findAll');
        const mockUsers = [mockUser];
        mockFindAll.mockResolvedValue(mockUsers);

        const result = await userRepository.findAllUsers(10, 20);

        expect(mockFindAll).toHaveBeenCalledWith('users', 10, 20);
        expect(result).toEqual(mockUsers);
      });
    });

    describe('findActiveUsers', () => {
      it('should find active users without limit', async () => {
        const activeUsers = [mockUser];
        mockDb.query.mockResolvedValue({ rows: activeUsers });

        const result = await userRepository.findActiveUsers();

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC',
          []
        );
        expect(result).toEqual(activeUsers);
      });

      it('should find active users with limit', async () => {
        const activeUsers = [mockUser];
        mockDb.query.mockResolvedValue({ rows: activeUsers });

        const result = await userRepository.findActiveUsers(5);

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC LIMIT $1',
          [5]
        );
        expect(result).toEqual(activeUsers);
      });

      it('should return empty array when no active users', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.findActiveUsers();

        expect(result).toEqual([]);
      });
    });

    describe('searchUsers', () => {
      it('should search users by username', async () => {
        const searchResults = [mockUser];
        mockDb.query.mockResolvedValue({ rows: searchResults });

        const result = await userRepository.searchUsers('test');

        expect(mockDb.query).toHaveBeenCalledWith(
          `SELECT * FROM users 
       WHERE (username ILIKE $1 OR email ILIKE $1) 
       AND is_active = true 
       ORDER BY username 
       LIMIT $2`,
          ['%test%', 10]
        );
        expect(result).toEqual(searchResults);
      });

      it('should search users with custom limit', async () => {
        const searchResults = [mockUser];
        mockDb.query.mockResolvedValue({ rows: searchResults });

        const result = await userRepository.searchUsers('test', 25);

        expect(mockDb.query).toHaveBeenCalledWith(
          `SELECT * FROM users 
       WHERE (username ILIKE $1 OR email ILIKE $1) 
       AND is_active = true 
       ORDER BY username 
       LIMIT $2`,
          ['%test%', 25]
        );
        expect(result).toEqual(searchResults);
      });

      it('should return empty array for no matches', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.searchUsers('nonexistent');

        expect(result).toEqual([]);
      });

      it('should handle special characters in search term', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        await userRepository.searchUsers('test@domain.com');

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.any(String),
          ['%test@domain.com%', 10]
        );
      });
    });
  });

  describe('User Statistics and Counting', () => {
    describe('usernameExists', () => {
      it('should return true when username exists', async () => {
        const mockExists = jest.spyOn(BaseRepository.prototype, 'exists');
        mockExists.mockResolvedValue(true);

        const result = await userRepository.usernameExists('testuser');

        expect(mockExists).toHaveBeenCalledWith('users', 'username', 'testuser');
        expect(result).toBe(true);
      });

      it('should return false when username does not exist', async () => {
        const mockExists = jest.spyOn(BaseRepository.prototype, 'exists');
        mockExists.mockResolvedValue(false);

        const result = await userRepository.usernameExists('nonexistent');

        expect(mockExists).toHaveBeenCalledWith('users', 'username', 'nonexistent');
        expect(result).toBe(false);
      });
    });

    describe('emailExists', () => {
      it('should return true when email exists', async () => {
        const mockExists = jest.spyOn(BaseRepository.prototype, 'exists');
        mockExists.mockResolvedValue(true);

        const result = await userRepository.emailExists('test@example.com');

        expect(mockExists).toHaveBeenCalledWith('users', 'email', 'test@example.com');
        expect(result).toBe(true);
      });

      it('should return false when email does not exist', async () => {
        const mockExists = jest.spyOn(BaseRepository.prototype, 'exists');
        mockExists.mockResolvedValue(false);

        const result = await userRepository.emailExists('nonexistent@example.com');

        expect(mockExists).toHaveBeenCalledWith('users', 'email', 'nonexistent@example.com');
        expect(result).toBe(false);
      });
    });

    describe('getUserCount', () => {
      it('should return total user count', async () => {
        const mockCount = jest.spyOn(BaseRepository.prototype, 'count');
        mockCount.mockResolvedValue(150);

        const result = await userRepository.getUserCount();

        expect(mockCount).toHaveBeenCalledWith('users');
        expect(result).toBe(150);
      });

      it('should return zero when no users', async () => {
        const mockCount = jest.spyOn(BaseRepository.prototype, 'count');
        mockCount.mockResolvedValue(0);

        const result = await userRepository.getUserCount();

        expect(result).toBe(0);
      });
    });

    describe('getActiveUserCount', () => {
      it('should return active user count', async () => {
        const mockCount = jest.spyOn(BaseRepository.prototype, 'count');
        mockCount.mockResolvedValue(120);

        const result = await userRepository.getActiveUserCount();

        expect(mockCount).toHaveBeenCalledWith('users', 'is_active = $1', [true]);
        expect(result).toBe(120);
      });
    });
  });

  describe('User Management Operations', () => {
    describe('updateLastLogin', () => {
      it('should update last login timestamp', async () => {
        mockDb.query.mockResolvedValue({ rowCount: 1 });

        await userRepository.updateLastLogin(1);

        expect(mockDb.query).toHaveBeenCalledWith(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
          [1]
        );
      });

      it('should handle update when user does not exist', async () => {
        mockDb.query.mockResolvedValue({ rowCount: 0 });

        // Should not throw error even if user doesn't exist
        await expect(userRepository.updateLastLogin(999)).resolves.toBeUndefined();
      });
    });

    describe('updatePreferences', () => {
      it('should update user preferences successfully', async () => {
        const newPreferences = { language: 'de' as const, theme: 'light' as const };
        const updatedUser = { ...mockUser, preferences: newPreferences };
        mockDb.query.mockResolvedValue({ rows: [updatedUser] });

        const result = await userRepository.updatePreferences(1, newPreferences);

        expect(mockDb.query).toHaveBeenCalledWith(
          'UPDATE users SET preferences = $1 WHERE id = $2 RETURNING *',
          [JSON.stringify(newPreferences), 1]
        );
        expect(result).toEqual(updatedUser);
      });

      it('should return null when user not found for preference update', async () => {
        const newPreferences = { language: 'de' as const, theme: 'light' as const };
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.updatePreferences(999, newPreferences);

        expect(result).toBeNull();
      });

      it('should handle complex preference objects', async () => {
        const complexPreferences = { language: 'en' as const, theme: 'dark' as const };
        mockDb.query.mockResolvedValue({ rows: [mockUser] });

        await userRepository.updatePreferences(1, complexPreferences);

        expect(mockDb.query).toHaveBeenCalledWith(
          'UPDATE users SET preferences = $1 WHERE id = $2 RETURNING *',
          [JSON.stringify(complexPreferences), 1]
        );
      });
    });

    describe('getUsersByTimezone', () => {
      it('should find users by timezone', async () => {
        const timezoneUsers = [mockUser];
        mockDb.query.mockResolvedValue({ rows: timezoneUsers });

        const result = await userRepository.getUsersByTimezone('Europe/Berlin');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE timezone = $1 AND is_active = true',
          ['Europe/Berlin']
        );
        expect(result).toEqual(timezoneUsers);
      });

      it('should return empty array for timezone with no users', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.getUsersByTimezone('Australia/Sydney');

        expect(result).toEqual([]);
      });

      it('should only return active users for timezone', async () => {
        mockDb.query.mockResolvedValue({ rows: [mockUser] });

        await userRepository.getUsersByTimezone('UTC');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE timezone = $1 AND is_active = true',
          ['UTC']
        );
      });
    });
  });

  describe('Email Verification Operations', () => {
    describe('findByEmailVerificationToken', () => {
      it('should find user by valid verification token', async () => {
        mockDb.query.mockResolvedValue({ rows: [mockUser] });

        const result = await userRepository.findByEmailVerificationToken('valid-token');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
          ['valid-token']
        );
        expect(result).toEqual(mockUser);
      });

      it('should return null for expired verification token', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.findByEmailVerificationToken('expired-token');

        expect(result).toBeNull();
      });

      it('should return null for non-existent verification token', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.findByEmailVerificationToken('non-existent-token');

        expect(result).toBeNull();
      });
    });

    describe('setEmailVerificationToken', () => {
      it('should set email verification token and expiry', async () => {
        const token = 'verification-token-123';
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        mockDb.query.mockResolvedValue({ rowCount: 1 });

        await userRepository.setEmailVerificationToken(1, token, expiresAt);

        expect(mockDb.query).toHaveBeenCalledWith(
          'UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3',
          [token, expiresAt, 1]
        );
      });

      it('should handle setting token for non-existent user', async () => {
        mockDb.query.mockResolvedValue({ rowCount: 0 });

        await expect(userRepository.setEmailVerificationToken(999, 'token', new Date()))
          .resolves.toBeUndefined();
      });
    });

    describe('verifyEmail', () => {
      it('should verify email with valid token', async () => {
        const verifiedUser = { ...mockUser, email_verified: true };
        mockDb.query.mockResolvedValue({ rows: [verifiedUser] });

        const result = await userRepository.verifyEmail('valid-token');

        expect(mockDb.query).toHaveBeenCalledWith(
          `UPDATE users 
       SET email_verified = true, 
           email_verification_token = NULL, 
           email_verification_expires = NULL 
       WHERE email_verification_token = $1 
       AND email_verification_expires > NOW() 
       RETURNING *`,
          ['valid-token']
        );
        expect(result).toEqual(verifiedUser);
      });

      it('should return null for invalid or expired token', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.verifyEmail('invalid-token');

        expect(result).toBeNull();
      });

      it('should clear verification token fields after successful verification', async () => {
        const verifiedUser = {
          ...mockUser,
          email_verified: true,
          email_verification_token: null,
          email_verification_expires: null
        };
        mockDb.query.mockResolvedValue({ rows: [verifiedUser] });

        const result = await userRepository.verifyEmail('valid-token');

        expect(result?.email_verification_token).toBeNull();
        expect(result?.email_verification_expires).toBeNull();
      });
    });
  });

  describe('Password Reset Operations', () => {
    describe('findByPasswordResetToken', () => {
      it('should find user by valid password reset token', async () => {
        mockDb.query.mockResolvedValue({ rows: [mockUser] });

        const result = await userRepository.findByPasswordResetToken('valid-reset-token');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
          ['valid-reset-token']
        );
        expect(result).toEqual(mockUser);
      });

      it('should return null for expired password reset token', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.findByPasswordResetToken('expired-reset-token');

        expect(result).toBeNull();
      });

      it('should return null for non-existent password reset token', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.findByPasswordResetToken('non-existent-token');

        expect(result).toBeNull();
      });
    });

    describe('setPasswordResetToken', () => {
      it('should set password reset token and expiry', async () => {
        const token = 'reset-token-456';
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        mockDb.query.mockResolvedValue({ rowCount: 1 });

        await userRepository.setPasswordResetToken(1, token, expiresAt);

        expect(mockDb.query).toHaveBeenCalledWith(
          'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
          [token, expiresAt, 1]
        );
      });

      it('should handle setting token for non-existent user', async () => {
        mockDb.query.mockResolvedValue({ rowCount: 0 });

        await expect(userRepository.setPasswordResetToken(999, 'token', new Date()))
          .resolves.toBeUndefined();
      });
    });

    describe('resetPassword', () => {
      it('should reset password with valid token', async () => {
        const newPasswordHash = '$2b$10$newhashedpassword';
        const updatedUser = { ...mockUser, password_hash: newPasswordHash };
        mockDb.query.mockResolvedValue({ rows: [updatedUser] });

        const result = await userRepository.resetPassword('valid-reset-token', newPasswordHash);

        expect(mockDb.query).toHaveBeenCalledWith(
          `UPDATE users 
       SET password_hash = $1, 
           password_reset_token = NULL, 
           password_reset_expires = NULL 
       WHERE password_reset_token = $2 
       AND password_reset_expires > NOW() 
       RETURNING *`,
          [newPasswordHash, 'valid-reset-token']
        );
        expect(result).toEqual(updatedUser);
      });

      it('should return null for invalid or expired reset token', async () => {
        mockDb.query.mockResolvedValue({ rows: [] });

        const result = await userRepository.resetPassword('invalid-token', '$2b$10$newpass');

        expect(result).toBeNull();
      });

      it('should clear reset token fields after successful password reset', async () => {
        const updatedUser = {
          ...mockUser,
          password_hash: '$2b$10$newpass',
          password_reset_token: null,
          password_reset_expires: null
        };
        mockDb.query.mockResolvedValue({ rows: [updatedUser] });

        const result = await userRepository.resetPassword('valid-token', '$2b$10$newpass');

        expect(result?.password_reset_token).toBeNull();
        expect(result?.password_reset_expires).toBeNull();
      });
    });

    describe('clearPasswordResetToken', () => {
      it('should clear password reset token and expiry', async () => {
        mockDb.query.mockResolvedValue({ rowCount: 1 });

        await userRepository.clearPasswordResetToken(1);

        expect(mockDb.query).toHaveBeenCalledWith(
          'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = $1',
          [1]
        );
      });

      it('should handle clearing token for non-existent user', async () => {
        mockDb.query.mockResolvedValue({ rowCount: 0 });

        await expect(userRepository.clearPasswordResetToken(999))
          .resolves.toBeUndefined();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      mockDb.query.mockRejectedValue(new Error('Connection timeout'));

      await expect(userRepository.findByUsername('test')).rejects.toThrow('Connection timeout');
      await expect(userRepository.findByEmail('test@example.com')).rejects.toThrow('Connection timeout');
    });

    it('should handle malformed JSON in preferences', async () => {
      // This test would be more relevant in integration tests, but we can test the logic
      const malformedPreferences = { language: 'en' as const, theme: 'dark' as const };
      mockDb.query.mockResolvedValue({ rows: [mockUser] });

      await userRepository.updatePreferences(1, malformedPreferences);

      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE users SET preferences = $1 WHERE id = $2 RETURNING *',
        [JSON.stringify(malformedPreferences), 1]
      );
    });

    it('should handle empty search terms', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.searchUsers('');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        ['%%', 10]
      );
      expect(result).toEqual([]);
    });

    it('should handle very long search terms', async () => {
      const longSearchTerm = 'a'.repeat(1000);
      mockDb.query.mockResolvedValue({ rows: [] });

      await userRepository.searchUsers(longSearchTerm);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        [`%${longSearchTerm}%`, 10]
      );
    });

    it('should handle negative user IDs', async () => {
      const mockFindById = jest.spyOn(BaseRepository.prototype, 'findById');
      mockFindById.mockResolvedValue(null);

      const result = await userRepository.findUserById(-1);

      expect(mockFindById).toHaveBeenCalledWith('users', -1);
      expect(result).toBeNull();
    });

    it('should handle zero limit in search', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.searchUsers('test', 0);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        ['%test%', 0]
      );
      expect(result).toEqual([]);
    });

    it('should handle null preferences gracefully', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await userRepository.updatePreferences(1, null as any);

      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE users SET preferences = $1 WHERE id = $2 RETURNING *',
        ['null', 1]
      );
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large result sets efficiently', async () => {
      const largeUserArray = Array(1000).fill(mockUser);
      const mockFindAll = jest.spyOn(BaseRepository.prototype, 'findAll');
      mockFindAll.mockResolvedValue(largeUserArray);

      const result = await userRepository.findAllUsers(1000);

      expect(result).toHaveLength(1000);
      expect(mockFindAll).toHaveBeenCalledWith('users', 1000, undefined);
    });

    it('should handle concurrent database operations', async () => {
      mockDb.query.mockResolvedValue({ rows: [mockUser] });

      const promises = [
        userRepository.findByUsername('user1'),
        userRepository.findByUsername('user2'),
        userRepository.findByUsername('user3')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockDb.query).toHaveBeenCalledTimes(3);
    });

    it('should handle pagination edge cases', async () => {
      const mockFindAll = jest.spyOn(BaseRepository.prototype, 'findAll');
      mockFindAll.mockResolvedValue([]);

      // Test with very large offset
      await userRepository.findAllUsers(10, 999999);

      expect(mockFindAll).toHaveBeenCalledWith('users', 10, 999999);
    });
  });

  describe('Data Validation and Constraints', () => {
    it('should respect email format in searches', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await userRepository.findByEmail('invalid-email-format');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['invalid-email-format']
      );
    });

    it('should handle special characters in usernames', async () => {
      const specialUsername = 'user@#$%';
      mockDb.query.mockResolvedValue({ rows: [] });

      await userRepository.findByUsername(specialUsername);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = $1',
        [specialUsername]
      );
    });

    it('should handle unicode characters in usernames', async () => {
      const unicodeUsername = 'ユーザー名';
      mockDb.query.mockResolvedValue({ rows: [] });

      await userRepository.findByUsername(unicodeUsername);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = $1',
        [unicodeUsername]
      );
    });

    it('should handle extremely long usernames', async () => {
      const longUsername = 'a'.repeat(500);
      mockDb.query.mockResolvedValue({ rows: [] });

      await userRepository.findByUsername(longUsername);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = $1',
        [longUsername]
      );
    });
  });
}); 