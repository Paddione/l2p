import { jest } from '@jest/globals';
import { QueryResultRow } from 'pg';

// Create a mock implementation of BaseRepository
class MockBaseRepository {
  protected db: any;
  
  constructor() {
    this.db = {
      query: jest.fn()
    };
  }

  // Mock protected methods as public for testing
  async findById<T extends QueryResultRow>(table: string, id: number): Promise<T | null> {
    return null;
  }

  async findAll<T extends QueryResultRow>(table: string, limit?: number, offset?: number): Promise<T[]> {
    return [];
  }

  async create<T extends QueryResultRow>(table: string, data: Record<string, any>): Promise<T> {
    return null as unknown as T;
  }

  async update<T extends QueryResultRow>(table: string, id: number, data: Record<string, any>): Promise<T | null> {
    return null;
  }

  async delete(table: string, id: number): Promise<boolean> {
    return false;
  }

  async exists(table: string, field: string, value: any): Promise<boolean> {
    return false;
  }

  async count(table: string, whereClause?: string, params?: any[]): Promise<number> {
    return 0;
  }
}

// Create a factory function to create mock instances
export function createMockBaseRepository() {
  const mockInstance = new MockBaseRepository();
  
  // Create a proxy to track method calls
  return new Proxy(mockInstance, {
    get(target, prop) {
      // If the property is a function, wrap it in jest.fn()
      if (typeof target[prop as keyof typeof target] === 'function') {
        return jest.fn(target[prop as keyof typeof target].bind(target));
      }
      return target[prop as keyof typeof target];
    }
  });
}

// Mock the actual BaseRepository module
const mockBaseRepository = createMockBaseRepository();

export default mockBaseRepository;
