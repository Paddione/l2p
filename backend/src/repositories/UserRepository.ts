import { BaseRepository } from './BaseRepository.js';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  selected_character: string;
  character_level: number;
  experience_points: number;
  created_at: Date;
  last_login?: Date;
  is_active: boolean;
  preferences: {
    language: 'en' | 'de';
    theme: 'light' | 'dark';
  };
  avatar_url?: string;
  timezone?: string;
  notification_settings?: {
    email: boolean;
    push: boolean;
  };
}

export interface CreateUserData {
  username: string;
  email: string;
  password_hash: string;
  email_verified?: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  selected_character?: string;
  character_level?: number;
  experience_points?: number;
  preferences?: {
    language: 'en' | 'de';
    theme: 'light' | 'dark';
  };
  avatar_url?: string;
  timezone?: string;
  notification_settings?: {
    email: boolean;
    push: boolean;
  };
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password_hash?: string;
  email_verified?: boolean;
  email_verification_token?: string | null;
  email_verification_expires?: Date | null;
  password_reset_token?: string | null;
  password_reset_expires?: Date | null;
  selected_character?: string;
  character_level?: number;
  experience_points?: number;
  last_login?: Date;
  is_active?: boolean;
  preferences?: {
    language: 'en' | 'de';
    theme: 'light' | 'dark';
  };
  avatar_url?: string;
  timezone?: string;
  notification_settings?: {
    email: boolean;
    push: boolean;
  };
}

export class UserRepository extends BaseRepository {
  private readonly tableName = 'users';

  async findUserById(id: number): Promise<User | null> {
    return super.findById<User>(this.tableName, id);
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const defaultPreferences = {
      language: 'en' as const,
      theme: 'light' as const
    };

    const defaultNotificationSettings = {
      email: true,
      push: true
    };

    const data = {
      ...userData,
      email_verified: userData.email_verified || false,
      selected_character: userData.selected_character || 'student',
      character_level: userData.character_level || 1,
      experience_points: userData.experience_points || 0,
      preferences: userData.preferences || defaultPreferences,
      notification_settings: userData.notification_settings || defaultNotificationSettings,
      timezone: userData.timezone || 'UTC'
    };

    return super.create<User>(this.tableName, data);
  }

  async updateUser(id: number, userData: UpdateUserData): Promise<User | null> {
    return super.update<User>(this.tableName, id, userData);
  }

  async deleteUser(id: number): Promise<boolean> {
    return super.delete(this.tableName, id);
  }

  async findAllUsers(limit?: number, offset?: number): Promise<User[]> {
    return super.findAll<User>(this.tableName, limit, offset);
  }

  async findActiveUsers(limit?: number): Promise<User[]> {
    let query = 'SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC';
    const params: any[] = [];

    if (limit) {
      query += ` LIMIT $1`;
      params.push(limit);
    }

    const result = await this.db.query<User>(query, params);
    return result.rows;
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  async usernameExists(username: string): Promise<boolean> {
    return super.exists(this.tableName, 'username', username);
  }

  async emailExists(email: string): Promise<boolean> {
    return super.exists(this.tableName, 'email', email);
  }

  async getUserCount(): Promise<number> {
    return super.count(this.tableName);
  }

  async getActiveUserCount(): Promise<number> {
    return super.count(this.tableName, 'is_active = $1', [true]);
  }

  async searchUsers(searchTerm: string, limit: number = 10): Promise<User[]> {
    const result = await this.db.query<User>(
      `SELECT * FROM users 
       WHERE (username ILIKE $1 OR email ILIKE $1) 
       AND is_active = true 
       ORDER BY username 
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );
    return result.rows;
  }

  async updatePreferences(id: number, preferences: User['preferences']): Promise<User | null> {
    const result = await this.db.query<User>(
      'UPDATE users SET preferences = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(preferences), id]
    );
    return result.rows[0] || null;
  }

  async getUsersByTimezone(timezone: string): Promise<User[]> {
    const result = await this.db.query<User>(
      'SELECT * FROM users WHERE timezone = $1 AND is_active = true',
      [timezone]
    );
    return result.rows;
  }

  // Email verification methods
  async findByEmailVerificationToken(token: string): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  async setEmailVerificationToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await this.db.query(
      'UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3',
      [token, expiresAt, userId]
    );
  }

  async verifyEmail(token: string): Promise<User | null> {
    const result = await this.db.query<User>(
      `UPDATE users 
       SET email_verified = true, 
           email_verification_token = NULL, 
           email_verification_expires = NULL 
       WHERE email_verification_token = $1 
       AND email_verification_expires > NOW() 
       RETURNING *`,
      [token]
    );
    return result.rows[0] || null;
  }

  // Password reset methods
  async findByPasswordResetToken(token: string): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  async setPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await this.db.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [token, expiresAt, userId]
    );
  }

  async resetPassword(token: string, newPasswordHash: string): Promise<User | null> {
    const result = await this.db.query<User>(
      `UPDATE users 
       SET password_hash = $1, 
           password_reset_token = NULL, 
           password_reset_expires = NULL 
       WHERE password_reset_token = $2 
       AND password_reset_expires > NOW() 
       RETURNING *`,
      [newPasswordHash, token]
    );
    return result.rows[0] || null;
  }

  async clearPasswordResetToken(userId: number): Promise<void> {
    await this.db.query(
      'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = $1',
      [userId]
    );
  }
}