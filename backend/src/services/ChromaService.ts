/**
 * Stub ChromaService - ChromaDB integration has been removed
 * This service exists only to prevent import errors in test files
 */

export interface ChromaServiceResult {
  success: boolean;
  error?: string;
  data?: any;
}

export class ChromaService {
  constructor() {
    console.warn('ChromaService is deprecated - ChromaDB integration has been removed');
  }

  async testConnection(): Promise<ChromaServiceResult> {
    return {
      success: false,
      error: 'ChromaDB integration has been removed from this application'
    };
  }

  async initializeCollection(): Promise<ChromaServiceResult> {
    return {
      success: false,
      error: 'ChromaDB integration has been removed from this application'
    };
  }

  async addDocument(content: string, metadata?: any): Promise<ChromaServiceResult> {
    return {
      success: false,
      error: 'ChromaDB integration has been removed from this application'
    };
  }

  async searchDocuments(query: string, limit: number = 5): Promise<ChromaServiceResult> {
    return {
      success: false,
      error: 'ChromaDB integration has been removed from this application'
    };
  }

  async deleteDocument(documentId: string): Promise<ChromaServiceResult> {
    return {
      success: false,
      error: 'ChromaDB integration has been removed from this application'
    };
  }

  async getCollectionStats(): Promise<ChromaServiceResult> {
    return {
      success: false,
      error: 'ChromaDB integration has been removed from this application'
    };
  }
}
