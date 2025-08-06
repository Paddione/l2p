import { ChromaClient } from 'chromadb';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import crypto from 'crypto';

export interface DocumentMetadata {
  source: string;
  title: string;
  course: string;
  subject: string;
  page?: number;
  section?: string;
  fileId?: string; // File ID for uploaded files
  version?: number; // Document version for versioning support
  hash?: string; // Content hash for deduplication
  createdAt?: string; // Creation timestamp (ISO string)
  updatedAt?: string; // Last update timestamp (ISO string)
}

export interface EmbeddingResult {
  success: boolean;
  documentsProcessed: number;
  embeddingsCreated: number;
  duplicatesSkipped: number;
  error?: string;
}

export interface SearchResult {
  content: string;
  metadata: DocumentMetadata;
  distance: number;
}

export class ChromaService {
  private client: ChromaClient;
  private collectionName: string;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    // Use ChromaDB HTTP client to connect to local server
    // For local development, always use localhost:8000
    const chromaUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.CHROMA_URL || 'http://localhost:8000')
      : 'http://localhost:8000';
    this.client = new ChromaClient({
      path: chromaUrl
    });
    
    this.collectionName = 'university_courses';
    
    // Initialize text splitter for document processing
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', '']
    });
  }

  /**
   * Initialize the ChromaDB collection
   */
  async initializeCollection(): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add documents to the vector database with deduplication
   */
  async addDocuments(documents: Document[], metadata: DocumentMetadata): Promise<EmbeddingResult> {
    try {
      const collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      });

      // Generate content hashes for deduplication
      const documentsWithHashes = documents.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          hash: this.generateContentHash(doc.pageContent),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));

      // Check for duplicates
      const hashes = documentsWithHashes.map(doc => doc.metadata.hash);
      const existingDocs = await this.findDocumentsByHashes(hashes);
      const duplicateHashes = new Set(existingDocs.map(doc => doc.metadata.hash));

      // Filter out duplicates
      const uniqueDocuments = documentsWithHashes.filter(doc => !duplicateHashes.has(doc.metadata.hash));
      const duplicatesSkipped = documents.length - uniqueDocuments.length;

      if (uniqueDocuments.length === 0) {
        return {
          success: true,
          documentsProcessed: documents.length,
          embeddingsCreated: 0,
          duplicatesSkipped
        };
      }

      const texts = uniqueDocuments.map(doc => doc.pageContent);
      const metadatas = uniqueDocuments.map(doc => {
        const docMetadata = {
          ...metadata,
          ...doc.metadata
        };
        // Ensure createdAt and updatedAt are strings
        if (typeof docMetadata.createdAt === 'object' && docMetadata.createdAt !== null && 'toISOString' in docMetadata.createdAt) {
          docMetadata.createdAt = (docMetadata.createdAt as Date).toISOString();
        }
        if (typeof docMetadata.updatedAt === 'object' && docMetadata.updatedAt !== null && 'toISOString' in docMetadata.updatedAt) {
          docMetadata.updatedAt = (docMetadata.updatedAt as Date).toISOString();
        }
        return docMetadata;
      });
      const ids = uniqueDocuments.map((_, index) => `${metadata.source}_${Date.now()}_${index}`);

      await collection.add({
        ids,
        documents: texts,
        metadatas
      });

      return {
        success: true,
        documentsProcessed: documents.length,
        embeddingsCreated: uniqueDocuments.length,
        duplicatesSkipped
      };
    } catch (error) {
      return {
        success: false,
        documentsProcessed: 0,
        embeddingsCreated: 0,
        duplicatesSkipped: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search for relevant documents using semantic search
   */
  async search(query: string, nResults: number = 5): Promise<SearchResult[]> {
    try {
      const collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      });

      const results = await collection.query({
        queryTexts: [query],
        nResults: nResults
      });

      if (!results.documents || !results.metadatas) {
        return [];
      }

      if (!results.documents[0] || !results.metadatas![0]) {
        return [];
      }

      return results.documents[0].map((content, index) => {
        const metadata = results.metadatas![0]?.[index];
        return {
          content: content || '',
          metadata: {
            source: metadata?.source || 'unknown',
            title: metadata?.title || 'unknown',
            course: metadata?.course || 'unknown',
            subject: metadata?.subject || 'unknown',
            page: metadata?.page,
            section: metadata?.section
          } as DocumentMetadata,
          distance: results.distances && results.distances[0] ? (results.distances[0][index] || 0) : 0
        };
      });
    } catch (error) {
      console.error('Error searching ChromaDB:', error);
      return [];
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(): Promise<{
    totalDocuments: number;
    totalEmbeddings: number;
    sources: string[];
    subjects: string[];
  }> {
    try {
      const collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      });

      const results = await collection.get({
        include: ['metadatas'] as any
      });

      const sources = new Set<string>();
      const subjects = new Set<string>();

      if (results.metadatas) {
        results.metadatas.forEach((metadata: any) => {
          if (metadata.source) sources.add(metadata.source);
          if (metadata.subject) subjects.add(metadata.subject);
        });
      }

      return {
        totalDocuments: results.documents?.length || 0,
        totalEmbeddings: results.embeddings?.length || 0,
        sources: Array.from(sources),
        subjects: Array.from(subjects)
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return {
        totalDocuments: 0,
        totalEmbeddings: 0,
        sources: [],
        subjects: []
      };
    }
  }

  /**
   * Delete documents by source
   */
  async deleteDocumentsBySource(source: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      });

      const results = await collection.get({
        where: { source: source },
        include: ['metadatas'] as any
      });

      if (results.ids && results.ids.length > 0) {
        await collection.delete({
          ids: results.ids
        });
      }

      return {
        success: true,
        deletedCount: results.ids?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test ChromaDB connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const heartbeat = await this.client.heartbeat();
      console.log('ChromaDB heartbeat:', heartbeat);
      return { success: true };
    } catch (error) {
      console.error('ChromaDB connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create document from text content
   */
  createDocument(content: string, metadata: DocumentMetadata): Document {
    return new Document({
      pageContent: content,
      metadata
    });
  }

  /**
   * Create documents from course content
   */
  createCourseDocuments(courseContent: string, metadata: DocumentMetadata): Document[] {
    // Split course content into logical sections
    const sections = courseContent.split(/\n#{1,6}\s+/);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      return new Document({
        pageContent: section.trim(),
        metadata: {
          ...metadata,
          section: `section_${index + 1}`,
          page: index + 1
        }
      });
    }).filter(Boolean) as Document[];
  }

  /**
   * Get available sources in the database
   */
  async getAvailableSources(): Promise<string[]> {
    try {
      const stats = await this.getCollectionStats();
      return stats.sources;
    } catch (error) {
      console.error('Error getting available sources:', error);
      return [];
    }
  }

  /**
   * Get available subjects in the database
   */
  async getAvailableSubjects(): Promise<string[]> {
    try {
      const stats = await this.getCollectionStats();
      return stats.subjects;
    } catch (error) {
      console.error('Error getting available subjects:', error);
      return [];
    }
  }

  /**
   * Search by subject
   */
  async searchBySubject(subject: string, query: string, nResults: number = 5): Promise<SearchResult[]> {
    try {
      // For now, return empty results to avoid complex ChromaDB setup
      // This can be enhanced later when ChromaDB is properly configured
      return [];
    } catch (error) {
      console.error('Error searching by subject:', error);
      return [];
    }
  }

  /**
   * Get documents by file ID
   */
  async getDocumentsByFileId(fileId: string): Promise<any[]> {
    try {
      const collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      });

      const results = await collection.query({
        queryTexts: [''], // Empty query to get all documents
        nResults: 1000, // Large number to get all documents
        where: { fileId } // Filter by file ID
      });

      return results.documents?.[0]?.map((doc, index) => ({
        pageContent: doc,
        metadata: results.metadatas?.[0]?.[index] || {}
      })) || [];
    } catch (error) {
      console.error('Error getting documents by file ID:', error);
      return [];
    }
  }

  /**
   * Add documents in batch with progress tracking
   */
  async addDocumentsBatch(
    documentBatches: Array<{ documents: Document[]; metadata: DocumentMetadata }>,
    onProgress?: (progress: { current: number; total: number; batch: number }) => void
  ): Promise<EmbeddingResult> {
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalDuplicatesSkipped = 0;

    try {
      for (let i = 0; i < documentBatches.length; i++) {
        const batch = documentBatches[i];
        const fallbackMetadata = { source: '', title: '', course: '', subject: '' };
        const result = await this.addDocuments(batch?.documents ?? [], batch?.metadata ?? fallbackMetadata);
        
        totalProcessed += result.documentsProcessed;
        totalCreated += result.embeddingsCreated;
        totalDuplicatesSkipped += result.duplicatesSkipped || 0;

        if (onProgress) {
          onProgress({
            current: totalProcessed,
            total: documentBatches.reduce((sum, b) => sum + (b?.documents?.length || 0), 0),
            batch: i + 1
          });
        }
      }

      return {
        success: true,
        documentsProcessed: totalProcessed,
        embeddingsCreated: totalCreated,
        duplicatesSkipped: totalDuplicatesSkipped
      };
    } catch (error) {
      return {
        success: false,
        documentsProcessed: totalProcessed,
        embeddingsCreated: totalCreated,
        duplicatesSkipped: totalDuplicatesSkipped,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update document version
   */
  async updateDocumentVersion(fileId: string, newContent: string, metadata: DocumentMetadata): Promise<EmbeddingResult> {
    try {
      // Delete existing documents for this file
      await this.deleteDocumentsByFileId(fileId);

      // Create new document with incremented version
      const newVersion = (metadata.version || 0) + 1;
      const document = this.createDocument(newContent, {
        ...metadata,
        version: newVersion,
        updatedAt: new Date().toISOString()
      });

      // Add the new version
      return await this.addDocuments([document], metadata);
    } catch (error) {
      return {
        success: false,
        documentsProcessed: 0,
        embeddingsCreated: 0,
        duplicatesSkipped: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete documents by file ID
   */
  async deleteDocumentsByFileId(fileId: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      });

      // Get document IDs for this file
      const documents = await this.getDocumentsByFileId(fileId);
      const documentIds = documents.map((_, index) => `${fileId}_${index}`);

      if (documentIds.length === 0) {
        return { success: true, deletedCount: 0 };
      }

      await collection.delete({
        ids: documentIds
      });

      return { success: true, deletedCount: documentIds.length };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find documents by content hashes
   */
  private async findDocumentsByHashes(hashes: string[]): Promise<any[]> {
    try {
      const collection = await this.client.getOrCreateCollection({
        name: this.collectionName
      });

      const results = await collection.query({
        queryTexts: [''], // Empty query to get all documents
        nResults: 10000, // Large number to get all documents
        where: { hash: { $in: hashes } } // Filter by hashes
      });

      return results.documents?.[0]?.map((doc, index) => ({
        pageContent: doc,
        metadata: results.metadatas?.[0]?.[index] || {}
      })) || [];
    } catch (error) {
      console.error('Error finding documents by hashes:', error);
      return [];
    }
  }

  /**
   * Generate content hash for deduplication
   */
  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get document versions for a file
   */
  async getDocumentVersions(fileId: string): Promise<Array<{ version: number; createdAt: Date; updatedAt: Date }>> {
    try {
      const documents = await this.getDocumentsByFileId(fileId);
      return documents
        .map(doc => doc.metadata)
        .filter(metadata => metadata.version)
        .map(metadata => ({
          version: metadata.version,
          createdAt: new Date(metadata.createdAt),
          updatedAt: new Date(metadata.updatedAt)
        }))
        .sort((a, b) => b.version - a.version);
    } catch (error) {
      console.error('Error getting document versions:', error);
      return [];
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(): Promise<{
    totalDocuments: number;
    totalFiles: number;
    totalVersions: number;
    averageChunksPerFile: number;
    storageSize: number;
  }> {
    try {
      const stats = await this.getCollectionStats();
      const sources = await this.getAvailableSources();
      
      // Calculate file count (unique sources)
      const fileSources = sources.filter(source => source.startsWith('file_'));
      const totalFiles = fileSources.length;

      // Calculate average chunks per file
      const averageChunksPerFile = totalFiles > 0 ? stats.totalDocuments / totalFiles : 0;

      return {
        totalDocuments: stats.totalDocuments,
        totalFiles,
        totalVersions: stats.totalDocuments, // Each document is a version
        averageChunksPerFile: Math.round(averageChunksPerFile * 100) / 100,
        storageSize: stats.totalDocuments * 1024 // Rough estimate: 1KB per document
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      return {
        totalDocuments: 0,
        totalFiles: 0,
        totalVersions: 0,
        averageChunksPerFile: 0,
        storageSize: 0
      };
    }
  }
} 