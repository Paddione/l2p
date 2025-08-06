import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private pool: Pool;
  private isConnected: boolean = false;
  private isClosing: boolean = false;

  private constructor() {
    const config: DatabaseConfig = this.parseConnectionString();
    this.pool = new Pool({
      ...config,
      max: config.max || 20, // Maximum number of connections
      min: config.min || 2,  // Minimum number of connections
      idleTimeoutMillis: config.idleTimeoutMillis || 30000, // 30 seconds
      connectionTimeoutMillis: config.connectionTimeoutMillis || 10000, // 10 seconds
    });

    this.setupEventHandlers();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public static async reset(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.close();
      DatabaseService.instance = null;
    }
  }

  private parseConnectionString(): DatabaseConfig {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (databaseUrl) {
      try {
        // Handle special characters in password by properly encoding the URL
        let encodedUrl = databaseUrl;
        
        // If the URL contains unencoded special characters, try to encode them
        if (databaseUrl.includes('@') && !databaseUrl.includes('%')) {
          // Extract parts before encoding
          const urlParts = databaseUrl.match(/^postgresql:\/\/([^:]+):([^@]+)@(.+)$/);
          if (urlParts && urlParts.length >= 4) {
            const [, user, password, rest] = urlParts;
            if (user && password && rest) {
              const encodedUser = encodeURIComponent(user);
              const encodedPassword = encodeURIComponent(password);
              encodedUrl = `postgresql://${encodedUser}:${encodedPassword}@${rest}`;
            }
          }
        }
        
        // Parse DATABASE_URL format: postgresql://user:password@host:port/database
        const url = new URL(encodedUrl);
        return {
          host: url.hostname,
          port: parseInt(url.port) || 5432,
          database: url.pathname.slice(1), // Remove leading slash
          user: decodeURIComponent(url.username),
          password: decodeURIComponent(url.password),
          ssl: process.env.DB_SSL === 'true'
        };
      } catch (error) {
        // If URL parsing fails (e.g., in test environment), fall back to defaults
        console.warn('Invalid DATABASE_URL, using fallback configuration:', error);
      }
    }

    // Fallback to individual environment variables with consistent database name
    const dbName = process.env.DB_NAME || process.env.POSTGRES_DB || 'l2p_db';
    
    return {
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: dbName,
      user: process.env.DB_USER || process.env.POSTGRES_USER || 'l2p_user',
      password: process.env.POSTGRES_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true',
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '2')
    };
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      console.log('Database connection established');
      this.isConnected = true;
    });

    this.pool.on('error', (err: Error) => {
      console.error('Database pool error:', err);
      this.isConnected = false;
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        this.reconnect();
      }, 5000);
    });

    this.pool.on('remove', () => {
      console.log('Database connection removed from pool');
    });
  }

  private async reconnect(): Promise<void> {
    try {
      console.log('Attempting to reconnect to database...');
      await this.testConnection();
      console.log('Database reconnection successful');
    } catch (error) {
      console.error('Database reconnection failed:', error);
      // Retry after another delay
      setTimeout(() => {
        this.reconnect();
      }, 10000);
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (this.isClosing) {
      throw new Error('Database service is closing');
    }

    const client = await this.pool.connect();
    
    try {
      const start = Date.now();
      const result = await client.query<T>(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, text);
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      
      // Handle specific PostgreSQL errors
      if (error instanceof Error) {
        const pgError = error as any;
        
        switch (pgError.code) {
          case '23505': // Unique violation
            throw new DatabaseError('Duplicate entry found', 'DUPLICATE_ENTRY', pgError);
          case '23503': // Foreign key violation
            throw new DatabaseError('Referenced record not found', 'FOREIGN_KEY_VIOLATION', pgError);
          case '23502': // Not null violation
            throw new DatabaseError('Required field is missing', 'NOT_NULL_VIOLATION', pgError);
          case '42P01': // Undefined table
            throw new DatabaseError('Table does not exist', 'UNDEFINED_TABLE', pgError);
          case '42703': // Undefined column
            throw new DatabaseError('Column does not exist', 'UNDEFINED_COLUMN', pgError);
          default:
            throw new DatabaseError('Database operation failed', 'QUERY_ERROR', pgError);
        }
      }
      
      throw error;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back due to error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async getPoolStatus(): Promise<{
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  }> {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  public isHealthy(): boolean {
    return this.isConnected && this.pool.totalCount > 0;
  }

  public async close(): Promise<void> {
    if (this.isClosing) return;
    
    try {
      this.isClosing = true;
      this.isConnected = false;
      await this.pool.end();
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error closing database connection pool:', error);
      throw error;
    } finally {
      this.isClosing = false;
    }
  }

  // Health check method for monitoring
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      poolStatus: any;
      responseTime: number;
    };
  }> {
    const start = Date.now();
    
    try {
      await this.testConnection();
      const poolStatus = await this.getPoolStatus();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        details: {
          connected: this.isConnected,
          poolStatus,
          responseTime
        }
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          poolStatus: await this.getPoolStatus(),
          responseTime
        }
      };
    }
  }
}

// Custom database error class
export class DatabaseError extends Error {
  public readonly code: string;
  public readonly originalError: any;

  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.originalError = originalError;
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance();